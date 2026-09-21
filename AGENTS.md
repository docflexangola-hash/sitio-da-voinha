# AGENTS.md — Sítio da Voinha (site digital)

Guia de contexto para agentes/sessões que trabalhem neste projeto. Lê-o antes de qualquer tarefa.
{RESPEITAR}: manter este ficheiro atualizado quando mudanças estruturais acontecerem (auth, deploy, schema, decisões). NÃO editar sem motivo — é memória de projeto, não changelog.

## Visão geral

Landing page estática do restaurante **Sítio da Voinha — Restaurante & Playground** (Avenida dos Restaurantes, Praia Morena, Benguela — Angola), com um **painel admin separado** para editar preços e disponibilidade sem mexer no código.

- Estrutura da landing (foco = menu): bloco de boas-vindas compacto (fundo `hero-1600/900.jpg`) → secção **Menu** com **uma aba por categoria** (default: a primeira secção da ordem vigente — Entradas se não houver ordem cloud) → rodapé compacto (morada, horário, telefone/WhatsApp, link admin, crédito "Desenvolvido por DOCFLEX ANGOLA" → `https://docflex-site.vercel.app/`).
- Público: clientes (mobile-first, vêm do QR/menu físico). Idioma: PT/EN (EN é extra minimal). Admin: apenas PT.
- Objetivo: nunca precisar de redeploy para mudar um preço — os preços são editados na cloud (Supabase).
- Contacto: tel `+244925963030`, WhatsApp `https://wa.me/244925963030`.

## Stack & comandos

- **Vite 6 + Tailwind CSS 3.4 (PostCSS) + JS vanilla**. Nenhum framework, sem bibliotecas de runtime. Duas entradas HTML estáticas: `index.html` + `admin.html` (config em `vite.config.js` via `rollupOptions.input`).
- Node ≥ 20 (testado com v24.19.0 / npm 11.17.0). `npm approve-scripts esbuild` já feito (`allowScripts` no package.json).

| Comando | Uso |
|---|---|
| `npm run dev` | dev server (porta 5173) |
| `npm run build` | build de produção → `dist/` |
| `npm run preview` | servir `dist/` localmente (porta 4173) |

Após qualquer alteração relevante: **correr `npm run build`** para validar.

## Arquitetura / mapa de ficheiros

```
sitio-da-voinha/
├── index.html          Landing (bem-vindo compacto, menu com abas por categoria, rodapé)
├── admin.html          Painel admin (login conta Supabase Auth → editor de preços/disponibilidade e ordem)
├── src/
│   ├── main.js         Lógica da landing (render abas por categoria + lista ativa, lang)
│   ├── admin.js        Lógica do admin (login email+password, lista editável, guardar via RPC)
│   ├── store.js        Dados: makeMenus, itemKey, mergeOverrides, flatCategories, displayPrice
│   ├── supabase.js     Adapter cloud: fetchOverrides, fetchOrdem, savePrice, saveOrdem, pingBackend +
│                       auth em Raw REST (authSignIn, authSignOut, getSession, sessão `sdv-session`)
│   ├── theme.js        Dark/light (localStorage `sdv-theme`) + janela nocturna 17:30–05:00
│   ├── i18n.js         Dicts pt/en, keys data-i18n, evento `sdv:lang`
│   ├── icons.js        Ícones SVG inline (helper `icon(name)`); sem biblioteca externa
│   ├── style.css       Design tokens (CSS vars) + @layer base/components/utilities
│   └── data/menu.json  Cardápio base (preços em Kz) + `nome_en`/`nota_en` (tradução EN) — NÃO é a fonte viva de preços
├── supabase/
│   ├── config.js       SUPABASE_URL + anon key (públicas por design)
│   └── schema.sql      Migração: tabelas (precos, config, seccoes), RLS, funções
│                       (eh_admin, atualizar_preco, atualizar_ordem, ping_admin) + config.admin_email
├── public/
│   ├── favicon.svg     Ícone da aba do browser (recorte do logotipo: garfo/colher cruzados, `viewBox` fixo)
│   └── images/         hero-1600/900.jpg (fundo do bloco bem-vindo, derivados do PNG cinematográfico do dono, 1930×815), logotipo_sitio_da_voinha.svg (logo oficial), wordmark_sitio_da_voinha.svg (lettering do hero)
├── LOG.md              Registo de desenvolvimento (append datado)
└── AGENTS.md           Este ficheiro
```

