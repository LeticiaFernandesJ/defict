import type { NivelAtividade } from '../types';
import { toISODate } from './dates';

// Regras de progressão: marcar >= vezesSemana por `semanas` semanas para subir.
export const REGRAS_ATIVIDADE: Record<
  NivelAtividade,
  { vezesSemana: number; semanas: number; proximo: NivelAtividade | null }
> = {
  Sedentario: { vezesSemana: 3, semanas: 5, proximo: 'Leve' },
  Leve: { vezesSemana: 3, semanas: 10, proximo: 'Moderado' },
  Moderado: { vezesSemana: 4, semanas: 10, proximo: 'Intenso' },
  Intenso: { vezesSemana: 6, semanas: 10, proximo: 'MuitoIntenso' },
  MuitoIntenso: { vezesSemana: 6, semanas: 0, proximo: null }, // nível máximo
};

/** Segunda-feira (início da semana ISO) de uma data, como yyyy-mm-dd local. */
function inicioSemanaISO(d: Date): string {
  const dt = new Date(d);
  const diaSeg = (dt.getDay() + 6) % 7; // 0 = segunda
  dt.setDate(dt.getDate() - diaSeg);
  dt.setHours(0, 0, 0, 0);
  return toISODate(dt);
}

/** Resumo das últimas `n` semanas: rótulo, marcações e se qualificou. */
export function historicoSemanas(
  datas: string[],
  vezesSemana: number,
  n = 6,
): { rotulo: string; count: number; qualificada: boolean; atual: boolean }[] {
  const contagem = new Map<string, number>();
  for (const iso of datas) {
    const wk = inicioSemanaISO(new Date(`${iso}T12:00:00`));
    contagem.set(wk, (contagem.get(wk) ?? 0) + 1);
  }
  const semanaAtual = inicioSemanaISO(new Date());
  const out: { rotulo: string; count: number; qualificada: boolean; atual: boolean }[] = [];
  const cursor = new Date();
  for (let i = 0; i < n; i++) {
    const key = inicioSemanaISO(cursor);
    const count = contagem.get(key) ?? 0;
    const d = new Date(`${key}T12:00:00`);
    const rotulo = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.unshift({ rotulo, count, qualificada: count >= vezesSemana, atual: key === semanaAtual });
    cursor.setDate(cursor.getDate() - 7);
  }
  return out;
}

export interface ProgressoAtividade {
  nivel: NivelAtividade;
  proximo: NivelAtividade | null;
  vezesSemana: number; // mínimo exigido por semana
  semanasRequeridas: number;
  semanasConcluidas: number; // sequência consecutiva de semanas qualificadas (cap na exigida)
  vezesNaSemana: number; // marcações na semana atual
  elegivel: boolean; // atingiu o requisito para subir de nível
  pctPrincipal: number; // barra principal (progresso de nível) 0..100
  pctSemana: number; // barra menor (semana atual) 0..100
}

/**
 * Calcula o progresso de atividade a partir das datas marcadas (yyyy-mm-dd),
 * do nível atual e do baseline (nivel_atualizado_em) — a contagem de semanas
 * começa no baseline.
 */
export function calcularProgressoAtividade(
  datas: string[],
  nivel: NivelAtividade,
  baselineISO: string,
): ProgressoAtividade {
  const regra = REGRAS_ATIVIDADE[nivel] ?? REGRAS_ATIVIDADE.Sedentario;

  // marcações por semana
  const contagem = new Map<string, number>();
  for (const iso of datas) {
    const wk = inicioSemanaISO(new Date(`${iso}T12:00:00`));
    contagem.set(wk, (contagem.get(wk) ?? 0) + 1);
  }

  const semanaAtual = inicioSemanaISO(new Date());
  const vezesNaSemana = contagem.get(semanaAtual) ?? 0;

  // Enumera as semanas do baseline até a semana atual (inclui as vazias, para detectar quebras).
  const baseSemana = inicioSemanaISO(new Date(baselineISO));
  const semanas: number[] = [];
  const cursor = new Date(`${baseSemana}T12:00:00`);
  for (let i = 0; i < 520; i++) {
    const key = inicioSemanaISO(cursor);
    semanas.push(contagem.get(key) ?? 0);
    if (key === semanaAtual) break;
    cursor.setDate(cursor.getDate() + 7);
  }

  // Sequência consecutiva de semanas COMPLETAS qualificadas (exclui a semana atual, que está em curso),
  // + 1 se a semana atual já bateu o mínimo.
  const completas = semanas.slice(0, -1);
  let seq = 0;
  for (let i = completas.length - 1; i >= 0; i--) {
    if (completas[i] >= regra.vezesSemana) seq++;
    else break;
  }
  if (vezesNaSemana >= regra.vezesSemana) seq++;

  const semanasConcluidas = Math.min(seq, regra.semanas);
  const elegivel = !!regra.proximo && regra.semanas > 0 && seq >= regra.semanas;

  return {
    nivel,
    proximo: regra.proximo,
    vezesSemana: regra.vezesSemana,
    semanasRequeridas: regra.semanas,
    semanasConcluidas,
    vezesNaSemana,
    elegivel,
    pctPrincipal: regra.semanas > 0 ? (semanasConcluidas / regra.semanas) * 100 : 100,
    pctSemana: Math.min(100, (vezesNaSemana / regra.vezesSemana) * 100),
  };
}
