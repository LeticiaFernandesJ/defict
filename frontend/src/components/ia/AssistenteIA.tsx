import { useState } from 'react';
import { Sparkles, Send, Loader2, X, MessageCircle, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { gemini } from '../../lib/gemini';
import { useDashboard } from '../../hooks/useDashboard';
import { Button } from '../ui/Button';

type Aba = 'chat' | 'analise';

/** Botão flutuante (canto inferior direito, desktop e mobile) que abre o popup da IA. */
export function AssistenteIA() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {aberto && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      {aberto && (
        <div
          className="fixed z-50 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-card bg-branco shadow-card animate-fadeInUp"
          style={{
            right: '1rem',
            bottom: 'calc(var(--bottom-nav-height) + 5.5rem)',
            maxHeight: '70vh',
          }}
          role="dialog"
          aria-label="Assistente IA"
        >
          <PopupIA onClose={() => setAberto(false)} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={aberto ? 'Fechar assistente IA' : 'Abrir assistente IA'}
        className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-card transition-transform hover:brightness-95 active:scale-95"
        style={{ right: '1rem', bottom: 'calc(var(--bottom-nav-height) + 1.25rem)' }}
      >
        {aberto ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </>
  );
}

function PopupIA({ onClose }: { onClose: () => void }) {
  const [aba, setAba] = useState<Aba>('chat');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-[#F1EBE1] px-4 py-3">
        <span className="flex items-center gap-2 font-display text-base font-bold text-primary">
          <Sparkles size={16} className="text-accent" /> IA · Gemini
        </span>
        <button onClick={onClose} className="text-textSecondary hover:text-primary" aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 px-4 pt-3">
        <button
          className={`pill flex items-center gap-1 ${aba === 'chat' ? 'pill-on' : ''}`}
          onClick={() => setAba('chat')}
        >
          <MessageCircle size={13} /> Chat
        </button>
        <button
          className={`pill flex items-center gap-1 ${aba === 'analise' ? 'pill-on' : ''}`}
          onClick={() => setAba('analise')}
        >
          <CalendarCheck size={13} /> Analisar meu dia
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {aba === 'chat' ? <Chat /> : <AnaliseDia />}
      </div>
    </div>
  );
}

interface Msg {
  autor: 'user' | 'ai';
  texto: string;
}

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { autor: 'ai', texto: 'Olá! Posso ajudar com dúvidas sobre alimentação e sua meta. O que você quer saber?' },
  ]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviar = async () => {
    const msg = texto.trim();
    if (!msg || carregando) return;
    setMsgs((m) => [...m, { autor: 'user', texto: msg }]);
    setTexto('');
    setCarregando(true);
    try {
      const { resposta } = await gemini.chat(msg);
      setMsgs((m) => [...m, { autor: 'ai', texto: resposta || 'Não consegui responder agora.' }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { autor: 'ai', texto: e instanceof Error ? e.message : 'Erro ao falar com a IA. Tente novamente.' },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <div className="flex-1 space-y-3.5 overflow-y-auto">
        {msgs.map((m, i) =>
          m.autor === 'ai' ? (
            <div
              key={i}
              className="max-w-[85%] bg-surface px-3.5 py-2.5 text-sm text-primary"
              style={{ borderRadius: '14px 14px 14px 4px' }}
            >
              {m.texto}
            </div>
          ) : (
            <div
              key={i}
              className="ml-auto max-w-[85%] bg-primary px-3.5 py-2.5 text-sm text-[#EAF0FA]"
              style={{ borderRadius: '14px 14px 4px 14px' }}
            >
              {m.texto}
            </div>
          ),
        )}
        {carregando && (
          <div
            className="flex max-w-[85%] items-center gap-2 bg-surface px-3.5 py-2.5 text-sm text-textSecondary"
            style={{ borderRadius: '14px 14px 14px 4px' }}
          >
            <Loader2 size={14} className="animate-spin" /> digitando…
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-[24px] bg-surface py-1.5 pl-[18px] pr-2">
        <input
          className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-textSecondary"
          placeholder="Escreva uma mensagem…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
        />
        <button
          onClick={enviar}
          disabled={carregando}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-accent text-white disabled:opacity-60"
          aria-label="Enviar"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

function AnaliseDia() {
  const { profile } = useAuthStore();
  const { data } = useDashboard(profile?.id);
  const [analise, setAnalise] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const analisar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resumo = {
        calorias: data?.resumo.calorias ?? 0,
        meta: profile?.meta_calorica_manual ?? null,
        proteinas: data?.resumo.proteinas ?? 0,
        carboidratos: data?.resumo.carboidratos ?? 0,
        gorduras: data?.resumo.gorduras ?? 0,
        refeicoes: data?.resumo.quantidadeRefeicoes ?? 0,
      };
      const r = await gemini.analisarDia(resumo);
      setAnalise(r.analise);
    } catch {
      setErro('Erro ao analisar o dia. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="mut">Gere uma análise curta e motivadora da sua alimentação de hoje.</p>
      <Button onClick={analisar} loading={carregando} className="w-full">
        <Sparkles size={16} /> Analisar meu dia
      </Button>
      {erro && <p className="text-sm text-vermelho">{erro}</p>}
      {analise && (
        <div
          className="max-w-full whitespace-pre-line bg-surface px-3.5 py-2.5 text-sm text-primary animate-fadeInUp"
          style={{ borderRadius: '14px 14px 14px 4px' }}
        >
          {analise}
        </div>
      )}
    </div>
  );
}
