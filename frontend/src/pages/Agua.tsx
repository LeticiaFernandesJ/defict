import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAgua, useAguaHistorico, useAguaMutations } from '../hooks/useAgua';
import { hojeISO, fmtNum } from '../lib/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Carregando, EstadoErro, PageHeader } from '../components/ui/States';

export function Agua() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const dataISO = hojeISO();
  const [modalCustom, setModalCustom] = useState(false);
  const [custom, setCustom] = useState(300);

  const { data: agua, isLoading, isError, refetch } = useAgua(profile?.id, dataISO);
  const historico = useAguaHistorico(profile?.id, 5);
  const { adicionar } = useAguaMutations(profile?.id, dataISO);

  const meta = profile?.meta_agua ?? 2000;
  const ml = agua?.quantidade_ml ?? 0;
  const pct = Math.min(100, Math.round((ml / meta) * 100));
  const faltam = Math.max(0, meta - ml);

  const barras = historico.data ?? [];
  const maxBar = Math.max(meta, ...barras.map((b) => b.quantidade_ml), 1);

  return (
    <div className="space-y-4">
      <PageHeader titulo="Água" subtitulo="hidratação de hoje" />

      {isLoading && <Carregando />}
      {isError && <EstadoErro onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Anel de progresso */}
          <Card className="flex flex-col items-center justify-center !py-8 text-center">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#E3EEF6" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="var(--cor-agua)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute font-display text-[30px] font-semibold text-primary">{pct}%</div>
            </div>
            <p className="mt-4 text-base font-medium text-primary">
              {fmtNum(ml)} / {fmtNum(meta)} ml
            </p>
            <p className="mut">
              {faltam > 0 ? `faltam ${fmtNum(faltam)} ml para a meta` : 'meta atingida! 🎉'}
            </p>
          </Card>

          {/* Coluna de ações */}
          <div className="flex flex-col gap-3.5">
            <Card>
              <p className="mut mb-3">Adicionar rápido</p>
              <div className="flex gap-2.5">
                <button onClick={() => adicionar.mutate(250)} className="btn-primary flex-1 !min-h-[44px]">
                  +250 ml
                </button>
                <button onClick={() => adicionar.mutate(500)} className="btn-primary flex-1 !min-h-[44px]">
                  +500 ml
                </button>
                <button onClick={() => setModalCustom(true)} className="btn-outline flex-1 !min-h-[44px]">
                  outro
                </button>
              </div>
              {ml > 0 && (
                <button onClick={() => adicionar.mutate(-250)} className="mt-3 text-xs text-textSecondary underline">
                  remover 250 ml
                </button>
              )}
            </Card>

            <Card className="row">
              <span className="mut">Meta diária</span>
              <button onClick={() => navigate('/configuracoes')} className="font-medium text-primary">
                {fmtNum(meta)} ml
              </button>
            </Card>

            <Card>
              <p className="mut mb-2.5">Últimos dias</p>
              {barras.length === 0 ? (
                <p className="mut">Sem registros ainda.</p>
              ) : (
                <div className="flex h-[60px] items-end gap-2.5">
                  {barras.map((b, i) => (
                    <div
                      key={b.id}
                      className="flex-1 rounded"
                      style={{
                        height: `${Math.max(6, (b.quantidade_ml / maxBar) * 100)}%`,
                        background: i === barras.length - 1 ? 'var(--cor-agua)' : '#CFE3F1',
                      }}
                      title={`${fmtNum(b.quantidade_ml)} ml`}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <Modal open={modalCustom} onClose={() => setModalCustom(false)} title="Quantidade personalizada">
        <div className="space-y-3">
          <input type="number" className="input-field" value={custom} onChange={(e) => setCustom(Number(e.target.value))} />
          <Button
            onClick={() => {
              adicionar.mutate(custom);
              setModalCustom(false);
            }}
            className="w-full"
          >
            Adicionar {fmtNum(custom)} ml
          </Button>
        </div>
      </Modal>
    </div>
  );
}
