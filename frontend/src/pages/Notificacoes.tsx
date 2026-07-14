import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, BellRing } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotificacoes, useNotificacaoMutations } from '../hooks/useNotificacoes';
import { ativarNotificacoes, jaAtivado, pushSuportado } from '../lib/push';
import {
  LABEL_NOTIFICACAO,
  TIPOS_NOTIFICACAO,
  type ConfiguracaoNotificacao,
  type NotificacaoTipo,
} from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Carregando, EstadoErro, PageHeader } from '../components/ui/States';

// Alguns lembretes disparam por evento (não por horário fixo).
const POR_EVENTO: Partial<Record<NotificacaoTipo, string>> = {
  RefeicaoMetaProxima: 'ao atingir',
  RefeicaoMetaUltrapassada: 'ao atingir',
};

export function Notificacoes() {
  const { profile } = useAuthStore();
  const { data, isLoading, isError, refetch } = useNotificacoes(profile?.id);
  const mut = useNotificacaoMutations(profile?.id);

  const porTipo = new Map<NotificacaoTipo, ConfiguracaoNotificacao>();
  (data ?? []).forEach((c) => porTipo.set(c.tipo, c));

  const toggle = (tipo: NotificacaoTipo, existente?: ConfiguracaoNotificacao) => {
    if (existente) mut.atualizar.mutate({ id: existente.id, ativo: !existente.ativo });
    else mut.criar.mutate({ tipo, horario_gatilho: '09:00:00', ativo: true });
  };

  return (
    <div className="space-y-4">
      <Link to="/configuracoes" className="inline-flex items-center gap-1 text-sm text-textSecondary">
        <ChevronLeft size={16} /> Configurações
      </Link>
      <PageHeader titulo="Notificações" subtitulo="configure seus lembretes" />

      <PushCard userId={profile?.id} />

      {isLoading && <Carregando />}
      {isError && <EstadoErro onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <Card>
          <table className="data-table">
            <thead>
              <tr>
                <th>Lembrete</th>
                <th>Horário</th>
                <th className="text-right">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_NOTIFICACAO.map((tipo) => {
                const cfg = porTipo.get(tipo);
                const ativo = cfg?.ativo ?? false;
                const evento = POR_EVENTO[tipo];
                return (
                  <tr key={tipo}>
                    <td>{LABEL_NOTIFICACAO[tipo]}</td>
                    <td className="mut">
                      {evento ? (
                        evento
                      ) : ativo && cfg ? (
                        <input
                          type="time"
                          className="rounded-md border border-[#E7DECF] bg-branco px-2 py-1 text-xs"
                          value={cfg.horario_gatilho.slice(0, 5)}
                          onChange={(e) =>
                            mut.atualizar.mutate({ id: cfg.id, horario_gatilho: `${e.target.value}:00` })
                          }
                        />
                      ) : (
                        cfg?.horario_gatilho.slice(0, 5) ?? '09:00'
                      )}
                    </td>
                    <td className="text-right">
                      <Toggle ativo={ativo} onChange={() => toggle(tipo, cfg)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PushCard({ userId }: { userId?: string }) {
  const [ativado, setAtivado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const suportado = pushSuportado();

  useEffect(() => {
    jaAtivado().then(setAtivado);
  }, []);

  const ativar = async () => {
    if (!userId) return;
    setCarregando(true);
    setMsg(null);
    const r = await ativarNotificacoes(userId);
    setCarregando(false);
    if (r.ok) {
      setAtivado(true);
      setMsg('Notificações ativadas neste dispositivo.');
    } else {
      setMsg(r.erro ?? 'Não foi possível ativar.');
    }
  };

  return (
    <Card>
      <div className="row">
        <div className="flex items-center gap-2">
          {ativado ? <BellRing size={18} className="text-verde" /> : <Bell size={18} className="text-accent" />}
          <div>
            <p className="text-sm font-medium text-primary">Notificações push</p>
            <p className="mut">
              {ativado ? 'Ativadas neste dispositivo.' : 'Receba os lembretes mesmo com o app fechado.'}
            </p>
          </div>
        </div>
        {!ativado && (
          <Button onClick={ativar} loading={carregando} disabled={!suportado} className="!min-h-[40px] px-4 text-sm">
            Ativar
          </Button>
        )}
      </div>
      {!suportado && <p className="mut mt-2 !text-[11px]">Este navegador não suporta notificações push.</p>}
      {msg && <p className={`mt-2 text-xs ${ativado ? 'text-verde' : 'text-vermelho'}`}>{msg}</p>}
    </Card>
  );
}
