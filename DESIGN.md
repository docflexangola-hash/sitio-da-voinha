---
name: Sítio da Voinha — Restaurante & Playground
description: Menu digital de uma esplanada costeira casual, dourada e clássica, à beira-mar em Benguela.
colors:
  gold: "rgb(117 91 0)"
  gold-on: "rgb(255 255 255)"
  gold-container: "rgb(178 145 47)"
  gold-on-container: "rgb(58 44 0)"
  gold-fixed: "rgb(255 224 143)"
  gold-100: "rgb(243 235 208)"
  gold-500: "rgb(178 145 47)"
  gold-600: "rgb(143 114 34)"
  surface: "rgb(249 249 247)"
  surface-lowest: "rgb(255 255 255)"
  surface-low: "rgb(244 244 242)"
  surface-high: "rgb(232 232 230)"
  surface-highest: "rgb(226 227 225)"
  on-surface: "rgb(26 28 27)"
  on-surface-variant: "rgb(77 70 55)"
  outline: "rgb(127 118 101)"
  outline-variant: "rgb(208 197 177)"
  honey: "rgb(254 217 126)"
  on-honey: "rgb(120 93 11)"
  wood: "rgb(130 83 53)"
  error: "rgb(186 26 26)"
  error-surface: "rgb(255 218 214)"
  on-error-surface: "rgb(147 0 10)"
  ink-toast: "rgb(17 17 17)"
  on-toast: "rgb(241 241 239)"
  toast-surface: "rgb(47 49 48)"
typography:
  script:
    fontFamily: '"Playfair Display", Georgia, serif'
    fontSize: "clamp(1.5rem, 3.5vw, 1.9rem)"
    fontWeight: 400
    fontStyle: italic
    lineHeight: 1.15
  headline:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  headline-sm:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.03em"
    textTransform: "uppercase"
  price:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.01em"
  body-lg:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.01em"
  body-sm:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
  label:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.14em"
    textTransform: "uppercase"
  label-sm:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.12em"
    textTransform: "uppercase"
rounded:
  none: "0"
  lg: "0.375rem"
  xl: "0.625rem"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-on}"
    rounded: "{rounded.none}"
    padding: "20px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.gold-container}"
    textColor: "{colors.gold-on-container}"
    rounded: "{rounded.none}"
    padding: "20px 24px"
    typography: "{typography.label}"
  chip-idle:
    backgroundColor: "{colors.surface-lowest}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
    typography: "{typography.label}"
  chip-active:
    backgroundColor: "{colors.gold-100}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
    typography: "{typography.label}"
  input-text:
    backgroundColor: "{colors.surface-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface-lowest}"
    rounded: "{rounded.xl}"
  toggle-track:
    backgroundColor: "{colors.surface-highest}"
    rounded: "{rounded.full}"
    height: "24px"
    width: "44px"
---

# Design System: Sítio da Voinha

## Overview

**Creative North Star: "Ouro da Praia Morena"**

O Sítio da Voinha é uma esplanada costeira casual com playground, à beira-mar na Praia Morena, Benguela. O sistema visual pega no ouro areento do estuário — o mesmo tom que aparece no verniz da madeira e na palha dos guarda-sóis — e arruma-o com a precisão de uma **carta clássica de restaurante**: listas abertas, linhas pontilhadas a fechar o preço, maiúsculas largas de menu, um toque de caligrafia quando a "Vó" fala. É costeiro porque respira areia e creme; é clássico porque nenhum botão é redondo e cada preço tem o seu lugar à direita.

O sistema fala com tom descontraído e hierarquia firme. A densidade é baixa: muito ar, listas que se leem em linha reta, um dourado que aparece só onde esse dourado ganha significado — nos preços, nos CTAs e no item ativo. A personalidade vem do contraste entre o *sans* grave e compressado (Montserrat, caps muito lar de espaçamento) e o *script* solto da Playfair em itálico, reservado para as saudações da Vó.

Todo o sistema vive em **tokens RGB invertíveis**: o mesmo token muda de sentido entre claro e escuro (dourado-escuro vira dourado-claro, creme vira quase-preto quente). Quem edita nunca escreve literais — usa o token. Duas regras de marca ficam fora da malha: o **logótipo** é imagem SVG que escurece a branco no modo escuro, e o **wordmark** do hero é letra-imagem, sempre branca, com o seu véu próprio.

