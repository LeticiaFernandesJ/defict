-- =====================================================================
-- Déficit — SETUP COMPLETO DO BANCO (Postgres / Supabase)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- É idempotente: pode rodar de novo sem quebrar (usa IF NOT EXISTS /
-- CREATE OR REPLACE / DROP ... IF EXISTS).
--
-- O que é essencial para o CADASTRO de usuários:
--   1) tabela public.profiles
--   2) função + trigger handle_new_user (cria o profiles no signup)
--   3) RLS na profiles
-- As demais tabelas ficam prontas para o resto do app.
-- =====================================================================

-- =====================================================================
-- 1) TABELAS
-- =====================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- usuarios: autenticação PRÓPRIA (e-mail + senha). Só a Edge Function `auth`
-- acessa (via service_role). RLS ligada e SEM policies => cliente não lê senha_hash.
create table if not exists public.usuarios (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  senha_hash  text not null,
  criado_em   timestamptz not null default now()
);
alter table public.usuarios enable row level security;

-- profiles: 1:1 com usuarios (id = usuarios.id). auth.uid() vem do JWT próprio.
create table if not exists public.profiles (
  id                    uuid primary key references public.usuarios (id) on delete cascade,
  nome                  text not null default '',
  sexo                  text check (sexo in ('Masculino', 'Feminino')),
  data_nascimento       date,
  altura                numeric,          -- cm
  peso_inicial          numeric,          -- kg
  peso_meta             numeric,          -- kg
  nivel_atividade       text check (nivel_atividade in
                          ('Sedentario','Leve','Moderado','Intenso','MuitoIntenso')),
  usa_mounjaro          boolean not null default false,
  meta_agua             integer not null default 2000,   -- ml
  meta_calorica_manual  integer,          -- sobrepõe o cálculo automático
  onboarding_concluido  boolean not null default false,
  data_criacao          timestamptz not null default now()
);

-- registros_peso
create table if not exists public.registros_peso (
  id           bigint generated always as identity primary key,
  usuario_id   uuid not null references public.profiles (id) on delete cascade,
  data         timestamptz not null default now(),
  peso         numeric not null,
  observacao   text
);
create index if not exists idx_peso_usuario_data on public.registros_peso (usuario_id, data desc);

-- refeicoes + itens_refeicao (cascade)
create table if not exists public.refeicoes (
  id             bigint generated always as identity primary key,
  usuario_id     uuid not null references public.profiles (id) on delete cascade,
  data           timestamptz not null default now(),
  tipo_refeicao  text not null check (tipo_refeicao in
                   ('CafeDaManha','LancheManha','Almoco','LancheTarde','Jantar','Ceia')),
  observacao     text
);
create index if not exists idx_refeicoes_usuario_data on public.refeicoes (usuario_id, data);

create table if not exists public.itens_refeicao (
  id             bigint generated always as identity primary key,
  refeicao_id    bigint not null references public.refeicoes (id) on delete cascade,
  nome_alimento  text not null,
  quantidade     numeric not null default 0,
  unidade        text not null default 'g',
  calorias       numeric not null default 0,
  proteinas      numeric not null default 0,
  carboidratos   numeric not null default 0,
  gorduras       numeric not null default 0,
  fibras         numeric not null default 0
);
create index if not exists idx_itens_refeicao on public.itens_refeicao (refeicao_id);

-- registros_agua: 1 registro por usuário/dia (upsert)
create table if not exists public.registros_agua (
  id                  bigint generated always as identity primary key,
  usuario_id          uuid not null references public.profiles (id) on delete cascade,
  data                date not null,
  quantidade_ml       integer not null default 0,
  ultima_atualizacao  timestamptz not null default now(),
  unique (usuario_id, data)
);

-- registros_mounjaro
create table if not exists public.registros_mounjaro (
  id                        bigint generated always as identity primary key,
  usuario_id                uuid not null references public.profiles (id) on delete cascade,
  data_aplicacao            timestamptz not null default now(),
  dose_mg                   numeric not null,
  local_aplicacao           text not null,
  sintomas                  text,
  nivel_tolerancia_sintoma  text not null default 'Nenhum' check (nivel_tolerancia_sintoma in
                              ('Nenhum','Leve','Moderado','Intenso')),
  observacao                text
);
create index if not exists idx_mounjaro_usuario on public.registros_mounjaro (usuario_id, data_aplicacao desc);

