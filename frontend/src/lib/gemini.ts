import { supabase } from './supabase';

// O cliente NUNCA fala com o Gemini diretamente — chama a Edge Function `gemini`,
// que valida o usuário e usa a chave secreta do servidor.
async function invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('gemini', {
    body: { action, ...payload },
  });
  if (error) {
    // extrai a mensagem real do corpo da resposta (ex.: cota excedida)
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
  return data as T;
}

export const gemini = {
  chat: (mensagem: string, contexto?: string) =>
    invoke<{ resposta: string }>('chat', { mensagem, contexto }),

  analisarDia: (resumo: unknown) =>
    invoke<{ analise: string }>('analisar-dia', { resumo }),

  cardapio: (preferencias: string, restricoes: string, metaCalorica: number, refeicoes: string[]) =>
    invoke<{ cardapio: unknown }>('cardapio', { preferencias, restricoes, metaCalorica, refeicoes }),

  nutrientes: (alimento: string, quantidade: number, unidade: string) =>
    invoke<{ nutrientes: {
      calorias: number; proteinas: number; carboidratos: number;
      gorduras: number; fibras: number;
    } }>('nutrientes', { alimento, quantidade, unidade }),
};
