import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Check, Timer, X, SkipForward, Lock } from 'lucide-react';
import type { DiaTreino } from '../../types';
import { formatTempo, parseDescanso, sorteiaMotivacao } from '../../lib/treinoUtils';

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const h = () => setReduce(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return reduce;
}

type Estado = 'frente' | 'exercicio' | 'descanso' | 'concluido' | 'travado';

interface Props {
  dia: DiaTreino;
  ehHoje: boolean;
  /** Só o card do dia de hoje fica disponível para iniciar. */
  disponivel: boolean;
  jaConcluido: boolean;
  onConcluir: (diaSemana: string) => Promise<void>;
}

export function CardTreino({ dia, ehHoje, disponivel, jaConcluido, onConcluir }: Props) {
  const reduce = useReducedMotion();
  const exercicios = dia.exercicios ?? [];
  const N = exercicios.length;
  const bloqueado = !disponivel && !jaConcluido; // não é hoje e ainda não concluído
  const [estado, setEstado] = useState<Estado>(jaConcluido ? 'travado' : 'frente');
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState(() => sorteiaMotivacao());
  const [salvando, setSalvando] = useState(false);

  // Sincroniza trava vinda de fora (ex.: concluído em outro dispositivo).
  useEffect(() => {
    if (jaConcluido && estado === 'frente') setEstado('travado');
  }, [jaConcluido, estado]);

  const flipped = estado === 'exercicio' || estado === 'descanso' || estado === 'concluido';
  const atual = exercicios[idx];
  const ultimo = idx >= N - 1;
  const proximo = exercicios[idx + 1];

  const iniciar = () => {
    if (bloqueado) return; // só o card de hoje inicia
    if (estado === 'travado') {
      setMsg(sorteiaMotivacao());
      setEstado('concluido'); // reexibe motivação (sem persistir)
    } else if (estado === 'frente') {
      setEstado('exercicio');
    }
  };

  const concluirDia = async () => {
    setSalvando(true);
    setMsg(sorteiaMotivacao());
    try {
      await onConcluir(dia.diaSemana);
    } catch {
      /* erro tratado no hook; ainda mostra a motivação */
    }
    setSalvando(false);
    setEstado('concluido');
  };

  const avancar = () => {
    setIdx((i) => Math.min(i + 1, N - 1));
    setEstado('exercicio');
  };

  const transicao = reduce ? '' : 'transition-transform duration-500';

  return (
    <div style={{ perspective: '1200px' }} className={ehHoje ? 'rounded-card ring-2 ring-accent' : ''}>
      <div
        className={`relative min-h-[360px] ${transicao}`}
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* ================= FRENTE ================= */}
        <div
          className="card flex min-h-[360px] flex-col"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={iniciar}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && iniciar()}
        >
          {estado === 'travado' ? (
            <FrenteTravada dia={dia} />
          ) : bloqueado ? (
            <FrenteBloqueada dia={dia} />
          ) : (
            <FrenteDia dia={dia} ehHoje={ehHoje} n={N} />
          )}
        </div>

        {/* ================= VERSO ================= */}
        <div
          className="card absolute inset-0 flex min-h-[360px] flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {estado === 'descanso' && atual ? (
            <Cronometro
              segundos={parseDescanso(atual.descanso)}
              proximoNome={proximo?.nome ?? 'Próximo exercício'}
              reduce={reduce}
              onFim={avancar}
            />
          ) : estado === 'concluido' ? (
            <VersoConcluido msg={msg} onFechar={() => setEstado('travado')} />
          ) : (
            atual && (
              <VersoExercicio
                key={idx}
                reduce={reduce}
                idx={idx}
                total={N}
                ex={atual}
                ultimo={ultimo}
                salvando={salvando}
                onDescanso={() => setEstado('descanso')}
                onConcluir={concluirDia}
                onSair={() => setEstado('frente')}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Frente
function FrenteDia({ dia, ehHoje, n }: { dia: DiaTreino; ehHoje: boolean; n: number }) {
  return (
    <>
      <div className="row">
        <span className="mut">{n} exercícios</span>
        {ehHoje && <span className="badge badge-blue">hoje</span>}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Dumbbell className="mb-3 text-accent" size={30} />
        <div className="font-display text-2xl font-semibold text-ink">{dia.diaSemana}</div>
        <div className="mt-1 text-[15px] font-medium text-ink">{dia.titulo}</div>
        {dia.foco && <div className="mut mt-1">{dia.foco}</div>}
      </div>
      <p className="mut text-center !text-[11px]">Toque para começar</p>
    </>
  );
}

function FrenteBloqueada({ dia }: { dia: DiaTreino }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center opacity-70">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5">
        <Lock className="text-textSecondary" size={24} />
      </div>
      <div className="mt-3 font-display text-xl font-semibold text-ink">{dia.diaSemana}</div>
      <div className="mt-1 text-[15px] font-medium text-ink">{dia.titulo}</div>
      <div className="mut mt-2 max-w-[16rem]">Disponível na {dia.diaSemana.toLowerCase()}</div>
    </div>
  );
}

function FrenteTravada({ dia }: { dia: DiaTreino }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-card bg-verde/10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-verde/20">
        <Check className="text-verde" size={28} />
      </div>
      <div className="mt-3 font-display text-xl font-semibold text-ink">{dia.diaSemana}</div>
      <div className="mut mt-1 max-w-[16rem]">Concluído — volta na próxima semana</div>
    </div>
  );
}

