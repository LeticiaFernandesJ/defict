-- =====================================================================
-- Autenticação PRÓPRIA (substitui o Supabase Auth), mantendo a RLS.
-- A Edge Function `auth` emite um JWT assinado com o JWT secret do projeto,
-- com sub = usuarios.id. Como profiles.id = usuarios.id, auth.uid() continua
-- funcionando nas policies existentes.
--
-- ATENÇÃO: repontar profiles.id remove profiles órfãos (sem dados reais aqui).
-- =====================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Tabela de usuários própria. RLS ligada e SEM policies => cliente não acessa
-- (só a Edge Function, via service_role, lê/escreve senha_hash).
create table if not exists public.usuarios (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  senha_hash  text not null,
  criado_em   timestamptz not null default now()
);
alter table public.usuarios enable row level security;

-- Remove a integração com o Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Repontar profiles.id: de auth.users(id) para public.usuarios(id)
delete from public.profiles p where not exists (select 1 from public.usuarios u where u.id = p.id);
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references public.usuarios (id) on delete cascade;

-- As policies de profiles e demais tabelas (auth.uid() = id / usuario_id)
-- continuam valendo — o JWT próprio traz o mesmo sub.
