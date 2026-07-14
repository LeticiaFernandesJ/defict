import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bell, LogOut, ChevronRight, Check, Trash2, Info } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../lib/authClient';
import { calcularResumo } from '../lib/calc';
import {
  LABEL_NIVEL_ATIVIDADE,
  NIVEIS_ATIVIDADE,
  type NivelAtividade,
  type Sexo,
} from '../types';
import { fmtNum } from '../lib/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/States';

const APP_VERSION = '1.0.0';

export function Configuracoes() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [recarregando, setRecarregando] = useState(false);
  const [tentou, setTentou] = useState(false);

  // Auto-recuperação: se o perfil não veio (e não está carregando), tenta buscar 1×.
  useEffect(() => {
    if (!profile && !loading && !tentou) {
      setTentou(true);
      loadProfile();
    }
  }, [profile, loading, tentou, loadProfile]);

  const recarregar = async () => {
    setRecarregando(true);
    await loadProfile();
    setRecarregando(false);
  };

  if (!profile) {
    // ainda carregando (sessão/perfil) → skeleton
    if (loading || !tentou || recarregando) {
      return (
        <div className="space-y-4">
          <PageHeader titulo="Configurações" subtitulo="perfil, metas e preferências" />
          <div className="h-40 animate-pulse rounded-card bg-primary/5" />
        </div>
      );
    }
    // carregou mas não há perfil → erro claro + tentar novamente
    return (
      <div className="space-y-4">
        <PageHeader titulo="Configurações" subtitulo="perfil, metas e preferências" />
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="text-vermelho" size={30} />
          <p className="font-medium">Não foi possível carregar seu perfil</p>
          <p className="mut max-w-sm">
            Verifique sua conexão. Se persistir, seu perfil pode não ter sido criado no banco —
            saia e entre novamente, ou refaça o cadastro/onboarding.
          </p>
          <Button onClick={recarregar} loading={recarregando} className="px-5">
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 stagger">
      <PageHeader titulo="Configurações" subtitulo="perfil, metas e preferências" />
      <SecaoPerfil />
      <SecaoMetas />
      <SecaoPreferencias />
      <SecaoConta />
      <SecaoPerigo />
      <SecaoSobre />
    </div>
  );
}

