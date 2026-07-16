// Edge Function (Deno) — job agendado (pg_cron a cada ~15-30 min).
// Avalia notificações "pendentes" por usuário e envia Web Push.
// Usa a SERVICE ROLE (ignora RLS) — protegida por ser chamada só pelo cron.
//
// Deploy:  supabase functions deploy notificacoes-dispatch --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:voce@exemplo.com
// Cron (SQL): ver supabase/migrations/0005_cron_notificacoes.sql
//
// OBS de fuso: todos os horários (horario_gatilho, "hoje", dia da semana, semana
// ISO) são avaliados no horário de Brasília (America/Sao_Paulo), não UTC.
// Ainda é um fuso único para todos os usuários (sem preferência por usuário).

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

const TZ = 'America/Sao_Paulo';

/** Ano/mês/dia/hora/minuto no horário de Brasília, extraídos via Intl (lida
 * com o fuso corretamente, sem precisar calcular o offset manualmente). */
function partesBrasilia(d: Date = new Date()): { year: string; month: string; day: string; hour: string; minute: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const partes: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) partes[p.type] = p.value;
  return partes as any;
}
function hojeISO(): string {
  const v = partesBrasilia();
  return `${v.year}-${v.month}-${v.day}`;
}
function horaAgora(): string {
  const v = partesBrasilia();
  return `${v.hour}:${v.minute}`;
}
function jaDisparouHoje(ultimo: string | null): boolean {
  return !!ultimo && ultimo.slice(0, 10) === hojeISO();
}
function passaramHoras(ultimo: string | null, horas: number): boolean {
  return !ultimo || Date.now() - new Date(ultimo).getTime() >= horas * 60 * 60 * 1000;
}
// Lembretes de "meta do dia ainda não cumprida" — repetem a cada 2h (em vez de
// 1×/dia) enquanto a condição continuar valendo; a checagem de horário dentro
// de cada `case` já impede o primeiro disparo antes do horário configurado.
const TIPOS_RECORRENTES = new Set(['AguaMetaNaoAtingida', 'RefeicaoNaoRegistrada', 'AtividadeNaoRegistrada']);
const INTERVALO_RECORRENCIA_HORAS = 2;
function diasDesde(dataISO: string): number {
  return Math.floor((Date.now() - new Date(dataISO).getTime()) / 86400000);
}

// Nome do dia da semana (pt-BR) e semana ISO "AAAA-Www" — mesma lógica de
// frontend/src/lib/treinoUtils.ts, mas usando a data civil de Brasília (não UTC).
const DIAS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
/** Data UTC "sintética" à meia-noite, só para representar o dia civil de
 * Brasília e reaproveitar os cálculos de dia-da-semana/semana ISO abaixo. */
function dataCivilBrasilia(): Date {
  const v = partesBrasilia();
  return new Date(Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day)));
}
function diaSemanaHoje(): string {
  return DIAS_PT[dataCivilBrasilia().getUTCDay()];
}
function anoSemanaHoje(): string {
  const dt = dataCivilBrasilia();
  const dia = (dt.getUTCDay() + 6) % 7; // segunda = 0
  dt.setUTCDate(dt.getUTCDate() - dia + 3); // quinta desta semana
  const primeiraQuinta = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const semana =
    1 +
    Math.round(
      ((dt.getTime() - primeiraQuinta.getTime()) / 86400000 -
        3 +
        ((primeiraQuinta.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${dt.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
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
    let treinoAgendadoHoje: boolean | null = null;
    let treinoConcluidoHoje: boolean | null = null;

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
    const carregarAtividade = async () => {
      if (treinoAgendadoHoje !== null) return;
      const { data: plano } = await supabase
        .from('planos_treino').select('id, dias').eq('usuario_id', p.id).eq('ativo', true)
        .order('criado_em', { ascending: false }).limit(1).maybeSingle();
      const hojeAbrev = diaSemanaHoje().toLowerCase().slice(0, 3);
      const diaPlano = (plano?.dias ?? []).find(
        (d: any) => (d?.diaSemana ?? '').toLowerCase().startsWith(hojeAbrev),
      );
      if (!plano || !diaPlano) {
        treinoAgendadoHoje = false;
        treinoConcluidoHoje = true; // nada agendado → não "falta" marcar nada
        return;
      }
      treinoAgendadoHoje = true;
      const { data: conclusao } = await supabase
        .from('treino_conclusoes').select('id').eq('usuario_id', p.id).eq('plano_id', plano.id)
        .eq('dia_semana', diaPlano.diaSemana).eq('ano_semana', anoSemanaHoje()).maybeSingle();
      treinoConcluidoHoje = !!conclusao;
    };

    const meta = metaCalorica(p);
    const noHorario = (h: string) => agora >= h.slice(0, 5);

    for (const cfg of configs) {
      const recorrente = TIPOS_RECORRENTES.has(cfg.tipo);
      if (recorrente) {
        if (!passaramHoras(cfg.ultimo_disparo, INTERVALO_RECORRENCIA_HORAS)) continue;
      } else if (jaDisparouHoje(cfg.ultimo_disparo)) {
        continue;
      }
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
        case 'AtividadeNaoRegistrada':
          await carregarAtividade();
          if (treinoAgendadoHoje && !treinoConcluidoHoje && noHorario(cfg.horario_gatilho)) {
            dispara = true; corpo = 'Hoje é dia de treino e você ainda não marcou como feito.';
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
