import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-outline';
  return (
    <button
      className={`${base} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Carregando…' : children}
    </button>
  );
}
