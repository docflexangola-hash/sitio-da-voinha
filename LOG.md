# LOG — Sítio da Voinha (site digital)

Registo de desenvolvimento do projeto. Convenção: **acrescentar uma entrada datada no topo (ou no fim, de forma consistente) a cada sessão**; registar decisões, mudanças de estado e pendências.

## 2026-09-22 — Fix: ReferenceError em `renderList` que bloqueava a exibição da Galeria

- **Sintoma**: a secção `#galeria` continuava com `hidden` na landing page mesmo com dados existentes na base de dados.
- **Causa raiz**: na função `renderList()` de `src/main.js`, a linha `listEl().setAttribute('aria-labelledby', \`tab-${active.catId}\`)` tentava aceder à variável `active` em vez de `cat` (a variável declarada no escopo era `const cat = activeCat()`). Isso disparava um `Uncaught ReferenceError: active is not defined` durante `loadData()` / `renderMenu()`, interrompendo a execução antes da chamada a `renderGaleria()`.
- **Solução**: corrigido em `src/main.js` para `tab-${cat.catId}`.
- **Validação**: `npm run build` executado com sucesso sem erros.

## 2026-09-22 — Fotos do slider migradas do imgbb para o Supabase Storage

- **Contexto**: o slider tinha problemas de carregamento. As fotos viviam no **imgbb** (CDN grátis, lento/instável) via edge function `upload-imgbb` — um CDN externo contra a convenção do AGENTS.md, e sem qualquer otimização (subia-se o ficheiro original, às vezes 32MB/HEIC).
- **Decisão (dono)**: mudar o destino para o **Supabase Storage** (bucket público `galeria`), **redimensionar no browser** antes do upload e **remover o imgbb por completo**.
- **`supabase/schema.sql` (bloco 6 novo)**: cria o bucket `galeria` (`public`, limite 32MB) + políticas (leitura anon; escrita `authenticated`) + grants. Idempotente (`on conflict (id) do nothing`).
- **Edge Functions novas** (Deno, mesmo padrão de auth da antiga — `OPTIONS` CORS + `getUser` + `rpc('eh_admin')`):
  - `supabase/functions/upload-galeria/` — valida `image/*` e ≤32MB, gera caminho `{menu}/{uuid}.{ext}`, `storage.from('galeria').upload(..., {cacheControl:'3600'})`, devolve a URL pública (`{SUPABASE_URL}/storage/v1/object/public/galeria/...`).
  - `supabase/functions/remover-galeria/` — lê a URL atual, remove o objeto do Storage e apaga a linha via RPC `remover_galeria` (idempotente; o RPC continua a validar `eh_admin`).
  - Removida `upload-imgbb/`; secret `IMGBB_KEY` deve ser apagado (`supabase secrets unset IMGBB_KEY`).
- **`src/supabase.js`**: `uploadImgbb(file)` → `uploadGaleria(file, menuId)` (POST `/functions/v1/upload-galeria`, FormData `image`+`menu`); `removeGaleriaItem(id)` passou a chamar `/functions/v1/remover-galeria` (apaga ficheiro + linha). `fetchGaleria`/`addGaleriaItem`/slider inalterados.
- **`src/admin.js`**: helper `galeriaOptimize(file)` — redimensiona para máx. 1100px no canvas, encoda PNG/WebP/JPEG (q.8), preserva GIFs animados e o original se o canvas falhar; `onGaleriaFile` usa-o antes do upload; `saveErrorMsg` atualizado (`storage-falhou`, `categoria-invalida`; removidos os `imgbb-*`).
- **Passos do dono (Supabase)**: correr o **bloco 6** do `schema.sql` no SQL Editor; `supabase functions deploy upload-galeria --project-ref qsohbmjdhwjgizdfowfk --no-verify-jwt`; idem `remover-galeria`; `supabase secrets unset IMGBB_KEY`. Depois **re-subir as 7 fotos** pelo `/admin.html` (as URLs antigas do imgbb ficam órfãs — apagá-las pela lista) e correr `npm run build`.
- **Nota técnica**: `sharp` não corre em edge functions do Deno (binários nativos `.node`); por isso o redimensionamento foi feito no browser (canvas) — mesmo objetivo (imagens ~1100px para cartões de 330px) sem dependências novas.

