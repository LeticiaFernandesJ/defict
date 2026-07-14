import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MoreHorizontal, LogOut } from 'lucide-react';
import { NAV_ITEMS, MOBILE_PRIMARY_ORDER } from './navItems';
import { useAuthStore } from '../../stores/authStore';

export function BottomNav() {
  const { profile, signOut } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();

  const primarios = MOBILE_PRIMARY_ORDER.map(
    (to) => NAV_ITEMS.find((i) => i.to === to)!,
  );
  const extras = NAV_ITEMS.filter(
    (i) => !i.primaryMobile && (!i.mounjaroOnly || profile?.usa_mounjaro),
  );

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
      isActive ? 'text-accent' : 'text-white/70'
    }`;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex bg-primary lg:hidden"
        style={{ height: 'var(--bottom-nav-height)' }}
      >
        {primarios.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={20} />
            {label === 'Dashboard' ? 'Início' : label}
          </NavLink>
        ))}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] text-white/70"
        >
          <MoreHorizontal size={20} />
          Mais
        </button>
      </nav>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-primary/40 lg:hidden animate-fadeIn"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full rounded-t-card bg-branco p-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
            <div className="grid grid-cols-3 gap-2">
              {extras.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    setSheetOpen(false);
                    navigate(to);
                  }}
                  className="flex flex-col items-center gap-2 rounded-card p-4 hover:bg-surface"
                >
                  <Icon size={22} className="text-accent" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSheetOpen(false);
                signOut();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] py-3 text-sm font-medium text-vermelho hover:bg-vermelho/5"
            >
              <LogOut size={16} /> Sair da conta
            </button>
          </div>
        </div>
      )}
    </>
  );
}
