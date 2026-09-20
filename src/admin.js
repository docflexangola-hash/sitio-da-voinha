import './style.css';
import { initTheme } from './theme.js';
import { icon } from './icons.js';
import {
  makeMenus,
  mergeOverrides,
  itemKey,
  formatKz,
  countItems,
  flatCategories,
} from './store.js';
import {
  fetchOverrides,
  fetchOrdem,
  savePrice,
  saveOrdem,
  authSignIn,
  authSignOut,
  getSession,
  isConfigured,
} from './supabase.js';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

let state = {
  menus: [],
  overrides: [],
  ordemMap: new Map(),
  tab: 'refeicoes',
  busca: '',
};

const $ = (sel) => document.querySelector(sel);
const toastEl = () => $('#toast');

function fillIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.getAttribute('data-icon'));
  });
}

function toast(msg, kind = 'ok') {
  const el = toastEl();
  const colors =
    kind === 'err'
      ? 'bg-error-container text-on-error-container'
      : kind === 'warn'
        ? 'bg-secondary-container text-on-secondary-container'
        : 'bg-ink text-inverse-on-surface';
  el.innerHTML = `
    <div class="flex items-center gap-2.5 rounded-full px-5 py-3 font-sans text-body-md shadow-float-strong ${colors}" role="status">
      ${icon(kind === 'err' ? 'close' : 'check', 'text-[1.1rem]')}
      <span>${esc(msg)}</span>
    </div>`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.innerHTML = ''), 3200);
}

// ---------------- backend status / banners

