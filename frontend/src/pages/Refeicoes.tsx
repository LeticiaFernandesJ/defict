import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  BookOpen,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import {
  useRefeicoes,
  useRefeicaoMutations,
  somarItens,
  type NovoItem,
  type RefeicaoComItens,
} from '../hooks/useRefeicoes';
import { gemini } from '../lib/gemini';
import { calcularResumo } from '../lib/calc';
import { hojeISO, addDiasISO, fmtData, fmtNum } from '../lib/dates';
import { LABEL_TIPO_REFEICAO, TIPOS_REFEICAO, type ItemRefeicao } from '../types';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { NumericInput } from '../components/ui/NumericInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Carregando, EstadoErro, EstadoVazio } from '../components/ui/States';
import { SecaoCardapio } from '../components/refeicoes/SecaoCardapio';

export function Refeicoes() {
  const { profile } = useAuthStore();
  const [dataISO, setDataISO] = useState(hojeISO());
  const [modalTipo, setModalTipo] = useState(false);
  const [itemModal, setItemModal] = useState<{ refeicaoId?: number; item?: ItemRefeicao } | null>(null);
  const [excluir, setExcluir] = useState<{ tipo: 'item' | 'refeicao'; id: number } | null>(null);
  const [mostrarCardapio, setMostrarCardapio] = useState(false);

  const { data: refeicoes, isLoading, isError, refetch } = useRefeicoes(profile?.id, dataISO);
  const mut = useRefeicaoMutations(profile?.id, dataISO);

  const meta = useMemo(() => {
    if (!profile) return 1850;
    try {
      return calcularResumo(profile).metaCalorica;
    } catch {
      return profile.meta_calorica_manual ?? 1850;
    }
  }, [profile]);

  const totalDia = useMemo(
    () => somarItens((refeicoes ?? []).flatMap((r) => r.itens ?? [])),
    [refeicoes],
  );
  const pct = meta > 0 ? Math.min(100, (totalDia.calorias / meta) * 100) : 0;
  const lista = refeicoes ?? [];

  return (
    <div className="space-y-4">
      {/* Header + navegação de data */}
      <div className="row animate-fadeIn">
        <div>
          <h1 className="ph1">Refeições</h1>
          <p className="psub">{fmtData(dataISO)}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-textSecondary">
          <button onClick={() => setDataISO((d) => addDiasISO(d, -1))} className="rounded-full p-1.5 hover:bg-branco" aria-label="Dia anterior">
            <ChevronLeft size={18} />
          </button>
          <span>{dataISO === hojeISO() ? 'hoje' : fmtData(dataISO).slice(0, 5)}</span>
          <button
            onClick={() => setDataISO((d) => addDiasISO(d, 1))}
            disabled={dataISO >= hojeISO()}
            className="rounded-full p-1.5 hover:bg-branco disabled:opacity-30"
            aria-label="Próximo dia"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading && <Carregando />}
      {isError && <EstadoErro onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Coluna esquerda — refeições */}
          <div className="flex flex-col gap-3.5">
            {lista.length === 0 ? (
              <EstadoVazio
                icon={UtensilsCrossed}
                titulo="Nenhuma refeição registrada"
                descricao="Adicione sua primeira refeição do dia."
                acao={{ label: 'Adicionar refeição', onClick: () => setModalTipo(true) }}
              />
            ) : (
              lista.map((r) => (
                <RefeicaoCard
                  key={r.id}
                  refeicao={r}
                  onAddItem={() => setItemModal({ refeicaoId: r.id })}
                  onEditItem={(item) => setItemModal({ refeicaoId: r.id, item })}
                  onDeleteItem={(id) => setExcluir({ tipo: 'item', id })}
                  onDeleteRefeicao={() => setExcluir({ tipo: 'refeicao', id: r.id })}
                />
              ))
            )}
          </div>

          {/* Coluna direita — resumo + ações */}
          <div className="flex flex-col gap-3.5">
            <Card>
              <p className="mut">Resumo do dia</p>
              <div className="my-1 font-display text-[26px] font-semibold text-ink">
                {fmtNum(totalDia.calorias)}
                <span className="text-[13px] font-normal text-textSecondary"> / {fmtNum(meta)}</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${pct}%`, background: totalDia.calorias > meta ? 'var(--cor-vermelho)' : 'var(--cor-destaque)' }} />
              </div>
              <div className="mt-3 flex justify-between text-xs text-textSecondary">
                <span>P {fmtNum(totalDia.proteinas)}g</span>
                <span>C {fmtNum(totalDia.carboidratos)}g</span>
                <span>G {fmtNum(totalDia.gorduras)}g</span>
                <span>F {fmtNum(totalDia.fibras)}g</span>
              </div>
            </Card>

            <button onClick={() => setModalTipo(true)} className="btn-primary w-full">
              <Plus size={16} /> Adicionar refeição
            </button>
            <button
              onClick={() =>
                lista.length ? setItemModal({}) : setModalTipo(true)
              }
              className="btn-outline w-full border-dashed"
            >
              <Sparkles size={16} /> Calcular nutrientes com IA
            </button>
            <button
              onClick={() => setMostrarCardapio((v) => !v)}
              className={`btn-outline w-full ${mostrarCardapio ? '!border-accent !text-accent' : ''}`}
            >
              <BookOpen size={16} /> {mostrarCardapio ? 'Ocultar cardápio' : 'Gerar cardápio com IA'}
            </button>
          </div>
        </div>
      )}

      {mostrarCardapio && <SecaoCardapio dataISO={dataISO} />}

      {/* Modal escolher tipo */}
      <Modal open={modalTipo} onClose={() => setModalTipo(false)} title="Adicionar refeição">
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_REFEICAO.map((t) => (
            <button
              key={t}
              onClick={async () => {
                setModalTipo(false);
                await mut.criarRefeicao.mutateAsync(t);
              }}
              className="fchip justify-center !py-3"
            >
              {LABEL_TIPO_REFEICAO[t]}
            </button>
          ))}
        </div>
      </Modal>

      {/* Modal item */}
      {itemModal && (
        <ItemModal
          item={itemModal.item}
          refeicoes={lista}
          refeicaoIdFixa={itemModal.refeicaoId}
          onClose={() => setItemModal(null)}
          onSave={async (refeicaoId, novo) => {
            if (itemModal.item) {
              await mut.atualizarItem.mutateAsync({ id: itemModal.item.id, item: novo });
            } else {
              await mut.adicionarItem.mutateAsync({ refeicaoId, item: novo });
            }
            setItemModal(null);
          }}
        />
      )}

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={() => {
          if (!excluir) return;
          if (excluir.tipo === 'item') mut.excluirItem.mutate(excluir.id);
          else mut.excluirRefeicao.mutate(excluir.id);
        }}
      />
    </div>
  );
}

function RefeicaoCard({
  refeicao,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteRefeicao,
}: {
  refeicao: RefeicaoComItens;
  onAddItem: () => void;
  onEditItem: (item: ItemRefeicao) => void;
  onDeleteItem: (id: number) => void;
  onDeleteRefeicao: () => void;
}) {
  const total = somarItens(refeicao.itens ?? []);
  return (
    <Card>
      <div className="row">
        <span className="text-[15px] font-medium text-ink">
          {LABEL_TIPO_REFEICAO[refeicao.tipo_refeicao]}
        </span>
        <div className="flex items-center gap-2">
          <span className="mut">{fmtNum(total.calorias)} kcal</span>
          <button onClick={onDeleteRefeicao} className="text-textSecondary hover:text-vermelho" aria-label="Excluir refeição">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-2.5">
        {(refeicao.itens ?? []).length === 0 ? (
          <p className="mut py-1">Nenhum item ainda.</p>
        ) : (
          refeicao.itens.map((it) => (
            <div key={it.id} className="group row py-1.5">
              <span className="mut truncate">
                {it.nome_alimento} · {fmtNum(it.quantidade, 0)} {it.unidade}
              </span>
              <span className="flex items-center gap-2">
                <span className="mut">{fmtNum(it.calorias)} kcal</span>
                <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => onEditItem(it)} className="text-textSecondary hover:text-accent" aria-label="Editar">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => onDeleteItem(it.id)} className="text-textSecondary hover:text-vermelho" aria-label="Excluir">
                    <Trash2 size={13} />
                  </button>
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      <button onClick={onAddItem} className="mt-2 flex items-center gap-1 text-[13px] font-medium text-accent">
        <Plus size={14} /> item
      </button>
    </Card>
  );
}

function ItemModal({
  item,
  refeicoes,
  refeicaoIdFixa,
  onClose,
  onSave,
}: {
  item?: ItemRefeicao;
  refeicoes: RefeicaoComItens[];
  refeicaoIdFixa?: number;
  onClose: () => void;
  onSave: (refeicaoId: number, novo: NovoItem) => Promise<void>;
}) {
  const [refeicaoId, setRefeicaoId] = useState<number>(refeicaoIdFixa ?? refeicoes[0]?.id ?? 0);
  const [nome, setNome] = useState(item?.nome_alimento ?? '');
  const [quantidade, setQuantidade] = useState<number | ''>(item?.quantidade ?? 100);
  const [unidade, setUnidade] = useState(item?.unidade ?? 'g');
  const [macros, setMacros] = useState({
    calorias: item?.calorias ?? 0,
    proteinas: item?.proteinas ?? 0,
    carboidratos: item?.carboidratos ?? 0,
    gorduras: item?.gorduras ?? 0,
    fibras: item?.fibras ?? 0,
  });
  const [calc, setCalc] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const calcularIA = async () => {
    if (!nome.trim() || !quantidade) return;
    setCalc(true);
    setErroIA(null);
    try {
      const { nutrientes } = await gemini.nutrientes(nome, quantidade, unidade);
      setMacros(nutrientes);
    } catch {
      setErroIA('Não foi possível calcular. Preencha manualmente.');
    } finally {
      setCalc(false);
    }
  };

  const salvar = async () => {
    if (!nome.trim() || !refeicaoId || !quantidade) return;
    setSalvando(true);
    await onSave(refeicaoId, { nome_alimento: nome, quantidade, unidade, ...macros });
    setSalvando(false);
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Editar item' : 'Adicionar item'}>
      <div className="space-y-3">
        {!refeicaoIdFixa && !item && (
          <div>
            <p className="lb-modal">Refeição</p>
            <select className="input-field" value={refeicaoId} onChange={(e) => setRefeicaoId(Number(e.target.value))}>
              {refeicoes.map((r) => (
                <option key={r.id} value={r.id}>
                  {LABEL_TIPO_REFEICAO[r.tipo_refeicao]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="lb-modal">Alimento</p>
          <input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Batata doce cozida" />
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <p className="lb-modal">Qtd.</p>
            <NumericInput value={quantidade} onValueChange={setQuantidade} />
          </div>
          <div className="flex-1">
            <p className="lb-modal">Unidade</p>
            <select className="input-field" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="un">un</option>
              <option value="fatia">fatia</option>
              <option value="colher">colher</option>
            </select>
          </div>
        </div>

        <button onClick={calcularIA} disabled={calc} className="btn-outline w-full border-dashed">
          <Sparkles size={16} /> {calc ? 'Calculando…' : 'Calcular nutrientes com IA'}
        </button>
        {erroIA && <p className="text-xs text-vermelho">{erroIA}</p>}

        {/* Chips de nutrientes (editáveis ao clicar) */}
        <div className="flex flex-wrap gap-2">
          <NutChip label="kcal" k="calorias" macros={macros} setMacros={setMacros} destaque />
          <NutChip label="P" k="proteinas" macros={macros} setMacros={setMacros} />
          <NutChip label="C" k="carboidratos" macros={macros} setMacros={setMacros} />
          <NutChip label="G" k="gorduras" macros={macros} setMacros={setMacros} />
          <NutChip label="Fib" k="fibras" macros={macros} setMacros={setMacros} />
        </div>

        <Button onClick={salvar} loading={salvando} className="w-full">
          Salvar item
        </Button>
      </div>
    </Modal>
  );
}

type Macros = { calorias: number; proteinas: number; carboidratos: number; gorduras: number; fibras: number };
function NutChip({
  label,
  k,
  macros,
  setMacros,
  destaque,
}: {
  label: string;
  k: keyof Macros;
  macros: Macros;
  setMacros: (fn: (m: Macros) => Macros) => void;
  destaque?: boolean;
}) {
  return (
    <label className={`fchip ${destaque ? 'fchip-on' : ''}`}>
      <NumericInput
        casasDecimais={1}
        value={macros[k]}
        onValueChange={(v) => setMacros((m) => ({ ...m, [k]: v === '' ? 0 : v }))}
        className="w-12 bg-transparent text-right outline-none"
      />
      {label}
    </label>
  );
}
