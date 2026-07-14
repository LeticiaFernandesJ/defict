import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});
type Form = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, senha }: Form) => {
    setErro(null);
    try {
      await login(email, senha);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'E-mail ou senha incorretos.');
    }
  };

  return (
    <AuthLayout titulo="Entrar" subtitulo="Bem-vindo de volta ao seu déficit.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input type="email" className="input-field" {...register('email')} />
          {errors.email && (
            <p className="mt-1 text-xs text-vermelho">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input type="password" className="input-field" {...register('senha')} />
          {errors.senha && (
            <p className="mt-1 text-xs text-vermelho">{errors.senha.message}</p>
          )}
        </div>
        {erro && <p className="text-sm text-vermelho">{erro}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Entrar
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-textSecondary">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-accent">
          Criar conta grátis
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm animate-fadeInUp">
        <Link to="/" className="mb-6 block text-center">
          <span className="font-display text-3xl font-bold text-accent">Déficit</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-semibold">{titulo}</h1>
          <p className="mb-5 mt-1 text-sm text-textSecondary">{subtitulo}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
