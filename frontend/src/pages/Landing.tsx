import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  LayoutGrid,
  Syringe,
  WifiOff,
  Bell,
  ChevronDown,
  Check,
  HeartPulse,
  Apple,
  Droplets,
  Dumbbell,
  Scale,
  ShieldCheck,
} from 'lucide-react';

const BENEFICIOS = [
  { icon: Apple, titulo: 'Alimentação', texto: 'Calorias e macros de cada refeição, sem contar na mão.' },
  { icon: Scale, titulo: 'Peso', texto: 'Histórico, gráfico de evolução e quanto falta para a meta.' },
  { icon: Droplets, titulo: 'Hidratação', texto: 'Meta diária de água acompanhada ao longo do dia.' },
  { icon: Dumbbell, titulo: 'Movimento', texto: 'Treino por IA e progressão de atividade física.' },
];

const DIFERENCIAIS = [
  {
    icon: Sparkles,
    titulo: 'IA nutricional integrada',
    texto:
      'Calcule calorias e macros digitando o alimento em linguagem natural, gere cardápio semanal, receba análise motivadora do dia e converse com um chat nutricional (Google Gemini).',
  },
  {
    icon: Target,
    titulo: 'Meta calculada, não chutada',
    texto:
      'IMC, TMB (Mifflin-St Jeor), TDEE e meta de déficit calculados automaticamente a partir do seu perfil com opção de meta manual.',
  },
  {
    icon: LayoutGrid,
    titulo: 'Tudo num só app',
    texto:
      'Refeições e macros, peso com histórico e gráfico, hidratação e evolução de atividade. Sem pular entre aplicativos.',
  },
  {
    icon: Syringe,
    titulo: 'Acompanhamento de Mounjaro',
    texto:
      'Para quem usa tirzepatida: registre dose, local de aplicação e sintomas, com histórico organizado. Recurso opcional por perfil.',
  },
  {
    icon: WifiOff,
    titulo: 'Funciona offline (PWA)',
    texto:
      'Instale na tela inicial e use como um app nativo, com dados recentes disponíveis mesmo sem internet.',
  },
  {
    icon: Bell,
    titulo: 'Lembretes inteligentes',
    texto:
      'Notificações configuráveis: refeição não registrada, meta próxima/ultrapassada, água e dias de dose.',
  },
];

const PASSOS = [
  {
    n: 1,
    titulo: 'Crie sua conta e faça o onboarding',
    texto: 'Sexo, idade, altura, peso atual e meta, nível de atividade.',
  },
  {
    n: 2,
    titulo: 'Registre no dia a dia',
    texto: 'Refeições, peso e água a IA ajuda a calcular os nutrientes.',
  },
  {
    n: 3,
    titulo: 'Acompanhe e ajuste a rota',
    texto: 'Use os gráficos e a meta calórica para manter a consistência.',
  },
];

const PLANO_INCLUI = [
  'IA nutricional: cálculo de calorias, cardápio semanal e chat',
  'Meta calórica calculada (IMC, TMB e TDEE)',
  'Refeições, peso, água e atividade num só app',
  'Treino gerado por IA e progressão de nível',
  'Acompanhamento de Mounjaro (opcional)',
  'Lembretes inteligentes e uso offline (PWA)',
  'Seus dados isolados e protegidos por usuário',
];

