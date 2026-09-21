-- ============================================================
-- Sítio da Voinha · Supabase Schema
-- ============================================================
-- Como usar:
--   1. Abra o SQL Editor no painel Supabase do projeto.
--   2. Cole este ficheiro e execute (é idempotente).
--   3. Já não há PIN: o acesso do admin usa Supabase Auth (email+password).
--      Antes de correr, crie no Dashboard (Authentication > Users > Add user)
--      a conta do dono com o email em `admin_email` abaixo. O login envia a
--      sessão JWT; as funções de escrita confirmam que quem chama É a conta
--      autorizada (eh_admin) — o browser nunca escreve diretamente.
--
-- O que faz:
--   - Cria `precos` (overrides de preço/disponibilidade) + `seccoes` (ordem).
--   - Cria `config` com `admin_email` (a conta autorizada a editar).
--   - Habilita RLS: anon só pode LER `precos` e `seccoes`.
--   - Cria `atualizar_preco`/`atualizar_ordem` (SECURITY DEFINER): validam
--     que auth.email = admin_email e fazem o upsert.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Tabela de preços (overrides)
-- ------------------------------------------------------------
create table if not exists public.precos (
  chave      text primary key,            -- ex.: refeicoes/carnes/picanha
  preco      integer not null,            -- valor em Kz (inteiro)
  disponivel boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.precos is
  'Overrides de preço/disponibilidade aplicados por cima do menu.json';

-- ------------------------------------------------------------
-- 1b. Tabela de ordem das seções (global, intercalada entre menus)
-- ------------------------------------------------------------
create table if not exists public.seccoes (
  cat_id     text primary key,            -- ex.: carnes, cafetaria
  ordem      integer not null,
  updated_at timestamptz not null default now()
);

comment on table public.seccoes is
  'Ordem global das seções nas abas do menu (lista intercalada entre Refeições e Bebidas)';

-- ------------------------------------------------------------
-- 1c. Tabela da galeria (fotos do slider, por categoria de menu)
-- ------------------------------------------------------------
create table if not exists public.galeria (
  id         bigint generated always as identity primary key,
  menu_id    text not null check (menu_id in ('refeicoes', 'bebidas')),
  url        text not null,               -- url final (ex.: display_url do imgbb)
  alt        text not null default '',    -- etiqueta do prato (opcional)
  created_at timestamptz not null default now()
);

comment on table public.galeria is
  'Fotos do slider da landing, agrupadas por menu (refeicoes|bebidas)';

-- ------------------------------------------------------------
-- 2. Tabela de configuração (email da conta administradora)
-- ------------------------------------------------------------
create table if not exists public.config (
  chave text primary key,
  valor text not null
);

-- >>>>> CONTA DO DONO <<<<<
-- Email da conta Supabase Auth autorizada a editar (criada no Dashboard).
-- Se já correu o schema com outro valor, basta voltar a correr este insert
-- (ou: update public.config set valor = 'novo@email.pt' where chave='admin_email';)
insert into public.config (chave, valor)
values ('admin_email', 'docflex.angola@gmail.com')
on conflict (chave) do update set valor = excluded.valor;

-- limpa a chave antiga do PIN (já sem uso; inofensiva se não existir)
delete from public.config where chave = 'pin_hash';

-- ------------------------------------------------------------
-- 3. Row Level Security
-- ------------------------------------------------------------
alter table public.precos enable row level security;
alter table public.config  enable row level security;
alter table public.seccoes enable row level security;
alter table public.galeria enable row level security;

-- anon e authenticated podem LER os preços (a landing)
drop policy if exists "precos_leitura_publica" on public.precos;
create policy "precos_leitura_publica"
  on public.precos for select
  using (true);

-- anon e authenticated podem LER a ordem das seções (a landing)
drop policy if exists "seccoes_leitura_publica" on public.seccoes;
create policy "seccoes_leitura_publica"
  on public.seccoes for select
  using (true);

-- anon e authenticated podem LER a galeria (a landing)
drop policy if exists "galeria_leitura_publica" on public.galeria;
create policy "galeria_leitura_publica"
  on public.galeria for select
  using (true);

-- ninguém lê a tabela config diretamente (só as funções internas)
drop policy if exists "config_sem_leitura" on public.config;
create policy "config_sem_leitura"
  on public.config for select
  using (false);

-- ------------------------------------------------------------
-- 4. Funções (validação no servidor)
-- ------------------------------------------------------------

-- Remove as assinaturas antigas (com PIN) e o validar_pin, se existirem
drop function if exists public.validar_pin(text);
drop function if exists public.atualizar_preco(text, text, integer, boolean);
drop function if exists public.atualizar_ordem(text, text[]);

-- Devolve true se o pedido vier da conta de dono (auth.email = admin_email)
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select (
    select lower(trim(valor)) = lower(trim(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')))
    from public.config
    where chave = 'admin_email'
  );
$$;

-- Atualiza um override de preço/disponibilidade (apenas o dono)
create or replace function public.atualizar_preco(
  p_chave text,
  p_preco integer,
  p_disponivel boolean
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.eh_admin(), false) then
    return false;
  end if;

  insert into public.precos (chave, preco, disponivel, updated_at)
  values (p_chave, p_preco, coalesce(p_disponivel, true), now())
  on conflict (chave) do update
  set preco = excluded.preco,
      disponivel = excluded.disponivel,
      updated_at = now();

  return true;
end;
$$;

-- Grava a ordem global das seções (apenas o dono)
create or replace function public.atualizar_ordem(
  p_ordens text[]
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.eh_admin(), false) then
    return false;
  end if;

  delete from public.seccoes where cat_id <> all(p_ordens);

  insert into public.seccoes (cat_id, ordem, updated_at)
  select ord.value, ord.ordinality - 1, now()
  from unnest(p_ordens) with ordinality as ord(value)
  on conflict (cat_id) do update
  set ordem = excluded.ordem,
      updated_at = now();

  return true;
end;
$$;

-- Função de "health check": devolve true se o backend estiver pronto
create or replace function public.ping_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select true;
$$;

-- Adiciona uma foto à galeria (apenas o dono)
create or replace function public.adicionar_galeria(
  p_url text,
  p_alt text,
  p_menu text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.eh_admin(), false) then
    return false;
  end if;
  if p_url is null or p_url = '' then
    return false;
  end if;
  insert into public.galeria (menu_id, url, alt)
  values (coalesce(p_menu, 'refeicoes'), p_url, coalesce(p_alt, ''));
  return true;
end;
$$;

-- Remove uma foto da galeria (apenas o dono)
create or replace function public.remover_galeria(p_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.eh_admin(), false) then
    return false;
  end if;
  delete from public.galeria where id = p_id;
  return true;
end;
$$;

-- ------------------------------------------------------------
-- 5. Permissões
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.precos to anon, authenticated;
grant select on public.seccoes to anon, authenticated;
grant select on public.galeria to anon, authenticated;
grant execute on function public.atualizar_preco(text, integer, boolean) to anon, authenticated;
grant execute on function public.atualizar_ordem(text[]) to anon, authenticated;
grant execute on function public.ping_admin() to anon, authenticated;
grant execute on function public.adicionar_galeria(text, text, text) to anon, authenticated;
grant execute on function public.remover_galeria(bigint) to anon, authenticated;