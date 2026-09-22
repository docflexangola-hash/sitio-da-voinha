import './style.css';
import { initTheme, toggleTheme } from './theme.js';
import { initI18n, setLang, currentSavedLang, t } from './i18n.js';
import { icon } from './icons.js';
import { makeMenus, mergeOverrides, flatCategories, displayPrice } from './store.js';
import { fetchOverrides, fetchOrdem, fetchGaleria } from './supabase.js';

// ---------------------------------------------------------------- helpers

function fillIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.getAttribute('data-icon'));
  });
}

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// ---------------------------------------------------------------- header

function initHeader() {
  const openBtn = document.querySelector('[data-nav-open]');
  const nav = document.querySelector('[data-mobile-nav]');
  const header = document.querySelector('[data-header]');

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) =>
    btn.addEventListener('click', toggleTheme)
  );

  openBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('hidden');
    openBtn.setAttribute('aria-expanded', String(!open));
    openBtn.setAttribute('aria-label', t(open ? 'nav_close' : 'nav_open'));
  });
  nav?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.add('hidden');
      openBtn?.setAttribute('aria-expanded', 'false');
      openBtn?.setAttribute('aria-label', t('nav_open'));
    })
  );
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || nav?.classList.contains('hidden')) return;
    nav.classList.add('hidden');
    openBtn?.setAttribute('aria-expanded', 'false');
    openBtn?.setAttribute('aria-label', t('nav_open'));
    openBtn?.focus();
  });

  const onScroll = () => {
    if (window.scrollY > 8) {
      header?.classList.add('shadow-[0_1px_12px_rgba(0,0,0,0.06)]');
    } else {
      header?.classList.remove('shadow-[0_1px_12px_rgba(0,0,0,0.06)]');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------------------------------------------------------------- menu

const state = {
  menus: [],
  overrides: [],
  ordemMap: new Map(),
  categorias: [],
  menu: 'refeicoes',
  categoria: 'entradas',
  galeria: [],
  galeriaDeck: [],
  galeriaTimer: null,
  galeriaRaf: 0,
  galeriaScrollT: null,
};

const isEn = () => currentSavedLang() === 'en';
const lname = (o) => (isEn() && o.nome_en ? o.nome_en : o.nome);
const lnote = (o) => (isEn() && o.nota_en ? o.nota_en : o.nota);

const tabsEl = () => document.querySelector('[data-tabs]');
const listEl = () => document.querySelector('[data-lista]');

function activeCat() {
  return (
    state.categorias.find((c) => c.catId === state.categoria) ||
    state.categorias[0]
  );
}

function renderTabs() {
  const active = activeCat();

  document.querySelectorAll('[data-menu-btn]').forEach((btn) => {
    const on = btn.getAttribute('data-menu-btn') === state.menu;
    btn.className = `chip ${on ? 'chip-active' : 'chip-idle'}`;
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = t(btn.getAttribute('data-menu-btn') === 'refeicoes' ? 'menu_refeicoes' : 'menu_bebidas');
  });

  const visible = state.categorias.filter((c) => c.menuId === state.menu);
  tabsEl().innerHTML = visible
    .map(
      (c) => `
      <button
        type="button"
        role="tab"
        id="tab-${esc(c.catId)}"
        aria-selected="${c.catId === active.catId}"
        aria-controls="lista-categoria"
        tabindex="${c.catId === active.catId ? '0' : '-1'}"
        data-cat="${esc(c.catId)}"
        class="${c.catId === active.catId ? 'chip-active' : 'chip-idle'}"
      >${esc(lname(c))}</button>`
    )
    .join('');

  tabsEl().querySelectorAll('[data-cat]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.categoria = btn.getAttribute('data-cat');
      renderTabs();
      renderList(true);
    })
  );
}

