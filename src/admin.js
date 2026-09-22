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
  fetchGaleria,
  addGaleriaItem,
  removeGaleriaItem,
  uploadGaleria,
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
  ordemAberto: false,
  galeria: [],
  galeriaCat: 'refeicoes',
  galeriaUploading: false,
};

const dirty = new Set();

function markDirty(row) {
  dirty.add(row.getAttribute('data-chave'));
  row.classList.add('row-dirty');
  const btn = row.querySelector('[data-save]');
  if (btn) btn.title = 'Guardar alterações';
}

function confirmDiscard() {
  if (!dirty.size) return true;
  return window.confirm(
    `${dirty.size} ${dirty.size === 1 ? 'alteração ainda não guardada' : 'alterações ainda não guardadas'}. Descartar?`
  );
}

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
  const [res, ordem, gal] = await Promise.all([fetchOverrides(), fetchOrdem(), fetchGaleria()]);
  state.overrides = res.ok ? res.data : [];
  mergeOverrides(state.menus, state.overrides);
  state.galeria = gal.ok ? gal.data : [];
  state.ordemMap = new Map(
    (ordem.data || [])
      .filter((r) => r && r.cat_id != null && r.ordem != null)
      .map((r) => [r.cat_id, r.ordem])
  );
  setBackendBanner();
  dirty.clear();
  render();
  renderOrdem();
  renderGaleriaAdmin();
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
          <span class="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 font-sans text-label-caps-sm uppercase text-primary">${items.length}</span>
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
              <div class="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between" data-row data-chave="${esc(key)}" data-name="${esc(it.nome)}" data-base="${it.preco}">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-sans font-semibold text-on-surface">${esc(it.nome)}</h3>
                    ${changed ? `<span class="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 font-sans text-label-caps-sm uppercase text-primary">${icon('edit', 'text-[0.85rem]')}editado</span>` : ''}
                  </div>
                  ${it.nota ? `<p class="mt-0.5 font-sans text-body-sm text-on-surface-variant">${esc(it.nota)}</p>` : ''}
                  <p class="mt-1 font-sans text-body-sm text-outline">${esc(key)}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <div class="flex items-center gap-2">
                    <label class="relative inline-flex cursor-pointer items-center" title="${disp ? 'Disponível' : 'Esgotado'}">
                      <input type="checkbox" data-avail role="switch" aria-checked="${String(disp)}" aria-label="${disp ? 'Disponível' : 'Esgotado'}" ${disp ? 'checked' : ''} class="peer sr-only" />
                      <span class="h-6 w-11 rounded-full bg-surface-highest transition-colors peer-checked:bg-primary relative"></span>
                      <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"></span>
                    </label>
                    <span data-avail-text class="w-20 font-sans text-label-caps-sm uppercase text-on-surface-variant">${disp ? 'Disponível' : 'Esgotado'}</span>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <div class="relative">
                      <input type="text" inputmode="numeric" autocomplete="off" value="${preco}" data-preco class="tnum w-28 rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 py-2 pr-9 font-sans text-right text-price-display text-on-surface outline-none focus:border-gold-600" />
                      <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-label-caps-sm uppercase text-outline">Kz</span>
                    </div>
                    <span data-prev-help class="font-sans text-label-caps-sm text-on-surface-variant">= ${formatKz(preco)}</span>
                  </div>
                  <button type="button" data-save class="inline-flex h-10 w-10 items-center justify-center rounded-none bg-primary text-on-primary transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60" aria-label="Guardar ${esc(it.nome)}" title="Guardar">
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

function updatePrecoHelper(inp) {
  const helper = inp.closest('[data-row]')?.querySelector('[data-prev-help]');
  if (!helper) return;
  const raw = inp.value.replace(/[.\s]/g, '');
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) {
    helper.textContent = `= ${formatKz(Math.round(n))}`;
  } else {
    helper.textContent = 'Preço inválido.';
  }
}

function normalizePreco(inp) {
  const raw = String(inp.value).replace(/[.\s]/g, '');
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) inp.value = String(Math.round(n));
  updatePrecoHelper(inp);
}

function wireRows() {
  document.querySelectorAll('[data-save]').forEach((btn) =>
    btn.addEventListener('click', () => guardar(btn.closest('[data-row]')))
  );
  document.querySelectorAll('[data-preco]').forEach((inp) => {
    inp.addEventListener('input', () => {
      updatePrecoHelper(inp);
      markDirty(inp.closest('[data-row]'));
    });
    inp.addEventListener('blur', () => normalizePreco(inp));
  });
  document.querySelectorAll('[data-avail]').forEach((chk) => {
    chk.addEventListener('change', () => {
      const row = chk.closest('[data-row]');
      const off = !chk.checked;
      chk.setAttribute('aria-checked', String(!off));
      chk.setAttribute('aria-label', off ? 'Esgotado' : 'Disponível');
      const label = row.querySelector('label');
      if (label) label.title = off ? 'Esgotado' : 'Disponível';
      const txt = row.querySelector('[data-avail-text]');
      if (txt) txt.textContent = off ? 'Esgotado' : 'Disponível';
      markDirty(row);
    });
  });
}

