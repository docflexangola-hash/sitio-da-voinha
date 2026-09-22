import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const MAX_BYTES = 32 * 1024 * 1024;
const CACHE_SECONDS = 3600;

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

    const supabase = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) return json(401, { error: 'not-authenticated' });

    const { data: isAdmin } = await supabase.rpc('eh_admin');
    if (!isAdmin) return json(403, { error: 'acesso-nao-admin' });

    const form = await req.formData();
    const file = form.get('image');
    const menu = String(form.get('menu') ?? 'refeicoes');
    if (!(file instanceof File)) return json(400, { error: 'sem-imagem' });
    if (!file.type || !file.type.startsWith('image/')) return json(400, { error: 'formato-invalido' });
    if (file.size > MAX_BYTES) return json(400, { error: 'imagem-grande' });
    if (menu !== 'refeicoes' && menu !== 'bebidas') return json(400, { error: 'categoria-invalida' });

    const type = file.type.toLowerCase();
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg';
    const path = `${menu}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('galeria')
      .upload(path, bytes, {
        contentType: file.type,
        cacheControl: `${CACHE_SECONDS}`,
        upsert: false,
      });
    if (uploadError || !uploadData?.path) return json(502, { error: 'storage-falhou' });

    const url = `${URL}/storage/v1/object/public/galeria/${uploadData.path}`;
    return json(200, { url, path: uploadData.path });
  } catch {
    return json(500, { error: 'erro-interno' });
  }
});