function renderList(scrollTop = false) {
  const cat = activeCat();
  if (!cat) return;

  const itemsHtml = cat.itens
    .map((it) => {
      const off = it._disponivel === false;
      return `
      <li class="${off ? 'opacity-70' : ''}">
        <div class="flex items-end gap-3 py-3 first:pt-0 last:pb-0">
          <h3 class="min-w-0 font-sans font-semibold ${off ? 'text-on-surface-variant line-through decoration-outline/60' : 'text-on-surface'}">${esc(lname(it))}</h3>
          <span aria-hidden="true" class="mb-1 min-w-2 flex-1 border-b border-dotted ${off ? 'border-outline/40' : 'border-outline-variant/60'}"></span>
          <span class="tnum shrink-0 whitespace-nowrap font-sans text-price-display ${off ? 'text-outline line-through' : 'text-primary'}">${displayPrice(it)} Kz</span>
        </div>
        ${it.nota ? `<p class="pb-3 font-sans text-body-sm ${off ? 'text-outline line-through' : 'text-on-surface-variant'}">${esc(lnote(it))}</p>` : ''}
        ${off ? `<span class="mb-3 block w-fit rounded-full bg-error-container px-2 py-0.5 font-sans text-label-caps-sm uppercase text-on-error-container">${esc(t('badge_esgotado'))}</span>` : ''}
      </li>`;
    })
    .join('');

  listEl().innerHTML = `
    <div class="mb-2 flex items-center gap-3">
      <h3 class="font-sans text-headline-sm uppercase tracking-wide text-on-surface">${esc(lname(cat))}</h3>
      <span class="h-px flex-1 bg-outline-variant/60"></span>
      <span class="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 font-sans text-label-caps-sm uppercase text-primary">${cat.itens.length} ${esc(t('count_opcoes'))}</span>
    </div>
    <ul class="divide-y divide-outline-variant/15">
      ${itemsHtml}
    </ul>
    <p class="mt-10 border-t border-outline-variant/40 pt-6 text-center font-sans text-body-sm text-on-surface-variant">
      ${esc(t('menu_footer_note'))}
    </p>`;

  listEl().setAttribute('aria-labelledby', `tab-${cat.catId}`);
  const statusEl = document.querySelector('#lista-status');
  if (statusEl) statusEl.textContent = `${lname(cat)} — ${cat.itens.length} ${t('count_opcoes')}`;

  if (scrollTop) {
    listEl().previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderMenu() {
  renderTabs();
  renderList();
  renderGaleria();
}

// ---------------------------------------------------------------- galeria (slider)

const GALERIA_AUTO_MS = 4500;
const GALERIA_CARD_GAP = 16;

const galeriaSec = () => document.querySelector('#galeria');
const galeriaTrack = () => document.querySelector('[data-galeria-track]');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function galeriaCardHtml(f, i) {
  const alt = f.alt ? esc(f.alt) : t('a11y_galeria');
  return `
    <div class="aspect-[4/5] w-[72vw] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest shadow-card">
      <div class="relative h-full w-full">
        <img src="${esc(f.url)}" alt="${alt}" loading="lazy" decoding="async"
          class="absolute inset-0 h-full w-full object-cover" />
        ${f.alt ? `<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pt-12 pb-3"><span class="font-sans text-label-caps uppercase tracking-[0.18em] text-white">${esc(f.alt)}</span></div>` : ''}
      </div>
    </div>`;
}

function updateGaleriaDots(active) {
  const wrap = document.querySelector('[data-galeria-dots]');
  if (!wrap) return;
  const n = state.galeriaDeck.length;
  if (!n) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = Array.from(
    { length: n },
    (_, i) => `
    <button type="button" role="tab" aria-selected="${i === active}" tabindex="${i === active ? '0' : '-1'}"
      aria-label="${esc(t('a11y_galeria_dot'))} ${i + 1}" data-galeria-dot="${i}"
      class="h-1.5 rounded-none border-0 bg-none p-0 transition-all duration-300 ${i === active ? 'w-6 bg-primary' : 'w-1.5 bg-outline hover:bg-gold-500'}"></button>`
  ).join('');
}

function onGaleriaScroll() {
  if (state.galeriaRaf) return;
  state.galeriaRaf = requestAnimationFrame(() => {
    state.galeriaRaf = 0;
    const track = galeriaTrack();
    const card = track?.firstElementChild;
    if (!card) return;
    const active = Math.min(
      state.galeriaDeck.length - 1,
      Math.max(0, Math.round(track.scrollLeft / (card.offsetWidth + GALERIA_CARD_GAP)))
    );
    updateGaleriaDots(active);
  });
  if (prefersReducedMotion()) return;
  clearTimeout(state.galeriaScrollT);
  state.galeriaScrollT = setTimeout(restartGaleriaAutoplay, 2200);
}

function restartGaleriaAutoplay() {
  stopGaleriaAutoplay();
  if (prefersReducedMotion()) return;
  state.galeriaTimer = setInterval(() => nextGaleria(1), GALERIA_AUTO_MS);
}

function stopGaleriaAutoplay() {
  if (state.galeriaTimer) clearInterval(state.galeriaTimer);
  state.galeriaTimer = null;
}

function nextGaleria(dir) {
  const track = galeriaTrack();
  if (!track) return;
  const cards = [...track.children];
  if (cards.length < 2 || !cards[0].offsetWidth) return;
  const step = cards[0].offsetWidth + GALERIA_CARD_GAP;
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
  let target = track.scrollLeft + step * dir;
  if (dir > 0 && atEnd) target = 0;
  else if (dir < 0 && track.scrollLeft <= 0) target = track.scrollWidth;
  track.scrollTo({ left: target, behavior: 'smooth' });
}

function renderGaleria() {
  const sec = galeriaSec();
  if (!sec) return;
  stopGaleriaAutoplay();
  const eyebrow = document.querySelector('[data-i18n="galeria_eyebrow"]');
  if (eyebrow) eyebrow.textContent = t(state.menu === 'bebidas' ? 'galeria_eyebrow_bebidas' : 'galeria_eyebrow');
  const title = document.querySelector('[data-i18n="galeria_title"]');
  if (title) title.hidden = state.menu === 'bebidas';
  const deck = shuffle(state.galeria.filter((f) => f.menu_id === state.menu));
  state.galeriaDeck = deck;
  if (!deck.length) {
    sec.hidden = true;
    updateGaleriaDots(0);
    return;
  }
  const track = galeriaTrack();
  track.innerHTML = deck.map(galeriaCardHtml).join('');
  track.scrollLeft = 0;
  updateGaleriaDots(0);
  sec.hidden = false;
  restartGaleriaAutoplay();
}

function initGaleria() {
  const root = document.querySelector('[data-galeria]');
  if (!root) return;
  root.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-galeria-dot]');
    if (dot) {
      const track = galeriaTrack();
      const card = track?.children[Number(dot.getAttribute('data-galeria-dot'))];
      if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
      return;
    }
    if (e.target.closest('[data-galeria-prev]')) return nextGaleria(-1);
    if (e.target.closest('[data-galeria-next]')) return nextGaleria(1);
  });
  galeriaTrack()?.addEventListener('scroll', onGaleriaScroll, { passive: true });
  root.addEventListener('pointerenter', stopGaleriaAutoplay);
  root.addEventListener('pointerleave', restartGaleriaAutoplay);
  root.addEventListener('touchstart', stopGaleriaAutoplay, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopGaleriaAutoplay();
    else restartGaleriaAutoplay();
  });
}

function initMenu() {
  renderMenu();

  document.querySelectorAll('[data-menu-btn]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-menu-btn');
      if (m === state.menu) return;
      state.menu = m;
      const first = state.categorias.find((c) => c.menuId === m);
      if (first) state.categoria = first.catId;
      renderMenu();
      listEl().previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
  );

  tabsEl().addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const btns = [...tabsEl().querySelectorAll('[data-cat]')];
    const idx = btns.findIndex((b) => b.getAttribute('data-cat') === state.categoria);
    if (idx === -1) return;
    let n = idx;
    if (e.key === 'ArrowRight') n = (idx + 1) % btns.length;
    else if (e.key === 'ArrowLeft') n = (idx - 1 + btns.length) % btns.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = btns.length - 1;
    e.preventDefault();
    state.categoria = btns[n].getAttribute('data-cat');
    renderTabs();
    renderList(true);
    const active = tabsEl().querySelector(`[data-cat="${btns[n].getAttribute('data-cat')}"]`);
    active?.focus();
  });

  window.addEventListener('sdv:lang', () => renderMenu());
}

// ---------------------------------------------------------------- state data

async function loadData() {
  state.menus = makeMenus();
  const [res, ordem, gal] = await Promise.all([fetchOverrides(), fetchOrdem(), fetchGaleria()]);
  state.galeria = gal.ok ? gal.data : [];
  if (res.ok) {
    state.overrides = res.data;
    mergeOverrides(state.menus, state.overrides);
  } else {
    mergeOverrides(state.menus, []);
    if (res.error !== 'not-configured') {
      console.warn('[sdv] overrides indisponíveis:', res.error);
    }
  }
  state.ordemMap = new Map(
    (ordem.data || []).filter((r) => r && r.cat_id != null && r.ordem != null).map((r) => [r.cat_id, r.ordem])
  );
  state.categorias = flatCategories(state.menus, state.ordemMap);
  const first = state.categorias[0];
  state.menu = first ? first.menuId : 'refeicoes';
  state.categoria = first?.catId || 'entradas';
  renderMenu();
}

// ---------------------------------------------------------------- boot

function initLangButtons() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
  });
  setLang(currentSavedLang());
}

function boot() {
  fillIcons();
  initTheme();
  initLangButtons();
  initI18n();
  initHeader();
  initMenu();
  initGaleria();
  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}