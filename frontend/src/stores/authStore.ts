import { create } from 'zustand';
import { supabase, getToken, setToken } from '../lib/supabase';
import { decodeJwt, tokenExpirado } from '../lib/jwt';
import { authApi, type RegisterInput } from '../lib/authClient';
import type { Profile } from '../types';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  authenticated: boolean;
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean; // true até a sessão inicial ser hidratada
  /** Hidrata a sessão a partir do token salvo. Retorna cleanup (no-op). */
  init: () => () => void;
  login: (email: string, senha: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  /** Aplica um novo token (ex.: após trocar e-mail) e atualiza o usuário. */
  applyToken: (token: string) => void;
  loadProfile: () => Promise<void>;
  setProfile: (p: Profile | null) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authenticated: false,
  user: null,
  profile: null,
  loading: true,

  init: () => {
    const token = getToken();
    if (token && !tokenExpirado(token)) {
      const c = decodeJwt(token);
      set({ authenticated: true, user: c ? { id: c.sub, email: c.email ?? '' } : null });
      get()
        .loadProfile()
        .finally(() => set({ loading: false }));
    } else {
      setToken(null);
      set({ authenticated: false, user: null, loading: false });
    }
    return () => {};
  },

  login: async (email, senha) => {
    const { token, user } = await authApi.login(email, senha);
    setToken(token);
    set({ authenticated: true, user });
    await get().loadProfile();
  },

  register: async (input) => {
    const { token, user, profile } = await authApi.register(input);
    setToken(token);
    set({ authenticated: true, user, profile });
  },

  applyToken: (token) => {
    setToken(token);
    const c = decodeJwt(token);
    if (c) set({ authenticated: true, user: { id: c.sub, email: c.email ?? '' } });
  },

  loadProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null });
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Falha ao carregar perfil:', error.message);
      return;
    }
    set({ profile: (data as Profile) ?? null });
  },

  setProfile: (p) => set({ profile: p }),

  updateProfile: async (patch) => {
    const user = get().user;
    if (!user) throw new Error('Não autenticado');
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .single();
    if (error) throw error;
    set({ profile: data as Profile });
  },

  signOut: async () => {
    setToken(null);
    set({ authenticated: false, user: null, profile: null });
  },
}));
