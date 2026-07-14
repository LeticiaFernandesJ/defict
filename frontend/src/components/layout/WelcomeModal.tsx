import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { primeiroNome } from '../../lib/format';
import { fmtNum } from '../../lib/dates';

const mensagens = [
  'Sua jornada rumo à saúde começa agora. Cada escolha conta! 💪',
  'O primeiro passo é o mais importante. Você já deu o seu! 🌟',
  'Pequenas mudanças diárias criam grandes transformações! 🔥',
  'Bem-vindo(a) ao controle da sua alimentação. Vamos juntos! 🥗',
  'Seu corpo é capaz de muito mais do que você imagina! ⚡',
];

interface Props {
  imc: number;
  classificacaoImc: string;
  metaCalorica: number;
}

/** Mostrado uma única vez por usuário (localStorage) na primeira visita ao dashboard. */
export function WelcomeModal({ imc, classificacaoImc, metaCalorica }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [aberto, setAberto] = useState(false);
  const [mensagem] = useState(() => mensagens[Math.floor(Math.random() * mensagens.length)]);

  useEffect(() => {
    if (!profile?.id) return;
    const key = `deficit_welcome_shown_${profile.id}`;
    if (!localStorage.getItem(key)) {
      setAberto(true);
      localStorage.setItem(key, 'true');
    }
  }, [profile?.id]);

  if (!aberto || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={() => setAberto(false)}
    >
      <div
        className="mx-4 w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-scaleIn sm:mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-6xl" style={{ animation: 'bounce 1s infinite' }}>
          🎉
        </div>

        <h2 className="mb-1 font-display text-2xl font-bold text-ink">
          Olá, {primeiroNome(profile.nome)}!
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-textSecondary">{mensagem}</p>

        <div className="mb-6 space-y-2 rounded-2xl bg-surface p-4 text-left">
          <div className="flex justify-between">
            <span className="text-xs text-textSecondary">Meta calórica</span>
            <span className="text-sm font-semibold text-ink">{fmtNum(metaCalorica)} kcal/dia</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-textSecondary">IMC atual</span>
            <span className="text-sm font-semibold text-ink">
              {fmtNum(imc, 1)} — {classificacaoImc}
            </span>
          </div>
        </div>

        <button
          onClick={() => setAberto(false)}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          Começar minha jornada! 🚀
        </button>
      </div>
    </div>
  );
}
