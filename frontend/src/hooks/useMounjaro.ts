import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { NivelToleranciaSintoma, RegistroMounjaro } from '../types';

export function useMounjaro(userId: string | undefined) {
  return useQuery<RegistroMounjaro[]>({
    queryKey: ['mounjaro', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_mounjaro')
        .select('*')
        .order('data_aplicacao', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RegistroMounjaro[];
    },
  });
}

export interface NovaAplicacao {
  data_aplicacao: string;
  dose_mg: number;
  local_aplicacao: string;
  sintomas?: string | null;
  nivel_tolerancia_sintoma: NivelToleranciaSintoma;
  observacao?: string | null;
}

export function useMounjaroMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mounjaro'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const criar = useMutation({
    mutationFn: async (a: NovaAplicacao) => {
      const { error } = await supabase
        .from('registros_mounjaro')
        .insert({ usuario_id: userId, ...a });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...a }: NovaAplicacao & { id: number }) => {
      const { error } = await supabase.from('registros_mounjaro').update(a).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('registros_mounjaro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { criar, atualizar, excluir };
}
