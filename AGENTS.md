# AGENTS.md — Sítio da Voinha (site digital)

Guia de contexto para agentes/sessões que trabalhem neste projeto. Lê-o antes de qualquer tarefa.
{RESPEITAR}: manter este ficheiro atualizado quando mudanças estruturais acontecerem (auth, deploy, schema, decisões). NÃO editar sem motivo — é memória de projeto, não changelog.

## Visão geral

Landing page estática do restaurante **Sítio da Voinha — Restaurante & Playground** (Avenida dos Restaurantes, Praia Morena, Benguela — Angola), com um **painel admin separado** para editar preços e disponibilidade sem mexer no código.

- Estrutura da landing (foco = menu): bloco de boas-vindas compacto (fundo `hero-1600/900.jpg`) → secção **Menu** com **dois estágios**: chips "Refeições"/"Bebidas" (grupo de menus) e, abaixo, **uma aba por categoria do menu ativo** (default: a primeira secção da ordem vigente dentro desse menu — "Pequeno Almoço da Avó"/Entradas se não houver ordem cloud) → **secção Galeria** (slider de fotos dos pratos por categoria, entre o menu e o rodapé: fotos `galeria` carregadas no admin para o **Storage do Supabase** (bucket público `galeria`); ordem aleatória, snap + autoplay + setas; `hidden` quando a categoria não tem fotos) → despedida da Vó (um script accent por ecrã, usado aqui) → rodapé compacto (morada, horário, telefone/WhatsApp, micro-copy com link admin e crédito "Desenvolvido por DOCFLEX ANGOLA" → `https://docflex-site.vercel.app/`).
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
│   ├── schema.sql      Migração: tabelas (precos, config, seccoes, galeria), RLS, funções
│   │                   (eh_admin, atualizar_preco, atualizar_ordem, ping_admin,
│   │                    adicionar_galeria, remover_galeria) + bucket Storage `galeria`
│   │                   (público, leitura anon; escrita só authenticated) + config.admin_email
│   └── functions/      Edge Functions (Deno): recebem a imagem/pedido + JWT do dono, validam
│                       eh_admin() e mexem no Storage do Supabase (bucket `galeria`);
│                       nenhuma chave externa no repo
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
5. **Landing**: `flatCategories(menus, ordemMap)` achata os 2 menus em categorias (`{ menuId, catId, nome, nome_en, itens }`). Com **ordem cloud** (`seccoes`) usa essa ordem global (pode intercalar menus livremente — `menuId` é só namespace, as `itemKey` não mudam); sem ordem, default com **`entradas` primeiro**. Na landing o utilizador escolhe primeiro o menu ("Refeições"/"Bebidas", `state.menu`), e as abas mostram só as categorias desse menu (na ordem global). A aba ativa ao carregar é **a primeira da ordem vigente dentro do menu ativo** (`main.js`: `state.categoria = state.categorias[0]?.catId`), não está fixa em "entradas"; o clique do utilizador não é sobrescrito.
6. **Tradução EN**: cada item/categoria tem `nome_en` (e `nota_en` nas notas). `main.js` usa `lname()`/`lnote()`: quando o idioma é EN e há `nome_en`, mostra o nome EN; senão PT. Admin é sempre PT (`nome`). Regras de tom: nome comum em inglês quando existe; senão descritivo; marcas/nomes próprios (cervejas, vinhos, cocktails) mantêm-se.
9. **Escrita preços**: admin → RPC `atualizar_preco(chave, preco, disponivel)` (SECURITY DEFINER) com `Authorization: Bearer <access_token>` da sessão do dono. A função confirma no servidor que `auth.email = config.admin_email` (`eh_admin()`); se não, devolve `false` e nada é escrito. O browser só envia o JWT da sessão — nunca contas/roles.
10. **Escrita ordem**: admin → painel "Ordem das Seções" (painel de setas ↑/↓, guarda de cada vez) → RPC `atualizar_ordem(ordens text[])`; a função apaga só órfãs (`delete ... where cat_id <> all(p_ordens)`) e faz upsert na tabela `seccoes (cat_id PK, ordem)`. **Nunca usar `DELETE` sem `WHERE`** em RPCs — o PostgREST/Supabase bloqueia (SQLSTATE 21000 "delete requires a where clause").
11. **Fallback**: sem rede/Supabase a landing mostra os preços do JSON e a ordem default (sem prémio de erro).

