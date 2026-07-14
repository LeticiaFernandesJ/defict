interface ProgressBarProps {
  value: number;
  max: number;
  /** cor da barra quando ultrapassa a meta */
  overColor?: string;
  className?: string;
}

export function ProgressBar({ value, max, overColor, className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className={`progress-track ${className}`}>
      <div
        className="progress-fill"
        style={{
          width: `${pct}%`,
          backgroundColor: over ? overColor ?? 'var(--cor-vermelho)' : undefined,
        }}
      />
    </div>
  );
}
