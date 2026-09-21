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

  listEl().setAttribute('aria-labelledby', `tab-${active.catId}`);
  const statusEl = document.querySelector('#lista-status');
  if (statusEl) statusEl.textContent = `${lname(cat)} — ${cat.itens.length} ${t('count_opcoes')}`;

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
  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}