**Key Characteristics:**
- Dourado areento de estuário como cor de autoridade (preços, CTAs, estado ativo).
- Superfícies creme/areia com texto quente-escuro; escuro = quase-preto quente com dourado-claro.
- Botões e chips **perfeitamente retangulares** (`rounded-none`); inputs e cartas afáveis (`rounded-xl`); pills só para badges e toggles.
- Listas abertas à moda da carta clássica — nunca cartões fechados no menu público.
- Montserrat caps com tracking largo para estrutura; Playfair italics para o registo da Vó.
- Elevação flat com brilho quente: sombras cor de ouro no lugar certo (cartas, botões primários), nada ostensivo.
- Temas clar/escuro por inversão de tokens; dark automático por janela horária (17:30–05:00) com escolha manual.

## Colors

Paleta em tons de **areia e ouro de estuário**: quente, seca e diurna, com um castanho-madeira como acento orgânico e um mel para avisos suaves.

### Primary
- **Ouro de Estuário** (`rgb(117 91 0)`): a cor de autoridade. Preços do menu, botões primários, aba ativa, ícone de restrito, divisória decorativa (`gold-500/60`). No modo escuro **inverte** para dourado-claro (`rgb(232 195 92)`) — a mesma dignidade, outro clima.
- **Ouro de Estuário — Container** (`rgb(178 145 47)`): fundo hover dos botões primários e estados de luminosidade maior.
- **Ouro Lavado** (`gold-100` = `rgb(243 235 208)`): pílulas de contagem, chips ativos, badges "editado".
- **Ouro Profundo** (`gold-600` = `rgb(143 114 34)`): foco visível e textos dourados que precisam de mais contraste.

### Secondary
- **Mel** (`honey` = `rgb(254 217 126)` + `on-honey`): fundos de avisos suaves (toast de "aviso" no admin).

### Tertiary
- **Madeira de Barco** (`wood` = `rgb(130 83 53)`): apenas para os apontamentos em *script* da Vó ("A nossa ementa", "Os preços da Vó"). Reservado, quase nunca mais usado.

### Neutral
- **Areia** (`surface` = `rgb(249 249 247)`): fundo geral da página e véu final do hero.
- **Branco Areia** (`surface-lowest` = `rgb(255 255 255)`): superfícies elevadas (cartas, inputs, chips, header pills).
- **Areia Alta** (`surface-high`/`surface-highest`): tela de switches, fundo de grupos de abas no admin.
- **Tinta** (`on-surface` = `rgb(26 28 27)`): texto principal.
- **Tinta Suave** (`on-surface-variant` = `rgb(77 70 55)`): texto secundário, estados idle.
- **Linha** (`outline`/`outline-variant`): bordas e separadores; `outline-variant` é o padrão suave.
- **Tinta para Toast** (`ink-toast` `rgb(17 17 17)` + `on-toast`): toast de sucesso do admin.

### Named Rules
**The Dourado-Seletivo Rule.** O dourado só brilha onde significa valor: preço, CTA primário, estado ativo, marca. Nunca como decoração gratuita em superfícies.

**The Inversão Rule.** Um token é uma família que muda com o tema — `gold` dark = `rgb(232 195 92)` (claro), nunca um dourado escuro sobre fundo escuro. Nunca escrever cores literais; sempre token.

**The Toast Rule.** Não há "verde de sucesso": o admin usa **tinta sobre superfície inversa** (toast quase-preto) para sucesso, **mel** para avisos e **vermelho-container** para erros.

## Typography

**Display Font (sans):** Montserrat (com `ui-sans-serif`, `system-ui`)
**Script Font:** Playfair Display (com Georgia, serif) — apenas em itálico, para a voz da Vó
**Label/Mono Font:** sem mono próprio; preços usam `font-variant-numeric: tabular-nums`

**Character:** Montserrat grave, condensada no espaçamento de letras das caps — soa a ementa impressa, não a app moderna. A Playfair em itálico entra como a voz contada da avó: suave, humana, reservada para uma saudação de cada vez.

### Hierarchy
- **Script** (Playfair 400 itálico, `clamp(1.5rem, 3.5vw, 1.9rem)`, 1.15): saudações da Vó — "A nossa ementa", "Os preços da Vó", a despedida depois da lista. Máximo um por ecrã.
- **Headline** (Montserrat 700, `clamp(1.75rem, 4vw, 2.5rem)`, caps, 0.05em): título de secção ("Menu", "Editar Menu").
- **Headline-sm** (Montserrat 600, 1.125rem, caps): títulos de grupo/categoria e de cards do admin.
- **Price** (Montserrat 700, 1.25rem, `tnum`): o valor em Kz — sempre no fim da linha, à direita, com pontos de milhar.
- **Body** (Montserrat 400, 0.875rem, 1.6): texto corrente.
- **Body-sm** (Montserrat 400, 0.75rem): notas, metadados, chaves técnicas, crédito.
- **Label** (Montserrat 700, 0.6875rem, caps, 0.14em): botões, abas, navegação, eyebrow.
- **Label-sm** (Montserrat 700, 0.625rem, caps, 0.12em): pílulas de contagem, badges, micro-rótulos.

