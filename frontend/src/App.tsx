import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppShell } from './components/layout/AppShell';
import {
  MounjaroRoute,
  ProtectedRoute,
  TelaCarregando,
} from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Privacidade } from './pages/Privacidade';
import { Termos } from './pages/Termos';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Refeicoes } from './pages/Refeicoes';
import { Agua } from './pages/Agua';
import { Peso } from './pages/Peso';
import { Atividade } from './pages/Atividade';
import { IA } from './pages/IA';
import { Configuracoes } from './pages/Configuracoes';
import { Notificacoes } from './pages/Notificacoes';
import { Mounjaro } from './pages/Mounjaro';

/** Rotas públicas que redirecionam usuários logados para o app. */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuthStore();
  if (loading) return <TelaCarregando />;
  if (authenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => init(), [init]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/cadastro" element={<PublicOnly><Cadastro /></PublicOnly>} />

        {/* Legais — acessíveis logado ou não */}
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />

        {/* Autenticadas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/refeicoes" element={<Refeicoes />} />
            <Route path="/atividade" element={<Atividade />} />
            <Route path="/agua" element={<Agua />} />
            <Route path="/peso" element={<Peso />} />
            <Route path="/ia" element={<IA />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/configuracoes/notificacoes" element={<Notificacoes />} />
            <Route element={<MounjaroRoute />}>
              <Route path="/mounjaro" element={<Mounjaro />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
