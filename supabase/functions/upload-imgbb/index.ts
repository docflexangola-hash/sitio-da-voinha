import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IMGBB_KEY = Deno.env.get('IMGBB_KEY') ?? '';
const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const MAX_BYTES = 32 * 1024 * 1024;
const IMGBB_TIMEOUT_MS = 20_000;

const json = (status, body) => {
  const headers = { 'Content-Type': 'application/json' };
  if (status !== 204) {
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'authorization, x-client-info, apikey, content-type';
  }
  return new Response(JSON.stringify(body), { status, headers });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  try {
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { error: 'not-authenticated' });
    if (!IMGBB_KEY) return json(503, { error: 'imgbb-nao-configurado' });

    const supabase = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) return json(401, { error: 'not-authenticated' });

    const { data: isAdmin } = await supabase.rpc('eh_admin');
    if (!isAdmin) return json(403, { error: 'acesso-nao-admin' });

    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof File)) return json(400, { error: 'sem-imagem' });
    if (!file.type || !file.type.startsWith('image/')) return json(400, { error: 'formato-invalido' });
    if (file.size > MAX_BYTES) return json(400, { error: 'imagem-grande' });

    const imgbb = new FormData();
    imgbb.set('key', IMGBB_KEY);
    imgbb.set('image', file);
    let data;
    try {
      const r = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbb,
        signal: AbortSignal.timeout(IMGBB_TIMEOUT_MS),
      });
      data = await r.json().catch(() => null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        return json(504, { error: 'imgbb-timeout' });
      }
      return json(502, { error: 'imgbb-falhou' });
    }
    if (!data?.data?.display_url) return json(502, { error: 'imgbb-falhou' });

    return json(200, { url: data.data.display_url, delete_url: data.data.delete_url ?? '' });
  } catch {
    return json(500, { error: 'erro-interno' });
  }
});