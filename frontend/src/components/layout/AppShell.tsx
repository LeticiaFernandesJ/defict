import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { AssistenteIA } from '../ia/AssistenteIA';

/** Shell responsivo: sidebar (desktop) + header/bottom-nav (mobile). */
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="lg:pl-[212px]">
        <Header />
        <main
          className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-8"
          style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 1.25rem)' }}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AssistenteIA />
    </div>
  );
}
