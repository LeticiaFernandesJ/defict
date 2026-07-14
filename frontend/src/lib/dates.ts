import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** yyyy-mm-dd no fuso local (para colunas DateOnly e navegação de dias). */
export function toISODate(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function hojeISO(): string {
  return toISODate(new Date());
}

/** Soma dias a uma data ISO (yyyy-mm-dd) e devolve ISO. */
export function addDiasISO(iso: string, dias: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + dias);
  return toISODate(d);
}

/** 'dd/MM/yyyy' */
export function fmtData(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

/** 'dd/MM' */
export function fmtDiaMes(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'dd/MM', { locale: ptBR });
}

/** 'EEEE, dd 'de' MMMM' — ex.: "sexta-feira, 03 de julho" */
export function fmtDataLonga(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

/** Número em pt-BR com N casas (vírgula decimal). */
export function fmtNum(n: number | null | undefined, casas = 0): string {
  if (n == null || Number.isNaN(n)) return '0';
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}
