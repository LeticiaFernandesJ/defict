import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { treino, type GerarTreinoInput } from '../lib/treino';
import type { PlanoTreino } from '../types';

export function usePlanoTreino(userId: string | undefined) {
  return useQuery<PlanoTreino | null>({
    queryKey: ['plano-treino', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos_treino')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as PlanoTreino) ?? null;
    },
  });
}

export function usePlanoTreinoMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['plano-treino'] });

  // Gera via Edge Function (Gemini), desativa planos anteriores e salva o novo.
  const gerar = useMutation({
    mutationFn: async (input: GerarTreinoInput) => {
      const { plano } = await treino.gerar(input);
      const dias = plano?.dias ?? [];
      if (!dias.length) throw new Error('A IA não retornou um plano válido.');

      // desativa planos ativos anteriores
      await supabase.from('planos_treino').update({ ativo: false }).eq('usuario_id', userId).eq('ativo', true);

      const { error } = await supabase.from('planos_treino').insert({
        usuario_id: userId,
        objetivo: input.objetivo,
        dias_por_semana: input.dias.length,
        equipamento: input.equipamento,
        restricoes: input.restricoes || null,
        ativo: true,
        dias,
      });
      // supabase devolve um objeto (não Error) — embrulha para a UI mostrar a mensagem real
      if (error) throw new Error(`Falha ao salvar o treino: ${error.message}`);
    },
    onSuccess: invalidate,
  });

  const desativar = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('planos_treino').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { gerar, desativar };
}