const FAQ = [
  {
    q: 'Como funcionam os 7 dias grátis?',
    a: 'Você cria a conta e usa o Déficit completo por 7 dias sem pagar nada. Se gostar, o plano continua por R$ 19,99 por mês. Você pode cancelar quando quiser.',
  },
  {
    q: 'Quanto custa depois do período grátis?',
    a: 'R$ 19,99 por mês, com todos os recursos incluídos. Sem níveis confusos nem cobranças escondidas.',
  },
  {
    q: 'Funciona no iPhone e Android?',
    a: 'Sim. É um PWA instalável na tela inicial de iOS e Android, além de rodar no navegador.',
  },
  {
    q: 'Preciso saber contar calorias?',
    a: 'Não. Descreva o alimento em português e a IA calcula calorias e macros para você.',
  },
  {
    q: 'É indicado para quem usa Mounjaro?',
    a: 'Há um módulo opcional para registrar doses, local e sintomas. É uma ferramenta de registro, não orientação médica.',
  },
  {
    q: 'Meus dados ficam salvos e seguros?',
    a: 'Sim, com isolamento por usuário. Cada pessoa só acessa os próprios dados.',
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-surface text-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-primary/5 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-display text-2xl font-bold text-accent">
            <HeartPulse size={22} className="text-accent" /> Déficit
          </span>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#recursos" className="hover:text-accent">Recursos</a>
            <a href="#diferenciais" className="hover:text-accent">Diferenciais</a>
            <a href="#como-funciona" className="hover:text-accent">Como funciona</a>
            <a href="#planos" className="hover:text-accent">Planos</a>
            <a href="#faq" className="hover:text-accent">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-outline px-3 !min-h-[40px] text-sm">Entrar</Link>
            <Link to="/cadastro" className="btn-primary px-3 !min-h-[40px] text-sm">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* brilho de fundo suave, remetendo a bem-estar */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-verde/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="animate-fadeInUp">
            <span className="badge-pill green mb-4">
              <Sparkles size={13} /> 7 dias grátis · depois R$ 19,99/mês
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              Cuide do corpo com dados, não com achismo
            </h1>
            <p className="mt-4 text-lg text-textSecondary">
              O Déficit acompanha alimentação, peso, hidratação e treino num lugar só com
              uma IA que calcula os nutrientes e monta seu cardápio. Menos esforço, mais
              consistência, resultado que dá para ver.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/cadastro" className="btn-primary px-5">Começar 7 dias grátis</Link>
              <a href="#planos" className="btn-outline px-5">Ver planos</a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-textSecondary">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-verde" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-verde" /> Dados protegidos</span>
              <span className="flex items-center gap-1.5"><HeartPulse size={15} className="text-verde" /> Feito para saúde</span>
            </div>
          </div>
          <div className="animate-scaleIn">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* Benefícios / cuidar do corpo */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="card">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                <Icon className="text-accent" size={22} />
              </div>
              <h3 className="mt-3 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-textSecondary">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* O que é */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-12">
        <div className="card">
          <h2 className="font-display text-2xl font-bold">O que é o Déficit</h2>
          <p className="mt-2 max-w-2xl text-textSecondary">
            Uma ferramenta simples para parar de depender de planilha e centralizar tudo
            num lugar só sabendo qual é a sua meta calórica certa e mantendo a consistência
            que leva ao resultado.
          </p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {['Pare de usar planilha', 'Centralize alimentação, peso e água', 'Saiba sua meta calórica correta', 'Mantenha a consistência com dados na mão'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-verde" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Diferenciais */}
      <section id="diferenciais" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Diferenciais</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {DIFERENCIAIS.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="card">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                <Icon className="text-accent" size={22} />
              </div>
              <h3 className="mt-3 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-textSecondary">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Como funciona</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PASSOS.map(({ n, titulo, texto }) => (
            <div key={n} className="card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-white">
                {n}
              </div>
              <h3 className="mt-3 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-textSecondary">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold">Um plano simples, tudo incluído</h2>
          <p className="mt-2 text-textSecondary">
            Comece com 7 dias grátis. Sem níveis confusos: um preço, todos os recursos.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="relative rounded-card bg-branco p-7 shadow-card ring-2 ring-accent">
            <span className="badge-pill green absolute -top left-1/2 -translate-x-1/2">
              <Sparkles size={13} /> 7 dias grátis
            </span>

            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Plano Déficit</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-5xl font-bold">R$ 19,99</span>
              <span className="mb-1.5 text-textSecondary">/mês</span>
            </div>
            <p className="mt-1 text-sm text-textSecondary">
              Grátis nos primeiros 7 dias. Depois, R$ 19,99 por mês.
            </p>

            <ul className="mt-6 space-y-2.5">
              {PLANO_INCLUI.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde/15">
                    <Check size={13} className="text-verde" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link to="/cadastro" className="btn-primary mt-7 w-full">
              Começar 7 dias grátis
            </Link>
            <p className="mt-3 text-center text-xs text-textSecondary">
              Cancele quando quiser · sem compromisso
            </p>
            <p className="mt-1 text-center text-xs text-textSecondary">
              Ao começar, você aceita a{' '}
              <Link to="/privacidade" className="text-accent hover:underline">Política de Privacidade</Link>{' '}
              e os{' '}
              <Link to="/termos" className="text-accent hover:underline">Termos</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Prova rápida */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {['Cálculo automático', 'IA em português', 'Instalável', '7 dias grátis'].map((t) => (
            <div key={t} className="card py-4 text-sm font-semibold">
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} {...item} />
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-card bg-primary p-8 text-center text-white">
          <h2 className="font-display text-2xl font-bold text-white">
            Comece a cuidar do seu corpo hoje
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/70">
            Crie sua conta em minutos, teste 7 dias grátis e deixe a IA fazer as contas por você.
          </p>
          <Link to="/cadastro" className="btn-primary mt-5 inline-flex px-6">
            Começar 7 dias grátis
          </Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-primary/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-textSecondary">
          <span className="flex items-center gap-2 font-display text-xl font-bold text-accent">
            <HeartPulse size={18} /> Déficit

          </span>
          <nav className="flex flex-wrap justify-center gap-4">
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Cadastro</Link>
            <a href="#planos">Planos</a>
            <a href="#faq">FAQ</a>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos</Link>
          </nav>
          <p className="max-w-md text-xs">
            O Déficit é uma ferramenta de registro e acompanhamento e não substitui
            orientação de nutricionista ou médico.
          </p>
          <p className="flex items-center gap-1.5 text-xs">
            <ShieldCheck size={13} className="text-verde" /> <a href="https://www.vesk.com.br/" target='_Blank'>Desenvolvido pela VESK</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Mockup do painel do app — dá ao hero cara de produto real, no lugar de uma imagem. */
function HeroMockup() {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const pct = 0.72;
  const macros = [
    { nome: 'Proteínas', v: 78, cor: 'var(--cor-verde)' },
    { nome: 'Carbo.', v: 55, cor: 'var(--cor-destaque)' },
    { nome: 'Gordura', v: 40, cor: 'var(--cor-agua)' },
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-card bg-branco p-5 shadow-card">
      {/* topo */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-textSecondary">Bom dia,</p>
          <p className="font-display text-lg font-bold">Sofia</p>
        </div>
        <span className="badge-pill green"><HeartPulse size={13} /> No caminho</span>
      </div>

      {/* anel de calorias */}
      <div className="mt-4 flex items-center gap-4 rounded-card bg-surface p-4">
        <div className="relative h-[112px] w-[112px] shrink-0">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
            <circle cx="56" cy="56" r={r} fill="none" stroke="#e8e3db" strokeWidth="10" />
            <circle
              cx="56"
              cy="56"
              r={r}
              fill="none"
              stroke="var(--cor-destaque)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-bold leading-none">1.332</span>
            <span className="text-[11px] text-textSecondary">de 1.850 kcal</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {macros.map((m) => (
            <div key={m.nome}>
              <div className="flex justify-between text-[11px] text-textSecondary">
                <span>{m.nome}</span>
                <span>{m.v}%</span>
              </div>
              <div className="progress-track mt-1">
                <div className="progress-fill" style={{ width: `${m.v}%`, background: m.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* peso + água */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-card bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary">
            <Scale size={14} /> Peso
          </div>
          <p className="mt-1 font-display text-lg font-bold">72,4 kg</p>
          <p className="text-[11px] text-verde">faltam 4,4 kg</p>
        </div>
        <div className="rounded-card bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary">
            <Droplets size={14} /> Água
          </div>
          <p className="mt-1 font-display text-lg font-bold">1,6 L</p>
          <div className="progress-track mt-1.5">
            <div className="progress-fill" style={{ width: '64%', background: 'var(--cor-agua)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card !p-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left font-medium"
        aria-expanded={open}
      >
        {q}
        <ChevronDown
          size={18}
          className={`shrink-0 text-accent transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-textSecondary">{a}</p>}
    </div>
  );
}
