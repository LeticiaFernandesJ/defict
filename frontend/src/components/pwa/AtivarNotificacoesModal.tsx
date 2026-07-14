import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ativarNotificacoes, jaAtivado, pushSuportado } from '../../lib/push';

const CHAVE_SESSAO = 'deficit_notif_prompt_shown';

/**
 * Popup exibido ao entrar no app (1× por sessão) enquanto as notificações
 * push não estiverem ativadas neste dispositivo. Não aparece se o navegador
 * não suportar push, ou se a permissão já tiver sido negada (o navegador
 * bloqueia um novo pedido de qualquer forma).
 */
export function AtivarNotificacoesModal() {
  const profile = useAuthStore((s) => s.profile);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    if (sessionStorage.getItem(CHAVE_SESSAO)) return;
    if (!pushSuportado()) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return;

    let cancelado = false;
    jaAtivado().then((ja) => {
      if (cancelado || ja) return;
      sessionStorage.setItem(CHAVE_SESSAO, '1');
      setAberto(true);
    });
    return () => {
      cancelado = true;
    };
  }, [profile?.id]);

  const ativar = async () => {
    if (!profile?.id) return;
    setCarregando(true);
    setErro(null);
    const r = await ativarNotificacoes(profile.id);
    setCarregando(false);
    if (r.ok) setAberto(false);
    else setErro(r.erro ?? 'Não foi possível ativar.');
  };

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={() => setAberto(false)}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-3xl bg-branco p-7 text-center shadow-2xl animate-scaleIn sm:mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <BellRing size={26} className="text-accent" />
        </div>

        <h2 className="mb-1 font-display text-xl font-bold text-ink">Ativar lembretes?</h2>
        <p className="mb-6 text-sm leading-relaxed text-textSecondary">
          Receba lembretes de água, refeições e treino direto no seu dispositivo — mesmo com o
          app fechado.
        </p>

        {erro && <p className="mb-3 text-xs text-vermelho">{erro}</p>}

        <div className="flex gap-2.5">
          <button onClick={() => setAberto(false)} className="btn-outline flex-1">
            Agora não
          </button>
          <button onClick={ativar} disabled={carregando} className="btn-primary flex-1">
            {carregando ? 'Ativando…' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}