// ------------------------------------------------------------------ Perfil
function SecaoPerfil() {
  const { profile, updateProfile } = useAuthStore();
  const qc = useQueryClient();
  const [nome, setNome] = useState(profile?.nome ?? '');
  const [sexo, setSexo] = useState<Sexo | ''>(profile?.sexo ?? '');
  const [nascimento, setNascimento] = useState(profile?.data_nascimento ?? '');
  const [altura, setAltura] = useState<number | ''>(profile?.altura ?? '');
  const [pesoInicial, setPesoInicial] = useState<number | ''>(profile?.peso_inicial ?? '');
  const [pesoMeta, setPesoMeta] = useState<number | ''>(profile?.peso_meta ?? '');
  const [nivel, setNivel] = useState<NivelAtividade | ''>(profile?.nivel_atividade ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});
  const salvar = useSalvar();

  const validar = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'O nome é obrigatório.';
    if (nome.length > 200) e.nome = 'Máximo de 200 caracteres.';
    if (nascimento && new Date(nascimento) >= new Date(new Date().toDateString()))
      e.nascimento = 'Data de nascimento inválida.';
    if (altura !== '' && Number(altura) <= 0) e.altura = 'Altura deve ser maior que zero.';
    if (pesoInicial !== '' && Number(pesoInicial) <= 0) e.pesoInicial = 'Peso deve ser maior que zero.';
    if (pesoMeta !== '' && Number(pesoMeta) <= 0) e.pesoMeta = 'Peso deve ser maior que zero.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const onSalvar = () => {
    if (!validar()) return;
    salvar.run(async () => {
      await updateProfile({
        nome: nome.trim(),
        sexo: (sexo || null) as Sexo | null,
        data_nascimento: nascimento || null,
        altura: altura === '' ? null : Number(altura),
        peso_inicial: pesoInicial === '' ? null : Number(pesoInicial),
        peso_meta: pesoMeta === '' ? null : Number(pesoMeta),
        nivel_atividade: (nivel || null) as NivelAtividade | null,
      });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });
  };

  return (
    <SecaoCard titulo="Perfil">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome" erro={erros.nome} full>
          <input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erros.nome} />
        </Field>
        <Field label="Sexo">
          <select className="input-field" value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
            <option value="">—</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </Field>
        <Field label="Data de nascimento" erro={erros.nascimento}>
          <input type="date" className="input-field" value={nascimento ?? ''} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNascimento(e.target.value)} aria-invalid={!!erros.nascimento} />
        </Field>
        <Field label="Altura (cm)" erro={erros.altura}>
          <input type="number" step="0.1" className="input-field" value={altura} onChange={(e) => setAltura(e.target.value === '' ? '' : Number(e.target.value))} aria-invalid={!!erros.altura} />
        </Field>
        <Field label="Peso inicial (referência) kg" erro={erros.pesoInicial}>
          <input type="number" step="0.1" className="input-field" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value === '' ? '' : Number(e.target.value))} aria-invalid={!!erros.pesoInicial} />
        </Field>
        <Field label="Peso meta (kg)" erro={erros.pesoMeta}>
          <input type="number" step="0.1" className="input-field" value={pesoMeta} onChange={(e) => setPesoMeta(e.target.value === '' ? '' : Number(e.target.value))} aria-invalid={!!erros.pesoMeta} />
        </Field>
        <Field label="Nível de atividade" full>
          <select className="input-field" value={nivel} onChange={(e) => setNivel(e.target.value as NivelAtividade)}>
            <option value="">—</option>
            {NIVEIS_ATIVIDADE.map((n) => (
              <option key={n} value={n}>
                {LABEL_NIVEL_ATIVIDADE[n]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <SaveBtn label="Salvar perfil" status={salvar.status} erro={salvar.erro} onClick={onSalvar} />
    </SecaoCard>
  );
}

// ------------------------------------------------------------------ Metas
function SecaoMetas() {
  const { profile, updateProfile } = useAuthStore();
  const qc = useQueryClient();
  const [automatica, setAutomatica] = useState(profile?.meta_calorica_manual == null);
  const [metaCal, setMetaCal] = useState<number | ''>(profile?.meta_calorica_manual ?? '');
  const [metaAgua, setMetaAgua] = useState<number | ''>(profile?.meta_agua ?? 2000);
  const salvar = useSalvar();

  let metaAuto: number | null = null;
  let faltamDados = false;
  try {
    metaAuto = profile ? calcularResumo(profile).metaCalorica : null;
  } catch {
    faltamDados = true;
  }

  const onSalvar = () => {
    if (metaAgua === '' || Number(metaAgua) <= 0) return;
    salvar.run(async () => {
      await updateProfile({
        meta_calorica_manual: automatica ? null : metaCal === '' ? null : Number(metaCal),
        meta_agua: Math.round(Number(metaAgua)),
      });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });
  };

  return (
    <SecaoCard titulo="Metas">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-accent" checked={automatica} onChange={(e) => setAutomatica(e.target.checked)} />
        Calcular meta calórica automaticamente
      </label>

      {automatica ? (
        <div className="mt-2 rounded-card bg-surface p-3">
          {faltamDados ? (
            <p className="mut">
              Dados insuficientes — informe altura, peso inicial, data de nascimento e nível de atividade acima.
            </p>
          ) : (
            <p className="text-sm text-primary">
              Meta calculada: <b>{fmtNum(metaAuto ?? 0)} kcal/dia</b>{' '}
              <span className="mut">(atualiza com o perfil)</span>
            </p>
          )}
        </div>
      ) : (
        <Field label="Meta calórica (kcal)" full>
          <input type="number" className="input-field" value={metaCal} onChange={(e) => setMetaCal(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
      )}

      <Field label="Meta de água (ml)" full>
        <input type="number" className="input-field" value={metaAgua} onChange={(e) => setMetaAgua(e.target.value === '' ? '' : Number(e.target.value))} />
      </Field>
      <SaveBtn label="Salvar metas" status={salvar.status} erro={salvar.erro} onClick={onSalvar} />
    </SecaoCard>
  );
}

// ------------------------------------------------------------- Preferências
function SecaoPreferencias() {
  const { profile, updateProfile } = useAuthStore();
  const permissao =
    typeof Notification !== 'undefined'
      ? Notification.permission === 'granted'
        ? 'concedida'
        : Notification.permission === 'denied'
          ? 'negada'
          : 'não solicitada'
      : 'indisponível';

  return (
    <div className="space-y-4">
      <Card className="!border-2 !border-[#E7C9B5]">
        <div className="row">
          <div>
            <div className="text-[15px] font-medium text-primary">Uso Mounjaro</div>
            <div className="mut">Ativa a área de registro de aplicações.</div>
          </div>
          <Toggle
            ativo={profile?.usa_mounjaro ?? false}
            cor="var(--cor-destaque)"
            onChange={(v) => updateProfile({ usa_mounjaro: v })}
          />
        </div>
      </Card>

      <Card>
        <Link to="/configuracoes/notificacoes" className="row">
          <span className="flex items-center gap-2 text-sm text-primary">
            <Bell size={16} className="text-accent" /> Notificações
          </span>
          <span className="flex items-center gap-2">
            <span className="mut">permissão: {permissao}</span>
            <ChevronRight size={16} className="text-textSecondary" />
          </span>
        </Link>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------ Conta e segurança
function SecaoConta() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const applyToken = useAuthStore((s) => s.applyToken);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const salvarEmail = useSalvar();
  const salvarSenha = useSalvar();

  const onEmail = () => {
    if (!email) return;
    salvarEmail.run(async () => {
      const { token } = await authApi.changeEmail(email);
      applyToken(token); // novo token com o e-mail atualizado
      setEmail('');
    });
  };

  const validarSenha = () => {
    if (senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula.';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter pelo menos um número.';
    if (senha !== confirmar) return 'As senhas devem corresponder.';
    return null;
  };

  const onSenha = () => {
    const err = validarSenha();
    setErroSenha(err);
    if (err) return;
    salvarSenha.run(async () => {
      await authApi.changePassword(senha);
      setSenha('');
      setConfirmar('');
    });
  };

  const sair = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <SecaoCard titulo="Conta e segurança">
      <div className="rounded-card bg-surface p-3">
        <p className="mut">E-mail atual</p>
        <p className="text-sm font-medium text-primary">{user?.email ?? '—'}</p>
      </div>

      <Field label="Novo e-mail" full>
        <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deixe em branco para manter" />
      </Field>
      <p className="mut !text-[11px]">Ao alterar, enviamos um link de confirmação para o novo endereço.</p>
      <SaveBtn label="Alterar e-mail" status={salvarEmail.status} erro={salvarEmail.erro} onClick={onEmail} />

      <div className="mt-4 border-t border-[#F1EBE1] pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nova senha">
            <input type="password" className="input-field" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirmar senha">
            <input type="password" className="input-field" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {erroSenha && <p className="mt-1 text-xs text-vermelho">{erroSenha}</p>}
        <SaveBtn label="Alterar senha" status={salvarSenha.status} erro={salvarSenha.erro} onClick={onSenha} />
      </div>

      <button onClick={sair} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border border-primary/20 py-3 text-sm font-medium text-primary hover:bg-primary/5">
        <LogOut size={16} /> Sair da conta
      </button>
    </SecaoCard>
  );
}

// ------------------------------------------------------------- Zona de perigo
function SecaoPerigo() {
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const excluir = async () => {
    setExcluindo(true);
    setErro(null);
    try {
      await authApi.deleteAccount();
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setErro('Não foi possível excluir a conta. Talvez precise sair e entrar novamente.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <Card className="!border-2 !border-vermelho/25">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-vermelho">Zona de perigo</p>
      <p className="mut mb-3">Excluir sua conta remove permanentemente todos os seus dados.</p>
      <button onClick={() => setAberto(true)} className="flex items-center justify-center gap-2 rounded-[10px] bg-vermelho px-4 py-3 text-sm font-medium text-white hover:brightness-95">
        <Trash2 size={16} /> Excluir minha conta
      </button>
      {erro && <p className="mt-2 text-xs text-vermelho">{erro}</p>}
      <ConfirmDialog
        open={aberto}
        titulo="Excluir minha conta?"
        descricao="Essa ação é permanente e apaga todos os seus dados."
        confirmarLabel={excluindo ? 'Excluindo…' : 'Excluir'}
        onConfirm={excluir}
        onClose={() => setAberto(false)}
      />
    </Card>
  );
}

// ------------------------------------------------------------------ Sobre
function SecaoSobre() {
  return (
    <Card>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-textSecondary">Sobre</p>
      <p className="text-sm text-primary">Déficit · versão {APP_VERSION}</p>
      <Link to="/" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent">
        <Info size={14} /> Sobre o app e FAQ
      </Link>
      <p className="mut mt-3 !text-[11px]">
        O Déficit é uma ferramenta de registro e acompanhamento e não substitui orientação de
        nutricionista ou médico.
      </p>
    </Card>
  );
}

// ------------------------------------------------------------------ helpers
function SecaoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-textSecondary">{titulo}</p>
      {children}
    </Card>
  );
}

function Field({
  label,
  erro,
  full,
  children,
}: {
  label: string;
  erro?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-medium ${full ? 'sm:col-span-2' : ''}`}>
      {label}
      <div className="mt-1">{children}</div>
      {erro && <p className="mt-1 text-xs font-normal text-vermelho">{erro}</p>}
    </label>
  );
}

type Status = 'idle' | 'salvando' | 'salvo' | 'erro';
function useSalvar() {
  const [status, setStatus] = useState<Status>('idle');
  const [erro, setErro] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setStatus('salvando');
    setErro(null);
    try {
      await fn();
      setStatus('salvo');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      setStatus('erro');
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
  };
  return { status, erro, run };
}

function SaveBtn({
  label,
  status,
  erro,
  onClick,
}: {
  label: string;
  status: Status;
  erro: string | null;
  onClick: () => void;
}) {
  return (
    <div>
      <Button onClick={onClick} loading={status === 'salvando'} className="w-full">
        {status === 'salvo' ? (
          <>
            <Check size={16} /> Salvo
          </>
        ) : (
          label
        )}
      </Button>
      {status === 'erro' && erro && <p className="mt-1 text-xs text-vermelho">{erro}</p>}
    </div>
  );
}
