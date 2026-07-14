export interface JwtClaims {
  sub: string;
  email?: string;
  exp?: number;
}

/** Lê os claims do JWT (sem verificar assinatura — só para saber quem está logado). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function tokenExpirado(token: string): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return false;
  return claims.exp * 1000 <= Date.now();
}