### Endpoints/serviços usados (`src/supabase.js`)
`GET /rest/v1/precos?select=*` · `GET /rest/v1/seccoes?select=cat_id,ordem&order=ordem` · `POST /rest/v1/rpc/ping_admin` · `POST /rest/v1/rpc/atualizar_preco` · `POST /rest/v1/rpc/atualizar_ordem` · `GET /rest/v1/galeria?select=id,menu_id,url,alt,created_at&order=created_at` · `POST /rest/v1/rpc/adicionar_galeria` · `POST /rest/v1/rpc/remover_galeria` · `POST /functions/v1/upload-galeria` (upload de fotos do slider → Storage, requer JWT do dono) · `POST /functions/v1/remover-galeria` (apaga ficheiro + linha) · `GET /storage/v1/object/public/galeria/<caminho>` (fotos do slider, públicas) · `POST /auth/v1/token?grant_type=password` (login) · `POST /auth/v1/token?grant_type=refresh_token` (refresh) · `POST /auth/v1/logout`. Headers: `apikey` + `Authorization: Bearer <anon ou access_token>` + `Content-Type: application/json`.

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
- **Galeria (fotos do slider)**: a tabela `galeria` é pública para SELECT (RLS), mas a escrita é só via RPCs `adicionar_galeria` / `remover_galeria` (SECURITY DEFINER, confirmam `eh_admin()`). Os ficheiros vivem no **bucket público `galeria`** do Supabase Storage (criado no bloco 6 do `schema.sql`; leitura anon, escrita só `authenticated`) e nunca em CDNs externos. O upload/remoção usam as **Edge Functions `upload-galeria` / `remover-galeria`** (Deno) que voltam a validar `getUser` + `eh_admin()` no servidor antes de tocar no Storage/BD — o navegador só envia o JWT da sessão, nunca chaves. O `admin.js` **redimensiona/comprime no browser** (canvas, máx. 1100px) antes do upload para o slider carregar rápido. Deploy: `supabase functions deploy upload-galeria --project-ref qsohbmjdhwjgizdfowfk --no-verify-jwt` (e idem `remover-galeria`). As funções importam de `jsr:@supabase/supabase-js@2` — **não voltar para `esm.sh`** (o bundler remoto da Supabase não o consegue buscar, falha com "Fetch timed out"; em 2026-09-22 trocou-se para jsr e o deploy passou). A flag `--no-verify-jwt` desliga a verificação JWT da *plataforma* para o preflight OPTIONS chegar ao handler CORS da função — a segurança continua na função; não expõe a escrita.
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
- **Slider da galeria**: cartões 4:5 (`aspect-[4/5]`, `rounded-xl`, `snap-start`), ordem aleatória (Fisher–Yates) em cada render/troca de menu, autoplay ~4.5 s com pausa em hover/touch/`prefers-reduced-motion`/aba oculta, setas laterais e dots **rectangulares** (`rounded-none`); secção fica `hidden` se a categoria não tiver fotos (sem prémio de erro, como o resto). Sem accent de script (a Vó já fala uma vez).
- **Listagem de pratos**: estilo carta clássico — 1 coluna, nome à esquerda → linha pontilhada (`border-b border-dotted`) → preço dourado à direita (`tnum`, `whitespace-nowrap`); nota por baixo da linha; esgotado com riscado + badge e `opacity-70`. Sem cartão fechado (lista aberta com `divide-y`).
- **Imagens**: locais e otimizadas em `public/images/` (as fotos foram geradas por IA num CDN externo em 2026 — confiar nos `alt`, o modelo não vê imagens). Não meter CDNs externos; favicon é SVG inline local.
- **Logotipo**: usar sempre `public/images/logotipo_sitio_da_voinha.svg` com a classe `logo-sdv`. **No dark o logotipo é 100% branco** — `.dark .logo-sdv { filter: brightness(0) invert(1); }`; nunca acrescentar outras camadas de texto junto do logo (o nome "Sítio da Voinha" já está dentro do SVG). Os SVGs em `public/` ficam **limpos**: sem metadata C2PA, sem `xmlns:c2pa`, sem `width/height/style` (só `viewBox`). O PNG `logo-sm.png` foi retirado — não voltar a usar.
- **Wordmark do hero**: o H1 da landing usa `public/images/wordmark_sitio_da_voinha.svg` (extraído do ficheiro do dono `logotipo_sitio_da_voinha_sem_restaurante.svg`: estampa "SÍTIO DA" + caligrafia "VOINHA"; `viewBox="-18 562 2767 1343"`; paths `texto-sitio-da` + `texto-voinha`). NÃO usar o path antigo `escrita-voinha-e-talheres` (misturava os talheres com o texto e cortava o "Voinha"). Renderizado **sempre branco** com a classe `.logo-sdv-hero` (`filter: brightness(0) invert(1) drop-shadow(...)`) — não depende do dark mode porque está sobre a foto do hero. Não é "fonte" editável: se o lettering mudar, re-extrair do logotipo.
- **Scrim da hero**: o véu sobre a foto usa `from-black/80 via-black/40 to-surface` (`index.html`). **NUNCA usar `ink/...` no scrim** — o token `ink` inverte em dark (fica quase branco) e apagava o texto branco do hero no modo nocturno. `black` não inverte com o tema; `to-surface` mantém o blend com a página.
- **Menu/adicionar item**: editar `menu.json` + rebuild + deploy se for mudança permanente; para preço/disponibilidade momentânea usar o admin (não editar JSON). **Ao adicionar/alterar um item, acrescentar `nome_en`** (e `nota_en` se houver nota). Nunca mudar `nome` (invalida overrides).

