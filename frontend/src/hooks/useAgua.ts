import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RegistroAgua } from '../types';

export function useAgua(userId: string | undefined, dataISO: string) {
  return useQuery<RegistroAgua | null>({
    queryKey: ['agua', userId, dataISO],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_agua')
        .select('*')
        .eq('data', dataISO)
        .maybeSingle();
      if (error) throw error;
      return (data as RegistroAgua) ?? null;
    },
  });
}

/** Histórico dos últimos N dias (para mini-gráfico). */
export function useAguaHistorico(userId: string | undefined, dias = 7) {
  return useQuery<RegistroAgua[]>({
    queryKey: ['agua-historico', userId, dias],
    enabled: !!userId,
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - (dias - 1));
      const { data, error } = await supabase
        .from('registros_agua')
        .select('*')
        .gte('data', desde.toISOString().slice(0, 10))
        .order('data', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RegistroAgua[];
    },
  });
}

export function useAguaMutations(userId: string | undefined, dataISO: string) {
  const qc = useQueryClient();

  /** Soma `ml` ao total do dia (upsert por (usuario_id, data)). */
  const adicionar = useMutation({
    mutationFn: async (ml: number) => {
      const { data: atual } = await supabase
        .from('registros_agua')
        .select('quantidade_ml')
        .eq('data', dataISO)
        .maybeSingle();
      const nova = Math.max(0, (atual?.quantidade_ml ?? 0) + ml);
      const { error } = await supabase.from('registros_agua').upsert(
        {
          usuario_id: userId,
          data: dataISO,
          quantidade_ml: nova,
          ultima_atualizacao: new Date().toISOString(),
        },
        { onConflict: 'usuario_id,data' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agua'] });
      qc.invalidateQueries({ queryKey: ['agua-historico'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { adicionar };
}
