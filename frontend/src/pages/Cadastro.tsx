import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { calcularResumo } from '../lib/calc';
import { LABEL_NIVEL_ATIVIDADE, type NivelAtividade } from '../types';

const NIVEIS: NivelAtividade[] = [
  'Sedentario',
  'Leve',
  'Moderado',
  'Intenso',
  'MuitoIntenso',
];

// ------- Validação (mensagens exatas do original) -------
const schema = z
  .object({
    nome: z
      .string()
      .min(1, 'O nome é obrigatório.')
      .max(200, 'O nome deve ter no máximo 200 caracteres.'),
    email: z
      .string()
      .min(1, 'O email é obrigatório.')
      .email('Email inválido.'),
    senha: z
      .string()
      .min(1, 'A senha é obrigatória.')
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
    confirmarSenha: z.string().min(1, 'A senha é obrigatória.'),
    aceiteLgpd: z.boolean().refine((v) => v === true, {
      error:
        'Para criar a conta, você precisa aceitar a Política de Privacidade e os Termos de Uso.',
    }),
    sexo: z.enum(['Masculino', 'Feminino'], { error: 'Sexo inválido.' }),
    dataNascimento: z.string().min(1, 'Data de nascimento inválida.'),
    altura: z
      .number({ error: 'Altura deve ser maior que zero.' })
      .positive({ error: 'Altura deve ser maior que zero.' }),
    nivelAtividade: z.enum(NIVEIS as [string, ...string[]], {
      error: 'Nível de atividade inválido.',
    }),
    pesoInicial: z
      .number({ error: 'Peso atual deve ser maior que zero.' })
      .positive({ error: 'Peso atual deve ser maior que zero.' }),
    pesoMeta: z
      .number({ error: 'Peso meta deve ser maior que zero.' })
      .positive({ error: 'Peso meta deve ser maior que zero.' }),
    metaAgua: z
      .number({ error: 'Meta de água deve ser maior que zero.' })
      .positive({ error: 'Meta de água deve ser maior que zero.' }),
    usaMounjaro: z.boolean(),
    metaCaloricaManual: z
      .number({ error: 'Meta calórica deve ser maior que zero.' })
      .positive({ error: 'Meta calórica deve ser maior que zero.' }),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    path: ['confirmarSenha'],
    error: 'As senhas devem corresponder.',
  })
  .refine((d) => new Date(d.dataNascimento) < new Date(new Date().toDateString()), {
    path: ['dataNascimento'],
    error: 'Data de nascimento inválida.',
  });

type Form = z.infer<typeof schema>;

// Campos validados por passo antes de avançar.
const CAMPOS_PASSO: FieldPath<Form>[][] = [
  ['nome', 'email', 'senha', 'confirmarSenha', 'aceiteLgpd'],
  ['sexo', 'dataNascimento', 'altura', 'nivelAtividade'],
  ['pesoInicial', 'pesoMeta', 'metaAgua', 'usaMounjaro', 'metaCaloricaManual'],
];

const PASSOS = ['Conta', 'Sobre você', 'Metas'];

