import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { primeiroNome } from '../../lib/format';

/** Header superior reutilizável (mobile). Fundo primary, logo + saudação + sair. */
export function Header() {
  const { profile, signOut } = useAuthStore();
  return (
    <header className="flex items-center justify-between bg-primary px-4 py-3 text-white lg:hidden">
      <div>
        <span className="font-display text-lg font-bold text-accent">Déficit</span>
        {profile?.nome && (
          <p className="text-xs text-white/70">Olá, {primeiroNome(profile.nome)}</p>
        )}
      </div>
      <button
        onClick={signOut}
        className="rounded-full p-2 text-white/80 hover:bg-white/10"
        aria-label="Sair"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
