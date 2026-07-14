import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-textSecondary">{texto}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-primary/5 ${className}`} />;
}

export function EstadoVazio({
  icon: Icon = Inbox,
  titulo,
  descricao,
  acao,
}: {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center animate-fadeInUp">
      <Icon className="text-accent" size={30} />
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-textSecondary">{descricao}</p>}
      {acao && (
        <Button onClick={acao.onClick} className="mt-1 px-5">
          {acao.label}
        </Button>
      )}
    </Card>
  );
}

export function EstadoErro({
  mensagem = 'Algo deu errado ao carregar os dados.',
  onRetry,
}: {
  mensagem?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center animate-fadeInUp">
      <AlertCircle className="text-vermelho" size={30} />
      <p className="max-w-sm text-sm text-vermelho">{mensagem}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-1 px-5">
          Tentar novamente
        </Button>
      )}
    </Card>
  );
}

export function PageHeader({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 animate-fadeIn">
      <div>
        <h1 className="ph1">{titulo}</h1>
        {subtitulo && <p className="psub">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}
