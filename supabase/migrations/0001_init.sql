-- =====================================================================
-- Déficit — schema inicial (Postgres / Supabase)
-- Migração do modelo original (MySQL) para Postgres.
-- Enums modelados como TEXT + CHECK (serializam como string no JSON).
-- Isolamento por usuário via RLS: auth.uid() = usuario_id.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: 1:1 com auth.users. Substitui a entidade Usuario
-- (sem senha_hash nem refresh_token — geridos pelo Supabase Auth).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
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

-- ---------------------------------------------------------------------
-- registros_peso
-- ---------------------------------------------------------------------
create table if not exists public.registros_peso (
  id           bigint generated always as identity primary key,
  usuario_id   uuid not null references public.profiles (id) on delete cascade,
  data         timestamptz not null default now(),
  peso         numeric not null,
  observacao   text
);
create index if not exists idx_peso_usuario_data on public.registros_peso (usuario_id, data desc);

-- ---------------------------------------------------------------------
-- refeicoes + itens_refeicao (cascade)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- registros_agua: 1 registro por usuário/dia (upsert)
-- ---------------------------------------------------------------------
create table if not exists public.registros_agua (
  id                  bigint generated always as identity primary key,
  usuario_id          uuid not null references public.profiles (id) on delete cascade,
  data                date not null,
  quantidade_ml       integer not null default 0,
  ultima_atualizacao  timestamptz not null default now(),
  unique (usuario_id, data)
);

-- ---------------------------------------------------------------------
-- registros_mounjaro
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- configuracoes_notificacao
-- ---------------------------------------------------------------------
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
-- Trigger: cria a linha em profiles quando um usuário é criado no Auth.
-- O cadastro do Déficit é um formulário ÚNICO e completo — todos os campos
-- de perfil chegam em raw_user_meta_data (enviados no signUp) e já marcamos
-- onboarding_concluido = true. Campos ausentes viram null (colunas NOT NULL
-- usam coalesce para o default). Robusto e independente de confirmação de e-mail.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (
    id, nome, sexo, data_nascimento, altura, nivel_atividade,
    peso_inicial, peso_meta, meta_agua, usa_mounjaro,
    meta_calorica_manual, onboarding_concluido, data_criacao
  ) values (
    new.id,
    coalesce(m->>'nome', ''),
    nullif(m->>'sexo', ''),
    (nullif(m->>'data_nascimento', ''))::date,
    (nullif(m->>'altura', ''))::numeric,
    nullif(m->>'nivel_atividade', ''),
    (nullif(m->>'peso_inicial', ''))::numeric,
    (nullif(m->>'peso_meta', ''))::numeric,
    coalesce((nullif(m->>'meta_agua', ''))::int, 2000),
    coalesce((m->>'usa_mounjaro')::boolean, false),
    (nullif(m->>'meta_calorica_manual', ''))::int,
    coalesce((m->>'onboarding_concluido')::boolean, false),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
