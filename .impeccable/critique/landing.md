# Design Critique — Landing `index.html` (run 1)

**Date:** 2026-09-21T17-17-31Z
**Method: dual-agent (A: `ses_f3b0d9020ffeQ7SHX5Uo1ddsZp` · B: `ses_f3b0d6871ffeM9TsnUkzaqL5Yo`)**
**Score:** 28/36 — Good

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Re-render sem cue quando os preços cloud chegam (main.js:157-175) |
| 2 | Match System / Real World | 4 | Kz com pontos, PT-first, vocabulário natural — excelente |
| 3 | User Control and Freedom | 3 | Nav móvel sem Escape/backdrop close; tab force-scrolla |
| 4 | Consistency and Standards | 3 | Tablist sem padrão WAI-ARIA (setas/roving/panel) |
| 5 | Error Prevention | 3 | Sem hora de atualização dos preços — velho vs. vivo indistinguível |
| 6 | Recognition Rather Than Recall | 3 | 30 tabs sem hint de scroll nem visited-state |
| 7 | Flexibility and Efficiency | 2 | Sem search; o ícone search existe e nunca é usado (icons.js:10) |
| 8 | Aesthetic and Minimalist Design | 4 | Densidade baixa, dourado seletivo, carta aberta — genuinamente ótimo |
| 9 | Error Recovery | 3 | Esgotado limpo; fallback offline sólido, mas silencioso a dobrar |
| 10 | Help and Documentation | n/a | Menu QR com tel/WhatsApp acessíveis; docs seriam ruído |
| **Total** | | **28/36** | **Good (77%)** |

## Design Specificity Verdict

**Coerente no sistema, sub-carregado no conteúdo.** A metáfora "carta clássica impressa numa esplanada costeira" atravessa todas as decisões: superfícies areia/creme, dourado-só-onde-vale, rectos de menu impresso, líder pontilhado que reproduz o papel onde está o QR (main.js:118), e o nome "Avó" embutido na base de dados. Não é uma colagem genérica.

O senão: a especificidade vive nos **tokens e nos nomes**, não na **experiência**. O playground não aparece no corpo da página; a voz da Vó está quase muda (uma linha em itálico, index.html:139); o pico visual é a fotografia do dono, não o trabalho do sistema.

## Overall Impression

Entrada fortíssima, meio funcional, fim frio. A hero com o wordmark branco sobre a foto real é um convite genuíno; a lista em carta é imediatamente legível ao sol. Mas a página acaba no colo do admin — "Área reservada" + crédito DOCFLEX — e o menu inteiro pendura em 30 abas sem mapa, sem search.

## Priority Issues

- **[P0] Parede de 30 abas sem mapa** — flatCategories (store.js:67-73) funde os dois menus; fronteira Refeições→Bebidas invisível; 22/30 abas são bebidas. Fix: disclosure em 2 estágios ou mini-divisores caps. → distill
- **[P1] Teto de descoberta** — tira sem edge-fade/visited-state; ícone search morto (icons.js:10). Fix: hint de scroll + tabs visitadas + "Encontrar prato". → layout
- **[P1] Página acaba no colo do admin** — rodapé fecha com lock + crédito (index.html:180-191); zero menção playground. Fix: linha Playfair da Vó, micro-copy admin, playground no bloco horário. → polish
- **[P1] Tabs fora do padrão ARIA** — sem setas/roving/aria-controls/tabpanel; sem aria-live (main.js:127); aria-labels PT no EN. Fix: WAI-ARIA tabs + aria-live + data-i18n-aria + focus/Escape. → harden
- **[P2] Render em 2 fases muda o menu sem aviso** (main.js:172-174). Fix: "a atualizar…" diáfano + preservar scroll/aba + carimbo de sync. → optimize
- **[P2, detector] Contraste light** — .chip-active 3.83:1 (style.css:145, main.js:131) e text-outline 4.26:1 (index.html:169,181,182). Dark OK. → audit

## Persona Red Flags

- **Casey** — Ligar escondido no mobile (index.html:73), WhatsApp só no rodapé (174); "Peixe/Marisco" = 6-10 swipes cegos.
- **Sam** — tablist sem panel/setas; troca nunca anunciada; EN com aria-labels PT; hero pode descer abaixo de AA; viragem dark silenciosa.
- **Riley** — preços/ordem mudam pos-render sem indicador; impossível distinguir preço vivo de snapshot.

## Minor Observations

- Ícone search definido e morto; tab force-scrolla debaixo do header fixo (sem scroll-margin no wrapper); bebidas gémeas sem legenda álcool (EN); nome longo parte a líder; eyebrow colide com wordmark; "Kz" hardcoded (main.js:119); imgs sem width/height → CLS.

## Run Notes

- Detector degradado a regex (parser modules não resolvidos) → subcontagem; contraste computado manualmente.
- Browser overlay indisponível no harness → sinal de fallback reportado.
- Decisão do dono (2026-09-21): **distil-first** — resolver P0 + ambos os rumos no polish único; padding de contrastes/harden ao rés do escaparate.