import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { gemini } from '../lib/gemini';
import { addDiasISO } from '../lib/dates';
import { TIPOS_REFEICAO, type CardapioSalvo, type TipoRefeicao } from '../types';

export interface CardItem {
  nomeAlimento?: string;
  quantidade?: number;
  unidade?: string;
  calorias?: number;
  proteinas?: number;
  carboidratos?: number;
  gorduras?: number;
  fibras?: number;
}
export interface CardRef {
  tipo?: string;
  descricao?: string;
  itens?: CardItem[];
}
export interface CardDia {
  nomeDia?: string;
  diaSemanaIndex?: number;
  refeicoes?: CardRef[];
  totalCalorias?: number;
}

export function mapTipo(tipo: string | undefined, indice: number): TipoRefeicao {
  const t = (tipo ?? '').toLowerCase();
  // lanches primeiro (contêm "manhã"/"tarde" e não podem cair no café)
  if (t.includes('lanche') && t.includes('tarde')) return 'LancheTarde';
  if (t.includes('lanche') && t.includes('manhã')) return 'LancheManha';
  if (t.includes('lanche')) return 'LancheManha';
  if (t.includes('café') || t.includes('cafe') || t.includes('manhã')) return 'CafeDaManha';
  if (t.includes('almoço') || t.includes('almoco')) return 'Almoco';
  if (t.includes('jantar')) return 'Jantar';
  if (t.includes('ceia')) return 'Ceia';
  if (t.includes('tarde')) return 'LancheTarde';
  return TIPOS_REFEICAO[Math.min(indice, TIPOS_REFEICAO.length - 1)];
}

export function useCardapios(userId: string | undefined) {
  return useQuery<CardapioSalvo[]>({
    queryKey: ['cardapios', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cardapios')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CardapioSalvo[];
    },
  });
}

export function useCardapioMutations(userId: string | undefined) {
  const qc = useQueryClient();

  const salvar = useMutation({
    mutationFn: async (c: {
      preferencias: string;
      restricoes: string;
      metaCalorica: number;
      inicioSemana: string;
      dias: CardDia[];
    }) => {
      const { data, error } = await supabase
        .from('cardapios')
        .insert({
          usuario_id: userId,
          preferencias: c.preferencias || null,
          restricoes: c.restricoes || null,
          meta_calorica: c.metaCalorica,
          inicio_semana: c.inicioSemana,
          dias: c.dias,
        })
        .select('*')
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['cardapios'] });
      return data as CardapioSalvo;
    },
  });

  async function inserirDia(dia: CardDia, dataISO: string) {
    for (const [i, ref] of (dia.refeicoes ?? []).entries()) {
      const { data: refCriada, error } = await supabase
        .from('refeicoes')
        .insert({
          usuario_id: userId,
          tipo_refeicao: mapTipo(ref.tipo, i),
          data: new Date(`${dataISO}T12:00:00`).toISOString(),
          observacao: ref.descricao ?? null,
        })
        .select('id')
        .single();
      if (error || !refCriada) continue;
      const itens = (ref.itens ?? []).map((it) => ({
        refeicao_id: refCriada.id,
        nome_alimento: it.nomeAlimento ?? 'Item',
        quantidade: it.quantidade ?? 0,
        unidade: it.unidade ?? 'g',
        calorias: it.calorias ?? 0,
        proteinas: it.proteinas ?? 0,
        carboidratos: it.carboidratos ?? 0,
        gorduras: it.gorduras ?? 0,
        fibras: it.fibras ?? 0,
      }));
      if (itens.length) await supabase.from('itens_refeicao').insert(itens);
    }
  }

  // Importa UMA refeição do cardápio como refeição real do dia, calculando os
  // nutrientes com IA quando o item vier sem eles.
  async function inserirRefeicao(ref: CardRef, dataISO: string) {
    const { data: refCriada, error } = await supabase
      .from('refeicoes')
      .insert({
        usuario_id: userId,
        tipo_refeicao: mapTipo(ref.tipo, 0),
        data: new Date(`${dataISO}T12:00:00`).toISOString(),
        observacao: ref.descricao ?? null,
      })
      .select('id')
      .single();
    if (error || !refCriada) throw new Error(error?.message ?? 'Falha ao criar refeição.');

    const itens = [];
    for (const it of ref.itens ?? []) {
      let nut = {
        calorias: it.calorias ?? 0,
        proteinas: it.proteinas ?? 0,
        carboidratos: it.carboidratos ?? 0,
        gorduras: it.gorduras ?? 0,
        fibras: it.fibras ?? 0,
      };
      if (nut.calorias <= 0 && it.nomeAlimento) {
        try {
          const r = await gemini.nutrientes(it.nomeAlimento, it.quantidade ?? 100, it.unidade ?? 'g');
          nut = r.nutrientes;
        } catch {
          /* mantém zeros se a IA falhar */
        }
      }
      itens.push({
        refeicao_id: refCriada.id,
        nome_alimento: it.nomeAlimento ?? 'Item',
        quantidade: it.quantidade ?? 0,
        unidade: it.unidade ?? 'g',
        ...nut,
      });
    }
    if (itens.length) await supabase.from('itens_refeicao').insert(itens);
  }

  const importarRefeicao = useMutation({
    mutationFn: async ({ ref, dataISO }: { ref: CardRef; dataISO: string }) => {
      await inserirRefeicao(ref, dataISO);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refeicoes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const importarDia = useMutation({
    mutationFn: async ({ dia, dataISO }: { dia: CardDia; dataISO: string }) => {
      await inserirDia(dia, dataISO);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refeicoes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const importarSemana = useMutation({
    mutationFn: async ({ dias, inicioSemana }: { dias: CardDia[]; inicioSemana: string }) => {
      for (const [i, dia] of dias.entries()) {
        const dataISO = addDiasISO(inicioSemana, dia.diaSemanaIndex ?? i);
        await inserirDia(dia, dataISO);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refeicoes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('cardapios').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cardapios'] }),
  });

  return { salvar, importarRefeicao, importarDia, importarSemana, excluir };
}
