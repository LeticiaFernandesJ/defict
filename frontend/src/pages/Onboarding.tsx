import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { LABEL_NIVEL_ATIVIDADE, type NivelAtividade } from '../types';

const NIVEIS: NivelAtividade[] = [
  'Sedentario',
  'Leve',
  'Moderado',
  'Intenso',
  'MuitoIntenso',
];

const num = (msg: string) =>
  z.number({ error: msg }).positive({ error: msg });

const schema = z.object({
  sexo: z.enum(['Masculino', 'Feminino']),
  data_nascimento: z.string().min(1, 'Informe a data'),
  altura: num('Altura inválida'),
  peso_inicial: num('Peso inválido'),
  peso_meta: num('Meta inválida'),
  nivel_atividade: z.enum(NIVEIS as [string, ...string[]]),
  usa_mounjaro: z.boolean(),
});
type Form = z.infer<typeof schema>;

export function Onboarding() {
  const navigate = useNavigate();
  const { user, loadProfile } = useAuthStore();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { usa_mounjaro: false },
  });

  const onSubmit = async (v: Form) => {
    setErro(null);
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        sexo: v.sexo,
        data_nascimento: v.data_nascimento,
        altura: v.altura,
        peso_inicial: v.peso_inicial,
        peso_meta: v.peso_meta,
        nivel_atividade: v.nivel_atividade,
        usa_mounjaro: v.usa_mounjaro,
        onboarding_concluido: true,
      })
      .eq('id', user.id);

    if (error) {
      setErro(error.message);
      return;
    }

    // Primeiro registro de peso = peso inicial informado.
    await supabase.from('registros_peso').insert({
      usuario_id: user.id,
      data: new Date().toISOString(),
      peso: v.peso_inicial,
      observacao: 'Peso inicial (onboarding)',
    });

    await loadProfile();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg animate-fadeInUp">
        <div className="mb-6 text-center">
          <span className="font-display text-3xl font-bold text-accent">Déficit</span>
          <p className="mt-1 text-sm text-textSecondary">
            Vamos calcular sua meta calórica. Preencha seu perfil:
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sexo</label>
            <select className="input-field" {...register('sexo')}>
              <option value="">Selecione…</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            {errors.sexo && (
              <p className="mt-1 text-xs text-vermelho">Selecione o sexo</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data de nascimento</label>
            <input type="date" className="input-field" {...register('data_nascimento')} />
            {errors.data_nascimento && (
              <p className="mt-1 text-xs text-vermelho">{errors.data_nascimento.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo label="Altura (cm)" erro={errors.altura?.message}>
              <input type="number" step="0.1" className="input-field" {...register('altura', { valueAsNumber: true })} />
            </Campo>
            <Campo label="Peso atual (kg)" erro={errors.peso_inicial?.message}>
              <input type="number" step="0.1" className="input-field" {...register('peso_inicial', { valueAsNumber: true })} />
            </Campo>
            <Campo label="Meta (kg)" erro={errors.peso_meta?.message}>
              <input type="number" step="0.1" className="input-field" {...register('peso_meta', { valueAsNumber: true })} />
            </Campo>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nível de atividade</label>
            <select className="input-field" {...register('nivel_atividade')}>
              <option value="">Selecione…</option>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {LABEL_NIVEL_ATIVIDADE[n]}
                </option>
              ))}
            </select>
            {errors.nivel_atividade && (
              <p className="mt-1 text-xs text-vermelho">Selecione o nível</p>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-card bg-surface p-3">
            <input type="checkbox" className="h-4 w-4 accent-accent" {...register('usa_mounjaro')} />
            <span className="text-sm">Uso Mounjaro (tirzepatida)</span>
          </label>

          {erro && <p className="text-sm text-vermelho">{erro}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Concluir e calcular minha meta
          </Button>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  erro,
  children,
}: {
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
      {erro && <p className="mt-1 text-xs text-vermelho">{erro}</p>}
    </div>
  );
}