## Design Context

(gerado por `impeccable init`; fonte: `PRODUCT.md`)

- Público: clientes no local telemóvel-first (QR físico/WhatsApp) + visitantes EN minimal; admin = dono e staff autorizado (PT-only).
- Posicionamento: esplanada costeira casual com playground, à beira-mar na Praia Morena — espaço para famílias; a carta é uma fonte viva (cloud, sem redeploy).
- Tom da marca: familiar e caseiro, centrado na "Voinha"; PT a verdade, EN cortesia.
- Material / contexto: praia (rede variável → fallback sem prémio de erro), horário Ter–Dom 10:00–22:00, contacto tel/WhatsApp `+244925963030`.

## Estado atual (2026-09-22)

- **Fotos do slider migradas do imgbb para o Supabase Storage (2026-09-22)**: o imgbb (CDN grátis, lento/instável) foi eliminado por completo. As fotos vivem agora no **bucket público `galeria`**; 2 Edge Functions novas (`upload-galeria`/`remover-galeria`) validam `eh_admin()` e mexem no Storage/BD; o `admin.js` **redimensiona/comprime no browser** (canvas, máx. 1100px) antes de enviar — o cartão do slider tem no máximo 330px. `fetchGaleria`/`addGaleriaItem`/slider **inalterados** (a URL continua a ser uma string). Migração das 7 fotos existentes = re-upload manual pelo admin.
- **Cache-busting via `vercel.json`**: o slider `#galeria` não aparecia no browser do dono (Angola) apesar do código/backend estarem corretos. Causa: proxies ISP/CDN serviam HTML stale (Vercel devolvia `X-Vercel-Cache: HIT` com `Age` elevado). Solução: criado `vercel.json` com `Cache-Control: no-cache, no-store, must-revalidate` + `Pragma: no-cache` + `Expires: 0` para `/` e `/(.*).html`; assets hasheados (`/assets/*`) mantêm `public, max-age=31536000, immutable`. Build verde (`npm run build`). Após push a `main` o Vercel aplica os novos headers e o browser recebe sempre o HTML/JS mais recente.
- **Upload de fotos corrigido (edge function antiga `upload-imgbb`, já removida — substituída pelas de Storage)**: sintoma "Failed to fetch" ao clicar em "Carregar foto" no admin — a versão deployada antes via **Dashboard editor** tinha JWT verification ativa na plataforma e respondia `401` sem headers CORS (o preflight do browser era bloqueado). Redeploy via CLI com a flag **`--no-verify-jwt`** e a função volta a correr o seu próprio handler de `OPTIONS` (204 + CORS) e a validação de dono (`getUser` + `eh_admin()`). `IMGBB_KEY` definida nos secrets (CLI 2.117.0 usa `supabase secrets set IMGBB_KEY=<chave>`; `--env-name` já não existe). Verificado por curl: `OPTIONS` → 204 com `Access-Control-Allow-Origin: *`; `POST` sem token → `401 {"error":"not-authenticated"}` com CORS (erro legível no browser). **`--no-verify-jwt` é seguro por design**: a função faz a autenticação no servidor — não expõe escrita a anon.
- **Bloco Instagram removido** (o dono não gostou do embed). Substituído por um **slider de fotos próprio** entre o menu e o rodapé: secção `#galeria` com header (eyebrow `galeria_eyebrow`/`galeria_title` + fio dourado), track `snap-x` de cartões 4:5 (`w-[72vw] max-w-[330px]`), setas laterais (ícones `arrowLeft`/`arrowRight`) + dots rectangulares, autoplay de 4.5 s e **ordem aleatória (Fisher–Yates)** em cada render/troca de menu. Filtra por `state.menu` (`menu_id` em `refeicoes`/`bebidas`). A secção só aparece se a categoria tiver fotos (`hidden` em vazio/backend ausente). Chaves i18n pt/en: `galeria_*` + `a11y_galeria*` (`insta_*` removidas).
- **Zona "Fotos do slider" no admin** (antes da lista de preços): chips de categoria, campo opcional "Nome do prato" (→ `alt`), botão "Carregar foto" → redimensionamento no browser (canvas) → Edge Function `upload-galeria` → Storage → RPC `adicionar_galeria`; lista de fotos com miniatura, tag de categoria e eliminar → Edge Function `remover-galeria` (apaga ficheiro + linha). Contagem de fotos no status (`· N fotos`). Erros mapeados em `saveErrorMsg` (sem-imagem, formato-invalido, imagem-grande, categoria-invalida, storage-falhou, erro-interno, timeout).
- **Pré-requisitos da feature (lado do dono)**: correr o bloco `galeria` **+ bloco 6 (Storage)** de `supabase/schema.sql` no SQL Editor (tabela + RLS + RPCs + grants + bucket) e depois `supabase functions deploy upload-galeria --project-ref qsohbmjdhwjgizdfowfk --no-verify-jwt` e `supabase functions deploy remover-galeria --project-ref qsohbmjdhwjgizdfowfk --no-verify-jwt` (sem secrets externos; `IMGBB_KEY` foi removida). **Feito em 2026-09-22** (projeto `svoinha`, ref `qsohbmjdhwjgizdfowfk`; CLI logado com `supabase login`). Sem estes passos o admin mostra "Backend em falta" e a landing mantém a secção oculta.
- **Polish de acessibilidade e robustez (impeccable)**: landing com **menu em dois estágios** (chips "Refeições"/"Bebidas" com `aria-pressed` + abas por categoria com `role=tab`/`aria-selected`/roving e `aria-controls` → `#lista-categoria` com `aria-labelledby`); despedida da Vó (script accent único) acima do rodapé; rodapé/micro-copy com `text-on-surface-variant` (AA na light); toggle de tema com `aria-label` por idioma. Admin com **guarda de alterações não guardadas** (`dirty` Set → confirm em troca de tab/busca ativa não reinicia, refresh, Sair, `beforeunload`; `.row-dirty` visual), botão guardar desativado durante o save, painel "Ordem das Seções" **colapsável** (`<details>` + chevron), switch de disponibilidade com `role=switch`/`aria-checked` + rótulo "Disponível"/"Esgotado", input de preço `text`/`inputmode=numeric` com helper `= < valor formatado >` e normalização no blur, validação (>0) e aviso de salto >50% face ao base, tags "Bebidas" com `text-primary`; tabs com `aria-selected` + `aria-labelledby` do painel; `#btn-refresh` com nome acessível fixo + status em `<p role="status">`; botão "Site" usa ícone `external`. Token semântico `chip-active` agora usa `text-primary` na light (AA).
- (restante estado de 2026-09-20 mantém-se: admin Supabase Auth, logotipo/favicon, tradução EN, ordem de seções, deploy único Vercel…)

