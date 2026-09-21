# LOG — Sítio da Voinha (site digital)

Registo de desenvolvimento do projeto. Convenção: **acrescentar uma entrada datada no topo (ou no fim, de forma consistente) a cada sessão**; registar decisões, mudanças de estado e pendências.

## 2026-09-21 — QR code do site

- Gerado (offline, Node + `qrcode` + `sharp`): **preto sobre branco, logo dos talheres ao centro**, nível de correção **H**, **1024×1024** PNG + versão vector SVG (sem logo, impressão alta resolução).
- URL codificada: `https://sitio-da-voinha.vercel.app/` (confirmada por scan com `jsqr`).
- Pasta `qrcode/` na raiz (excluída do Git, não publicada no site) — para mesas/menus/cartões.

## 2026-09-20 — Favicon PNG/ICO (WhatsApp + Vercel)

- O favicon atual (`public/favicon.svg`, recorte dos talheres) tem suporte limitado em plataformas como WhatsApp/iOS. Geradas versões PNG/ICO via `sharp`: `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` (180×180), `favicon.ico`.
- `index.html` coloca os PNG/ICO **antes** do `<link rel="icon" type="image/svg+xml">`, de modo que crawlers/dispositivos que não suportam SVG usam o PNG/ICO; browsers modernos continuam com o SVG.
- Build verificado: PNG/ICO copiados para `dist/images/`; links com `%BASE_URL%` (funciona em Vercel raíz e GH Pages subpath).

## 2026-09-21 — GitHub Pages eliminado; Vercel único host

- **Removido o GitHub Pages**: apagado `.github/workflows/pages.yml` (+`.github/`) e desativado o site Pages via API (`DELETE /repos/docflexangola-hash/sitio-da-voinha/pages` → confirmado 404 e o antigo `https://docflexangola-hash.github.io/sitio-da-voinha/` deixou de servir).
- **`vite.config.js`**: `base: '/'` fixo (removido `process.env.BASE_PATH || '/'` — o subpath só servia o Pages). Em Vercel o site fica na raiz do domínio.
- **Vercel = único host**: cada push a `main` faz deploy automático (não precisa de ENV). Build local verde com paths raiz.

## 2026-09-21 — Wordmark do hero corrigido (texto "Sítio da Voinha")

- O wordmark do hero não mostrava corretamente o texto: o path antigo `escrita-voinha-e-talheres` misturava os talheres (draw fora do viewBox 2100×1864) com a caligrafia "Voinha", deixando o texto cortado/invisível.
- **Reescrito** `public/images/wordmark_sitio_da_voinha.svg` com os dois paths de texto limpos do ficheiro de referência `logotipo_sitio_da_voinha_sem_restaurante.svg` do dono: `#texto-sitio-da` ("SÍTIO DA") + `#texto-voinha` ("VOINHA"), `viewBox="-18 562 2767 1343"`.
- Regras mantidas: sem metadata C2PA, sem `width/height/style`, `role="img"` + `aria-label="Sítio da Voinha"`.
- Hero (index.html:120) inalterado — continua a usar `wordmark_sitio_da_voinha.svg` com `.logo-sdv-hero`. Builds (raiz + BASE_PATH) verdes; prévia `devtools-wm_preview.png` confere wordmark branco sobre fundo escuro (~1.15% branco, lettering espalhado — não borrão).

## 2026-09-21 — og:image = logotipo (preview WhatsApp)

- O preview do WhatsApp agora mostra o **logotipo completo** em vez da foto do hero.
- Gerado `public/images/og-1200x630.png` (1200×630, ~ proporção 1.91:1 do WhatsApp): **logotipo completo** sobre fundo **creme `#F4EFE4`**, sem transparência (canvas opaco), centrado. Gerado via `sharp` (script temporário `genog.cjs` apagado depois).
- `index.html`: `og:image` → `%BASE_URL%images/og-1200x630.png?v=2` (cache-buster `?v=2` para forçar a re-raspagem do WhatsApp ao reenviar o link). Adicionadas `og:image:type/width/height`.
- Build verificado nos 2 cenários (raiz Vercel + subpath GH Pages).

