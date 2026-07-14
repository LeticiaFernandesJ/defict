import { supabase } from './supabase';
import type { PlanoTreinoDias } from '../types';

export interface GerarTreinoInput {
  objetivo: string;
  dias: string[]; // dias da semana escolhidos (ex.: ['Terça','Quinta','Sábado'])
  equipamento: string;
  restricoes: string;
  nivelAtividade: string;
}

// O cliente NUNCA fala com a IA diretamente — chama a Edge Function `treino`,
// que valida o usuário e usa a chave secreta do servidor.
export const treino = {
  gerar: async (p: GerarTreinoInput) => {
    const { data, error } = await supabase.functions.invoke('treino', { body: p });
    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          const b = await ctx.json();
          if (b?.error) msg = b.error;
        }
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as { plano: { dias?: PlanoTreinoDias } | null };
  },
};
