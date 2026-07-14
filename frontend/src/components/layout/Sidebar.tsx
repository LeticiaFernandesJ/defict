import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useAuthStore } from '../../stores/authStore';
import { iniciais } from '../../lib/format';

export function Sidebar() {
  const { profile, signOut } = useAuthStore();

  const items = NAV_ITEMS.filter((i) => !i.mounjaroOnly || profile?.usa_mounjaro);

  const pesoAtual = profile?.peso_inicial ? profile.peso_inicial.toFixed(1).replace('.', ',') : '---';
  const pesoMeta = profile?.peso_meta ? `meta ${profile.peso_meta.toFixed(0)} kg` : 'meta —';

  return (
    <aside className="sidebar hidden lg:flex fixed inset-y-0 left-0 overflow-y-auto text-white">
      <div>
        <div className="logo-title">Déficit</div>
        <div className="logo-subtitle">controle inteligente</div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-avatar">{iniciais(profile?.nome)}</div>
          <div className="min-w-0">
            <p className="sidebar-footer-name truncate">{profile?.nome ?? 'Usuário'}</p>
            <p className="sidebar-footer-meta truncate">{`${pesoAtual} · ${pesoMeta}`}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
