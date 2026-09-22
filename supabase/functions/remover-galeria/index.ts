import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const PUBLIC_PREFIX = `${URL}/storage/v1/object/public/galeria/`;

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

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!Number.isFinite(id) || id <= 0) return json(400, { error: 'id-invalido' });

    const { data: row } = await supabase
      .from('galeria')
      .select('url')
      .eq('id', id)
      .maybeSingle();

    let path = '';
    if (row?.url && row.url.startsWith(PUBLIC_PREFIX)) path = row.url.slice(PUBLIC_PREFIX.length);

    if (path) {
      const { error: rmError } = await supabase.storage.from('galeria').remove([path]);
      if (rmError) return json(502, { error: 'storage-falhou' });
    }

    const { data: rpcOk } = await supabase.rpc('remover_galeria', { p_id: id });
    if (rpcOk !== true) return json(403, { error: 'acesso-nao-admin' });

    return json(200, {});
  } catch {
    return json(500, { error: 'erro-interno' });
  }
});