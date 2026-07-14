import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { calcularProgressoAtividade, type ProgressoAtividade } from '../lib/atividade';
import { hojeISO } from '../lib/dates';
import type { NivelAtividade, RegistroAtividade } from '../types';

export function useAtividadeMarcas(userId: string | undefined) {
  return useQuery<RegistroAtividade[]>({
    queryKey: ['atividade', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades_fisicas')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RegistroAtividade[];
    },
  });
}

export interface AtividadeInfo {
  marcas: RegistroAtividade[];
  marcadoHoje: boolean;
  progresso: ProgressoAtividade | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  /** marca/desmarca a atividade de hoje */
  toggleHoje: () => void;
  alternando: boolean;
  /** erro ao marcar (ex.: tabela atividades_fisicas ausente no banco) */
  erroMarcar: string | null;
}

/** Reúne marcações + progresso de nível para o usuário atual. */
export function useAtividade(): AtividadeInfo {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const { data: marcas, isLoading, isError, refetch } = useAtividadeMarcas(profile?.id);

  const hoje = hojeISO();
  const marcadoHoje = (marcas ?? []).some((m) => m.data === hoje);

  const baseline = profile?.nivel_atualizado_em ?? profile?.data_criacao ?? '2000-01-01';
  const nivel: NivelAtividade = profile?.nivel_atividade ?? 'Sedentario';
  const progresso = profile
    ? calcularProgressoAtividade((marcas ?? []).map((m) => m.data), nivel, baseline)
    : null;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (marcadoHoje) {
        const { error } = await supabase
          .from('atividades_fisicas')
          .delete()
          .eq('usuario_id', profile.id)
          .eq('data', hoje);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('atividades_fisicas')
          .insert({ usuario_id: profile.id, data: hoje });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atividade'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    marcas: marcas ?? [],
    marcadoHoje,
    progresso,
    isLoading,
    isError,
    refetch,
    toggleHoje: () => toggle.mutate(),
    alternando: toggle.isPending,
    erroMarcar: toggle.isError
      ? 'Não foi possível salvar a atividade. Verifique se a tabela "atividades_fisicas" existe no banco (rode o SQL de setup).'
      : null,
  };
}

/**
 * Sobe o nível automaticamente quando o requisito é atingido, reiniciando o
 * baseline (nivel_atualizado_em). Use uma única vez por tela ativa.
 */
export function useAutoSubirNivel(progresso: ProgressoAtividade | null) {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const subindo = useRef(false);

  const elegivel = progresso?.elegivel ?? false;
  const proximo = progresso?.proximo ?? null;

  useEffect(() => {
    if (!elegivel || !proximo || !profile || subindo.current) return;
    subindo.current = true;
    updateProfile({
      nivel_atividade: proximo,
      nivel_atualizado_em: new Date().toISOString(),
    })
      .catch(() => {})
      .finally(() => {
        subindo.current = false;
      });
  }, [elegivel, proximo, profile, updateProfile]);
}
