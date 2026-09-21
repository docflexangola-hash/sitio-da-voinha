import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase/config.js';

const PHONE = '+244925963030';
const SESSION_KEY = 'sdv-session';
const REFRESH_LEAD = 60;

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function authHeaders(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function anonHeaders() {
  return authHeaders(SUPABASE_ANON_KEY);
}

// Leitura pública dos overrides (RLS permite SELECT a anon)
export async function fetchOverrides() {
  if (!isConfigured()) return { ok: false, error: 'not-configured', data: [] };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/precos?select=chave,preco,disponivel`,
      { headers: anonHeaders() }
    );
    if (!res.ok) {
      let body = '';
      try { body = ((await res.json()) || {}).message || ''; } catch { /* ignore */ }
      return { ok: false, error: `http-${res.status} ${body}`.trim(), data: [] };
    }
    const rows = await res.json();
    return {
      ok: true,
      data: rows.map((r) => ({
        chave: r.chave,
        preco: r.preco,
        disponivel: r.disponivel !== false && r.disponivel !== null,
      })),
    };
  } catch (err) {
    return { ok: false, error: String(err), data: [] };
  }
}

// Leitura pública da ordem global das seções (RLS permite SELECT a anon)
export async function fetchOrdem() {
  if (!isConfigured()) return { ok: false, error: 'not-configured', data: [] };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/seccoes?select=cat_id,ordem&order=ordem`,
      { headers: anonHeaders() }
    );
    if (!res.ok) {
      let body = '';
      try { body = ((await res.json()) || {}).message || ''; } catch { /* ignore */ }
      return { ok: false, error: `http-${res.status} ${body}`.trim(), data: [] };
    }
    const rows = await res.json();
    return { ok: true, data: rows.map((r) => ({ cat_id: r.cat_id, ordem: r.ordem })) };
  } catch (err) {
    return { ok: false, error: String(err), data: [] };
  }
}

function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return s && s.access_token && s.refresh_token ? s : null;
  } catch {
    return null;
  }
}

function writeSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

async function tokenRequest(grantType, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = '';
    try {
      const j = await res.json();
      msg = j.error_description || j.msg || j.message || '';
    } catch { /* ignore */ }
    return { ok: false, error: msg || `http-${res.status}` };
  }
  const j = await res.json();
  return {
    ok: true,
    session: {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + Number(j.expires_in || 3600),
    },
  };
}

export async function authSignIn(email, password) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  const r = await tokenRequest('password', { email, password });
  if (!r.ok) return r;
  writeSession(r.session);
  return { ok: true, data: r.session };
}

export async function authSignOut() {
  const s = readSession();
  writeSession(null);
  if (s && isConfigured()) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: authHeaders(s.access_token),
        body: '{}',
      });
    } catch { /* ignore */ }
  }
  return { ok: true };
}

async function refreshSession(s) {
  const r = await tokenRequest('refresh_token', { refresh_token: s.refresh_token });
  if (r.ok) {
    writeSession(r.session);
    return r.session;
  }
  writeSession(null);
  return null;
}

export async function getSession() {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - Math.floor(Date.now() / 1000) < REFRESH_LEAD) {
    return await refreshSession(s);
  }
  return s;
}

async function writeHeaders() {
  const s = await getSession();
  return s ? authHeaders(s.access_token) : null;
}

async function rpcWrite(fn, payload, isRetry) {
  let headers = await writeHeaders();
  if (!headers) return { ok: false, error: 'not-authenticated' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (res.status === 401 && !isRetry) {
    await refreshSession(readSession());
    return rpcWrite(fn, payload, true);
  }
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    if (res.status === 404) return { ok: false, error: 'schema-ausente' };
    let msg = '';
    try { msg = (body && (body.message || body.error_description)) || `http-${res.status}`; } catch { /* ignore */ }
    return { ok: false, error: msg || `http-${res.status}` };
  }
  if (body !== true) return { ok: false, error: 'acesso-nao-admin' };
  return { ok: true, data: true };
}

// Escrita da ordem: chamada à função segura que confirma o dono no servidor
export async function saveOrdem(ordens) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  return rpcWrite('atualizar_ordem', { p_ordens: ordens }, false);
}

// Escrita: chamada à função segura que confirma o dono no servidor
export async function savePrice(chave, preco, disponivel) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  return rpcWrite('atualizar_preco', {
    p_chave: chave,
    p_preco: Number(preco),
    p_disponivel: Boolean(disponivel),
  }, false);
}

// Leitura pública da galeria do slider (RLS permite SELECT a anon)
export async function fetchGaleria() {
  if (!isConfigured()) return { ok: false, error: 'not-configured', data: [] };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/galeria?select=id,menu_id,url,alt,created_at&order=created_at`,
      { headers: anonHeaders() }
    );
    if (!res.ok) {
      let body = '';
      try { body = ((await res.json()) || {}).message || ''; } catch { /* ignore */ }
      return { ok: false, error: `http-${res.status} ${body}`.trim(), data: [] };
    }
    const rows = await res.json();
    return {
      ok: true,
      data: rows.map((r) => ({ id: r.id, menu_id: r.menu_id, url: r.url, alt: r.alt || '' })),
    };
  } catch (err) {
    return { ok: false, error: String(err), data: [] };
  }
}

// Adiciona uma foto à galeria (RPC que confirma o dono no servidor)
export async function addGaleriaItem(url, alt, menuId) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  return rpcWrite('adicionar_galeria', { p_url: url, p_alt: alt || '', p_menu: menuId }, false);
}

// Remove uma foto da galeria (RPC que confirma o dono no servidor)
export async function removeGaleriaItem(id) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  return rpcWrite('remover_galeria', { p_id: Number(id) }, false);
}

// Carrega a imagem para o imgbb via Edge Function (a chave vive no servidor)
export async function uploadImgbb(file) {
  if (!isConfigured()) return { ok: false, error: 'nao-configurado' };
  const session = await getSession();
  if (!session) return { ok: false, error: 'not-authenticated' };
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-imgbb`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: fd,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body.error || `http-${res.status}` };
    if (!body?.url) return { ok: false, error: 'imgbb-falhou' };
    return { ok: true, url: body.url, delete_url: body.delete_url || '' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Health check do backend (função ping_admin existe?)
export async function pingBackend() {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ping_admin`, {
      method: 'POST',
      headers: anonHeaders(),
      body: '{}',
    });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    return { ok: (await res.json()) === true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export const WHATSAPP_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(
  'Olá Sítio da Voinha! Quero fazer uma reserva.'
)}`;
export const TEL_URL = `tel:${PHONE}`;