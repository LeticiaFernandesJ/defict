interface ToggleProps {
  ativo: boolean;
  onChange: (v: boolean) => void;
  /** cor quando ativo (default = verde, como os lembretes da referência) */
  cor?: string;
}

export function Toggle({ ativo, onChange, cor = 'var(--cor-verde)' }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={ativo}
      onClick={() => onChange(!ativo)}
      className="relative inline-block h-[25px] w-[44px] flex-none rounded-[14px] align-middle transition-colors"
      style={{ background: ativo ? cor : '#D8CFC0' }}
    >
      <span
        className="absolute top-[3px] h-[19px] w-[19px] rounded-full bg-white transition-all"
        style={{ left: ativo ? undefined : '3px', right: ativo ? '3px' : undefined }}
      />
    </button>
  );
}