## 2026-09-20 — Vercel: sem ENV, base dinâmica

- Confirmado: zero `import.meta.env`/`process.env`/`VITE_` no código; Supabase URL + anon hardcoded em `supabase/config.js` (públicas por design). **Nenhum ENV é necessário no Vercel** (nada de serverless).
- `vite.config.js` → `base: process.env.BASE_PATH || '/'`: Vercel default `base:'/'` (raiz do domínio); workflow GH Pages define `BASE_PATH: /sitio-da-voinha/` no passo `npm run build`.
- `index.html` remove `og:url` (cosmético; `og:image` via `%BASE_URL%` já funciona em ambos).
- Builds verificados: sem env → paths `/assets/…`; com `BASE_PATH` → `/sitio-da-voinha/assets/…`.

## 2026-09-20 — Deploy em GitHub Pages (live)

- **Repo**: `docflexangola-hash/sitio-da-voinha` (público) — raiz do repo = a pasta do site. URL: `https://docflexangola-hash.github.io/sitio-da-voinha/`. Admin: `/admin.html`.
- **Base**: `vite.config.js` → `base: '/sitio-da-voinha/'`; caminhos absolutos do HTML trocados por `%BASE_URL%` (favicon, og:image, preload, logos, hero, wordmark, link admin e voltar). Dev continua em `/`.
- **Workflow**: `.github/workflows/pages.yml` (push para `main` + dispatch manual) → `npm ci` + `npm run build` + `configure-pages` + `upload-pages-artifact(dist)` + `deploy-pages`. **Foi preciso ativar Pages via API** (`build_type: workflow`) antes da primeira Action (configure-pages falhava com 404).
- Run #2 sucesso; live verificado 200 em `/`, `/admin.html`, favicon e imagens; assets servidos sob `/sitio-da-voinha/assets/`.
- Identidade git local: `Docflex Angola` / `docflexangola-hash@users.noreply.github.com`. Remote sem token (credential manager pede no push).
- **Segurança**: o token clássico partilhado nesta sessão tem escopos totais e deve ser **revogado** pelo dono (Settings → Developer settings → Personal access tokens) — chegou a ser visto em chat.

## 2026-09-20 — Crédito DOCFLEX ANGOLA no rodapé

- **Rodapé** (fundo): linha "Desenvolvido por **DOCFLEX ANGOLA**" — nome em maiúsculas a negrito, clicável (`https://docflex-site.vercel.app/`, `target="_blank" rel="noopener"`).
- i18n: nova key `foot_cred` (pt "Desenvolvido por" / en "Developed by"); o nome da marca é fixo.
- Build verde (index 10.98 kB); dist verificado (link, bold+uppercase, sem artefactos JSX); `foot_cred` presente no bundle em ambas as línguas.

## 2026-09-20 — Novo fundo do hero (cinematográfico)

- **Fundo**: `public/images/hero-1600.jpg` (1930×815) + `hero-900.jpg` (900×380) agora derivados do PNG do dono `hero_sitio_da_voinha_cinematografica.png` (2,8 MB → 408+110 KB, JPEG q82; sem transparência). Nomes mantidos → `og:image` e `<picture>`/preload continuam a apontar sem alterações de markup.
- **Scrim reforçado** para legibilidade do wordmark (index.html: gradiente `from-ink/80 via-ink/40 to-surface`).
- Removido `devtools-wm_preview.png` (artefato anterior). Build verde; `/`, `hero-1600.jpg`, `hero-900.jpg` = 200.

## 2026-09-20 — Wordmark do hero = lettering do logotipo

- **Antes**: o H1 "Sítio da Voinha" usava Playfair italic (`font-script`), diferente da arte do logo.
- **Agora**: o H1 da landing é o **SVG exacto** do lettering do logotipo — `public/images/wordmark_sitio_da_voinha.svg` (paths `texto-sitio-da` + `escrita-voinha-e-talheres`, `viewBox="0 0 2100 1864"`, zona esquerda do logo aprovada pelo dono — estampa "SÍTIO DA" + assinatura "Voinha").
- Sempre **branco** no hero via `.logo-sdv-hero` (`brightness(0) invert(1)` + drop-shadow), independente do dark — está sobre a foto. `alt="Sítio da Voinha"` mantém acessibilidade.
- Preview em `devtools-wm_preview.png` (raiz; apagar depois de rever). Build verde; `AGENTS.md` atualizado.

