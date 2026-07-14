import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/** Exige autenticação. Redireciona não logados para /login. */
export function ProtectedRoute() {
  const { authenticated, loading, profile } = useAuthStore();
  const location = useLocation();

  if (loading) return <TelaCarregando />;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  // Força o onboarding antes de liberar o app (exceto na própria rota de onboarding).
  if (
    profile &&
    !profile.onboarding_concluido &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/** Guard adicional para /mounjaro: exige usa_mounjaro. */
export function MounjaroRoute() {
  const { profile } = useAuthStore();
  if (profile && !profile.usa_mounjaro) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function TelaCarregando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="animate-fadeIn text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-3 text-sm text-textSecondary">Carregando…</p>
      </div>
    </div>
  );
}
