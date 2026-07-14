import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { anoSemanaISO } from '../lib/treinoUtils';
import { hojeISO } from '../lib/dates';

/** Dias (dia_semana) concluídos na semana ISO atual, para um plano. */
export function useTreinoConclusoes(userId: string | undefined, planoId: number | undefined) {
  const semana = anoSemanaISO();
  return useQuery<string[]>({
    queryKey: ['treino-conclusoes', userId, planoId, semana],
    enabled: !!userId && !!planoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treino_conclusoes')
        .select('dia_semana')
        .eq('plano_id', planoId!)
        .eq('ano_semana', semana);
      if (error) throw error;
      return (data ?? []).map((r) => r.dia_semana as string);
    },
  });
}

export function useTreinoConclusaoMutations(userId: string | undefined, planoId: number | undefined) {
  const qc = useQueryClient();

  const concluir = useMutation({
    mutationFn: async (diaSemana: string) => {
      if (!userId || !planoId) return;
      const ano_semana = anoSemanaISO();
      // trava o dia na semana atual
      const { error } = await supabase.from('treino_conclusoes').upsert(
        { usuario_id: userId, plano_id: planoId, dia_semana: diaSemana, ano_semana },
        { onConflict: 'usuario_id,plano_id,dia_semana,ano_semana' },
      );
      if (error) throw new Error(error.message);
      // alimenta o streak/progressão (1 marcação por dia)
      await supabase
        .from('atividades_fisicas')
        .upsert({ usuario_id: userId, data: hojeISO() }, { onConflict: 'usuario_id,data' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treino-conclusoes'] });
      qc.invalidateQueries({ queryKey: ['atividade'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { concluir };
}
