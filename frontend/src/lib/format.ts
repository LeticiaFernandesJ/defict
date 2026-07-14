/** Iniciais (2 primeiras letras) do nome para o avatar. */
export function iniciais(nome: string | undefined | null): string {
  if (!nome) return '··';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function primeiroNome(nome: string | undefined | null): string {
  if (!nome) return '';
  return nome.trim().split(/\s+/)[0];
}