export function Cadastro() {
  const navigate = useNavigate();
  const registrar = useAuthStore((s) => s.register);
  const [passo, setPasso] = useState(0);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [verSenha, setVerSenha] = useState(false);
  const metaEditadaRef = useRef(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      metaAgua: 2000,
      usaMounjaro: false,
      aceiteLgpd: false,
    },
  });

  const senhaAtual = watch('senha') ?? '';
  const pesoInicialAtual = watch('pesoInicial');

  // No passo de Metas, pré-preenche a meta calórica calculada (editável).
  // Recalcula ao informar o peso atual; só sobrescreve enquanto o usuário
  // não tiver editado o campo manualmente.
  useEffect(() => {
    if (passo !== 2 || metaEditadaRef.current) return;
    const v = getValues();
    if (!v.pesoInicial || v.pesoInicial <= 0) return;
    try {
      const { metaCalorica } = calcularResumo(
        {
          sexo: v.sexo,
          altura: v.altura,
          data_nascimento: v.dataNascimento,
          nivel_atividade: v.nivelAtividade as NivelAtividade,
          peso_inicial: v.pesoInicial,
          meta_calorica_manual: null,
        },
        v.pesoInicial,
      );
      setValue('metaCaloricaManual', metaCalorica);
    } catch {
      /* dados insuficientes — deixa o usuário preencher manualmente */
    }
  }, [passo, pesoInicialAtual, getValues, setValue]);

  const avancar = async () => {
    setErroGeral(null);
    const ok = await trigger(CAMPOS_PASSO[passo]);
    if (ok) setPasso((p) => Math.min(p + 1, PASSOS.length - 1));
  };

  const voltar = () => {
    setErroGeral(null);
    setPasso((p) => Math.max(p - 1, 0));
  };

  const onSubmit = async (v: Form) => {
    setErroGeral(null);
    try {
      await registrar({
        email: v.email,
        senha: v.senha,
        nome: v.nome,
        sexo: v.sexo,
        dataNascimento: v.dataNascimento,
        altura: v.altura,
        nivelAtividade: v.nivelAtividade,
        pesoInicial: v.pesoInicial,
        pesoMeta: v.pesoMeta,
        metaAgua: Math.round(v.metaAgua),
        usaMounjaro: v.usaMounjaro,
        metaCaloricaManual: Math.round(v.metaCaloricaManual),
      });
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    }
  };

  if (passo === -1) {
    return (
      <CadastroLayout>
        <div className="rounded-card bg-verde/10 p-5 text-center text-sm text-verde animate-fadeInUp">
          <Check className="mx-auto mb-2" />
          <p className="font-semibold">Conta criada!</p>
          <p className="mt-1">Confirme seu e-mail para ativar a conta e acessar o app.</p>
          <Link to="/login" className="mt-3 inline-block font-semibold text-accent">
            Ir para o login
          </Link>
        </div>
      </CadastroLayout>
    );
  }

  return (
    <CadastroLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <StepIndicator passo={passo} />

        {erroGeral && (
          <div
            role="alert"
            className="rounded-[10px] bg-vermelho/10 px-3 py-2 text-sm text-vermelho"
          >
            {erroGeral}
          </div>
        )}

        {/* Passo 1 — Conta */}
        {passo === 0 && (
          <div className="space-y-4 stagger">
            <Field label="Nome" erro={errors.nome?.message}>
              <input
                className="input-field"
                autoComplete="name"
                aria-invalid={!!errors.nome}
                {...register('nome')}
              />
            </Field>
            <Field label="E-mail" erro={errors.email?.message}>
              <input
                type="email"
                className="input-field"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
            </Field>
            <Field label="Senha" erro={errors.senha?.message}>
              <div className="relative">
                <input
                  type={verSenha ? 'text' : 'password'}
                  className="input-field pr-11"
                  autoComplete="new-password"
                  aria-invalid={!!errors.senha}
                  {...register('senha')}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-textSecondary"
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ForcaSenha senha={senhaAtual} />
            </Field>
            <Field label="Confirmar senha" erro={errors.confirmarSenha?.message}>
              <input
                type={verSenha ? 'text' : 'password'}
                className="input-field"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmarSenha}
                {...register('confirmarSenha')}
              />
            </Field>

            {/* Consentimento LGPD (art. 7º/11) — dados sensíveis de saúde */}
            <div>
              <label className="flex items-start gap-3 rounded-card bg-surface p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  aria-invalid={!!errors.aceiteLgpd}
                  {...register('aceiteLgpd')}
                />
                <span className="text-sm text-primary/90">
                  Li e concordo com a{' '}
                  <Link to="/privacidade" target="_blank" className="font-semibold text-accent hover:underline">
                    Política de Privacidade
                  </Link>{' '}
                  e os{' '}
                  <Link to="/termos" target="_blank" className="font-semibold text-accent hover:underline">
                    Termos de Uso
                  </Link>
                  , e <b>consinto</b> com o tratamento dos meus dados de saúde (peso,
                  alimentação, atividade e, se aplicável, Mounjaro) para o funcionamento do
                  app, conforme a LGPD.
                </span>
              </label>
              {errors.aceiteLgpd && (
                <p className="mt-1 text-xs text-vermelho">{errors.aceiteLgpd.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Passo 2 — Sobre você */}
        {passo === 1 && (
          <div className="space-y-4 stagger">
            <Field label="Sexo" erro={errors.sexo?.message}>
              <select className="input-field" aria-invalid={!!errors.sexo} {...register('sexo')}>
                <option value="">Selecione…</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </Field>
            <Field label="Data de nascimento" erro={errors.dataNascimento?.message}>
              <input
                type="date"
                className="input-field"
                aria-invalid={!!errors.dataNascimento}
                {...register('dataNascimento')}
              />
            </Field>
            <Field label="Altura (cm)" erro={errors.altura?.message}>
              <input
                type="number"
                step="0.1"
                className="input-field"
                aria-invalid={!!errors.altura}
                {...register('altura', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Nível de atividade" erro={errors.nivelAtividade?.message}>
              <select
                className="input-field"
                aria-invalid={!!errors.nivelAtividade}
                {...register('nivelAtividade')}
              >
                <option value="">Selecione…</option>
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>
                    {LABEL_NIVEL_ATIVIDADE[n]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* Passo 3 — Metas */}
        {passo === 2 && (
          <div className="space-y-4 stagger">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso atual (kg)" erro={errors.pesoInicial?.message}>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  aria-invalid={!!errors.pesoInicial}
                  {...register('pesoInicial', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Peso meta (kg)" erro={errors.pesoMeta?.message}>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  aria-invalid={!!errors.pesoMeta}
                  {...register('pesoMeta', { valueAsNumber: true })}
                />
              </Field>
            </div>
            <Field label="Meta de água (ml)" erro={errors.metaAgua?.message}>
              <input
                type="number"
                className="input-field"
                aria-invalid={!!errors.metaAgua}
                {...register('metaAgua', { valueAsNumber: true })}
              />
            </Field>
            <label className="flex items-center gap-3 rounded-card bg-surface p-3">
              <input type="checkbox" className="h-4 w-4 accent-accent" {...register('usaMounjaro')} />
              <span className="text-sm">Uso Mounjaro (tirzepatida)</span>
            </label>
            <Field
              label="Meta calórica (kcal)"
              erro={errors.metaCaloricaManual?.message}
              dica="Sugestão calculada do seu perfil — ajuste se quiser."
            >
              <input
                type="number"
                className="input-field"
                aria-invalid={!!errors.metaCaloricaManual}
                {...register('metaCaloricaManual', {
                  valueAsNumber: true,
                  onChange: () => (metaEditadaRef.current = true),
                })}
              />
            </Field>
          </div>
        )}

        {/* Navegação */}
        <div className="flex gap-3">
          {passo > 0 && (
            <Button type="button" variant="outline" onClick={voltar} className="flex-1">
              Voltar
            </Button>
          )}
          {passo < PASSOS.length - 1 ? (
            <Button type="button" onClick={avancar} className="flex-1">
              Continuar
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {isSubmitting ? 'Criando conta…' : 'Criar minha conta'}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-textSecondary">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-accent">
          Entrar
        </Link>
      </p>
    </CadastroLayout>
  );
}

// ---------------- subcomponentes ----------------

function CadastroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg animate-fadeInUp">
        <Link to="/" className="mb-6 block text-center">
          <span className="font-display text-3xl font-bold text-accent">Déficit</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-semibold">Criar conta</h1>
          <p className="mb-5 mt-1 text-sm text-textSecondary">
            Preencha seu perfil e comece a controlar seu déficit.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ passo }: { passo: number }) {
  return (
    <div className="flex items-center gap-2">
      {PASSOS.map((nome, i) => (
        <div key={nome} className="flex flex-1 flex-col gap-1">
          <div
            className={`h-1.5 rounded-full transition-colors ${
              i <= passo ? 'bg-accent' : 'bg-primary/10'
            }`}
          />
          <span
            className={`text-[11px] ${i === passo ? 'font-semibold text-accent' : 'text-textSecondary'}`}
          >
            {i + 1}. {nome}
          </span>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  erro,
  dica,
  children,
}: {
  label: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-textSecondary">{dica}</p>}
      {erro && <p className="mt-1 text-xs text-vermelho">{erro}</p>}
    </div>
  );
}

/** Medidor de força simples — informativo, não bloqueia além das regras do zod. */
function ForcaSenha({ senha }: { senha: string }) {
  if (!senha) return null;
  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;
  const rotulos = ['Fraca', 'Fraca', 'Média', 'Boa', 'Forte'];
  const cores = ['bg-vermelho', 'bg-vermelho', 'bg-accent', 'bg-verde', 'bg-verde'];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? cores[score] : 'bg-primary/10'}`}
          />
        ))}
      </div>
      <span className="text-[11px] text-textSecondary">{rotulos[score]}</span>
    </div>
  );
}
