// Domínio do Déficit. Nomes de campos em português, como no modelo original.
// Enums serializados como STRING (nunca número).

export type Sexo = 'Masculino' | 'Feminino';

export type NivelAtividade =
  | 'Sedentario'
  | 'Leve'
  | 'Moderado'
  | 'Intenso'
  | 'MuitoIntenso';

export type TipoRefeicao =
  | 'CafeDaManha'
  | 'LancheManha'
  | 'Almoco'
  | 'LancheTarde'
  | 'Jantar'
  | 'Ceia';

export type NivelToleranciaSintoma = 'Nenhum' | 'Leve' | 'Moderado' | 'Intenso';

export type NotificacaoTipo =
  | 'RefeicaoNaoRegistrada'
  | 'RefeicaoMetaProxima'
  | 'RefeicaoMetaUltrapassada'
  | 'AguaNaoRegistrada'
  | 'AguaMetaNaoAtingida'
  | 'AtividadeNaoRegistrada'
  | 'MounjaroProximaDose'
  | 'MounjaroDiaDaDose';

// Perfil = tabela pública `profiles` (1:1 com auth.users por id uuid).
// Substitui a entidade Usuario (sem SenhaHash / RefreshToken — geridos pelo Supabase Auth).
export interface Profile {
  id: string; // uuid = auth.users.id
  nome: string;
  sexo: Sexo | null;
  data_nascimento: string | null; // ISO date (yyyy-mm-dd)
  altura: number | null; // cm
  peso_inicial: number | null; // kg
  peso_meta: number | null; // kg
  nivel_atividade: NivelAtividade | null;
  usa_mounjaro: boolean;
  meta_agua: number; // ml, default 2000
  meta_calorica_manual: number | null; // sobrepõe o cálculo automático
  onboarding_concluido: boolean;
  data_criacao: string; // timestamptz
  nivel_atualizado_em?: string | null; // baseline da progressão de atividade
}

export interface RegistroAtividade {
  id: number;
  usuario_id: string;
  data: string; // yyyy-mm-dd — 1 por dia
  criado_em: string;
}

export interface ExercicioTreino {
  nome: string;
  series: number;
  repeticoes: string;
  descanso: string;
  observacao: string;
}
export interface DiaTreino {
  diaSemana: string;
  titulo: string;
  foco: string;
  exercicios: ExercicioTreino[];
}
export type PlanoTreinoDias = DiaTreino[];

export interface PlanoTreino {
  id: number;
  usuario_id: string;
  criado_em: string;
  objetivo: string | null;
  dias_por_semana: number | null;
  equipamento: string | null;
  restricoes: string | null;
  ativo: boolean;
  dias: PlanoTreinoDias;
}

export interface CardapioSalvo {
  id: number;
  usuario_id: string;
  criado_em: string;
  inicio_semana: string | null;
  preferencias: string | null;
  restricoes: string | null;
  meta_calorica: number | null;
  dias: unknown[];
}

export interface RegistroPeso {
  id: number;
  usuario_id: string;
  data: string; // timestamptz
  peso: number;
  observacao: string | null;
}

export interface Refeicao {
  id: number;
  usuario_id: string;
  data: string; // timestamptz
  tipo_refeicao: TipoRefeicao;
  observacao: string | null;
  itens?: ItemRefeicao[];
}

export interface ItemRefeicao {
  id: number;
  refeicao_id: number;
  nome_alimento: string;
  quantidade: number;
  unidade: string; // g, ml, un...
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
}

export interface RegistroAgua {
  id: number;
  usuario_id: string;
  data: string; // DateOnly (yyyy-mm-dd) — 1 registro por usuário/dia
  quantidade_ml: number;
  ultima_atualizacao: string;
}

export interface RegistroMounjaro {
  id: number;
  usuario_id: string;
  data_aplicacao: string;
  dose_mg: number;
  local_aplicacao: string;
  sintomas: string | null;
  nivel_tolerancia_sintoma: NivelToleranciaSintoma;
  observacao: string | null;
}

// Rótulos amigáveis (pt-BR) para exibição.
export const LABEL_NIVEL_ATIVIDADE: Record<NivelAtividade, string> = {
  Sedentario: 'Sedentário',
  Leve: 'Leve',
  Moderado: 'Moderado',
  Intenso: 'Intenso',
  MuitoIntenso: 'Muito intenso',
};

export const LABEL_TIPO_REFEICAO: Record<TipoRefeicao, string> = {
  CafeDaManha: 'Café da manhã',
  LancheManha: 'Lanche da manhã',
  Almoco: 'Almoço',
  LancheTarde: 'Lanche da tarde',
  Jantar: 'Jantar',
  Ceia: 'Ceia',
};

export const TIPOS_REFEICAO: TipoRefeicao[] = [
  'CafeDaManha',
  'LancheManha',
  'Almoco',
  'LancheTarde',
  'Jantar',
  'Ceia',
];

export const NIVEIS_ATIVIDADE: NivelAtividade[] = [
  'Sedentario',
  'Leve',
  'Moderado',
  'Intenso',
  'MuitoIntenso',
];

export const LABEL_TOLERANCIA: Record<NivelToleranciaSintoma, string> = {
  Nenhum: 'Nenhum',
  Leve: 'Leve',
  Moderado: 'Moderado',
  Intenso: 'Intenso',
};

export const NIVEIS_TOLERANCIA: NivelToleranciaSintoma[] = [
  'Nenhum',
  'Leve',
  'Moderado',
  'Intenso',
];

export const LOCAIS_APLICACAO = [
  'Abdômen',
  'Coxa esquerda',
  'Coxa direita',
  'Braço esquerdo',
  'Braço direito',
] as const;

export const LABEL_NOTIFICACAO: Record<NotificacaoTipo, string> = {
  RefeicaoNaoRegistrada: 'Refeição não registrada',
  RefeicaoMetaProxima: 'Perto da meta calórica',
  RefeicaoMetaUltrapassada: 'Meta calórica ultrapassada',
  AguaNaoRegistrada: 'Água não registrada',
  AguaMetaNaoAtingida: 'Meta de água não atingida',
  AtividadeNaoRegistrada: 'Treino do dia não marcado',
  MounjaroProximaDose: 'Próxima dose de Mounjaro',
  MounjaroDiaDaDose: 'Dia da dose de Mounjaro',
};

export const TIPOS_NOTIFICACAO: NotificacaoTipo[] = [
  'RefeicaoNaoRegistrada',
  'RefeicaoMetaProxima',
  'RefeicaoMetaUltrapassada',
  'AguaNaoRegistrada',
  'AguaMetaNaoAtingida',
  'AtividadeNaoRegistrada',
  'MounjaroProximaDose',
  'MounjaroDiaDaDose',
];

export interface ConfiguracaoNotificacao {
  id: number;
  usuario_id: string;
  tipo: NotificacaoTipo;
  horario_gatilho: string; // 'HH:mm:ss'
  ativo: boolean;
  ultimo_disparo: string | null;
}