### Named Rules
**The Price Gold Rule.** Todo o preço usa `price` + `tnum` + cor `gold`, alinhado à direita, com `whitespace-nowrap`. Esgotado → `line-through` + cor esmaecida, nunca outra cor.

**The Script Scarcity Rule.** A Playfair só fala uma vez; mais de uma saudação da Vó por página é excesso.

## Layout

Espaçamento em escala Tailwind (4/8/12/16/20/24/32 assumes 1rem = 16px). Largura de página `max-w-page` = 80rem (landing) e `max-w-4xl` (admin); conteúdo de leitura estreito em `max-w-3xl`.

- **Header fixo** (h-16 móvel, h-20 desktop) em `surface/85` + `backdrop-blur-md`, borda inferior `outline-variant/40`.
- **Barra de abas sticky** sob o header (`top-16/20`), `-mx-4/-mx-8` para tocar as margens, scroll-x sem barra (`no-scrollbar`).
- **Hero**: altura natural com `pt-16/md:pt-20` (altura do header), conteúdo centrado em `max-w-3xl`, imagem em `<picture>` com `hero-900` móvel e `hero-1600` desktop, véu `from-black/80 via-black/40 to-surface`.
- **Rodapé**: `bg-surface-low`, colunas em 3 cols (`sm:grid-cols-3`) para Endereço/Horário/Contacto, centrado no conteúdo.
- **Lista de pratos**: uma coluna, `divide-y divide-outline-variant/15`, linha de item com nome à esquerda → líder pontilhado (`border-b border-dotted`) → preço dourado à direita; nota em linha própria por baixo; separador por categoria com `h-px flex-1` + pílula de contagem.
- Densidade baixa no público; no admin densidade média (row `p-3.5`, search, toggles).

## Elevation & Depth

**Plano com brilho quente.** O sistema é flat por defeito; a profundidade é contida e com tom dourado, nunca cinza. As sombras existentes usam `rgba(143,114,34,…)` (ouro percorrido) em vez de preto puro.

### Shadow Vocabulary
- **soft** (`0 1px 2px rgba(17,17,17,0.03)`): elevação mínima, quase invisível.
- **card** (`0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(143,114,34,0.07)`): cartas em repouso.
- **card-hover** (`0 2px 4px rgba(17,17,17,0.05), 0 18px 40px rgba(143,114,34,0.14)`): cartas com intenção.
- **float** (`0 8px 24px rgba(143,114,34,0.14)`): botões primários.
- **float-strong** (`0 12px 32px rgba(143,114,34,0.24)`): toasts e elementos elevados pontuais.

### Named Rules
**The Flat-by-Default Rule.** Superfícies estão planas em repouso; a sombra aparece como resposta (cartas, toasts, foco de CTA) — nunca em toda a página.

## Shapes

Idioma de forma em **oposição deliberada**: o que é acção é **reto**; o que é recipiente é **afável**.

- **Botões e chips**: `rounded-none` (0) — cantos vivos, confiança de carta impressa.
- **Inputs, cartas, grupos de abas do admin**: `rounded-xl` (0.625rem) — suave mas contido.
- **Badges, pílulas de contagem e toggles**: `rounded-full` — pontuais, para estados.
- **Foco visível**: `outline: 2px solid gold-600; offset 2px` (`:focus-visible`), plus inputs com `focus:border-gold-600` + `ring-2 ring-gold-600/30`.
- Ícones SVG lineares inline (1em, `fill=currentColor`), família material simples de traço cheio.

### Named Rules
**The Recto Rule.** Nada de `rounded-full/lg/xl` em botões e chips — o recto faz a carta parecer impressa. Inputs mantêm o `rounded-xl`.

## Components

### Buttons
- **Shape:** rectangulares (0), caps `label`, espaçamento largo.
- **Primary:** fundo `gold`, texto `gold-on`, padding `20px 24px`; shadow `float`; hover → `gold-container`/`gold-on-container`; active `scale-[0.98]` (toque físico).
- **Outline (landing):** em forma de chip/button igualmente recto, `border-2 gold-500/70` transparente, hover acende `gold-500/10` + borda plena.
- **Ghost (admin):** borda `outline-variant/50`, hover `border-gold-500`/text `primary`.