async function guardar(row) {
  const chave = row.getAttribute('data-chave');
  const input = row.querySelector('[data-preco]');
  const raw = String(input.value).replace(/[.\s]/g, '');
  const preco = Number(raw);
  const disponivel = row.querySelector('[data-avail]').checked;
  const saveBtn = row.querySelector('[data-save]');

  if (!Number.isFinite(preco) || preco <= 0) {
    toast('Preço inválido. Usa só números (ex.: 3500 ou 3.500).', 'err');
    input.focus();
    return;
  }

  const base = Number(row.getAttribute('data-base') || 0);
  if (base > 0 && Math.abs(preco - base) / base > 0.5) {
    if (!window.confirm(`O preço muda mais de 50% face ao valor base (${formatKz(base)}). Guardar mesmo assim?`)) {
      input.focus();
      return;
    }
  }

  if (saveBtn) saveBtn.disabled = true;
  const res = await savePrice(chave, preco, disponivel);
  if (res.ok) {
    dirty.delete(chave);
    toast(disponivel ? `${row.getAttribute('data-name')} → ${formatKz(preco)}` : `${row.getAttribute('data-name')} → Esgotado`);
    await loadData();
    return;
  }
  if (saveBtn) saveBtn.disabled = false;
  toast(saveErrorMsg(res), 'err');
  if (res.error === 'not-authenticated' || res.error === 'acesso-nao-admin') await logoutToLogin();
}

function saveErrorMsg(res) {
  if (res.error === 'not-configured') return 'Supabase não configurado.';
  if (res.error === 'not-authenticated') return 'Sessão expirada — entra novamente.';
  if (res.error === 'acesso-nao-admin') return 'Conta sem permissão de administrador.';
  if (res.error === 'schema-ausente') return 'Backend em falta — corre o schema.sql no SQL Editor.';
  if (res.error === 'sem-imagem') return 'Nenhuma imagem recebida.';
  if (res.error === 'formato-invalido') return 'Formato de imagem não suportado.';
  if (res.error === 'imagem-grande') return 'Imagem acima de 32MB.';
  if (res.error === 'categoria-invalida') return 'Categoria inválida.';
  if (res.error === 'storage-falhou') return 'Não foi possível guardar a imagem no armazenamento. Tenta de novo.';
  if (res.error === 'erro-interno') return 'Erro interno do servidor.';
  if (res.error === 'timeout') return 'O carregamento demorou demasiado — tenta de novo.';
  return `Não guardou: ${res.error || 'erro desconhecido'}`;
}

function updateStatus() {
  const total = countItems(state.menus);
  const el = document.querySelector('[data-status-label]');
  if (el) el.textContent = `${total} itens · ${state.overrides.length} na cloud · ${state.galeria.length} fotos`;
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
    <details class="group rounded-xl border border-outline-variant/40 bg-surface-lowest shadow-card" ${state.ordemAberto ? 'open' : ''} data-ordem-details>
      <summary class="flex cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-5 py-4 font-sans text-headline-sm uppercase tracking-wide text-on-surface">
        <span>Ordem das Seções</span>
        ${icon('arrowDown', 'text-[1.1rem] text-on-surface-variant transition-transform group-open:rotate-180')}
      </summary>
      <div class="px-5 pb-1 pt-0.5">
        <p class="font-sans text-body-sm text-on-surface-variant">Define a ordem das categorias no menu — podes intercalar Refeições e Bebidas.</p>
      </div>
      <ol class="divide-y divide-outline-variant/15">
        ${cats
          .map(
            (c, i) => `
          <li class="flex items-center gap-3 px-5 py-2.5">
            <span class="tnum w-6 shrink-0 text-right font-sans text-label-caps-sm text-outline">${i + 1}</span>
            <span class="min-w-0 flex-1 truncate font-sans font-semibold text-on-surface">${esc(c.nome)}</span>
            <span class="hidden shrink-0 px-2 py-0.5 font-sans text-label-caps-sm uppercase sm:inline-block ${c.menuId === 'refeicoes' ? 'bg-surface-high text-on-surface-variant' : 'bg-gold-100 text-primary'}">${c.menuId === 'refeicoes' ? 'Refeições' : 'Bebidas'}</span>
            <div class="flex shrink-0 items-center gap-1">
              ${ordemArrowBtn('up', i, cats.length)}
              ${ordemArrowBtn('down', i, cats.length)}
            </div>
          </li>`
          )
          .join('')}
      </ol>
    </details>`;
  const details = el.querySelector('[data-ordem-details]');
  if (details) {
    details.addEventListener('toggle', () => {
      state.ordemAberto = details.open;
    });
  }
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

// ---------------- galeria (fotos do slider)

function galeriaCatBtn(menuId) {
  const active = state.galeriaCat === menuId;
  return `<button type="button" data-galeria-cat="${menuId}" aria-pressed="${active}"
    class="rounded-none border px-2.5 py-1 font-sans text-label-caps-sm uppercase transition-all ${
      active
        ? 'border-gold-500/70 bg-gold-500/10 text-primary'
        : 'border-outline-variant/50 text-on-surface-variant hover:border-gold-500 hover:text-primary'
    }">${menuId === 'refeicoes' ? 'Refeições' : 'Bebidas'}</button>`;
}

