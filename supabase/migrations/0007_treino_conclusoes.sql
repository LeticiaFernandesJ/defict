-- =====================================================================
-- treino_conclusoes: conclusão de um dia de treino, com trava semanal.
-- Um dia fica travado até a semana ISO seguinte (ano_semana ex.: 2025-W28).
-- =====================================================================
create table if not exists public.treino_conclusoes (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null references public.profiles (id) on delete cascade,
  plano_id      bigint references public.planos_treino (id) on delete cascade,
  dia_semana    text not null,
  ano_semana    text not null,               -- ex.: 2025-W28 (ano + semana ISO)
  concluido_em  timestamptz not null default now(),
  unique (usuario_id, plano_id, dia_semana, ano_semana)
);
create index if not exists idx_treino_conc_usuario
  on public.treino_conclusoes (usuario_id, ano_semana);

alter table public.treino_conclusoes enable row level security;
drop policy if exists "treino_conc_all_own" on public.treino_conclusoes;
create policy "treino_conc_all_own" on public.treino_conclusoes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