### Chips e navegação do menu
- **Menu nível menu (landing):** dois chips — "Refeições" e "Bebidas" — com `aria-pressed`; o activo usa `chip-active`.
- **Idle:** fundo `surface-lowest`, texto `on-surface-variant`, borda `outline/40`; hover `border-gold-500/60`.
- **Active:** fundo `gold-100`, texto `primary` (contraste AA na light: `primary`/`gold-100` = 5.4:1), borda `gold-500/60`, caps `label`.
- Scroll horizontal sem barra; `aria-selected` reflecte ordem activa; navegação por setas (roving `tabindex`) e `aria-controls` → painel da lista.

### Cards / Containers
- **Corner Style:** `rounded-xl` (0.625rem).
- **Background:** `surface-lowest`.
- **Shadow Strategy:** `card` em repouso (ver Elevation).
- **Border:** bordas internas `outline-variant/40`, `divide-y` entre linhas.
- **Internal Padding:** `p-5` (header/painel ordem), rows do admin `p-3.5`.

### Inputs / Fields
- **Style:** `surface-lowest` sobre `outline-variant/50`, `rounded-xl`, padding `12px 16px` (ou `py-2.5 px-4` para search), texto `body`/`body-md`.
- **Focus:** `border-gold-600` + `ring-2 ring-gold-600/30`, `outline-none`.
- **Erro/estados:** validados no JS (ex. preço) com toast contextual; nunca perde o valor digitado.

### Navigation
- Header fixo translúcido (`surface/85`, blur), logo à esquerda (`logo-sdv`, `h-9`→`h-11`), única âncora "Menu" em `label` caps; à direita grupo idioma PT/EN (tipo segmented), toggle tema (ícone lua/sol), CTA "Ligar" (desktop) e botão hambúrguer móvel que abre painel drop-down com as mesmas acções.

### Toggle (admin)
- 44×24, `rounded-full`; track `surface-highest` → `primary` quando checkado; botão circular branco desliza 20px com `shadow`; escondido ao screen-reader via `peer sr-only` (label visual próprio).

### Signature Component: Linha de Carta (Menu Item)
O prato é a assinatura do sistema: numa única linha (desktop e mobile), **nome** à esquerda (semi-negrito), **líder pontilhado** flexível (`border-b border-dotted`), **preço dourado** à direita em `price`/`tnum`. Notas em linha própria abaixo; esgotado = `line-through`, opacidade 70% e badge pill "Esgotado" (`error-container`/`on-error-container`). Sem cartão fechado, sem imagens — leitura pura de menu.

## Do's and Don'ts

### Do:
- **Do** usar tokens sempre (`primary`, `gold-600`, `surface-lowest`…); nunca hex/rgb literais.
- **Do** manter botões/chips rectos (`rounded-none`); inputs e cartas `rounded-xl`; pills só para badges/toggles.
- **Do** colocar o preço à direita com `price` + `tnum` + `whitespace-nowrap` + `gold` — sempre.
- **Do** usar o líder pontilhado (`border-b border-dotted`) para fechar nome→preço na carta.
- **Do** reflectir o tema via inversão de tokens (gold dark = claro, superfícies dark = quase-preto quente).
- **Do** preservar estados: hover/focus/active nos botões, `aria-selected` nas abas, esgotado com riscado+badge.
- **Do** gravar a escolha de tema em `sdv-theme` e deixar a janela horária (17:30–05:00) como default.
- **Do** adicionar `nome_en`/`nota_en` a cada item novo (i18n dos dois dicts).

### Don't:
- **Don't** usar `ink`/tokens invertíveis no véu da hero — só `from-black/80 via-black/40 to-surface` (o `ink` fica branco no dark e apagava o texto). 
- **Don't** voltar a colocar texto junto do logótipo nem usar `logo-sm.png`; o SVG `logo-sdv` já traz o nome, e no dark é 100% branco.
- **Don't** usar o path antigo `escrita-voinha-e-talheres` no wordmark; o hero usa `texto-sitio-da` + `texto-voinha`, sempre brancos com `logo-sdv-hero`.
- **Don't** envolver a lista pública de pratos em cartões fechados — carta aberta com `divide-y`.
- **Don't** usar verde para sucesso; o admin usa `ink-toast`/`on-toast` para sucesso, `honey` para avisos, `error-surface` para erros.
- **Don't** usar Playfair fora do registo de saudação da Vó; estrutura é sempre Montserrat caps.