function galeriaCatTag(menuId) {
  return menuId === 'refeicoes' ? 'bg-surface-high text-on-surface-variant' : 'bg-gold-100 text-primary';
}

function renderGaleriaAdmin() {
  const el = $('#galeria-admin');
  el.innerHTML = `
    <section class="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest shadow-card">
      <header class="border-b border-outline-variant/40 px-5 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-sans text-headline-sm uppercase tracking-wide text-on-surface">Fotos do slider</h2>
            <p class="mt-0.5 font-sans text-body-sm text-on-surface-variant">A landing mostra estas fotos por categoria, em ordem aleatória, antes do rodapé.</p>
          </div>
          <div class="flex items-center gap-1.5">
            ${galeriaCatBtn('refeicoes')}
            ${galeriaCatBtn('bebidas')}
          </div>
        </div>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="text" data-galeria-alt placeholder="Nome do prato (opcional)"
            class="min-w-0 flex-1 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 py-2.5 font-sans text-body-md text-on-surface outline-none transition-colors focus:border-gold-600" />
          <button type="button" data-galeria-input ${state.galeriaUploading ? 'disabled' : ''}
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-none bg-primary px-4 py-2.5 font-sans text-label-caps uppercase text-on-primary transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            <span data-icon="upload" class="text-[1rem]"></span>
            ${state.galeriaUploading ? 'A carregar…' : 'Carregar foto'}
          </button>
          <input type="file" accept="image/*" data-galeria-file class="sr-only">
        </div>
      </header>
      <ul data-galeria-lista class="divide-y divide-outline-variant/15">
        ${state.galeria.length
          ? state.galeria
              .map(
                (f) => `
          <li class="flex items-center gap-3 px-5 py-2.5">
            <img src="${esc(f.url)}" alt="" class="h-12 w-12 shrink-0 rounded-none border border-outline-variant/40 object-cover" loading="lazy" />
            <span class="${f.alt ? '' : 'hidden'} min-w-0 flex-1 truncate pr-3 font-sans font-semibold text-on-surface">${esc(f.alt)}</span>
            <span class="hidden shrink-0 px-2 py-0.5 font-sans text-label-caps-sm uppercase sm:inline-block ${galeriaCatTag(f.menu_id)}">${f.menu_id === 'refeicoes' ? 'Refeições' : 'Bebidas'}</span>
            <span class="shrink-0 font-sans text-body-sm text-outline sm:hidden">${f.menu_id === 'refeicoes' ? 'Refeições' : 'Bebidas'}</span>
            <button type="button" data-galeria-del="${f.id}" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-outline-variant/50 text-on-surface transition-colors hover:border-gold-600 hover:text-primary" aria-label="Eliminar foto" title="Eliminar">${icon('close', 'text-[1rem]')}</button>
          </li>`
              )
              .join('')
          : `
          <li class="px-5 py-8 text-center font-sans text-body-sm text-on-surface-variant">Ainda não há fotos. Escolhe a categoria e carrega a primeira.</li>`}
      </ul>
    </section>`;
  fillIcons();
}