## Fluxo de preços (o coração do sistema)

1. **Base estática**: `src/data/menu.json` → `makeMenus()` (`store.js`). Preços em Kz inteiros.
2. **Cloud (fonte viva)**: tabela `precos` no Supabase (`chave` text PK, `preco` int, `disponivel` bool, `updated_at`). Só contém **overrides** (zero linhas = menu 100% do JSON).
3. **Chave de item** (`itemKey`): `` `${menuId}/${catId}/${slug(nome)}` `` — ex. `bebidas/caipirinhas/caipirinha-da-avo`. **NUNCA mudar o `nome` de um item existente** no `menu.json` (invalida overrides guardados).
4. **Merge**: `mergeOverrides()` marca os items com `_preco`/`_disponivel` (ints/bools); `displayPrice()` formata com pontos (ex. `35.000`).
5. **Landing**: `flatCategories(menus, ordemMap)` achata os 2 menus em categorias (`{ menuId, catId, nome, nome_en, itens }`). Com **ordem cloud** (`seccoes`) usa essa ordem global (pode intercalar menus livremente — `menuId` é só namespace, as `itemKey` não mudam); sem ordem, default com **`entradas` primeiro**. A aba ativa ao carregar é **a primeira da ordem vigente** (`main.js`: `state.categoria = state.categorias[0]?.catId`), não está fixa em "entradas"; o clique do utilizador não é sobrescrito.
6. **Tradução EN**: cada item/categoria tem `nome_en` (e `nota_en` nas notas). `main.js` usa `lname()`/`lnote()`: quando o idioma é EN e há `nome_en`, mostra o nome EN; senão PT. Admin é sempre PT (`nome`). Regras de tom: nome comum em inglês quando existe; senão descritivo; marcas/nomes próprios (cervejas, vinhos, cocktails) mantêm-se.
9. **Escrita preços**: admin → RPC `atualizar_preco(chave, preco, disponivel)` (SECURITY DEFINER) com `Authorization: Bearer <access_token>` da sessão do dono. A função confirma no servidor que `auth.email = config.admin_email` (`eh_admin()`); se não, devolve `false` e nada é escrito. O browser só envia o JWT da sessão — nunca contas/roles.
10. **Escrita ordem**: admin → painel "Ordem das Seções" (painel de setas ↑/↓, guarda de cada vez) → RPC `atualizar_ordem(ordens text[])`; a função apaga só órfãs (`delete ... where cat_id <> all(p_ordens)`) e faz upsert na tabela `seccoes (cat_id PK, ordem)`. **Nunca usar `DELETE` sem `WHERE`** em RPCs — o PostgREST/Supabase bloqueia (SQLSTATE 21000 "delete requires a where clause").
11. **Fallback**: sem rede/Supabase a landing mostra os preços do JSON e a ordem default (sem prémio de erro).

### Endpoints/serviços usados (`src/supabase.js`)
`GET /rest/v1/precos?select=*` · `GET /rest/v1/seccoes?select=cat_id,ordem&order=ordem` · `POST /rest/v1/rpc/ping_admin` · `POST /rest/v1/rpc/atualizar_preco` · `POST /rest/v1/rpc/atualizar_ordem` · `POST /auth/v1/token?grant_type=password` (login) · `POST /auth/v1/token?grant_type=refresh_token` (refresh) · `POST /auth/v1/logout`. Headers: `apikey` + `Authorization: Bearer <anon ou access_token>` + `Content-Type: application/json`.

