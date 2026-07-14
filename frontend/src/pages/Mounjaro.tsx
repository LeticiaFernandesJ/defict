import { useState } from 'react';
import { Plus, Syringe, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMounjaro, useMounjaroMutations, type NovaAplicacao } from '../hooks/useMounjaro';
import {
  LABEL_TOLERANCIA,
  LOCAIS_APLICACAO,
  NIVEIS_TOLERANCIA,
  type NivelToleranciaSintoma,
  type RegistroMounjaro,
} from '../types';
import { hojeISO, addDiasISO, fmtDiaMes, fmtNum } from '../lib/dates';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Carregando, EstadoErro, EstadoVazio } from '../components/ui/States';

export function Mounjaro() {
  const { profile } = useAuthStore();
  const { data: aplicacoes, isLoading, isError, refetch } = useMounjaro(profile?.id);
  const mut = useMounjaroMutations(profile?.id);
  const [modal, setModal] = useState<{ registro?: RegistroMounjaro } | null>(null);
  const [excluir, setExcluir] = useState<number | null>(null);

  const ultima = aplicacoes?.[0];
  const proximaISO = ultima ? addDiasISO(ultima.data_aplicacao.slice(0, 10), 7) : null;
  const emDias = proximaISO
    ? Math.max(0, Math.ceil((new Date(proximaISO).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-4">
      <div className="row animate-fadeIn">
        <div>
          <h1 className="ph1">Mounjaro</h1>
          <p className="psub">registro de aplicações</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary px-5">
          <Plus size={16} /> Registrar aplicação
        </button>
      </div>

      {/* Resumo */}
      {ultima && (
        <Card>
          <div className="row">
            <div>
              <p className="mut">Última aplicação</p>
              <div className="font-display text-[24px] font-semibold text-primary">
                {fmtNum(ultima.dose_mg, 1)} mg
              </div>
              <p className="mut">
                {fmtDiaMes(ultima.data_aplicacao)} · {ultima.local_aplicacao}
              </p>
            </div>
            <div className="text-right">
              <p className="mut">Próxima dose</p>
              <div className="text-[18px] font-medium text-accent">{proximaISO && fmtDiaMes(proximaISO)}</div>
              <p className="mut">{emDias === 0 ? 'hoje' : `em ${emDias} dias`}</p>
            </div>
          </div>
        </Card>
      )}

      {isLoading && <Carregando />}
      {isError && <EstadoErro onRetry={() => refetch()} />}

      {!isLoading && !isError && (aplicacoes?.length ?? 0) === 0 && (
        <EstadoVazio
          icon={Syringe}
          titulo="Sem aplicações registradas"
          descricao="Registre sua primeira aplicação para acompanhar o histórico."
          acao={{ label: 'Registrar aplicação', onClick: () => setModal({}) }}
        />
      )}

      {(aplicacoes?.length ?? 0) > 0 && (
        <Card>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Dose</th>
                <th>Local</th>
                <th>Tolerância</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(aplicacoes ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{fmtDiaMes(a.data_aplicacao)}</td>
                  <td>{fmtNum(a.dose_mg, 1)} mg</td>
                  <td>{a.local_aplicacao}</td>
                  <td className={a.nivel_tolerancia_sintoma === 'Nenhum' ? 'mut' : ''}>
                    {LABEL_TOLERANCIA[a.nivel_tolerancia_sintoma]}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2 text-textSecondary">
                      <button onClick={() => setModal({ registro: a })} className="hover:text-accent" aria-label="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setExcluir(a.id)} className="hover:text-vermelho" aria-label="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mut mt-3.5 !text-[11px]">Registro pessoal — não substitui orientação médica.</p>
        </Card>
      )}

      {modal && (
        <ModalAplicacao
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

function ModalAplicacao({
  registro,
  onClose,
  onSalvar,
}: {
  registro?: RegistroMounjaro;
  onClose: () => void;
  onSalvar: (v: NovaAplicacao) => Promise<void>;
}) {
  const [data, setData] = useState(registro ? registro.data_aplicacao.slice(0, 10) : hojeISO());
  const [dose, setDose] = useState(registro?.dose_mg ?? ('' as number | ''));
  const [local, setLocal] = useState<string>(registro?.local_aplicacao ?? LOCAIS_APLICACAO[0]);
  const [tolerancia, setTolerancia] = useState<NivelToleranciaSintoma>(
    registro?.nivel_tolerancia_sintoma ?? 'Nenhum',
  );
  const [sintomas, setSintomas] = useState(registro?.sintomas ?? '');
  const [obs, setObs] = useState(registro?.observacao ?? '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!dose || Number(dose) <= 0) return;
    setSalvando(true);
    await onSalvar({
      data_aplicacao: new Date(`${data}T12:00:00`).toISOString(),
      dose_mg: Number(dose),
      local_aplicacao: local,
      nivel_tolerancia_sintoma: tolerancia,
      sintomas: sintomas || null,
      observacao: obs || null,
    });
    setSalvando(false);
  };

  return (
    <Modal open onClose={onClose} title={registro ? 'Editar aplicação' : 'Registrar aplicação'}>
      <div className="space-y-1">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <p className="lb-modal">Data</p>
            <input type="date" className="input-field" value={data} onChange={(e) => setData(e.target.value)} max={hojeISO()} />
          </div>
          <div className="flex-1">
            <p className="lb-modal">Dose (mg)</p>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={dose}
              onChange={(e) => setDose(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <p className="lb-modal !mt-3">Local de aplicação</p>
        <div className="flex flex-wrap gap-2">
          {LOCAIS_APLICACAO.map((l) => (
            <button key={l} onClick={() => setLocal(l)} className={`fchip ${local === l ? 'fchip-on' : ''}`}>
              {l}
            </button>
          ))}
        </div>

        <p className="lb-modal !mt-3">Tolerância aos sintomas</p>
        <div className="flex flex-wrap gap-2">
          {NIVEIS_TOLERANCIA.map((n) => (
            <button key={n} onClick={() => setTolerancia(n)} className={`fchip ${tolerancia === n ? 'fchip-on' : ''}`}>
              {LABEL_TOLERANCIA[n]}
            </button>
          ))}
        </div>

        <p className="lb-modal !mt-3">Sintomas</p>
        <input className="input-field" value={sintomas} onChange={(e) => setSintomas(e.target.value)} placeholder="opcional…" />
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