## 2026-09-22 — Fix: slider `#galeria` invisível no browser do dono (cache headers)

- **Sintoma**: o slider de fotos na landing não aparecia no browser do dono (Angola), mesmo em janela privada com hard refresh. O código JS (`renderGaleria`) e o backend (7 fotos na tabela `galeria`, REST 200) estavam corretos.
- **Diagnóstico**: o Vercel respondia com `X-Vercel-Cache: HIT` e `Age` elevado no HTML; o `Cache-Control: public, max-age=0, must-revalidate` padrão do Vercel não impede que proxies ISP/CDN em Angola sirvam uma cópia stale do HTML (versão anterior sem a secção `#galeria` ou com bundles antigos).
- **Solução**: criado [`vercel.json`](file:///c:/Users/juary/Downloads/stitch_s_tio_da_voinha_digital_menu/sitio-da-voinha/vercel.json) na raiz do projeto com headers explícitos:
  - `/` e `/(.*).html` → `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`
  - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` (os bundles hasheados pelo Vite são seguros para cache longo)
- **Validação**: `npm run build` → ✓ (12 modules, 45s, nomes de assets inalterados: `main-CgPcddTO.js`, `supabase-YIzwB-Ou.css`).
- **Próximo passo**: `git add vercel.json && git commit && git push` para o Vercel aplicar os novos headers. Após deploy, pedir ao dono para abrir a landing em janela privada e confirmar que o slider aparece.

## 2026-09-21 — Secção Instagram na landing (embed oficial do perfil)

- **Decisão (brainstorming com o dono)**: em vez de fotos locais/IA, usar o **embed oficial** `https://www.instagram.com/o_sitio_da_voinhaa/embed/` — zero manutenção, fotos sempre atuais; perde-se a ordem aleatória (é a do IG) e o iframe fica branco (não estilizável).
- **Bloqueio validado**: o link partilhado trazia `stkn=` (token de conta privada); o dono confirmou que o perfil **já é público** — o embed só mostra fotos em contas públicas.
- **Implementação** (`index.html`): nova `<section id="instagram">` entre o `#menu` e o rodapé — eyebrow dourado + título `O nosso Instagram` + card `max-w-md rounded-xl` com iframe `h-[600px]` `loading="lazy"` `referrerpolicy="no-referrer-when-downgrade"`, legenda `body-sm` e CTA "Seguir" (borda dourada, abre perfil em nova aba, ícone `external`). Sem accent de script (a Vó já fala uma vez por ecrã).
- **i18n**: +4 chaves pt/en (`insta_eyebrow`, `insta_title`, `insta_caption`, `insta_follow`).
- **Nota de verificação**: o embutido só confirma ao vivo no browser real/logado — o IG bloqueia bots e em dev pode mostrar a parede de login (normal). AGENTS.md atualizado (estrutura + Estado atual).

## 2026-09-21 — Pipeline impeccable: document + critique + polish

- **Document o sistema**: gerados `PRODUCT.md` (contexto), `DESIGN.md` (design system: tokens, tipografia, regras nomeadas) e `.impeccable/design.json` (source of truth estruturada) via `impeccable init/document`.
- **Critique ×2** (`impeccable critique`, evidência por dual-agente + detector): landing `index.html` **28/36 Good** · admin `admin.html` **18/36 Needs Work**. Snapshots em `.impeccable/critique/` + `trend.md`.
- **Polish** (distil-first, um único passe) — landing: **menu em dois estágios** (chips "Refeições"/"Bebidas" com `aria-pressed` + abas por categoria `role=tab`/`aria-selected`/roving, `aria-controls`→`#lista-categoria`), despedida da Vó (*script* accent único) acima do rodapé, contraste AA na light (`chip-active` → `text-primary` 5.4:1; rodapé → `text-on-surface-variant`), `#lista-status` sr-only live, toggle de tema com `aria-label` por idioma; admin: **guarda de edições não guardadas** (`dirty` Set + confirm em tab/refresh/Sair/`beforeunload`, `.row-dirty` visual, botão guardar com estado disabled), painel "Ordem das Seções" **colapsável** (`<details>` + chevron), switch com `role=switch`/`aria-checked` + rótulo Disponível/Esgotado + toast de estado real, input de preço com helper `= <formatado>` + normalização no blur + validação (>0, aviso de salto >50%), tabs com `aria-selected`/`aria-labelledby`, `#btn-refresh` com nome fixo + status em `<p role="status">`, ícone `external` no botão "Site".
- **Verificação**: `npm run build` verde; detector sem regressões (mesmos falsos positivos pré-existentes); i18n 32/32 chaves espelhadas pt/en. AGENTS.md e DESIGN.md atualizados para refletir as mudanças (menu em 2 estágios, token chip-active, Estado atual 2026-09-21).
- **Deploy**: commit `04af733` pushado → Vercel recarrega `https://sitio-da-voinha.vercel.app/`.

## 2026-09-21 — QR code do site

- Gerado (offline, Node + `qrcode` + `sharp`): **preto sobre branco, logo dos talheres ao centro**, nível de correção **H**, **1024×1024** PNG + versão vector SVG (sem logo, impressão alta resolução).
- URL codificada: `https://sitio-da-voinha.vercel.app/` (confirmada por scan com `jsqr`).
- Pasta `qrcode/` na raiz (excluída do Git, não publicada no site) — para mesas/menus/cartões.

## 2026-09-20 — Favicon PNG/ICO (WhatsApp + Vercel)

- O favicon atual (`public/favicon.svg`, recorte dos talheres) tem suporte limitado em plataformas como WhatsApp/iOS. Geradas versões PNG/ICO via `sharp`: `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` (180×180), `favicon.ico`.
- `index.html` coloca os PNG/ICO **antes** do `<link rel="icon" type="image/svg+xml">`, de modo que crawlers/dispositivos que não suportam SVG usam o PNG/ICO; browsers modernos continuam com o SVG.
- Build verificado: PNG/ICO copiados para `dist/images/`; links com `%BASE_URL%` (funciona em Vercel raíz e GH Pages subpath).

## 2026-09-21 — Scrim da hero: `black` em vez de `ink` (legibilidade no nocturno)

- O texto da hero ficava quase invisível no modo nocturno: o gradiente de véu usava `from-ink/80 via-ink/40`, e o token `ink` **inverte em dark** (`--c-ink: 240 238 233`, quase branco) → véu claro sobre texto branco.
- Fix em `index.html`: `from-black/80 via-black/40 to-surface`. `black` não inverte com o tema; `to-surface` mantém o blend com a página. Screenshot headless com `.dark` forçado confirmou topo escuro (~55%) + texto branco legível.

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
## 2026-09-21 - Slider de fotos proprio (substitui o embed do Instagram)

- **Decisao do cliente**: removeu-se o bloco Instagram (o dono nao gostou do iframe) e criou-se um **slider de fotos dos pratos** na landing, entre o menu e o rodape. Fotos carregadas pelo dono numa **zona no admin** ("Fotos do slider") e alojadas no **imgbb**; categoria por menu (refeicoes/bebidas) para o slider acompanhar o seletor "Refeicoes"/"Bebidas".
- **Schema (supabase/schema.sql)**: nova tabela galeria (id identity, menu_id, url, alt, created_at) com RLS publica para SELECT; RPCs dicionar_galeria(p_url,p_alt,p_menu) e emover_galeria(p_id) SECURITY DEFINER a exigir eh_admin(); grants. **A correr no SQL Editor**.
- **Edge Function nova supabase/functions/upload-imgbb/** (Deno): valida JWT + eh_admin(), exige imagem (<=32MB), envia para pi.imgbb.com/1/upload; devolve display_url. A chave IMGBB_KEY vive so na env: supabase functions deploy upload-imgbb + supabase secrets set --env-name IMGBB_KEY <chave>.
- **src/supabase.js**: etchGaleria() (leitura anon), ddGaleriaItem/emoveGaleriaItem (RPC), uploadImgbb(file) (POST a /functions/v1/upload-imgbb com Bearer da sessao do dono).
- **Admin**: painel "Fotos do slider" (chips de categoria, nome opcional -> alt, upload, lista com miniatura/tag/eliminar); contagem "N fotos" no status; erros novos mapeados; 5+1 respostas seguras (imgbb sem rede nao quebra nada).
- **Landing**: secao #galeria com track snap-x de cartoes 4:5 (w-[72vw] max-w-[330px]), setas (icons arrowLeft/arrowRight) + dots rectangulares, autoplay 4.5s com pausa (hover/touch/reduced-motion/aba oculta), **ordem aleatoria (Fisher-Yates) por render/troca de menu**; hidden se a categoria nao tiver fotos. i18n pt/en: galeria_*/11y_galeria* (removidas insta_*).
- **Verificado**: 
pm run build verde (12 modulos); validador i18n pt 38//en 38, usadas 34, sem faltas/divergencias; detetor UI sem regressoes novas.
- **Passos teus (Supabase)**: correr bloco galeria do schema.sql; supabase functions deploy upload-imgbb; supabase secrets set --env-name IMGBB_KEY <chave imgbb>; depois testar upload no /admin.html (login).- **Nota de verificacao do imgbb**: o teste de fumo a partir da maquina de desenvolvimento falha com imgbb code 103 ("forbidden to use this website" — mesmo com uma URL publica conhecida); trata-se de bloqueio por IP desta rede, nao do codigo (multipart/urlencoded/base64 e a chave passam; a chave nao devolve "invalid API key"). O upload real fara-se dos IPs da Supabase, via edge function deployada. Se ai voltar 103/415, rotacionar/confirmar a chave no dashboard do imgbb.- **Fix upload preso em "A carregar"**: a edge function pendurava sem timeout no pedido ao imgbb (e o fetch do browser idem). Adicionado AbortSignal.timeout(20s) ao imgbb na edge function (devolve imgbb-timeout), AbortController de 30s no uploadImgbb (cliente, devolve 	imeout), reset garantido do estado de upload em inally e novo erro mapeado no admin. **Re-colar o codigo novo da edge function no Dashboard (Deploy updates)** antes de retestar.

## 2026-09-22 - Upload de fotos corrigido (edge function via CLI)

- **Diagnostico do "Failed to fetch" no botao "Carregar foto"**: a funcao `upload-imgbb` estava deployada (via Dashboard editor, por isso o codigo diferia do local) com **JWT verification ativa na plataforma**. O gateway devolvia `401 {"error":"not-authenticated"}` **sem headers CORS** a todos os pedidos — incluindo o preflight OPTIONS que o browser manda antes de cada fetch. Sem `Access-Control-Allow-Origin` no preflight, o browser cancela o pedido (`TypeError: Failed to fetch`). Confirmado por curl: `OPTIONS` e `POST` → 401 sem `access-control-*`.
- **Correcao (sem mudancas de codigo — frontend e funcao local ja estavam corretos)**:
  1. `supabase login` (CLI 2.117.0; guarda token no keychain do SO, nao em `~/.supabase/access-token`).
  2. `supabase functions deploy upload-imgbb --project-ref qsohbmjdhwjgizdfowfk --no-verify-jwt` — a flag desliga o JWT da plataforma; a funcao continua a autenticar no servidor (`getUser` + `eh_admin()`). Deploy direto (Docker nao precisa de estar a correr para funcoes).
  3. `supabase secrets set IMGBB_KEY=<chave> --project-ref qsohbmjdhwjgizdfowfk` (no CLI 2.117.0 o `--env-name` **nao existe**; usa `NOME=VALOR`).
  4. `supabase secrets list` confirma `IMGBB_KEY` presente.
- **Verificacao tecnica** (curl): `OPTIONS` → `204` + `Access-Control-Allow-Origin: *` + `access-control-allow-headers/methods`; `POST` sem token → `401 {"error":"not-authenticated"}` **com** headers CORS (agora o browser mostra o erro real, nao "Failed to fetch").
- **Projetos do CLI**: `svoinha` (ref `qsohbmjdhwjgizdfowfk`, West EU) e o "docflexangola-hash's Project" (`wqnajtzsgqzrtawbrkbu`) — cuidado para nunca apontar para o ref errado. O CLI nao esta "linked" a nenhuma pasta (sem `config.toml`); usar sempre `--project-ref`.
- **Pendente**: teste ponta-a-ponta do upload (login do dono no `/admin.html` → carregar foto → foto no slider da landing). Nota antiga sobre imgbb code 103 por IP desta rede continua relevante: se o upload devolver `imgbb-falhou`, confirmar/rotacionar a chave no dashboard do imgbb.