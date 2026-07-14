-- =====================================================================
-- Row Level Security (OBRIGATÓRIO): cada usuário só acessa os próprios dados.
-- A anon/publishable key é pública — sem RLS, os dados ficariam expostos.
-- =====================================================================

alter table public.profiles                enable row level security;
alter table public.registros_peso          enable row level security;
alter table public.refeicoes               enable row level security;
alter table public.itens_refeicao          enable row level security;
alter table public.registros_agua          enable row level security;
alter table public.registros_mounjaro      enable row level security;
alter table public.configuracoes_notificacao enable row level security;

-- profiles: dono = id
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Macro para tabelas com coluna usuario_id.
-- (Repetimos por tabela pois o Postgres não tem "policy template".)

-- registros_peso
create policy "peso_all_own" on public.registros_peso
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- refeicoes
create policy "refeicoes_all_own" on public.refeicoes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- itens_refeicao: pertence ao usuário se a refeição-pai pertence a ele.
create policy "itens_all_own" on public.itens_refeicao
  for all
  using (
    exists (
      select 1 from public.refeicoes r
      where r.id = itens_refeicao.refeicao_id and r.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.refeicoes r
      where r.id = itens_refeicao.refeicao_id and r.usuario_id = auth.uid()
    )
  );

-- registros_agua
create policy "agua_all_own" on public.registros_agua
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- registros_mounjaro
create policy "mounjaro_all_own" on public.registros_mounjaro
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- configuracoes_notificacao
create policy "notif_all_own" on public.configuracoes_notificacao
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