-- configuracoes_notificacao
create table if not exists public.configuracoes_notificacao (
  id              bigint generated always as identity primary key,
  usuario_id      uuid not null references public.profiles (id) on delete cascade,
  tipo            text not null check (tipo in
                    ('RefeicaoNaoRegistrada','RefeicaoMetaProxima','RefeicaoMetaUltrapassada',
                     'AguaNaoRegistrada','AguaMetaNaoAtingida','MounjaroProximaDose','MounjaroDiaDaDose')),
  horario_gatilho time not null,
  ativo           boolean not null default true,
  ultimo_disparo  timestamptz
);
create index if not exists idx_notif_usuario on public.configuracoes_notificacao (usuario_id);

-- =====================================================================
-- 2) AUTENTICAÇÃO
-- Sem Supabase Auth: o cadastro/login e a criação do profiles são feitos
-- pela Edge Function `auth` (usa service_role). O JWT emitido por ela traz
-- sub = usuarios.id, então auth.uid() nas policies abaixo continua valendo.
-- =====================================================================

-- =====================================================================
-- 3) ROW LEVEL SECURITY (OBRIGATÓRIO)
-- A anon/publishable key é pública — sem RLS, os dados ficariam expostos.
-- =====================================================================
alter table public.profiles                  enable row level security;
alter table public.registros_peso            enable row level security;
alter table public.refeicoes                 enable row level security;
alter table public.itens_refeicao            enable row level security;
alter table public.registros_agua            enable row level security;
alter table public.registros_mounjaro        enable row level security;
alter table public.configuracoes_notificacao enable row level security;

-- profiles: dono = id
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- registros_peso
drop policy if exists "peso_all_own" on public.registros_peso;
create policy "peso_all_own" on public.registros_peso
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- refeicoes
drop policy if exists "refeicoes_all_own" on public.refeicoes;
create policy "refeicoes_all_own" on public.refeicoes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- itens_refeicao: pertence ao usuário se a refeição-pai pertence a ele.
drop policy if exists "itens_all_own" on public.itens_refeicao;
create policy "itens_all_own" on public.itens_refeicao
  for all
  using (
    exists (select 1 from public.refeicoes r
            where r.id = itens_refeicao.refeicao_id and r.usuario_id = auth.uid())
  )
  with check (
    exists (select 1 from public.refeicoes r
            where r.id = itens_refeicao.refeicao_id and r.usuario_id = auth.uid())
  );

-- registros_agua
drop policy if exists "agua_all_own" on public.registros_agua;
create policy "agua_all_own" on public.registros_agua
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- registros_mounjaro
drop policy if exists "mounjaro_all_own" on public.registros_mounjaro;
create policy "mounjaro_all_own" on public.registros_mounjaro
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- configuracoes_notificacao
drop policy if exists "notif_all_own" on public.configuracoes_notificacao;
create policy "notif_all_own" on public.configuracoes_notificacao
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- =====================================================================
-- 4) ATIVIDADE FÍSICA — 1 marcação por dia + progressão de nível
-- Regras: marcar >= X vezes/semana por N semanas para subir de nível.
-- nivel_atualizado_em = baseline (a contagem de semanas começa daqui).
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

-- =====================================================================
-- 5) FINALIZAÇÃO — push_subscriptions, cardapios, planos_treino
-- =====================================================================
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

-- treino_conclusoes: conclusão de um dia de treino, com trava semanal (ano_semana ISO)
create table if not exists public.treino_conclusoes (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null references public.profiles (id) on delete cascade,
  plano_id      bigint references public.planos_treino (id) on delete cascade,
  dia_semana    text not null,
  ano_semana    text not null,
  concluido_em  timestamptz not null default now(),
  unique (usuario_id, plano_id, dia_semana, ano_semana)
);
create index if not exists idx_treino_conc_usuario on public.treino_conclusoes (usuario_id, ano_semana);
alter table public.treino_conclusoes enable row level security;
drop policy if exists "treino_conc_all_own" on public.treino_conclusoes;
create policy "treino_conc_all_own" on public.treino_conclusoes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- =====================================================================
-- Pronto. Agora Auth → Providers → Email:
--   - desative "Confirm email" para ter login imediato após o cadastro
--     (paridade com o app original), OU trate a tela de confirmação.
-- =====================================================================
