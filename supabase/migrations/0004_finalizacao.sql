-- =====================================================================
-- Finalização: push_subscriptions, cardapios, planos_treino
-- Todas com RLS auth.uid() = usuario_id.
-- =====================================================================

-- Web Push — assinaturas do navegador
create table if not exists public.push_subscriptions (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  criado_em   timestamptz not null default now(),
  unique (usuario_id, endpoint)
);
create index if not exists idx_push_usuario on public.push_subscriptions (usuario_id);

-- Cardápios gerados pela IA (semana inteira persistida)
create table if not exists public.cardapios (
  id             bigint generated always as identity primary key,
  usuario_id     uuid not null references public.profiles (id) on delete cascade,
  criado_em      timestamptz not null default now(),
  inicio_semana  date,
  preferencias   text,
  restricoes     text,
  meta_calorica  int,
  dias           jsonb not null default '[]'::jsonb
);
create index if not exists idx_cardapios_usuario on public.cardapios (usuario_id, criado_em desc);

-- Planos de treino gerados pela IA (Claude)
create table if not exists public.planos_treino (
  id               bigint generated always as identity primary key,
  usuario_id       uuid not null references public.profiles (id) on delete cascade,
  criado_em        timestamptz not null default now(),
  objetivo         text,
  dias_por_semana  int,
  equipamento      text,
  restricoes       text,
  ativo            boolean not null default true,
  dias             jsonb not null default '[]'::jsonb
);
create index if not exists idx_planos_usuario on public.planos_treino (usuario_id, criado_em desc);

-- RLS
alter table public.push_subscriptions enable row level security;
alter table public.cardapios          enable row level security;
alter table public.planos_treino      enable row level security;

drop policy if exists "push_all_own" on public.push_subscriptions;
create policy "push_all_own" on public.push_subscriptions
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "cardapios_all_own" on public.cardapios;
create policy "cardapios_all_own" on public.cardapios
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "planos_all_own" on public.planos_treino;
create policy "planos_all_own" on public.planos_treino
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