function setBackendBanner() {
  const el = $('#banner-backend');
  if (isConfigured()) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="flex items-start gap-3 rounded-xl border border-outline-variant/50 bg-surface-lowest p-4">
      ${icon('cloud_off', 'mt-0.5 shrink-0 text-[1.3rem] text-outline')}
      <div>
        <p class="font-sans text-headline-sm uppercase text-on-surface">Supabase não configurado</p>
        <p class="mt-1 font-sans text-body-sm text-on-surface-variant">Preencha <code class="rounded bg-surface-high px-1 py-0.5">supabase/config.js</code> com a URL e a anon key.</p>
      </div>
    </div>`;
}

// ---------------- login

async function handleSubmitLogin(e) {
  e.preventDefault();
  const email = $('#campo-email').value.trim();
  const password = $('#campo-password').value;
  if (!email || !password) return;

  const res = await authSignIn(email, password);
  if (!res.ok) {
    toast(res.error === 'not-configured' ? 'Supabase não configurado.' : 'Email ou password incorretos.', 'err');
    return;
  }

  await enterAdmin();
  toast('Sessão iniciada');
}

async function enterAdmin() {
  $('#tela-login').classList.add('hidden');
  $('#tela-admin').classList.remove('hidden');
  await loadData();
}

async function logoutToLogin() {
  await authSignOut();
  state.overrides = [];
  $('#tela-admin').classList.add('hidden');
  $('#tela-login').classList.remove('hidden');
  $('#campo-email').value = '';
  $('#campo-password').value = '';
}

// ---------------- data + list

async function loadData() {
  state.menus = makeMenus();
  const [res, ordem] = await Promise.all([fetchOverrides(), fetchOrdem()]);
  state.overrides = res.ok ? res.data : [];
  mergeOverrides(state.menus, state.overrides);
  state.ordemMap = new Map(
    (ordem.data || [])
      .filter((r) => r && r.cat_id != null && r.ordem != null)
      .map((r) => [r.cat_id, r.ordem])
  );
  setBackendBanner();
  render();
  renderOrdem();
  updateStatus();
}

function currentMenu() {
  return state.menus.find((m) => m.id === state.tab) || state.menus[0];
}

function activeOverrides() {
  const map = new Map();
  state.overrides.forEach((o) => map.set(o.chave, o));
  return map;
}

function render() {
  const menu = currentMenu();
  const term = state.busca.trim().toLowerCase();
  const overrides = activeOverrides();
  let html = '';

  menu.categorias.forEach((cat) => {
    const items = cat.itens.filter((it) => {
      if (!term) return true;
      return `${it.nome} ${it.nota || ''}`.toLowerCase().includes(term);
    });
    if (!items.length) return;
    html += `
      <section class="mt-8 first:mt-0">
        <div class="mb-2 flex items-center gap-3">
          <h2 class="font-sans text-headline-sm uppercase tracking-wide text-on-surface">${esc(cat.nome)}</h2>
          <span class="h-px flex-1 bg-outline-variant/60"></span>
          <span class="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 font-sans text-label-caps-sm uppercase text-gold-600">${items.length}</span>
        </div>
        <div class="card divide-y divide-outline-variant/40 overflow-hidden">
          ${items
            .map((it) => {
              const key = itemKey(menu.id, cat.id, it.nome);
              const ov = overrides.get(key);
              const preco = ov ? ov.preco : it.preco;
              const disp = ov ? ov.disponivel : true;
              const changed = ov ? true : false;
              return `
              <div class="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between" data-row data-chave="${esc(key)}" data-name="${esc(it.nome)}">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-sans font-semibold text-on-surface">${esc(it.nome)}</h3>
                    ${changed ? `<span class="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 font-sans text-label-caps-sm uppercase text-gold-600">${icon('edit', 'text-[0.85rem]')}editado</span>` : ''}
                  </div>
                  ${it.nota ? `<p class="mt-0.5 font-sans text-body-sm text-on-surface-variant">${esc(it.nota)}</p>` : ''}
                  <p class="mt-1 font-sans text-body-sm text-outline">${esc(key)}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <label class="relative inline-flex cursor-pointer items-center" title="Disponível">
                    <input type="checkbox" data-avail ${disp ? 'checked' : ''} class="peer sr-only" />
                    <span class="h-6 w-11 rounded-full bg-surface-highest transition-colors peer-checked:bg-primary relative"></span>
                    <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"></span>
                  </label>
                  <div class="relative">
                    <input type="number" min="0" step="100" value="${preco}" data-preco class="tnum w-28 rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 py-2 pr-10 font-sans text-price-display text-on-surface outline-none focus:border-gold-600" />
                    <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-label-caps-sm uppercase text-outline">Kz</span>
                  </div>
                  <button type="button" data-save class="inline-flex h-10 w-10 items-center justify-center rounded-none bg-primary text-on-primary transition-transform active:scale-95" aria-label="Guardar ${esc(it.nome)}" title="Guardar">
                    ${icon('check', 'text-[1.2rem]')}
                  </button>
                </div>
              </div>`;
            })
            .join('')}
        </div>
      </section>`;
  });

  if (!html) {
    html = `<div class="mt-16 text-center">
      <p class="font-sans text-body-lg text-on-surface-variant">Sem resultados.</p>
    </div>`;
  }

  $('#admin-lista').innerHTML = html;
  wireRows();
}

function wireRows() {
  document.querySelectorAll('[data-save]').forEach((btn) =>
    btn.addEventListener('click', () => guardar($(btn.closest('[data-row]'))))
  );
}

async function guardar(row) {
  const chave = row.getAttribute('data-chave');
  const input = row.querySelector('[data-preco]');
  const preco = Number(input.value);
  const disponivel = row.querySelector('[data-avail]').checked;

  if (!preco || preco < 0 || !Number.isFinite(preco)) {
    toast('Preço inválido.', 'err');
    input.focus();
    return;
  }

  const res = await savePrice(chave, preco, disponivel);
  if (res.ok) {
    toast(`${row.getAttribute('data-name')} → ${formatKz(preco)} guardado`);
    await loadData();
    return;
  }
  toast(saveErrorMsg(res), 'err');
  if (res.error === 'not-authenticated' || res.error === 'acesso-nao-admin') await logoutToLogin();
}

function saveErrorMsg(res) {
  if (res.error === 'not-configured') return 'Supabase não configurado.';
  if (res.error === 'not-authenticated') return 'Sessão expirada — entra novamente.';
  if (res.error === 'acesso-nao-admin') return 'Conta sem permissão de administrador.';
  if (res.error === 'schema-ausente') return 'Backend em falta — corre o schema.sql no SQL Editor.';
  return `Não guardou: ${res.error || 'erro desconhecido'}`;
}

function updateStatus() {
  const total = countItems(state.menus);
  const el = document.querySelector('[data-status-label]');
  if (el) el.textContent = `${total} itens · ${state.overrides.length} na cloud`;
}

// ---------------- ordem das seções

function orderList() {
  return flatCategories(state.menus, state.ordemMap).map((c) => c.catId);
}

function ordemArrowBtn(dir, i, n) {
  const up = dir === 'up';
  const disabled = up ? i === 0 : i === n - 1;
  return `<button type="button" data-order-move data-idx="${i}" data-dir="${dir}" ${disabled ? 'disabled' : ''}
    aria-label="${up ? 'Mover para cima' : 'Mover para baixo'}"
    class="flex h-8 w-8 items-center justify-center rounded-none border border-outline-variant/50 text-on-surface transition-colors hover:border-gold-500 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
    ${icon(up ? 'arrowUp' : 'arrowDown', 'text-[1rem]')}
  </button>`;
}

function renderOrdem() {
  const el = $('#ordem-seccoes');
  const cats = flatCategories(state.menus, state.ordemMap);
  if (!cats.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="card overflow-hidden">
      <div class="border-b border-outline-variant/40 px-5 py-4">
        <h2 class="font-sans text-headline-sm uppercase tracking-wide text-on-surface">Ordem das Seções</h2>
        <p class="mt-0.5 font-sans text-body-sm text-on-surface-variant">Define a ordem das abas no menu — podes intercalar Refeições e Bebidas.</p>
      </div>
      <ol class="divide-y divide-outline-variant/15">
        ${cats
          .map(
            (c, i) => `
          <li class="flex items-center gap-3 px-5 py-2.5">
            <span class="tnum w-6 shrink-0 text-right font-sans text-label-caps-sm text-outline">${i + 1}</span>
            <span class="min-w-0 flex-1 truncate font-sans font-semibold text-on-surface">${esc(c.nome)}</span>
            <span class="hidden shrink-0 px-2 py-0.5 font-sans text-label-caps-sm uppercase sm:inline-block ${c.menuId === 'refeicoes' ? 'bg-surface-high text-on-surface-variant' : 'bg-gold-100 text-gold-600'}">${c.menuId === 'refeicoes' ? 'Refeições' : 'Bebidas'}</span>
            <div class="flex shrink-0 items-center gap-1">
              ${ordemArrowBtn('up', i, cats.length)}
              ${ordemArrowBtn('down', i, cats.length)}
            </div>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
  document.querySelectorAll('[data-order-move]').forEach((btn) =>
    btn.addEventListener('click', () =>
      moverSecao(Number(btn.getAttribute('data-idx')), btn.getAttribute('data-dir'))
    )
  );
}

