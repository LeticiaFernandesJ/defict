import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

// Estilos compactos para caber numa bolha de chat pequena (sempre texto claro
// sobre o popup navy da Andy — ver AssistenteIA.tsx).
const componentes: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&_p]:mb-0 [&_p]:inline">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
      {children}
    </a>
  ),
  h1: ({ children }) => <p className="mb-1 font-display text-base font-bold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 font-display text-base font-bold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-display text-sm font-bold">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-white/30 pl-3 italic opacity-90 last:mb-0">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-white/15 px-1 py-0.5 text-[13px]">{children}</code>,
  hr: () => <hr className="my-2 border-white/15" />,
};

/** Renderiza markdown básico (negrito, listas, links…) nas respostas da Andy. */
export function RespostaMarkdown({ texto }: { texto: string }) {
  return (
    <div className="leading-relaxed [&>*:last-child]:mb-0">
      <ReactMarkdown components={componentes}>{texto}</ReactMarkdown>
    </div>
  );
}
