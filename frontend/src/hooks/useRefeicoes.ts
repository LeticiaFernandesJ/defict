import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ItemRefeicao, Refeicao, TipoRefeicao } from '../types';

export interface RefeicaoComItens extends Refeicao {
  itens: ItemRefeicao[];
}

export function useRefeicoes(userId: string | undefined, dataISO: string) {
  return useQuery<RefeicaoComItens[]>({
    queryKey: ['refeicoes', userId, dataISO],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refeicoes')
        .select('*, itens:itens_refeicao(*)')
        .gte('data', `${dataISO}T00:00:00`)
        .lte('data', `${dataISO}T23:59:59`)
        .order('data', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RefeicaoComItens[];
    },
  });
}

export type NovoItem = Omit<ItemRefeicao, 'id' | 'refeicao_id'>;

export function useRefeicaoMutations(userId: string | undefined, dataISO: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['refeicoes', userId] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const criarRefeicao = useMutation({
    mutationFn: async (tipo: TipoRefeicao) => {
      const { data, error } = await supabase
        .from('refeicoes')
        .insert({
          usuario_id: userId,
          tipo_refeicao: tipo,
          data: new Date(`${dataISO}T12:00:00`).toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as Refeicao;
    },
    onSuccess: invalidate,
  });

  const excluirRefeicao = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('refeicoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const atualizarObservacao = useMutation({
    mutationFn: async ({ id, observacao }: { id: number; observacao: string }) => {
      const { error } = await supabase
        .from('refeicoes')
        .update({ observacao })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const adicionarItem = useMutation({
    mutationFn: async ({ refeicaoId, item }: { refeicaoId: number; item: NovoItem }) => {
      const { error } = await supabase
        .from('itens_refeicao')
        .insert({ refeicao_id: refeicaoId, ...item });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const atualizarItem = useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Partial<NovoItem> }) => {
      const { error } = await supabase.from('itens_refeicao').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const excluirItem = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('itens_refeicao').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    criarRefeicao,
    excluirRefeicao,
    atualizarObservacao,
    adicionarItem,
    atualizarItem,
    excluirItem,
  };
}

/** Soma os macros de uma lista de itens. */
export function somarItens(itens: ItemRefeicao[]) {
  return itens.reduce(
    (acc, it) => ({
      calorias: acc.calorias + (Number(it.calorias) || 0),
      proteinas: acc.proteinas + (Number(it.proteinas) || 0),
      carboidratos: acc.carboidratos + (Number(it.carboidratos) || 0),
      gorduras: acc.gorduras + (Number(it.gorduras) || 0),
      fibras: acc.fibras + (Number(it.fibras) || 0),
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 },
  );
}
