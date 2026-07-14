import type { NivelAtividade, Profile, Sexo } from '../types';

// Regras de negócio reproduzidas EXATAMENTE do serviço de cálculo original.
// Onde há peculiaridade preservada, está sinalizada em comentário.

export const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  Sedentario: 1.2,
  Leve: 1.375,
  Moderado: 1.55,
  Intenso: 1.725,
  MuitoIntenso: 1.9,
};

/** IMC = peso / alturaM². Arredonda a 1 casa. Se altura <= 0, retorna 0. */
export function calcularImc(pesoKg: number, alturaCm: number): number {
  if (alturaCm <= 0) return 0;
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);
  return Math.round(imc * 10) / 10;
}

/** Classificação do IMC em pt-BR (faixas da OMS). */
export function classificarImc(imc: number): string {
  if (imc <= 0) return '—';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/** Idade = anoAtual − anoDeNascimento (mesma conta simples do original). */
export function calcularIdade(dataNascimento: string): number {
  const ano = new Date(dataNascimento).getFullYear();
  return new Date().getFullYear() - ano;
}

/** TMB pura (Mifflin-St Jeor), sem fator de atividade. */
export function calcularTmbBase(
  sexo: Sexo,
  pesoKg: number,
  alturaCm: number,
  idade: number,
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  return sexo === 'Masculino' ? base + 5 : base - 161;
}

export interface ResultadoCalculo {
  imc: number;
  /**
   * PECULIARIDADE PRESERVADA: no original, o valor retornado como "TMB" já é
   * TMB × fator de atividade (arredondado a 0 casas), e o TDEE é retornado IGUAL
   * a esse valor. Mantemos o comportamento; `tmbPura` fica exposta à parte para
   * quem quiser a semântica correta.
   */
  tmb: number;
  tdee: number;
  tmbPura: number;
  metaCalorica: number;
}

/**
 * Calcula IMC, TMB(×fator)/TDEE e meta calórica (déficit) a partir do perfil.
 * Exige peso_inicial, altura, data_nascimento e nivel_atividade — caso contrário,
 * lança "Dados insuficientes para cálculo."
 */
export function calcularResumo(
  profile: Pick<
    Profile,
    | 'sexo'
    | 'peso_inicial'
    | 'altura'
    | 'data_nascimento'
    | 'nivel_atividade'
    | 'meta_calorica_manual'
  >,
  pesoAtual?: number | null,
): ResultadoCalculo {
  const { sexo, altura, data_nascimento, nivel_atividade } = profile;
  const peso = pesoAtual ?? profile.peso_inicial;

  if (
    peso == null ||
    altura == null ||
    data_nascimento == null ||
    nivel_atividade == null ||
    sexo == null
  ) {
    throw new Error('Dados insuficientes para cálculo.');
  }

  const idade = calcularIdade(data_nascimento);
  const imc = calcularImc(peso, altura);
  const tmbPura = calcularTmbBase(sexo, peso, altura, idade);

  const fator = FATOR_ATIVIDADE[nivel_atividade] ?? 1.2;
  const tmbComFator = Math.round(tmbPura * fator);

  // Original: Tdee === TMB(×fator).
  const tdee = tmbComFator;

  // Meta = max(1200, tdee − 500); meta manual sobrepõe o cálculo.
  const metaCalorica =
    profile.meta_calorica_manual ?? Math.max(1200, tdee - 500);

  return {
    imc,
    tmb: tmbComFator,
    tdee,
    tmbPura,
    metaCalorica,
  };
}