## 2026-09-20 — Aba default da landing = primeira secção da ordem

- **Antes**: a landing abria sempre em `entradas` (`main.js`), mesmo depois de reordenar no admin.
- **Agora**: ao carregar, a aba ativa é `state.categorias[0].catId` — a primeira secção da ordem vigente na cloud (hoje «Carnes», tal como definido no painel). Sem ordem cloud continua a abrir em Entradas. O clique do utilizador mantém-se (o default só é aplicado no load).
- `AGENTS.md` atualizado; build verde.

## 2026-09-20 — Email do dono removido do login + migration da ordem corrida

- **Fix do reorder executado na cloud**: o dono correu o `schema.sql` atualizado (`atualizar_ordem` já com `DELETE ... WHERE` + upsert). Pendência fechada.
- **Privacidade**: o email do dono (`docflex.angola@gmail.com`) **não pode aparecer no frontend** — estava no placeholder do campo e num texto de ajuda da tela de login (`admin.html`). Removidos ambos; placeholder neutro (`nome@email.com`). Build verde; grep confirma zero ocorrências em HTML/JS/CSS/JSON (o email fica só no `schema.sql` e em docs de dev AGENTS/LOG).

## 2026-09-20 — Fix "delete requires a where clause" na ordem das seções

- **Sintoma**: reordenar categorias no admin dava erro "delete requires a where clause" (SQLSTATE 21000).
- **Causa**: corpo da RPC `atualizar_ordem` fazia `delete from public.seccoes;` sem `WHERE`; o PostgREST/Supabase recusa `DELETE`/`UPDATE` sem `WHERE` (proteção tipo pg-safeupdate). O front não muda.
- **Fix** (schema.sql): `delete from public.seccoes where cat_id <> all(p_ordens);` + `insert ... on conflict do update` — apaga apenas órfãs, faz upsert das restantes. **Executado pelo dono no SQL Editor**.
- O front (`admin.js`/`supabase.js`) não foi alterado. `AGENTS.md` atualizado.

## 2026-09-20 — Logotipo oficial + favicon

- **Logo**: `logo-sm.png` (header/rodapé/admin) substituído pelo SVG do logotipo (`public/images/logotipo_sitio_da_voinha.svg`, limpo de metadata C2PA/width/height). Imagens com a classe `logo-sdv`; no dark fica **100% branco** (`filter: brightness(0) invert(1)`). Removido o bloco de texto ao lado do logo no header («Sítio da Voinha» + «Praia Morena · Benguela» — já constam no próprio SVG).
- **Favicon** (`public/favicon.svg`): recorte do logotipo com os talheres cruzados (enviado pelo dono), limpo de C2PA/style/width/height; `viewBox` mantido.
- Apagados `public/images/logo.png` e `logo-sm.png`; sem referências restantes.
- Build verde (12 módulos); `/`, `/admin.html`, `/favicon.svg` e `/images/logotipo_sitio_da_voinha.svg` → 200 no `vite preview`. `AGENTS.md` atualizado.

## 2026-09-20 — Tradução EN dos pratos + seções reorganizáveis no admin

- **Tradução não-literal**: `menu.json` ganhou `nome_en` em todas as 30 categorias e 163 itens + `nota_en` nas 4 notas. Regras: nome comum em inglês quando existe, senão descritivo; marcas/nomes próprios mantêm-se. `main.js` usa `lname()`/`lnote()` com fallback PT; admin continua PT-only.
- **Ordem das seções**: nova tabela `seccoes (cat_id PK, ordem)` + RPC `atualizar_ordem(pin, p_ordens text[])` no `schema.sql` (**a correr no SQL Editor**). `supabase.js`: `fetchOrdem`/`saveOrdem`. `flatCategories(menus, ordemMap)` sorteia pela ordem cloud (intercala menus livremente — `menuId` é só namespace, itemKeys não mudam) com fallback default (Entradas primeiro). Admin: painel "Ordem das Seções" com setas ↑/↓ (guarda a cada movimento; seta desativada nos extremos).
- Validações Node: traduções completas + itemKeys únicas/estáveis; reorder/dafault testado. Build OK; preview 200 em `/` e `/admin.html`.
- `AGENTS.md` atualizado (fluxos, endpoints, pendência da migração).

