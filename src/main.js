import './style.css';
import { initTheme, toggleTheme } from './theme.js';
import { initI18n, setLang, currentSavedLang, t } from './i18n.js';
import { icon } from './icons.js';
import { makeMenus, mergeOverrides, flatCategories, displayPrice } from './store.js';
import { fetchOverrides, fetchOrdem } from './supabase.js';

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
  });
  nav?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.add('hidden');
      openBtn?.setAttribute('aria-expanded', 'false');
    })
  );

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
  categoria: 'entradas',
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

function renderTabs(focusActive = false) {
  const active = activeCat();
  tabsEl().innerHTML = state.categorias
    .map(
      (c) => `
      <button
        type="button"
        role="tab"
        aria-selected="${c.catId === active.catId}"
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

  if (focusActive) {
    const btn = tabsEl().querySelector('[data-cat="' + esc(active.catId) + '"]');
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
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
      <span class="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 font-sans text-label-caps-sm uppercase text-gold-600">${cat.itens.length} ${esc(t('count_opcoes'))}</span>
    </div>
    <ul class="divide-y divide-outline-variant/15">
      ${itemsHtml}
    </ul>
    <p class="mt-10 border-t border-outline-variant/40 pt-6 text-center font-sans text-body-sm text-on-surface-variant">
      ${esc(t('menu_footer_note'))}
    </p>`;

  if (scrollTop) {
    listEl().previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderMenu() {
  renderTabs();
  renderList();
}

function initMenu() {
  renderMenu();
  window.addEventListener('sdv:lang', () => renderMenu());
}

// ---------------------------------------------------------------- state data

async function loadData() {
  state.menus = makeMenus();
  const [res, ordem] = await Promise.all([fetchOverrides(), fetchOrdem()]);
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
  state.categoria = state.categorias[0]?.catId || 'entradas';
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
  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}