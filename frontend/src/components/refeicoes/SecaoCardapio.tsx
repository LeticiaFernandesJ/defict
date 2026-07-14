import { useState } from 'react';
import { Sparkles, Check, History, UtensilsCrossed, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { gemini } from '../../lib/gemini';
import { calcularResumo } from '../../lib/calc';
import { hojeISO, fmtData } from '../../lib/dates';
import {
  useCardapios,
  useCardapioMutations,
  mapTipo,
  type CardDia,
  type CardRef,
} from '../../hooks/useCardapios';
import { LABEL_TIPO_REFEICAO, TIPOS_REFEICAO } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const REFEICOES_LABELS = TIPOS_REFEICAO.map((t) => LABEL_TIPO_REFEICAO[t]);

export function SecaoCardapio({ dataISO }: { dataISO: string }) {
  const { profile } = useAuthStore();
  const historico = useCardapios(profile?.id);
  const mut = useCardapioMutations(profile?.id);
  const [pref, setPref] = useState('');
  const [restr, setRestr] = useState('');
  const [refsSel, setRefsSel] = useState<string[]>(REFEICOES_LABELS);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dias, setDias] = useState<CardDia[] | null>(null);
  const [cardapioId, setCardapioId] = useState<number | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [marcando, setMarcando] = useState<string | null>(null);
  const [confirmarDelete, setConfirmarDelete] = useState<number | null>(null);

  const meta = (() => {
    if (!profile) return 1850;
    try {
      return calcularResumo(profile).metaCalorica;
    } catch {
      return profile.meta_calorica_manual ?? 1850;
    }
  })();

  const toggleRef = (label: string) =>
    setRefsSel((atual) =>
      atual.includes(label)
        ? atual.filter((x) => x !== label)
        : REFEICOES_LABELS.filter((x) => atual.includes(x) || x === label),
    );

  const gerar = async () => {
    if (refsSel.length === 0) {
      setErro('Escolha ao menos uma refeição.');
      return;
    }
    setGerando(true);
    setErro(null);
    setDias(null);
    setCardapioId(null);
    setMarcados(new Set());
    try {
      const { cardapio } = await gemini.cardapio(pref, restr, meta, refsSel);
      const lista = (cardapio as { dias?: CardDia[] })?.dias;
      if (!lista?.length) {
        setErro('A IA não retornou um cardápio válido. Tente novamente.');
      } else {
        setDias(lista);
        const salvo = await mut.salvar
          .mutateAsync({ preferencias: pref, restricoes: restr, metaCalorica: meta, inicioSemana: hojeISO(), dias: lista })
          .catch(() => null);
        if (salvo) setCardapioId(salvo.id);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar o cardápio.');
    } finally {
      setGerando(false);
    }
  };

  const marcarRealizado = async (key: string, ref: CardRef) => {
    setMarcando(key);
    try {
      await mut.importarRefeicao.mutateAsync({ ref, dataISO });
      setMarcados((s) => new Set(s).add(key));
    } catch {
      setErro('Não foi possível salvar a refeição. Tente novamente.');
    } finally {
      setMarcando(null);
    }
  };

  const deletar = async (id: number) => {
    await mut.excluir.mutateAsync(id).catch(() => {});
    if (id === cardapioId) {
      setDias(null);
      setCardapioId(null);
      setMarcados(new Set());
    }
  };

  const resumoItens = (ref: CardRef) =>
    (ref.itens ?? []).map((it) => `${it.nomeAlimento} (${it.quantidade}${it.unidade})`).join(', ') ||
    ref.descricao ||
    '';

  return (
    <div className="space-y-4">
      <Card className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <span className="font-medium text-primary">Cardápio com IA</span>
        </div>
        <p className="mut">A IA monta uma semana dentro da sua meta ({meta} kcal). Marque o que você comer.</p>

        <p className="lb-modal !mt-3">Refeições do dia</p>
        <div className="flex flex-wrap gap-2">
          {REFEICOES_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleRef(label)}
              className={`fchip ${refsSel.includes(label) ? 'fchip-on' : ''}`}
              aria-pressed={refsSel.includes(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="lb-modal !mt-3">Preferências</p>
        <input className="input-field" placeholder="Mais proteína, low carb…" value={pref} onChange={(e) => setPref(e.target.value)} />
        <p className="lb-modal !mt-3">Restrições</p>
        <input className="input-field" placeholder="Sem lactose…" value={restr} onChange={(e) => setRestr(e.target.value)} />
        <Button onClick={gerar} loading={gerando} className="mt-4 w-full">
          <Sparkles size={16} /> Gerar cardápio
        </Button>
        {erro && <p className="text-sm text-vermelho">{erro}</p>}
      </Card>

      {dias && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="mut !text-[11px]">
              Ao marcar "Comi isso", a refeição é salva no dia <b className="text-primary">{fmtData(dataISO)}</b> com os nutrientes.
            </p>
            <button
              onClick={() => (cardapioId ? setConfirmarDelete(cardapioId) : (setDias(null), setMarcados(new Set())))}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-vermelho hover:underline"
            >
              <Trash2 size={13} /> Deletar cardápio
            </button>
          </div>
          <div className="space-y-3 stagger">
            {dias.map((dia, i) => (
              <Card key={i}>
                <p className="mb-2 font-medium text-primary">{dia.nomeDia ?? `Dia ${i + 1}`}</p>
                <div className="space-y-2">
                  {(dia.refeicoes ?? []).map((ref, j) => {
                    const key = `${i}-${j}`;
                    const feito = marcados.has(key);
                    return (
                      <div key={j} className="rounded-card bg-surface p-2.5">
                        <div className="row">
                          <p className="text-sm font-medium text-primary">{LABEL_TIPO_REFEICAO[mapTipo(ref.tipo, j)]}</p>
                          <button
                            onClick={() => marcarRealizado(key, ref)}
                            disabled={feito || marcando === key}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              feito ? 'bg-verde/15 text-verde' : 'bg-accent/10 text-accent hover:bg-accent/20'
                            }`}
                          >
                            {feito ? (
                              <>
                                <Check size={13} /> Comido
                              </>
                            ) : marcando === key ? (
                              'Salvando…'
                            ) : (
                              <>
                                <UtensilsCrossed size={13} /> Comi isso
                              </>
                            )}
                          </button>
                        </div>
                        <p className="mut mt-0.5">{resumoItens(ref)}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {(historico.data?.length ?? 0) > 0 && (
        <Card>
          <p className="mut mb-2 flex items-center gap-1.5">
            <History size={15} /> Cardápios anteriores
          </p>
          <ul className="divide-y divide-[#F1EBE1]">
            {(historico.data ?? []).map((c) => (
              <li key={c.id} className="row py-2">
                <div className="min-w-0">
                  <p className="text-sm text-primary">{fmtData(c.criado_em)}</p>
                  <p className="mut truncate">
                    {c.preferencias || 'sem preferências'} · {c.meta_calorica} kcal
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => {
                      setDias(c.dias as CardDia[]);
                      setCardapioId(c.id);
                      setMarcados(new Set());
                      setErro(null);
                    }}
                    className="text-xs font-medium text-accent"
                  >
                    ver
                  </button>
                  <button
                    onClick={() => setConfirmarDelete(c.id)}
                    className="text-textSecondary hover:text-vermelho"
                    aria-label="Deletar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmarDelete != null}
        titulo="Deletar cardápio?"
        descricao="O cardápio será removido. As refeições que você já marcou como comidas continuam salvas."
        onConfirm={() => confirmarDelete != null && deletar(confirmarDelete)}
        onClose={() => setConfirmarDelete(null)}
      />
    </div>
  );
}
