-- Adiciona o lembrete de treino/atividade física não marcada no dia.
alter table public.configuracoes_notificacao
  drop constraint if exists configuracoes_notificacao_tipo_check;

alter table public.configuracoes_notificacao
  add constraint configuracoes_notificacao_tipo_check check (tipo in
    ('RefeicaoNaoRegistrada','RefeicaoMetaProxima','RefeicaoMetaUltrapassada',
     'AguaNaoRegistrada','AguaMetaNaoAtingida','AtividadeNaoRegistrada',
     'MounjaroProximaDose','MounjaroDiaDaDose'));
