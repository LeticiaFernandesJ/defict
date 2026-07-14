// Utilitários dos cards de treino.

/** Converte a string de descanso em segundos. Tolerante: "45s", "45 segundos",
 * "1 minuto", "1:30", "90". Fallback 45s. */
export function parseDescanso(s: string | undefined | null): number {
  if (!s) return 45;
  const t = String(s).toLowerCase().trim();
  const mmss = t.match(/^(\d+):(\d{1,2})$/);
  if (mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  const min = t.match(/(\d+)\s*min/);
  if (min) return parseInt(min[1], 10) * 60;
  const seg = t.match(/(\d+)\s*(s|seg)/);
  if (seg) return parseInt(seg[1], 10);
  const n = t.match(/^(\d+)$/);
  if (n) return parseInt(n[1], 10);
  return 45;
}

/** Segundos → "M:SS" (se ≥ 60) ou "N" (segundos). */
export function formatTempo(seg: number): string {
  if (seg >= 60) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return String(seg);
}

/** Ano + semana ISO, ex.: "2025-W28". */
export function anoSemanaISO(d: Date = new Date()): string {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
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

// Nome do dia de hoje (pt-BR) para comparar com dia.diaSemana.
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function ehDiaDeHoje(diaSemana: string): boolean {
  const hoje = DIAS[new Date().getDay()].toLowerCase();
  return (diaSemana ?? '').toLowerCase().startsWith(hoje.slice(0, 3));
}

// Frases de motivação — foco em esforço e constância, nunca aparência/peso/punição.
export const MOTIVACAO = [
  'Treino feito. Constância é o que constrói resultado.',
  'Mais um dia no seu ritmo. Orgulhe-se.',
  'Você apareceu e fez. É isso que importa.',
  'Pequenos passos, feitos com regularidade, vão longe.',
  'Cuidar de você é um bom motivo por si só.',
  'Respeite seus limites e descanse quando precisar.',
];
export function sorteiaMotivacao(): string {
  return MOTIVACAO[Math.floor(Math.random() * MOTIVACAO.length)];
}
