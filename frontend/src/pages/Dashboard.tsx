import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Plus, Activity, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useDashboard } from '../hooks/useDashboard';
import { useAguaMutations } from '../hooks/useAgua';
import { useAtividade, useAutoSubirNivel } from '../hooks/useAtividade';
import { usePlanoTreino } from '../hooks/usePlanoTreino';
import { calcularResumo, classificarImc } from '../lib/calc';
import { WelcomeModal } from '../components/layout/WelcomeModal';
import { Card } from '../components/ui/Card';
import { primeiroNome } from '../lib/format';
import { fmtDataLonga, fmtNum, hojeISO } from '../lib/dates';
import { LABEL_NIVEL_ATIVIDADE } from '../types';

export function Dashboard() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { data } = useDashboard(profile?.id);
  const { adicionar } = useAguaMutations(profile?.id, hojeISO());
  const atividade = useAtividade();
  useAutoSubirNivel(atividade.progresso);
  const planoTreino = usePlanoTreino(profile?.id);
  // Meta semanal = nº de dias do plano de treino escolhido (senão, a regra do nível).
  const metaSemanal = planoTreino.data?.dias?.length || atividade.progresso?.vezesSemana || 3;

  // Peso atual = último registro; recalcula sempre que o peso muda (a query
  // do dashboard é invalidada ao registrar/editar peso).
  const pesoAtual = data?.pesoAtual ?? profile?.peso_inicial ?? null;

  const calc = useMemo(() => {
    if (!profile) return null;
    try {
      return calcularResumo(profile, pesoAtual);
    } catch {
      return null;
    }
  }, [profile, pesoAtual]);

  const metaCal = calc?.metaCalorica ?? profile?.meta_calorica_manual ?? 1850;
  const consumidas = data?.resumo.calorias ?? 0;
  const restantes = Math.round(metaCal - consumidas);
  const ultrapassou = consumidas > metaCal;
  const pctCal = metaCal > 0 ? Math.min(100, Math.round((consumidas / metaCal) * 100)) : 0;

  const metaAgua = profile?.meta_agua ?? 2000;
  const aguaMl = data?.agua?.quantidade_ml ?? 0;

  const pesoMeta = profile?.peso_meta ?? null;
  const faltam =
    pesoAtual != null && pesoMeta != null ? Math.max(0, pesoAtual - pesoMeta) : null;

  const prog = atividade.progresso;

  return (
    <div className="space-y-4">
      {calc && (
        <WelcomeModal
          imc={calc.imc}
          classificacaoImc={classificarImc(calc.imc)}
          metaCalorica={calc.metaCalorica}
        />
      )}

      {/* Saudação com o nome */}
      <div className="animate-fadeIn">
        <h1 className="ph1">Olá, {primeiroNome(profile?.nome) || 'bem-vindo'}</h1>
        <p className="psub capitalize">{fmtDataLonga(new Date())}</p>
      </div>

      {/* Card retangular: peso atual · meta · IMC */}
      <Card className="animate-fadeInUp">
        <div className="grid grid-cols-3 divide-x divide-[#F1EBE1]">
          <div className="pr-3">
            <p className="mut">Peso atual</p>
            <div className="font-display text-[28px] font-semibold leading-tight text-ink">
              {pesoAtual != null ? fmtNum(pesoAtual, 1) : '—'}
              <span className="text-sm font-normal"> kg</span>
            </div>
            {faltam != null && (
              <p className="mt-0.5 text-xs font-medium text-vermelho">
                {faltam > 0 ? `faltam ${fmtNum(faltam, 1)} kg para a meta` : 'meta atingida 🎉'}
              </p>
            )}
          </div>

          <div className="px-3">
            <p className="mut">Peso meta</p>
            <div className="font-display text-[28px] font-semibold leading-tight text-ink">
              {pesoMeta != null ? fmtNum(pesoMeta, 1) : '—'}
              <span className="text-sm font-normal"> kg</span>
            </div>
          </div>

          <div className="pl-3">
            <p className="mut">IMC</p>
            <div className="font-display text-[28px] font-semibold leading-tight text-ink">
              {calc ? fmtNum(calc.imc, 1) : '—'}
            </div>
            {calc && <p className="mt-0.5 text-xs text-textSecondary">{classificarImc(calc.imc)}</p>}
          </div>
        </div>
      </Card>

      {/* Meta calórica + Água (mantidos) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] stagger">
        <Card>
          <div className="row">
            <span className="mut">Meta de hoje</span>
            <span className={`badge ${ultrapassou ? 'badge-red' : 'badge-green'}`}>
              {ultrapassou ? 'acima da meta' : 'no ritmo certo'}
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="font-display text-[40px] font-semibold leading-none text-ink">
              {fmtNum(consumidas)}
            </span>
            <span className="mut">/ {fmtNum(metaCal)} kcal</span>
          </div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${pctCal}%`, background: ultrapassou ? 'var(--cor-vermelho)' : 'var(--cor-destaque)' }}
            />
          </div>
          <p className="mut mt-2">
            {ultrapassou ? (
              <>Você está <b className="text-vermelho">{fmtNum(Math.abs(restantes))} kcal</b> acima da meta</>
            ) : (
              <>Restam <b className="text-ink">{fmtNum(restantes)} kcal</b> para a meta</>
            )}
          </p>
        </Card>

        <Card>
          <div className="row mut mb-2.5">
            <span className="flex items-center gap-1.5">
              <Droplet size={16} className="text-agua" /> Água
            </span>
            <span>
              {fmtNum(aguaMl)} / {fmtNum(metaAgua)} ml
            </span>
          </div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${Math.min(100, (aguaMl / metaAgua) * 100)}%`, background: 'var(--cor-agua)' }}
            />
          </div>
          <button onClick={() => adicionar.mutate(250)} className="btn-primary mt-3.5 w-full !min-h-[44px]">
            <Plus size={16} /> 250 ml
          </button>
        </Card>
      </div>

      {/* Indicadores — IMC (classificação), TMB, TDEE e meta */}
      <Card>
        <p className="mut mb-3">Seus indicadores</p>
        {calc ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador titulo="IMC" valor={fmtNum(calc.imc, 1)} sub={classificarImc(calc.imc)} />
            <Indicador titulo="TMB" valor={`${fmtNum(calc.tmbPura)}`} sub="kcal em repouso" />
            <Indicador titulo="TDEE" valor={`${fmtNum(calc.tdee)}`} sub="gasto diário" />
            <Indicador titulo="Meta" valor={`${fmtNum(calc.metaCalorica)}`} sub="kcal/dia" />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="mut">Dados insuficientes — complete altura, peso, nascimento e nível de atividade.</p>
            <button onClick={() => navigate('/configuracoes')} className="text-sm font-medium text-accent">
              Ir para Configurações →
            </button>
          </div>
        )}
      </Card>

      {/* Atividade física — barra principal (progresso de nível) + barra da semana */}
      <Card>
        <div className="row mb-1">
          <button onClick={() => navigate('/atividade')} className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Activity size={16} className="text-accent" /> Atividade física
            <ChevronRight size={15} className="text-textSecondary" />
          </button>
          <span className="badge badge-blue">
            {prog ? LABEL_NIVEL_ATIVIDADE[prog.nivel] : '—'}
          </span>
        </div>

        {/* Barra principal — progresso até o próximo nível (sempre visível) */}
        {prog && !prog.proximo ? (
          <p className="mut mt-1">Nível máximo atingido 🎉</p>
        ) : (
          <>
            <div className="bar">
              <div
                className="fill"
                style={{ width: `${prog?.pctPrincipal ?? 0}%`, background: 'var(--cor-destaque)' }}
              />
            </div>
            <p className="mut mt-1.5">
              {prog?.semanasConcluidas ?? 0} de {prog?.semanasRequeridas ?? 5} semanas para{' '}
              <b className="text-ink">
                {prog?.proximo ? LABEL_NIVEL_ATIVIDADE[prog.proximo] : 'Leve'}
              </b>
            </p>
          </>
        )}

        {/* Barra menor — vezes nesta semana (meta = dias do plano de treino) */}
        <div className="mt-3">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, ((prog?.vezesNaSemana ?? 0) / metaSemanal) * 100)}%` }}
            />
          </div>
          <p className="mut mt-1.5">
            {prog?.vezesNaSemana ?? 0} de {metaSemanal} vezes nesta semana
          </p>
        </div>
      </Card>
    </div>
  );
}

function Indicador({ titulo, valor, sub }: { titulo: string; valor: string; sub: string }) {
  return (
    <div className="rounded-card bg-surface py-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-textSecondary">{titulo}</p>
      <p className="mt-0.5 font-display text-xl font-semibold text-ink">{valor}</p>
      <p className="text-[11px] text-textSecondary">{sub}</p>
    </div>
  );
}
