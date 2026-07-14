import { useState } from 'react';
import { Activity, Check, Flame, Dumbbell, Sparkles, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAtividade, useAutoSubirNivel } from '../hooks/useAtividade';
import { usePlanoTreino, usePlanoTreinoMutations } from '../hooks/usePlanoTreino';
import { useTreinoConclusoes, useTreinoConclusaoMutations } from '../hooks/useTreinoConclusoes';
import { historicoSemanas } from '../lib/atividade';
import { ehDiaDeHoje } from '../lib/treinoUtils';
import { CardTreino } from '../components/treino/CardTreino';
import { LABEL_NIVEL_ATIVIDADE, type PlanoTreino } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Carregando, EstadoErro, PageHeader } from '../components/ui/States';

const DIAS_ORDEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function Atividade() {
  const { profile } = useAuthStore();
  const atv = useAtividade();
  useAutoSubirNivel(atv.progresso);
  const prog = atv.progresso;

  const plano = usePlanoTreino(profile?.id);
  const [regerar, setRegerar] = useState(false);
  // Meta semanal = dias do plano de treino escolhido (senão, a regra do nível).
  const metaSemanal = plano.data?.dias?.length || prog?.vezesSemana || 3;

  const historico = prog ? historicoSemanas(atv.marcas.map((m) => m.data), prog.vezesSemana, 6) : [];

  return (
    <div className="space-y-4">
      <PageHeader titulo="Atividade" subtitulo="treino com IA e progressão de nível" />

      {/* ===== Treino gerado por IA ===== */}
      {plano.isLoading ? (
        <Carregando texto="Carregando seu treino…" />
      ) : plano.data && !regerar ? (
        <PlanoView plano={plano.data} onNovo={() => setRegerar(true)} />
      ) : (
        <FormGerarTreino
          nivel={profile?.nivel_atividade ?? 'Sedentario'}
          onCancelar={plano.data ? () => setRegerar(false) : undefined}
          onGerado={() => setRegerar(false)}
        />
      )}

      {/* ===== Progressão de nível ===== */}
      {atv.isError && <EstadoErro onRetry={atv.refetch} />}
      {!atv.isError && prog && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <p className="mut">Nível atual</p>
              <div className="font-display text-[26px] font-semibold text-primary">
                {LABEL_NIVEL_ATIVIDADE[prog.nivel]}
              </div>
              {prog.proximo ? (
                <>
                  <div className="bar">
                    <div className="fill" style={{ width: `${prog.pctPrincipal}%`, background: 'var(--cor-destaque)' }} />
                  </div>
                  <p className="mut mt-2">
                    {prog.semanasConcluidas} de {prog.semanasRequeridas} semanas para{' '}
                    <b className="text-primary">{LABEL_NIVEL_ATIVIDADE[prog.proximo]}</b>
                  </p>
                  <p className="mut mt-1 !text-[11px]">
                    Marque ao menos {prog.vezesSemana}× por semana durante {prog.semanasRequeridas} semanas.
                  </p>
                </>
              ) : (
                <p className="mut mt-1">Nível máximo atingido 🎉</p>
              )}
            </Card>

            <Card className="flex flex-col justify-center">
              <div className="row">
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <Flame size={16} className="text-accent" /> Sequência
                </span>
                <span className="text-xl font-semibold text-primary">{prog.semanasConcluidas} sem.</span>
              </div>
            </Card>
          </div>

          {/* Esta semana + marcar (canônico) */}
          <Card>
            <div className="row mb-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Activity size={16} className="text-accent" /> Esta semana
              </span>
              <span className="mut">
                {prog.vezesNaSemana} de {metaSemanal} vezes
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (prog.vezesNaSemana / metaSemanal) * 100)}%` }}
              />
            </div>
            <button
              onClick={atv.toggleHoje}
              disabled={atv.alternando}
              className={atv.marcadoHoje ? 'btn-outline mt-3.5 w-full' : 'btn-primary mt-3.5 w-full'}
            >
              {atv.marcadoHoje ? (
                <>
                  <Check size={16} /> Atividade de hoje marcada
                </>
              ) : (
                'Marcar atividade de hoje'
              )}
            </button>
            {atv.erroMarcar && <p className="mt-2 text-xs text-vermelho">{atv.erroMarcar}</p>}
          </Card>

          {/* Histórico semanal */}
          <Card>
            <p className="mut mb-3">Últimas semanas</p>
            <div className="flex items-end gap-3" style={{ height: 90 }}>
              {historico.map((s, i) => {
                const alturaMax = Math.max(prog.vezesSemana, ...historico.map((h) => h.count), 1);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded"
                        style={{
                          height: `${Math.max(6, (s.count / alturaMax) * 100)}%`,
                          background: s.qualificada ? 'var(--cor-verde)' : s.atual ? 'var(--cor-destaque)' : '#E7DFD2',
                        }}
                        title={`${s.count} marcações`}
                      />
                    </div>
                    <span className="text-[10px] text-textSecondary">{s.rotulo}</span>
                  </div>
                );
              })}
            </div>
            <p className="mut mt-3 !text-[11px]">
              Verde = semana que bateu a meta ({prog.vezesSemana}×). Laranja = semana atual.
            </p>
          </Card>
        </>
      )}

      {!profile && <p className="mut">Complete seu perfil para acompanhar a progressão.</p>}
    </div>
  );
}

function FormGerarTreino({
  nivel,
  onCancelar,
  onGerado,
}: {
  nivel: string;
  onCancelar?: () => void;
  onGerado: () => void;
}) {
  const { profile } = useAuthStore();
  const mut = usePlanoTreinoMutations(profile?.id);
  const [objetivo, setObjetivo] = useState('Emagrecimento');
  const [diasSel, setDiasSel] = useState<string[]>(['Segunda', 'Quarta', 'Sexta']);
  const [equipamento, setEquipamento] = useState('Academia');
  const [restricoes, setRestricoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const toggleDia = (d: string) =>
    setDiasSel((atual) =>
      atual.includes(d) ? atual.filter((x) => x !== d) : [...DIAS_ORDEM.filter((x) => atual.includes(x) || x === d)],
    );

  const gerar = async () => {
    setErro(null);
    if (diasSel.length === 0) {
      setErro('Escolha ao menos um dia de treino.');
      return;
    }
    try {
      await mut.gerar.mutateAsync({ objetivo, dias: diasSel, equipamento, restricoes, nivelAtividade: nivel });
      onGerado();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível gerar o treino. Verifique se a função "treino" está publicada e a chave do Gemini configurada.',
      );
    }
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        <span className="font-medium text-primary">Gerar treino com IA</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Objetivo
          <select className="input-field mt-1" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
            <option>Emagrecimento</option>
            <option>Hipertrofia</option>
            <option>Condicionamento</option>
            <option>Saúde geral</option>
          </select>
        </label>
        <div className="block text-sm font-medium sm:col-span-2">
          Dias de treino da semana
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DIAS_ORDEM.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDia(d)}
                className={`fchip ${diasSel.includes(d) ? 'fchip-on' : ''}`}
                aria-pressed={diasSel.includes(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm font-medium">
          Equipamento
          <select className="input-field mt-1" value={equipamento} onChange={(e) => setEquipamento(e.target.value)}>
            <option>Academia</option>
            <option>Casa</option>
            <option>Sem equipamento</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Restrições / lesões
          <input className="input-field mt-1" value={restricoes} onChange={(e) => setRestricoes(e.target.value)} placeholder="opcional…" />
        </label>
      </div>
      {erro && <p className="text-sm text-vermelho">{erro}</p>}
      <div className="flex gap-2.5">
        {onCancelar && (
          <Button variant="outline" onClick={onCancelar} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button onClick={gerar} loading={mut.gerar.isPending} className="flex-1">
          <Sparkles size={16} /> Gerar treino
        </Button>
      </div>
      <p className="!text-[11px] text-textSecondary">
        Sugestão gerada por IA — orientação geral, não substitui um profissional de educação física.
      </p>
    </Card>
  );
}

function PlanoView({ plano, onNovo }: { plano: PlanoTreino; onNovo: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const conclusoes = useTreinoConclusoes(profile?.id, plano.id);
  const { concluir } = useTreinoConclusaoMutations(profile?.id, plano.id);
  const feitos = new Set(conclusoes.data ?? []);
  const total = plano.dias.length || 1;
  const pct = Math.round((feitos.size / total) * 100);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="row">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-accent" />
            <span className="font-medium text-primary">Seu treino ({plano.objetivo})</span>
          </div>
          <button onClick={onNovo} className="flex items-center gap-1 text-xs font-medium text-accent">
            <RefreshCw size={13} /> Novo plano
          </button>
        </div>
        <div>
          <div className="row mb-1">
            <span className="mut">Progresso da semana</span>
            <span className="mut">
              {feitos.size} de {plano.dias.length} dias
            </span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${pct}%`, background: 'var(--cor-verde)' }} />
          </div>
        </div>
      </Card>

      {/* Cards interativos por dia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plano.dias.map((d, i) => (
          <CardTreino
            key={i}
            dia={d}
            ehHoje={ehDiaDeHoje(d.diaSemana)}
            disponivel={ehDiaDeHoje(d.diaSemana)}
            jaConcluido={feitos.has(d.diaSemana)}
            onConcluir={(ds) => concluir.mutateAsync(ds)}
          />
        ))}
      </div>

      <p className="!text-[11px] text-textSecondary">
        Sugestão gerada por IA — orientação geral, não substitui um profissional de educação física.
      </p>
    </div>
  );
}
