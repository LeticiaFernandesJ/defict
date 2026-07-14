import { supabase } from './supabase';
import type { Profile } from '../types';

export interface RegisterInput {
  email: string;
  senha: string;
  nome: string;
  sexo: string;
  dataNascimento: string;
  altura: number;
  nivelAtividade: string;
  pesoInicial: number;
  pesoMeta: number;
  metaAgua: number;
  usaMounjaro: boolean;
  metaCaloricaManual: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

async function invoke<T>(action: string, extra: object = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('auth', {
    body: { action, ...extra },
  });
  // A função devolve { error } com status !=2xx; supabase-js expõe em `error`.
  if (error) {
    // tenta extrair a mensagem do corpo
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

export const authApi = {
  register: (input: RegisterInput) =>
    invoke<{ token: string; user: AuthUser; profile: Profile }>('register', input),

  login: (email: string, senha: string) =>
    invoke<{ token: string; user: AuthUser }>('login', { email, senha }),

  changePassword: (senha: string) => invoke<{ ok: true }>('change-password', { senha }),

  changeEmail: (email: string) =>
    invoke<{ ok: true; token: string; user: AuthUser }>('change-email', { email }),

  deleteAccount: () => invoke<{ ok: true }>('delete', {}),
};
