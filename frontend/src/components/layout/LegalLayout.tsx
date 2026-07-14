import { Link } from 'react-router-dom';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { LEGAL } from '../../lib/legal';

/** Moldura das páginas legais (Política de Privacidade / Termos). */
export function LegalLayout({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-accent">
            <HeartPulse size={22} /> Déficit
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-textSecondary hover:text-accent">
            <ArrowLeft size={16} /> Início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 animate-fadeInUp">
        <h1 className="font-display text-3xl font-bold">{titulo}</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Última atualização: {LEGAL.atualizadoEm}
        </p>
        <div className="legal-prose mt-8 space-y-6 text-[15px] leading-relaxed text-ink/90">
          {children}
        </div>

        <div className="mt-10 border-t border-ink/5 pt-6 text-sm text-textSecondary">
          <Link to="/privacidade" className="mr-4 hover:text-accent">Política de Privacidade</Link>
          <Link to="/termos" className="hover:text-accent">Termos de Uso</Link>
        </div>
      </main>
    </div>
  );
}

/** Seção com título — padroniza o espaçamento das páginas legais. */
export function LegalSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{titulo}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