// ---------------------------------------------------------------- Exercício
function VersoExercicio({
  reduce, idx, total, ex, ultimo, salvando, onDescanso, onConcluir, onSair,
}: {
  reduce: boolean;
  idx: number;
  total: number;
  ex: DiaTreino['exercicios'][number];
  ultimo: boolean;
  salvando: boolean;
  onDescanso: () => void;
  onConcluir: () => void;
  onSair: () => void;
}) {
  const anim = reduce ? 'animate-fadeIn' : '';
  return (
    <div
      className={`flex flex-1 flex-col ${anim}`}
      style={reduce ? undefined : { animation: 'flipContent 0.4s ease-out' }}
    >
      <div className="row">
        <span className="mut">Exercício {idx + 1} de {total}</span>
        <button onClick={onSair} className="mut hover:text-ink" aria-label="Sair">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="font-display text-xl font-semibold text-ink">{ex.nome}</div>
        <div className="mt-2 text-[15px] text-textSecondary">
          {ex.series}× {ex.repeticoes}
        </div>
        {(ex.descanso || ex.observacao) && (
          <div className="mut mt-1 max-w-[18rem]">
            {ex.descanso ? `descanso ${ex.descanso}` : ''}
            {ex.descanso && ex.observacao ? ' · ' : ''}
            {ex.observacao ?? ''}
          </div>
        )}
      </div>

      {/* pontos de progresso */}
      <div className="mb-3 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-accent' : i < idx ? 'w-1.5 bg-verde' : 'w-1.5 bg-ink/15'}`}
          />
        ))}
      </div>

      {ultimo ? (
        <button onClick={onConcluir} disabled={salvando} className="btn-primary w-full !bg-verde">
          <Check size={16} /> {salvando ? 'Salvando…' : 'Concluído'}
        </button>
      ) : (
        <button onClick={onDescanso} className="btn-primary w-full">
          <Timer size={16} /> Descanso
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Cronômetro
function Cronometro({
  segundos, proximoNome, reduce, onFim,
}: {
  segundos: number;
  proximoNome: string;
  reduce: boolean;
  onFim: () => void;
}) {
  const [restante, setRestante] = useState(segundos);
  const fimRef = useRef(Date.now() + segundos * 1000);

  useEffect(() => {
    fimRef.current = Date.now() + segundos * 1000;
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((fimRef.current - Date.now()) / 1000));
      setRestante(r);
      if (r <= 0) {
        clearInterval(id);
        onFim();
      }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  const piscando = restante <= 10;
  const R = 52;
  const circ = 2 * Math.PI * R;
  const frac = segundos > 0 ? restante / segundos : 0;
  const cor = piscando ? 'var(--cor-vermelho)' : 'var(--cor-destaque)';

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="mut mb-3">Descanso</p>
      <div
        className="relative flex h-36 w-36 items-center justify-center"
        style={piscando && !reduce ? { animation: 'pulsar 1s ease-in-out infinite' } : undefined}
      >
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(27,42,74,0.08)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke={cor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
          />
        </svg>
        <div
          className="absolute font-display text-4xl font-semibold"
          style={{ color: cor }}
          aria-live="polite"
        >
          {formatTempo(restante)}
        </div>
      </div>
      <p className="mut mt-3 max-w-[18rem]">A seguir: {proximoNome}</p>
      <button onClick={onFim} className="btn-outline mt-4 px-5 !min-h-[40px] text-sm">
        <SkipForward size={15} /> Pular
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Concluído
function VersoConcluido({ msg, onFechar }: { msg: string; onFechar: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFechar, 7000);
    return () => clearTimeout(t);
  }, [onFechar]);
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center animate-fadeIn">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-verde/15">
        <Check className="text-verde" size={34} />
      </div>
      <p className="mt-4 max-w-[18rem] font-display text-lg font-semibold text-ink">{msg}</p>
      <button onClick={onFechar} className="btn-outline mt-5 px-6 !min-h-[40px] text-sm">
        Fechar
      </button>
    </div>
  );
}