### Sessão do admin (Raw REST, sem SDK)
- Login: `authSignIn(email, password)` → grava `sdv-session` em localStorage (`{access_token, refresh_token, expires_at}`); sem rede precisa de nada mais (0 dependências de runtime).
- Escritas usam o token de acesso; em `401` o `refresh_token` é usado **uma vez** e a escrita é repetida (`rpcWrite`); refresh preventivo dentro de `getSession()` quando faltam ≤60 s.
- `authSignOut()` revoga a sessão e limpa o localStorage. No boot do admin, se houver sessão válida entra direto.

## Segurança (crítico)

- **Anon key / publishable key**: públicas por design, podem estar no bundle.
- **`service_role` / `sb_secret`**: NUNCA chegam ao frontend. Estão num ficheiro FORA do repo (`dbsupabasepass.md` na pasta-mãe dos downloads). Não o copiar para o projeto, não o commitar, não o logar.
- **Acesso do admin**: conta Supabase Auth do dono. Funciona por email — `config.admin_email` no servidor
  (atualmente `docflex.angola@gmail.com`) e as funções de escrita verificam `auth.email = admin_email` (`eh_admin`).
  O email/password do dono e credenciais nunca entram no bundle. Sem privilegiar autosignup no Dashboard.
  **O email do dono NUNCA aparece no frontend** (nem placeholder, nem textos de ajuda, nem logs visíveis) — existe só no `schema.sql` e em docs de dev.
- **Sessão no browser**: `sdv-session` em localStorage (JWT de ~1 h + refresh), enviado só nas escritas do admin.
- `.gitignore` cobre segredos e `dist/`. Revisitar se aparecerem ficheiros sensíveis novos.

## Convenções

- **Língua**: responder ao utilizador em PT; UI em PT (admin é PT-only). Código/identificadores em inglês.
- **Sem comentários no código** (nenhum; nem `//` nem `/* */`), exceto onde estritamente necessário.
- **i18n**: todas as strings visíveis têm key nos dicts de `src/i18n.js` (pt/en) — usar `data-i18n`, `data-i18n-placeholder` ou `t(key)`. Adicionar key aos DOIS dicts.
- **Design tokens**: cores/tipos/sombras em `tailwind.config.js` (mapeiam vars RGB de `src/style.css`). Não usar cores hex hardcoded. Classes utilitárias custom live em `@layer utilities` (`chip-active`, `no-scrollbar`, `section`, `tnum`, …).
- **Dark mode**: classe `.dark` no `<html>`; usar cores `surface*`/`on-surface*` (não literais).
  **Tema automático por horário (nocturno 17:30–05:00, relógio do dispositivo)**: `theme.js` usa a janela
  horária como regra default; se o utilizador clicar no botão dark/light, a escolha é gravada em `sdv-theme`
  e passa a mandar; `setInterval` 60 s reavalia o horário enquanto não houver escolha manual. Não usar
  `prefers-color-scheme` como regra default (substituída pela janela horária).
