-- =====================================================================
-- Agendamento do job de notificações via pg_cron + pg_net.
-- Chama a Edge Function notificacoes-dispatch a cada 15 minutos.
--
-- Pré-requisitos:
--   1) Habilite as extensões (Dashboard → Database → Extensions): pg_cron, pg_net.
--   2) Publique a função: supabase functions deploy notificacoes-dispatch --no-verify-jwt
--   3) Configure os secrets VAPID (ver função).
--   4) Ajuste a URL do projeto abaixo se necessário.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove agendamento anterior (idempotente)
select cron.unschedule('notificacoes-dispatch')
where exists (select 1 from cron.job where jobname = 'notificacoes-dispatch');

select cron.schedule(
  'notificacoes-dispatch',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://ncmfrykmslnpvslmxgof.supabase.co/functions/v1/notificacoes-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
