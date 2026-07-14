// Verificação do JWT próprio (HS256, assinado com JWT_SECRET) nas Edge Functions.
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? '';

let cryptoKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (!cryptoKey) {
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  }
  return cryptoKey;
}

/** Retorna o id do usuário (sub) se o token do request for válido; senão null. */
export async function usuarioDoRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = await verify(token, await getKey());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}