## 2026-09-20 — Listagem de pratos em estilo carta clássica

- `renderList()` (`main.js`) redesenhado: **1 coluna**, lista aberta (sem cartão fechado), cada prato com nome → **linha pontilhada** flexível → preço dourado à direita (`tnum`); nota por baixo da linha; esgotado com riscado + badge + `opacity-70`.
- Decisão do cliente: Opção A, sempre 1 coluna (mobile e desktop).
- Build OK; preview 200 em `/` e `/admin.html`; utilitários `border-dotted`, `divide-outline-variant/15`, `decoration-outline` presentes no CSS compilado. `AGENTS.md` atualizado.

## 2026-09-20 — Tema nocturno automático + botões retangulares

- **Dark auto por horário** (`theme.js`): janela nocturna **17:30–05:00** (relógio do dispositivo) como regra default; `setInterval` 60 s reavalia a meio da sessão. **Clique manual vence** (grava `sdv-theme` e passa a mandar). Removida a regra `prefers-color-scheme` como default.
- **Botões retangulares**: `.btn` e `.chip` → `rounded-none`; removidos `rounded-full/lg/xl` de todos os `<button>` e do "Ligar" no header e admin (tema, idioma, hamburger, tabs, guardar/sair/refresh, limpar busca). **Inputs/PIN mantêm `rounded-xl`** (decisão do cliente).
- Verificado: build OK; preview 200 em `/` e `/admin.html`; `rounded-none` presente no CSS compilado.
- `AGENTS.md` atualizado (regra do tema + convenção dos botões).

## 2026-09-20 — Redesign da landing com foco no menu

**Decisão:** a landing deixa de ser uma página multi-secção e passa a ter o menu como foco. Aprovado conceito pelo cliente: apenas "Bem-vindo" + Menu + rodapé compacto.

- Landing agora: bloco benvindo compacto (fundo `hero-1600/900.jpg`) → secção **Menu** com **uma aba por categoria** (default **Entradas**, barra horizontal scrollável, sticky) → rodapé enxuto (morada, horário, telefone/WhatsApp, link admin).
- **Removidos:** destaques, marquee, secção playground, secção localização completa, campo de busca e chips (substituídos pelas abas).
- `store.js`: novo `flatCategories()` — achata os 2 menus em categorias `{menuId, catId, nome, itens}`, reordena **`entradas` para o primeiro** lugar. `itemKey` mantém-se (`menuId/catId/nome`) → overrides da cloud continuam válidos.
- `main.js`: estado passa a `categoria` (default `entradas`); `renderTabs()`/`renderList()`. Removida renderização de destaques/busca/chips.
- `i18n.js`: dicionários PT/EN limitados às chaves usadas; novas keys `hero_eyebrow`, `hero_mini`, `menu_sub`. Rótulos das abas continuam PT (nomes das categorias).
- `index.html`: 385→~270 linhas; index passa de 27 KB a 10.8 KB; CSS 36.9→28.4 KB; main.js 13.7→6.9 KB.
- **Imagens apagadas** de `public/images/`: `deck-banner-1200`, `grelhada-640`, `choco-640`, `cocktails-640`, `mapa-1000`. Ficam `hero-1600/900.jpg`, `logo.png`, `logo-sm.png`, `favicon.svg`.
- **Verificado:** `npm run build` OK; preview 200 em `/` e `/admin.html`; ordenação `entradas` primeiro (30 categorias no total); sem referências a imagens apagadas.
- `AGENTS.md` atualizado (estrutura, flatCategories, estado atual).
- Admin inalterado (continua agrupado por refeicoes/bebidas — coerente com as chaves).

