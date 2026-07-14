import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    'Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em frontend/.env',
  );
}

const TOKEN_KEY = 'deficit_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Autenticação PRÓPRIA: não usamos o Supabase Auth. O supabase-js envia o nosso
// JWT (emitido pela Edge Function `auth`) em cada requisição via `accessToken`,
// e a RLS do Postgres continua valendo (auth.uid() lê o claim `sub`).
export const supabase = createClient(url, key, {
  accessToken: async () => getToken(),
});
