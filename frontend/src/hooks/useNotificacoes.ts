import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ConfiguracaoNotificacao, NotificacaoTipo } from '../types';

export function useNotificacoes(userId: string | undefined) {
  return useQuery<ConfiguracaoNotificacao[]>({
    queryKey: ['notificacoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_notificacao')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ConfiguracaoNotificacao[];
    },
  });
}

export function useNotificacaoMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notificacoes'] });

  const criar = useMutation({
    mutationFn: async (n: {
      tipo: NotificacaoTipo;
      horario_gatilho: string;
      ativo: boolean;
    }) => {
      const { error } = await supabase
        .from('configuracoes_notificacao')
        .insert({ usuario_id: userId, ...n });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const atualizar = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: number } & Partial<Pick<ConfiguracaoNotificacao, 'horario_gatilho' | 'ativo'>>) => {
      const { error } = await supabase
        .from('configuracoes_notificacao')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('configuracoes_notificacao')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { criar, atualizar, excluir };
}
