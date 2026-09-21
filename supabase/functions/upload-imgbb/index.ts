import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IMGBB_KEY = Deno.env.get('IMGBB_KEY') ?? '';
const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const MAX_BYTES = 32 * 1024 * 1024;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
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
    const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: imgbb });
    const data = await r.json().catch(() => ({}));
    if (!data?.data?.display_url) return json(502, { error: 'imgbb-falhou' });

    return json(200, { url: data.data.display_url, delete_url: data.data.delete_url ?? '' });
  } catch {
    return json(500, { error: 'erro-interno' });
  }
});