async function moverSecao(idx, dir) {
  const list = orderList();
  const j = idx + (dir === 'up' ? -1 : 1);
  if (j < 0 || j >= list.length) return;
  [list[idx], list[j]] = [list[j], list[idx]];
  state.ordemMap = new Map(list.map((catId, i) => [catId, i]));
  renderOrdem();
  const res = await saveOrdem(list);
  if (res.ok) {
    toast('Ordem das seções guardada');
  } else {
    toast(saveErrorMsg(res), 'err');
    if (res.error === 'not-authenticated' || res.error === 'acesso-nao-admin') await logoutToLogin();
    else await loadData();
  }
}

// ---------------- tabs / filters

function renderTabs() {
  const tabs = document.querySelectorAll('[data-atab]');
  tabs.forEach((btn) => {
    const active = btn.getAttribute('data-atab') === state.tab;
    btn.className = `rounded-none py-2.5 font-sans text-label-caps uppercase transition-all ${
      active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
    }`;
  });
}

function initControls() {
  document.querySelectorAll('[data-atab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.tab = btn.getAttribute('data-atab');
      state.busca = '';
      $('#admin-busca').value = '';
      $('#admin-limpar').classList.add('hidden');
      renderTabs();
      render();
    })
  );

  $('#admin-busca').addEventListener('input', (e) => {
    state.busca = e.target.value;
    $('#admin-limpar').classList.toggle('hidden', !e.target.value);
    render();
  });
  $('#admin-limpar').addEventListener('click', () => {
    state.busca = '';
    $('#admin-busca').value = '';
    $('#admin-limpar').classList.add('hidden');
    $('#admin-busca').focus();
    render();
  });

  $('#btn-refresh').addEventListener('click', loadData);
  $('#btn-sair').addEventListener('click', logoutToLogin);
}

// ---------------- boot

async function boot() {
  fillIcons();
  initTheme();
  $('#form-login').addEventListener('submit', handleSubmitLogin);
  initControls();
  setBackendBanner();
  renderTabs();
  if (await getSession()) await enterAdmin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}