- **Ícones**: adicionar SVGs a `src/icons.js` e usar `icon('nome')` / `data-icon`. Sem biblioteca de ícones.
- **Botões**: visual perfeitamente retangular — `.btn`/`.chip` usam `rounded-none`; não reintroduzir `rounded-full/lg/xl` em botões (inputs mantêm `rounded-xl`).
- **Listagem de pratos**: estilo carta clássico — 1 coluna, nome à esquerda → linha pontilhada (`border-b border-dotted`) → preço dourado à direita (`tnum`, `whitespace-nowrap`); nota por baixo da linha; esgotado com riscado + badge e `opacity-70`. Sem cartão fechado (lista aberta com `divide-y`).
- **Imagens**: locais e otimizadas em `public/images/` (as fotos foram geradas por IA num CDN externo em 2026 — confiar nos `alt`, o modelo não vê imagens). Não meter CDNs externos; favicon é SVG inline local.
- **Logotipo**: usar sempre `public/images/logotipo_sitio_da_voinha.svg` com a classe `logo-sdv`. **No dark o logotipo é 100% branco** — `.dark .logo-sdv { filter: brightness(0) invert(1); }`; nunca acrescentar outras camadas de texto junto do logo (o nome "Sítio da Voinha" já está dentro do SVG). Os SVGs em `public/` ficam **limpos**: sem metadata C2PA, sem `xmlns:c2pa`, sem `width/height/style` (só `viewBox`). O PNG `logo-sm.png` foi retirado — não voltar a usar.
- **Wordmark do hero**: o H1 da landing usa `public/images/wordmark_sitio_da_voinha.svg` (extraído do ficheiro do dono `logotipo_sitio_da_voinha_sem_restaurante.svg`: estampa "SÍTIO DA" + caligrafia "VOINHA"; `viewBox="-18 562 2767 1343"`; paths `texto-sitio-da` + `texto-voinha`). NÃO usar o path antigo `escrita-voinha-e-talheres` (misturava os talheres com o texto e cortava o "Voinha"). Renderizado **sempre branco** com a classe `.logo-sdv-hero` (`filter: brightness(0) invert(1) drop-shadow(...)`) — não depende do dark mode porque está sobre a foto do hero. Não é "fonte" editável: se o lettering mudar, re-extrair do logotipo.
- **Menu/adicionar item**: editar `menu.json` + rebuild + deploy se for mudança permanente; para preço/disponibilidade momentânea usar o admin (não editar JSON). **Ao adicionar/alterar um item, acrescentar `nome_en`** (e `nota_en` se houver nota). Nunca mudar `nome` (invalida overrides).

## Estado atual (2026-09-20)

- **Admin migrado para Supabase Auth (conta do dono)**: schema novo `admin_email`/`eh_admin` **já corrido na cloud** pelo utilizador e verificado (probes: `validar_pin` 404, escritas anon → `false`, `config` protegido, `precos`/`seccoes` legíveis). Faltava apenas testar o login real do dono (`docflex.angola@gmail.com`).
- **Logotipo oficial + favicon trocados**: `logo-sm.png` substituído pelo SVG com classe `logo-sdv` (branco no dark); texto ao lado removido. **Favicon = recorte dos talheres (`favicon.svg`)** — mas plataformas que não suportam SVG (WhatsApp, iOS) usam as versões PNG/ICO geradas via `sharp`: `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` (180×180) e `favicon.ico`, servidos em `/images/`. Build verde; `/`, `/admin.html`, `/favicon.svg` e o logo servem 200.
- **Tradução EN completa** (30 categorias, 163 itens, 4 notas com `nota_en`); validação Node OK (itemKeys estáveis).
- **Ordem das seções reorganizável no admin** (painel com setas ↑/↓, intercala menus, guarda via RPC).
- **Landing redesenhada** (menu como foco): bloco bem-vindo compacto + abas por categoria (default Entradas) + rodapé enxuto. Listagem em estilo carta clássica (linha pontilhada → preço dorado).
- **Deploy GitHub Pages (LIVE)**: repo `docflexangola-hash/sitio-da-voinha` (público) → `https://docflexangola-hash.github.io/sitio-da-voinha/` (admin: `/admin.html`). **Subpath**: `vite.config.js` usa `base: process.env.BASE_PATH || '/'`; o workflow GH Pages define `BASE_PATH: /sitio-da-voinha/` no build; HTML usa `%BASE_URL%` em vez de `/…` (senão 404 no Pages). Vercel **não precisa de ENV**: build-time env só para o Pages; em Vercel fica em `/` por default. Workflow: em cada push a `main` faz build+deploy (Pages já ativo com `build_type: workflow`). Para domínio próprio/CNAME: voltar a `base: '/'`.
- **OG image (WhatsApp/preview)**: `og-1200x630.png` — logotipo completo sobre fundo creme `#F4EFE4`, 1200×630, `?v=2` cache-buster em `og:image` para forçar re-raspagem.
- **Git**: repo tem raiz nesta pasta; identidade local `Docflex Angola` / `docflexangola-hash@users.noreply.github.com`; remote sem token (usa o credential manager do Windows). Fazer `git pull` antes de nova sessão no projeto e `git push` após alterações.
- Pendências: teste de login real do dono no admin **produção**; opcional: Lighthouse mobile, domínio próprio/CNAME.