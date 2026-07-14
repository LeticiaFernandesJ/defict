// Edge Function (Deno) — job agendado (pg_cron a cada ~15-30 min).
// Avalia notificações "pendentes" por usuário e envia Web Push.
// Usa a SERVICE ROLE (ignora RLS) — protegida por ser chamada só pelo cron.
//
// Deploy:  supabase functions deploy notificacoes-dispatch --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:voce@exemplo.com
// Cron (SQL): ver supabase/migrations/0005_cron_notificacoes.sql
//
// OBS de fuso: sem timezone por usuário, comparamos com a hora do servidor (UTC).
// Ajuste se precisar de precisão por fuso.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@deficit.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const FATOR: Record<string, number> = {
  Sedentario: 1.2, Leve: 1.375, Moderado: 1.55, Intenso: 1.725, MuitoIntenso: 1.9,
};

function metaCalorica(p: any): number | null {
  if (p.meta_calorica_manual) return p.meta_calorica_manual;
  if (!p.peso_inicial || !p.altura || !p.data_nascimento || !p.nivel_atividade || !p.sexo) return null;
  const idade = new Date().getFullYear() - new Date(p.data_nascimento).getFullYear();
  const base = 10 * p.peso_inicial + 6.25 * p.altura - 5 * idade + (p.sexo === 'Masculino' ? 5 : -161);
  const tdee = Math.round(base * (FATOR[p.nivel_atividade] ?? 1.2));
  return Math.max(1200, tdee - 500);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function horaAgora(): string {
  return new Date().toISOString().slice(11, 16); // HH:mm UTC
}
function jaDisparouHoje(ultimo: string | null): boolean {
  return !!ultimo && ultimo.slice(0, 10) === hojeISO();
}
function diasDesde(dataISO: string): number {
  return Math.floor((Date.now() - new Date(dataISO).getTime()) / 86400000);
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const hoje = hojeISO();
  const agora = horaAgora();
  let enviados = 0;

  const { data: perfis } = await supabase.from('profiles').select('*');

  for (const p of perfis ?? []) {
    const { data: configs } = await supabase
      .from('configuracoes_notificacao')
      .select('*')
      .eq('usuario_id', p.id)
      .eq('ativo', true);
    if (!configs?.length) continue;

    // dados do dia (carregados sob demanda)
    let calorias: number | null = null;
    let temRefeicaoHoje: boolean | null = null;
    let aguaHoje: number | null = null;
    let ultimaMounjaro: string | null | undefined = undefined;

    const carregarRefeicoes = async () => {
      if (calorias !== null) return;
      const { data } = await supabase
        .from('refeicoes')
        .select('id, itens:itens_refeicao(calorias)')
        .eq('usuario_id', p.id)
        .gte('data', `${hoje}T00:00:00`)
        .lte('data', `${hoje}T23:59:59`);
      temRefeicaoHoje = (data?.length ?? 0) > 0;
      calorias = (data ?? []).reduce(
        (a: number, r: any) => a + (r.itens ?? []).reduce((s: number, i: any) => s + Number(i.calorias || 0), 0),
        0,
      );
    };
    const carregarAgua = async () => {
      if (aguaHoje !== null) return;
      const { data } = await supabase
        .from('registros_agua').select('quantidade_ml').eq('usuario_id', p.id).eq('data', hoje).maybeSingle();
      aguaHoje = data ? Number(data.quantidade_ml) : 0;
    };
    const carregarMounjaro = async () => {
      if (ultimaMounjaro !== undefined) return;
      const { data } = await supabase
        .from('registros_mounjaro').select('data_aplicacao').eq('usuario_id', p.id)
        .order('data_aplicacao', { ascending: false }).limit(1).maybeSingle();
      ultimaMounjaro = data?.data_aplicacao ?? null;
    };

    const meta = metaCalorica(p);
    const noHorario = (h: string) => agora >= h.slice(0, 5);

    for (const cfg of configs) {
      if (jaDisparouHoje(cfg.ultimo_disparo)) continue;
      let dispara = false;
      let titulo = 'Déficit';
      let corpo = '';

      switch (cfg.tipo) {
        case 'RefeicaoNaoRegistrada':
          await carregarRefeicoes();
          if (noHorario(cfg.horario_gatilho) && !temRefeicaoHoje) {
            dispara = true; corpo = 'Você ainda não registrou nenhuma refeição hoje.';
          }
          break;
        case 'RefeicaoMetaProxima':
          await carregarRefeicoes();
          if (meta && calorias! >= 0.9 * meta && calorias! <= meta) {
            dispara = true; corpo = `Você está perto da sua meta (${calorias}/${meta} kcal).`;
          }
          break;
        case 'RefeicaoMetaUltrapassada':
          await carregarRefeicoes();
          if (meta && calorias! > meta) {
            dispara = true; corpo = `Você ultrapassou a meta calórica de hoje (${calorias}/${meta} kcal).`;
          }
          break;
        case 'AguaNaoRegistrada':
          await carregarAgua();
          if (noHorario(cfg.horario_gatilho) && aguaHoje === 0) {
            dispara = true; corpo = 'Você ainda não registrou água hoje.';
          }
          break;
        case 'AguaMetaNaoAtingida':
          await carregarAgua();
          if (noHorario(cfg.horario_gatilho) && aguaHoje! < (p.meta_agua ?? 2000)) {
            dispara = true; corpo = `Faltam ${(p.meta_agua ?? 2000) - aguaHoje!} ml para a meta de água.`;
          }
          break;
        case 'MounjaroProximaDose':
          await carregarMounjaro();
          if (ultimaMounjaro && diasDesde(ultimaMounjaro) === 6) {
            dispara = true; corpo = 'Sua próxima dose de Mounjaro é amanhã.';
          }
          break;
        case 'MounjaroDiaDaDose':
          await carregarMounjaro();
          if (ultimaMounjaro && diasDesde(ultimaMounjaro) >= 7 && noHorario(cfg.horario_gatilho)) {
            dispara = true; corpo = 'Hoje é dia da dose de Mounjaro.';
          }
          break;
      }

      if (!dispara) continue;

      const { data: subs } = await supabase
        .from('push_subscriptions').select('*').eq('usuario_id', p.id);
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: titulo, body: corpo, url: '/dashboard' }),
          );
          enviados++;
        } catch (e) {
          // subscription inválida → remove
          if (String(e).includes('410') || String(e).includes('404')) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id);
          }
        }
      }
      await supabase.from('configuracoes_notificacao').update({ ultimo_disparo: new Date().toISOString() }).eq('id', cfg.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, enviados }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
