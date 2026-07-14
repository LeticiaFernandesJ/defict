import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { Plus, Scale, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePesos, usePesoMutations } from '../hooks/usePeso';
import { hojeISO, fmtData, fmtDiaMes, fmtNum } from '../lib/dates';
import type { RegistroPeso } from '../types';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { NumericInput } from '../components/ui/NumericInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Carregando, EstadoErro, EstadoVazio } from '../components/ui/States';

export function Peso() {
  const { profile } = useAuthStore();
  const { data: pesos, isLoading, isError, refetch } = usePesos(profile?.id);
  const mut = usePesoMutations(profile?.id);
  const [modal, setModal] = useState<{ registro?: RegistroPeso } | null>(null);
  const [excluir, setExcluir] = useState<number | null>(null);

  const stats = useMemo(() => {
    const lista = pesos ?? [];
    const atual = lista.at(-1)?.peso ?? profile?.peso_inicial ?? null;
    const inicial = profile?.peso_inicial ?? lista[0]?.peso ?? null;
    return { atual, inicial, meta: profile?.peso_meta ?? null };
  }, [pesos, profile]);

  const serie = (pesos ?? []).map((p) => ({ dia: fmtDiaMes(p.data), peso: Number(p.peso) }));

  return (
    <div className="space-y-4">
      <div className="row animate-fadeIn">
        <div>
          <h1 className="ph1">Peso</h1>
          <p className="psub">evolução</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary px-5">
          <Plus size={16} /> Registrar peso
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <Metric v={stats.atual} l="atual" />
        <Metric v={stats.inicial} l="inicial" />
        <Metric v={stats.meta} l="meta" />
      </div>

      {isLoading && <Carregando />}
      {isError && <EstadoErro onRetry={() => refetch()} />}

      {!isLoading && !isError && (pesos?.length ?? 0) === 0 && (
        <EstadoVazio
          icon={Scale}
          titulo="Sem registros de peso"
          descricao="Comece registrando seu peso atual."
          acao={{ label: 'Registrar peso', onClick: () => setModal({}) }}
        />
      )}

      {serie.length > 0 && (
        <Card>
          <p className="mut mb-2.5">Evolução vs. meta</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: -28 }}>
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
              <Tooltip
                formatter={(v) => [`${fmtNum(Number(v), 1)} kg`, 'Peso']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sombra-card)', fontSize: 12 }}
              />
              {profile?.peso_meta != null && (
                <ReferenceLine
                  y={profile.peso_meta}
                  stroke="var(--cor-verde)"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{ value: `meta ${fmtNum(profile.peso_meta, 0)} kg`, fontSize: 11, fill: '#4CAF82', position: 'insideBottomLeft' }}
                />
              )}
              <Line type="monotone" dataKey="peso" stroke="#B5622A" strokeWidth={3} dot={{ r: 4, fill: '#B5622A' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(pesos?.length ?? 0) > 0 && (
        <Card>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Peso</th>
                <th>Observação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...(pesos ?? [])].reverse().map((p) => (
                <tr key={p.id}>
                  <td>{fmtData(p.data)}</td>
                  <td>{fmtNum(p.peso, 1)} kg</td>
                  <td className="mut">{p.observacao || '—'}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2 text-textSecondary">
                      <button onClick={() => setModal({ registro: p })} className="hover:text-accent" aria-label="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setExcluir(p.id)} className="hover:text-vermelho" aria-label="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modal && (
        <ModalRegistrarPeso
          registro={modal.registro}
          onClose={() => setModal(null)}
          onSalvar={async (v) => {
            if (modal.registro) await mut.atualizar.mutateAsync({ id: modal.registro.id, ...v });
            else await mut.criar.mutateAsync(v);
            setModal(null);
          }}
        />
      )}

      <ConfirmDialog
        open={excluir != null}
        onClose={() => setExcluir(null)}
        onConfirm={() => excluir != null && mut.excluir.mutate(excluir)}
      />
    </div>
  );
}

function Metric({ v, l }: { v: number | null; l: string }) {
  return (
    <div className="card !py-3.5 text-center">
      <div className="text-xl font-medium text-primary">
        {v != null ? `${fmtNum(v, 1)} kg` : '—'}
      </div>
      <div className="mut">{l}</div>
    </div>
  );
}

function ModalRegistrarPeso({
  registro,
  onClose,
  onSalvar,
}: {
  registro?: RegistroPeso;
  onClose: () => void;
  onSalvar: (v: { data: string; peso: number; observacao?: string | null }) => Promise<void>;
}) {
  const [data, setData] = useState(registro ? registro.data.slice(0, 10) : hojeISO());
  const [peso, setPeso] = useState(registro?.peso ?? ('' as number | ''));
  const [obs, setObs] = useState(registro?.observacao ?? '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!peso || Number(peso) <= 0) return;
    setSalvando(true);
    await onSalvar({
      data: new Date(`${data}T12:00:00`).toISOString(),
      peso: Number(peso),
      observacao: obs || null,
    });
    setSalvando(false);
  };

  return (
    <Modal open onClose={onClose} title={registro ? 'Editar peso' : 'Registrar peso'}>
      <div className="space-y-1">
        <p className="lb-modal">Data</p>
        <input type="date" className="input-field" value={data} onChange={(e) => setData(e.target.value)} max={hojeISO()} />
        <p className="lb-modal !mt-3">Peso (kg)</p>
        <NumericInput casasDecimais={1} value={peso} onValueChange={setPeso} />
        <p className="lb-modal !mt-3">Observação</p>
        <input className="input-field" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="opcional…" />
        <div className="flex gap-2.5 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={salvar} loading={salvando} className="flex-1">
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