## 2026-09-20 — Setup, landing original e backend

- **Stack escolhida** (aprovado): Vite 6 + Tailwind 3.4 (PostCSS) + JS vanilla, 2 entradas estáticas (`index.html` + `admin.html`). Sem framework.
- Scaffold (`package.json`, configs, `.gitignore`), `npm install`; `allowScripts` esbuild aprovado.
- **Design system** aplicado no CSS vars + tokens (`surface*`/`gold`/`tertiary`/…, Montserrat + Playfair, `text-*`/`chip-*`/`btn-*`).
- **Assets**: 7 imagens otimizadas em `public/images/` (posts de referência, CDN externo transitório); logo processado para transparente (`logo.png` 672 KB, `logo-sm.png`).
- **Data**: `src/data/menu.json` copiado do ficheiro original e corrigido (chave fantasma `martell` removida).
- **Supabase**: `supabase/config.js` (URL + anon key; service role/sb_secret ficam FORA do projeto, em `dbsupabasepass.md`), `schema.sql` com tabelas `precos`/`config`, RLS, `atualizar_preco()` (PIN via pgcrypto), `ping_admin()`, `validar_pin()`.
- **Build inicial** de landing + admin; verificado 200.
- **Migration corrida** no SQL Editor e verificada: `ping_admin → true`, `precos` legível (0 linhas). Backend ativo.
- **Pendências (na altura):** trocar PIN `1234`; teste ponta-a-ponta do admin; deploy; OG meta; Lighthouse.

## 2026-09-20 — Admin migrado de PIN para Supabase Auth (conta do dono)

- **Decisão do cliente**: Raw REST (zero dependências) + **um dono** — `config.admin_email = docflex.angola@gmail.com`. Sem SDK; `sb_secret`/credenciais nunca no bundle.
- **`schema.sql`** reescrito: removidos `pin_hash`/`validar_pin` e as assinaturas com `pin`; `config` guarda `admin_email`; nova `eh_admin()` (compara `auth.email` ao `admin_email` via `request.jwt.claims`); `atualizar_preco(chave,preco,disponivel)` e `atualizar_ordem(ordens text[])` **SECURITY DEFINER** a negar (`false`) se `not eh_admin()`; grants só das assinaturas novas. **A correr no SQL Editor**.
- **`src/supabase.js`**: `authSignIn`/`authSignOut`/`getSession` (Raw REST: `/auth/v1/token?grant_type=password|refresh_token`, `/auth/v1/logout`); sessão `sdv-session` em localStorage; refreshes preventivos (≤60 s) e retry único da escrita em 401; `savePrice`/`saveOrdem` sem PIN, com bearer da sessão.
- **`admin.html`/`admin.js`**: login email+password (inputs `campo-email`/`campo-password`); logout limpa sessão; auto-login no boot se houver sessão válida; erros mapeados (sessão expirada / conta sem permissão / schema em falta); removido o banner "backend à espera de setup".
- **Verificado**: build OK (12 módulos, 3 chunks vs 4); landing continua só com leituras anon.
- **Passos teus no Supabase**: desativar autosignup; criar utilizador `docflex.angola@gmail.com` (Users → Add user); correr `schema.sql` no SQL Editor; login no admin com esse email. `AGENTS.md` atualizado.

## Pendências em aberto

- [x] Criar a conta do dono no Dashboard (`docflex.angola@gmail.com`) e desligar o autosignup — **feito** (probes confirmam; verificação final é o login).
- [x] Correr o **novo `supabase/schema.sql`** no SQL Editor — **feito** (`validar_pin` 404; escritas anon → `false`; `config` protegido).
- [ ] Teste ponta-a-ponta do admin (login do dono → guardar preço → refletir na landing, incluindo "Esgotado"; reordenar seções).
- [ ] Deploy de `dist/` a host estático (Netlify/Vercel/GitHub Pages) + domínio (opcional).
- [ ] Opcional: meta OG refinado, Lighthouse mobile, mapear domínio próprio.