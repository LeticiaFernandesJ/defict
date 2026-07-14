-- =====================================================================
-- Atividade física — 1 marcação por dia + progressão de nível.
-- Regras (na app): marcar >= X vezes/semana por N semanas para subir de nível.
-- nivel_atualizado_em = baseline: a contagem de semanas do nível começa daqui.
-- =====================================================================

alter table public.profiles
  add column if not exists nivel_atualizado_em timestamptz not null default now();

create table if not exists public.atividades_fisicas (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  data        date not null,
  criado_em   timestamptz not null default now(),
  unique (usuario_id, data)   -- no máximo 1 marcação por dia
);
create index if not exists idx_atividade_usuario_data
  on public.atividades_fisicas (usuario_id, data desc);

alter table public.atividades_fisicas enable row level security;
drop policy if exists "atividade_all_own" on public.atividades_fisicas;
create policy "atividade_all_own" on public.atividades_fisicas
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