async function onGaleriaFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('Formato de imagem não suportado (usa JPG, PNG ou WebP).', 'err');
    return;
  }
  if (file.size > 32 * 1024 * 1024) {
    toast('Máximo de 32MB por foto.', 'err');
    return;
  }
  state.galeriaUploading = true;
  renderGaleriaAdmin();
  try {
    const optimized = await galeriaOptimize(file);
    const up = await uploadGaleria(optimized, state.galeriaCat);
    if (!up.ok) {
      toast(saveErrorMsg(up), 'err');
      if (up.error === 'not-authenticated' || up.error === 'acesso-nao-admin') {
        await logoutToLogin();
        return;
      }
      return;
    }
    const alt = $('#galeria-admin [data-galeria-alt]').value.trim();
    const res = await addGaleriaItem(up.url, alt, state.galeriaCat);
    if (res.ok) {
      toast('Foto adicionada ao slider');
      await loadData();
      return;
    }
    toast(saveErrorMsg(res), 'err');
    if (res.error === 'not-authenticated' || res.error === 'acesso-nao-admin') {
      await logoutToLogin();
      return;
    }
  } catch {
    toast('Não foi possível carregar a foto. Tenta de novo.', 'err');
  } finally {
    state.galeriaUploading = false;
    renderGaleriaAdmin();
  }
}

async function onGaleriaDelete(id) {
  if (!window.confirm('Eliminar esta foto do slider?')) return;
  const res = await removeGaleriaItem(id);
  if (res.ok) {
    toast('Foto eliminada');
    await loadData();
    return;
  }
  toast(saveErrorMsg(res), 'err');
  if (res.error === 'not-authenticated' || res.error === 'acesso-nao-admin') await logoutToLogin();
}

const GALERIA_MAX_EDGE = 1100;

function galeriaOptimize(file) {
  return new Promise((resolve) => {
    const type = file.type.toLowerCase();
    if (type === 'image/gif') return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    const finish = (out) => {
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => finish(file);
    img.onload = () => {
      const edge = Math.max(img.naturalWidth, img.naturalHeight);
      if (!edge || edge <= GALERIA_MAX_EDGE) return finish(file);
      const scale = GALERIA_MAX_EDGE / edge;
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      const outType =
        type === 'image/png' ? 'image/png' : type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob((blob) => finish(blob && blob.size > 0 ? blob : file), outType, 0.8);
    };
    img.src = url;
  });
}

function initGaleriaControls() {
  const wrap = $('#galeria-admin');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const del = e.target.closest('[data-galeria-del]');
    if (del) return onGaleriaDelete(del.getAttribute('data-galeria-del'));
    const chip = e.target.closest('[data-galeria-cat]');
    if (chip) {
      state.galeriaCat = chip.getAttribute('data-galeria-cat');
      renderGaleriaAdmin();
      return;
    }
    const btn = e.target.closest('[data-galeria-input]');
    if (btn) {
      const input = $('#galeria-admin [data-galeria-file]');
      if (input) input.click();
    }
  });
  wrap.addEventListener('change', (e) => {
    const input = e.target.closest('[data-galeria-file]');
    if (!input || !input.files?.length) return;
    onGaleriaFile(input.files[0]);
    input.value = '';
  });
}

// ---------------- tabs / filters

function renderTabs() {
  const tabs = document.querySelectorAll('[data-atab]');
  tabs.forEach((btn) => {
    const active = btn.getAttribute('data-atab') === state.tab;
    btn.className = `rounded-none py-2.5 font-sans text-label-caps uppercase transition-all ${
      active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
    }`;
    btn.setAttribute('aria-selected', String(active));
    btn.setAttribute('tabindex', active ? '0' : '-1');
  });
  const panel = $('#admin-lista');
  if (panel) panel.setAttribute('aria-labelledby', state.tab === 'bebidas' ? 'atab-bebidas' : 'atab-refeicoes');
}

function initControls() {
  const tablist = document.querySelector('[role="tablist"]');
  const tabs = [...(tablist?.querySelectorAll('[data-atab]') || [])];

  tabs.forEach((btn) =>
    btn.addEventListener('click', () => {
      if (!confirmDiscard()) return;
      dirty.clear();
      state.tab = btn.getAttribute('data-atab');
      state.busca = '';
      $('#admin-busca').value = '';
      $('#admin-limpar').classList.add('hidden');
      renderTabs();
      render();
    })
  );

  tablist?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const idx = tabs.findIndex((b) => b.getAttribute('data-atab') === state.tab);
    if (idx === -1) return;
    let n = idx;
    if (e.key === 'ArrowRight') n = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    e.preventDefault();
    state.tab = tabs[n].getAttribute('data-atab');
    renderTabs();
    render();
    tabs[n].focus();
  });

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

  $('#btn-refresh').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    dirty.clear();
    loadData();
  });
  $('#btn-sair').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    dirty.clear();
    logoutToLogin();
  });

  window.addEventListener('beforeunload', (e) => {
    if (!dirty.size) return;
    e.preventDefault();
    e.returnValue = '';
  });

  initGaleriaControls();
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