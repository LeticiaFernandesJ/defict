import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RegistroPeso } from '../types';

export function usePesos(userId: string | undefined) {
  return useQuery<RegistroPeso[]>({
    queryKey: ['peso', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_peso')
        .select('*')
        .order('data', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RegistroPeso[];
    },
  });
}

export interface NovoPeso {
  data: string; // ISO
  peso: number;
  observacao?: string | null;
}

export function usePesoMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['peso'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const criar = useMutation({
    mutationFn: async (p: NovoPeso) => {
      const { error } = await supabase.from('registros_peso').insert({
        usuario_id: userId,
        data: p.data,
        peso: p.peso,
        observacao: p.observacao ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...p }: NovoPeso & { id: number }) => {
      const { error } = await supabase
        .from('registros_peso')
        .update({ data: p.data, peso: p.peso, observacao: p.observacao ?? null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('registros_peso').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { criar, atualizar, excluir };
}
