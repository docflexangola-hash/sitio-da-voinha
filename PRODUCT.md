# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cliente do restaurante** (primário): está no local ou chegou pelo QR code do menu físico / mensagem WhatsApp. Usa o telemóvel, em contexto de praia à beira-mar, e quer consultar o menu e os preços em Kz antes de pedir ou decidir. Mobile-first.
- **Visitante que fala inglês**: turista em Benguela; o conteúdo EN é um extra mínimo (apenas nomes/notas traduzidos quando existem), não uma versão completa.
- **Dono e staff autorizado** (admin): usam o painel `admin.html` para editar preços, disponibilidade e a ordem das secções. Login com conta individual no Supabase Auth; o servidor decide quem pode escrever (`eh_admin`, por email verificado).

## Product Purpose

Site do **Sítio da Voinha — Restaurante & Playground** (Praia Morena, Benguela) que mostra o menu da casa e os preços no site. O objetivo central é **nunca precisar de redeploy para mudar um preço**: o dono edita preços/disponibilidade/ordem na cloud e a landing reflete na hora. Ao "funcionar", acontecem as duas coisas: o cliente vê os preços e decide ir ou ligar; e o dono atualiza o menu sozinho, sem depender de developers.

## Positioning

Esplanada costeira casual com **playground**, à beira-mar na Praia Morena — vale pelo cenário à beira-mar e por ser um sítio para famílias (incluindo crianças). O mecanismo diferenciador do produto digital: a carta é uma **fonte viva** — base estática em JSON + overrides guardados no Supabase, escritos pelo próprio dono através do painel, sem deploy.

## Operating Context

- O cliente chega normalmente pelo QR do menu físico ou do telemóvel; espera-se conectividade móvel variável (praia) — por isso a landing mostra sempre os preços mesmo sem rede (fallback para o JSON base, sem prémio de erro).
- Contactos reais de negócio: telefone `+244925963030` e WhatsApp `https://wa.me/244925963030`.
- Horário de funcionamento: Terça a Domingo, 10h00–22h00; Segunda-feira encerrado.
- O admin corre em conta separada (`admin.html`), apenas em PT, com sessão JWT em localStorage e refresh automático.
- Tema claro/escuro com modo automático por janela horária (17:30–05:00), com escolha manual persistida.

## Capabilities and Constraints

- Cardápio base em `src/data/menu.json` (preços em Kz, inteiros), com `nome_en`/`nota_en` para a tradução EN. Chave de item = `menuId/catId/slug(nome)` — **nunca mudar um `nome` existente** (invalida overrides guardados na cloud).
- Cloud (Supabase): tabelas `precos` (overrides), `seccoes` (ordem) e `config`; RPCs `atualizar_preco`, `atualizar_ordem`, `ping_admin`, `eh_admin`. Zero linhas em `precos` = menu 100% do JSON.
- Escritas só via RPC com `Authorization: Bearer <access_token>` da sessão; o servidor valida `auth.email = config.admin_email`. Nada de `DELETE` sem `WHERE` nas RPCs.
- Segurança: anon key pública por design; `service_role`/`sb_secret` nunca no frontend; o email do dono nunca aparece no frontend.
- Sem comentários no código; todas as strings visíveis passam pelos dicts `i18n.js` (pt/en); admin é PT-only.
- Sem norma formal de acessibilidade (boas práticas apenas).

## Brand Commitments

- Nome oficial: **Sítio da Voinha — Restaurante & Playground**; abreviatura "Sítio da Voinha".
- Logótipo oficial: `public/images/logotipo_sitio_da_voinha.svg` (classe `logo-sdv`); no modo escuro é renderizado a branco. O lettering do hero vem de `public/images/wordmark_sitio_da_voinha.svg` (extraído do ficheiro do dono; sempre branco sobre a foto).
- Crédito "Desenvolvido por DOCFLEX ANGOLA" → `https://docflex-site.vercel.app/` no rodapé da landing.
- Voz: familiar e caseiro, centrado na "Voinha" (avó); língua primária PT, EN extra mínimo.
- Nom e marcas próprias (cervejas, vinhos, cocktails) mantêm-se em PT/EN.

## Evidence on Hand

- **Foto real da hero**: `public/images/hero-1600.jpg` / `hero-900.jpg` (derivados do PNG cinematográfico fornecido pelo dono) — é a única fotografia real do espaço; o resto dos assets são de marca.
- **Assets de marca**: logotipo SVG (+ versões PNG/ICO para favicons), wordmark SVG, OG image 1200×630.
- **Ausência a não fabricar**: não existem ainda testemunhos de clientes, avaliações, case studies nem preços/licenças externos.

## Product Principles

1. **A carta é viva.** Preços, disponibilidade e ordem vivem na cloud e mudam sem deploy; o admin existe para o dono não depender de developers.
2. **Mobile e QR primeiro.** O cliente decide no telemóvel, na praia; o site é construído mobile-first e é chegado pelo QR físico.
3. **PT é a verdade; EN é cortesia.** O conteúdo primário é em português; o inglês aparece só onde é útil e existe.
4. **Nunca falhar por falta de rede.** Sem Supabase, a landing mostra o menu base sem prémio de erro; sem sessão, ninguém escreve.
5. **Só quem é dono escreve.** Autorização por email verificado no servidor; nada de segredos no bundle nem do email do dono no frontend.

## Accessibility & Inclusion

Sem requisito formal (boas práticas): contraste AA por defeito, foco visível, `prefers-reduced-motion`, `sr-only` para atalhos e `alt` significativos nos assets.