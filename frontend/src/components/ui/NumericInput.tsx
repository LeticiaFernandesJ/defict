import { useEffect, useState } from 'react';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number | '';
  onValueChange: (v: number | '') => void;
  /** casas decimais aceitas (0 = inteiro). */
  casasDecimais?: number;
};

function formatar(n: number, casasDecimais: number, agrupado: boolean) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
    useGrouping: agrupado,
  });
}

/** Só dígitos + no máx. 1 vírgula, com até `casasDecimais` dígitos depois dela. */
function sanitizar(texto: string, casasDecimais: number) {
  let s = texto.replace(/[^\d,]/g, '');
  const partes = s.split(',');
  if (partes.length > 2) s = partes[0] + ',' + partes.slice(1).join('');
  if (casasDecimais === 0) {
    s = s.replace(/,/g, '');
  } else {
    const [inteiro, decimal] = s.split(',');
    if (decimal !== undefined) s = `${inteiro},${decimal.slice(0, casasDecimais)}`;
  }
  return s;
}

function paraNumero(texto: string): number | '' {
  if (texto.trim() === '' || texto === ',') return '';
  const n = Number(texto.replace(',', '.'));
  return Number.isNaN(n) ? '' : n;
}

/** Input numérico com máscara pt-BR (vírgula decimal, agrupamento de milhar ao sair do campo). */
export function NumericInput({ value, onValueChange, casasDecimais = 0, className = 'input-field', ...rest }: Props) {
  const [texto, setTexto] = useState(() => (value === '' ? '' : formatar(value, casasDecimais, true)));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (focado) return;
    setTexto(value === '' ? '' : formatar(value, casasDecimais, true));
  }, [value, focado, casasDecimais]);

  return (
    <input
      type="text"
      inputMode={casasDecimais > 0 ? 'decimal' : 'numeric'}
      className={className}
      value={texto}
      onFocus={(e) => {
        setFocado(true);
        setTexto(value === '' ? '' : formatar(value, casasDecimais, false));
        requestAnimationFrame(() => e.currentTarget.select());
      }}
      onChange={(e) => {
        const limpo = sanitizar(e.target.value, casasDecimais);
        setTexto(limpo);
        onValueChange(paraNumero(limpo));
      }}
      onBlur={(e) => {
        setFocado(false);
        rest.onBlur?.(e);
      }}
      {...rest}
    />
  );
}