- **Admin migrado para Supabase Auth (conta do dono)**: schema novo `admin_email`/`eh_admin` **já corrido na cloud** pelo utilizador e verificado (probes: `validar_pin` 404, escritas anon → `false`, `config` protegido, `precos`/`seccoes` legíveis). Faltava apenas testar o login real do dono (`docflex.angola@gmail.com`).
- **Logotipo oficial + favicon trocados**: `logo-sm.png` substituído pelo SVG com classe `logo-sdv` (branco no dark); texto ao lado removido. **Favicon = recorte dos talheres (`favicon.svg`)** — mas plataformas que não suportam SVG (WhatsApp, iOS) usam as versões PNG/ICO geradas via `sharp`: `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` (180×180) e `favicon.ico`, servidos em `/images/`. Build verde; `/`, `/admin.html`, `/favicon.svg` e o logo servem 200.
- **Tradução EN completa** (30 categorias, 163 itens, 4 notas com `nota_en`); validação Node OK (itemKeys estáveis).
- **Ordem das seções reorganizável no admin** (painel com setas ↑/↓, intercala menus, guarda via RPC).
- **Landing redesenhada** (menu como foco): bloco bem-vindo compacto + abas por categoria (default Entradas) + rodapé enxuto. Listagem em estilo carta clássica (linha pontilhada → preço dorado).
- **Deploy (LIVE)**: **Vercel é o único host** — repo `docflexangola-hash/sitio-da-voinha` (público) → `https://sitio-da-voinha.vercel.app/` (admin: `/admin.html`). Deploy automático em cada push a `main`, sem ENV. `vite.config.js` usa `base: '/'` fixo; HTML usa `%BASE_URL%` (resolves para `/`). **GitHub Pages foi eliminado** (site desativado + workflow removido) — NÃO reintroduzir `BASE_PATH` nem `%BASE_URL%`/subpath.
- **OG image (WhatsApp/preview)**: `og-1200x630.png` — logotipo completo sobre fundo creme `#F4EFE4`, 1200×630, `?v=2` cache-buster em `og:image` para forçar re-raspagem.
- **Git**: repo tem raiz nesta pasta; identidade local `Docflex Angola` / `docflexangola-hash@users.noreply.github.com`; remote sem token (usa o credential manager do Windows). Fazer `git pull` antes de nova sessão no projeto e `git push` após alterações.
- Pendências: teste de login real do dono no admin **produção**; opcional: Lighthouse mobile, domínio próprio/CNAME.