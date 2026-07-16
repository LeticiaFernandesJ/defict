import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Syringe,
  WifiOff,
  Bell,
  ChevronDown,
  Check,
  HeartPulse,
  Droplets,
  Scale,
  ShieldCheck,
  ChefHat,
  CalendarDays,
  Activity,
  Lock,
  ArrowRight,
} from 'lucide-react';

const RECURSOS_GRID = [
  { icon: Target, titulo: 'Meta calculada, não chutada', texto: 'IMC, TMB e TDEE calculados a partir do seu perfil, com opção de ajuste manual.' },
  { icon: Scale, titulo: 'Peso em evolução', texto: 'Histórico e gráfico — veja a tendência, não só o número do dia.' },
  { icon: Droplets, titulo: 'Hidratação', texto: 'Meta diária de água acompanhada ao longo do dia.' },
  { icon: Syringe, titulo: 'Acompanhamento de Mounjaro', texto: 'Dose, local de aplicação e sintomas, para quem usa tirzepatida. Opcional.' },
  { icon: Bell, titulo: 'Lembretes que insistem', texto: 'Água, refeição e treino não marcados repetem o aviso a cada 2h — só até você resolver.' },
  { icon: WifiOff, titulo: 'Funciona offline', texto: 'Instale na tela inicial e use como app nativo (PWA), mesmo sem internet.' },
  { icon: Lock, titulo: 'Privacidade em primeiro lugar', texto: 'Dados isolados por usuário e tratados conforme a LGPD.' },
];

const PASSOS = [
  { n: 1, titulo: 'Crie sua conta e faça o onboarding', texto: 'Sexo, idade, altura, peso atual e meta, nível de atividade.' },
  { n: 2, titulo: 'Registre no dia a dia', texto: 'Refeições, peso e água — a Andy ajuda a calcular os nutrientes.' },
  { n: 3, titulo: 'Acompanhe e ajuste a rota', texto: 'Use os gráficos e a meta calórica para manter a consistência.' },
];

const PLANO_INCLUI = [
  'IA nutricional: cálculo de calorias, cardápio semanal e chat com a Andy',
  'Meta calórica calculada (IMC, TMB e TDEE)',
  'Refeições, peso, água e atividade num só app',
  'Treino gerado por IA e progressão de nível',
  'Acompanhamento de Mounjaro (opcional)',
  'Lembretes inteligentes e uso offline (PWA)',
  'Seus dados isolados e protegidos por usuário',
];

const FAQ = [
  { q: 'Como funcionam os 7 dias grátis?', a: 'Você cria a conta e usa o Déficit completo por 7 dias sem pagar nada. Se gostar, o plano continua por R$ 19,99 por mês. Você pode cancelar quando quiser.' },
  { q: 'Quanto custa depois do período grátis?', a: 'R$ 19,99 por mês, com todos os recursos incluídos. Sem níveis confusos nem cobranças escondidas.' },
  { q: 'Quem é a Andy?', a: 'É a assistente de IA do Déficit: monta cardápios e receitas, calcula nutrientes e tira dúvidas sobre alimentação, direto no chat do app.' },
  { q: 'Funciona no iPhone e Android?', a: 'Sim. É um PWA instalável na tela inicial de iOS e Android, além de rodar no navegador.' },
  { q: 'Preciso saber contar calorias?', a: 'Não. Descreva o alimento em português e a IA calcula calorias e macros para você.' },
  { q: 'É indicado para quem usa Mounjaro?', a: 'Há um módulo opcional para registrar doses, local e sintomas. É uma ferramenta de registro, não orientação médica.' },
  { q: 'Meus dados ficam salvos e seguros?', a: 'Sim, com isolamento por usuário e tratamento conforme a LGPD. Cada pessoa só acessa os próprios dados.' },
];

export function Landing() {
  const [rolado, setRolado] = useState(false);

  useEffect(() => {
    const onScroll = () => setRolado(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-ink">
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b bg-surface/85 backdrop-blur transition-shadow duration-300 ${
          rolado ? 'border-ink/5 shadow-[0_4px_24px_-8px_rgba(27,42,74,0.18)]' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-display text-2xl font-bold text-accent">
            <HeartPulse size={22} className="text-accent" /> Déficit
          </span>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#funcionalidades" className="relative py-1 transition-colors hover:text-accent">Funcionalidades</a>
            <a href="#andy" className="relative py-1 transition-colors hover:text-accent">Andy (IA)</a>
            <a href="#como-funciona" className="relative py-1 transition-colors hover:text-accent">Como funciona</a>
            <a href="#planos" className="relative py-1 transition-colors hover:text-accent">Planos</a>
            <a href="#faq" className="relative py-1 transition-colors hover:text-accent">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-outline px-3 !min-h-[40px] text-sm">Entrar</Link>
            <Link to="/cadastro" className="btn-primary px-3 !min-h-[40px] text-sm shadow-[0_8px_20px_-6px_rgba(181,98,42,0.55)] transition-transform hover:-translate-y-0.5">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-glowPulse" />
        <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-verde/10 blur-3xl animate-glowPulse" style={{ animationDelay: '1.5s' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="animate-fadeInUp">
            <span className="badge-pill green mb-4 shadow-sm">
              <Sparkles size={13} /> 7 dias grátis · depois R$ 19,99/mês
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              Cuide do corpo com dados,{' '}
              <span className="bg-gradient-to-r from-accent to-verde bg-clip-text text-transparent">
                não com achismo
              </span>
            </h1>
            <p className="mt-4 text-lg text-textSecondary">
              O Déficit acompanha alimentação, peso, hidratação e treino num lugar só, com a{' '}
              <b className="text-ink">Andy</b>, uma IA que calcula os nutrientes, monta seu cardápio e
              tira suas dúvidas. Menos esforço, mais consistência, resultado que dá para ver.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/cadastro" className="btn-primary px-5 shadow-[0_10px_24px_-8px_rgba(181,98,42,0.5)] transition-transform hover:-translate-y-0.5">
                Começar 7 dias grátis
              </Link>
              <a href="#funcionalidades" className="btn-outline px-5">Ver funcionalidades</a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-textSecondary">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-verde" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-verde" /> Dados protegidos (LGPD)</span>
              <span className="flex items-center gap-1.5"><HeartPulse size={15} className="text-verde" /> Feito para saúde</span>
            </div>
          </div>
          <div className="animate-scaleIn">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -z-10 translate-y-6 scale-95 rounded-card bg-primary/10 blur-2xl" />
              <div className="animate-float">
                <HeroMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos em destaque — uma seção por função importante */}
      <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Funcionalidades</span>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Cada função pensada para tirar peso das suas costas</h2>
          <p className="mt-3 text-textSecondary">Não é só registrar números — é o app fazendo o trabalho chato por você.</p>
        </Reveal>

        <div className="space-y-16 md:space-y-24">
          <FeatureSpotlight
            reverse={false}
            icon={ChefHat}
            selo="Refeições + IA"
            titulo="Descreva o que comeu. A IA calcula o resto."
            texto="Sem tabela nutricional, sem calculadora. Digite algo como “200g de arroz e um bife” em português mesmo, e a IA estima calorias e macros na hora — já registrado no seu dia."
            bullets={['Cálculo automático de calorias e macros', 'Edição manual sempre que quiser ajustar', 'Histórico completo por refeição']}
          >
            <MockNutrientes />
          </FeatureSpotlight>

          <FeatureSpotlight
            reverse
            icon={CalendarDays}
            selo="Cardápio semanal"
            titulo="Um cardápio da semana, gerado em segundos"
            texto="Escolha as refeições que quer receber, informe preferências e restrições, e a IA monta 7 dias de sugestões dentro da sua meta calórica. Marcou como comido? Já vira registro real."
            bullets={['Você escolhe quais refeições incluir', 'Respeita restrições e preferências', 'Um toque para marcar como comido']}
          >
            <MockCardapio />
          </FeatureSpotlight>

          <FeatureSpotlight
            reverse={false}
            icon={Activity}
            selo="Treino + IA"
            titulo="Treino sob medida, nos dias que você escolher"
            texto="Diga quais dias da semana quer treinar, seu objetivo e equipamento disponível. A IA monta o plano, e cada dia só libera na data certa — com cronômetro de descanso embutido."
            bullets={['Plano adaptado ao seu objetivo e equipamento', 'Cartões que só liberam no dia certo', 'Progressão de nível por consistência']}
          >
            <MockTreino />
          </FeatureSpotlight>
        </div>
      </section>

      {/* Andy — assistente de IA */}
      <section id="andy" className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-primary" />
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-verde/10 blur-3xl" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <Reveal>
            <span className="badge-pill orange !bg-white/10 !text-white">
              <Sparkles size={13} /> Sua nutricionista particular
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-white md:text-4xl">
              Converse com a Andy sempre que precisar
            </h2>
            <p className="mt-4 text-white/70">
              A Andy fica a um toque de distância em qualquer tela do app — um botão flutuante
              sempre à mão. Ela não é só uma calculadora: é uma conversa de verdade sobre comida.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Monta receitas com o que você tem na geladeira, do jeito rápido e prático.',
                'Tira dúvidas sobre nutrientes, rótulos e escolhas no mercado ou restaurante.',
                'Sugere substituições saudáveis e ajuda a planejar as compras da semana.',
                'Analisa seu dia com uma mensagem curta e motivadora — sem julgamento.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <Link
              to="/cadastro"
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 font-medium text-white shadow-[0_10px_24px_-8px_rgba(181,98,42,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Conversar com a Andy <ArrowRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="animate-float">
              <MockAndyChat />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Outros recursos */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">E ainda tem mais</h2>
          <p className="mt-2 text-textSecondary">Tudo o que fica em segundo plano, mas faz diferença no dia a dia.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS_GRID.map(({ icon: Icon, titulo, texto }, i) => (
            <Reveal key={titulo} delay={i * 60}>
              <div className="card group h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-16px_rgba(27,42,74,0.28)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20">
                  <Icon className="text-accent" size={22} />
                </div>
                <h3 className="mt-3 font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm text-textSecondary">{texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Como funciona</h2>
          <p className="mt-2 text-textSecondary">Três passos entre você e um controle de verdade sobre a sua rotina.</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {PASSOS.map(({ n, titulo, texto }, i) => (
            <Reveal key={n} delay={i * 100}>
              <div className="card relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-16px_rgba(27,42,74,0.28)]">
                <span className="pointer-events-none absolute -right-3 -top-6 font-display text-8xl font-bold text-ink/[0.04]">
                  {n}
                </span>
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-white shadow-[0_6px_14px_-4px_rgba(181,98,42,0.6)]">
                  {n}
                </div>
                <h3 className="relative mt-3 font-semibold">{titulo}</h3>
                <p className="relative mt-1 text-sm text-textSecondary">{texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold">Um plano simples, tudo incluído</h2>
          <p className="mt-2 text-textSecondary">
            Comece com 7 dias grátis. Sem níveis confusos: um preço, todos os recursos.
          </p>
        </Reveal>

        <Reveal className="mx-auto max-w-md">
          <div className="relative rounded-card bg-branco p-7 shadow-[0_30px_60px_-20px_rgba(27,42,74,0.28)] ring-2 ring-accent">
            <span className="badge-pill green absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">
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

            <Link to="/cadastro" className="btn-primary mt-7 w-full shadow-[0_10px_24px_-8px_rgba(181,98,42,0.5)] transition-transform hover:-translate-y-0.5">
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
        </Reveal>
      </section>

      {/* Prova rápida */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {['Cálculo automático', 'IA em português', 'Instalável', '7 dias grátis'].map((t) => (
            <div key={t} className="card py-4 text-sm font-semibold transition-shadow duration-300 hover:shadow-[0_16px_32px_-16px_rgba(27,42,74,0.25)]">
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <Reveal className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Perguntas frequentes</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 40}>
              <FaqItem {...item} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-card bg-primary p-8 text-center text-white shadow-[0_30px_70px_-24px_rgba(27,42,74,0.55)] md:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="relative font-display text-2xl font-bold text-white md:text-3xl">
              Comece a cuidar do seu corpo hoje
            </h2>
            <p className="relative mx-auto mt-2 max-w-xl text-white/70">
              Crie sua conta em minutos, teste 7 dias grátis e deixe a Andy fazer as contas por você.
            </p>
            <Link
              to="/cadastro"
              className="btn-primary relative mt-5 inline-flex px-6 shadow-[0_10px_24px_-8px_rgba(181,98,42,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Começar 7 dias grátis
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-ink/5 py-8">
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
            <ShieldCheck size={13} className="text-verde" />{' '}
            <a href="https://www.vesk.com.br/" target="_blank" rel="noreferrer">Desenvolvido pela VESK</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Anima a entrada do bloco quando ele cruza a viewport (rolagem). */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Bloco alternado ícone/texto + mockup, usado na seção de funcionalidades. */
function FeatureSpotlight({
  icon: Icon,
  selo,
  titulo,
  texto,
  bullets,
  reverse,
  children,
}: {
  icon: typeof Sparkles;
  selo: string;
  titulo: string;
  texto: string;
  bullets: string[];
  reverse: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid items-center gap-10 md:grid-cols-2 ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <Reveal>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
          <Icon className="text-accent" size={22} />
        </div>
        <span className="mt-3 block text-xs font-semibold uppercase tracking-widest text-accent">{selo}</span>
        <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">{titulo}</h3>
        <p className="mt-3 text-textSecondary">{texto}</p>
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-verde" /> {b}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={120}>{children}</Reveal>
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
    <div className="mx-auto w-full max-w-sm rounded-card bg-branco p-5 shadow-[0_30px_60px_-20px_rgba(27,42,74,0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-textSecondary">Bom dia,</p>
          <p className="font-display text-lg font-bold">Sofia</p>
        </div>
        <span className="badge-pill green"><HeartPulse size={13} /> No caminho</span>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-card bg-surface p-4">
        <div className="relative h-[112px] w-[112px] shrink-0">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
            <circle cx="56" cy="56" r={r} fill="none" stroke="#e8e3db" strokeWidth="10" />
            <circle
              cx="56" cy="56" r={r} fill="none" stroke="var(--cor-destaque)" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
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

/** Mockup: card de nutrientes calculados a partir de um texto descrito. */
function MockNutrientes() {
  return (
    <div className="rounded-card bg-branco p-5 shadow-[0_24px_50px_-18px_rgba(27,42,74,0.25)]">
      <p className="lb-modal">Alimento</p>
      <p className="input-field !cursor-default">200g de arroz e um bife grelhado</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { l: 'kcal', v: '512', on: true },
          { l: 'P', v: '38g' },
          { l: 'C', v: '55g' },
          { l: 'G', v: '14g' },
        ].map((m) => (
          <span key={m.l} className={`fchip ${m.on ? 'fchip-on' : ''}`}>
            <b>{m.v}</b> {m.l}
          </span>
        ))}
      </div>
      <div className="btn-primary mt-4 w-full !cursor-default justify-center opacity-90">
        <Sparkles size={16} /> Calculado pela Andy
      </div>
    </div>
  );
}

/** Mockup: mini grade do cardápio semanal. */
function MockCardapio() {
  const dias = ['Seg', 'Ter', 'Qua'];
  const refeicoesDia = ['Café da manhã', 'Almoço', 'Jantar'];
  return (
    <div className="rounded-card bg-branco p-5 shadow-[0_24px_50px_-18px_rgba(27,42,74,0.25)]">
      <div className="row">
        <p className="font-semibold">Cardápio da semana</p>
        <span className="badge-pill green">IA</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {dias.map((d) => (
          <div key={d} className="rounded-card bg-surface p-2.5">
            <p className="mut !text-[11px] font-semibold">{d}</p>
            <div className="mt-1.5 space-y-1.5">
              {refeicoesDia.map((r) => (
                <div key={r} className="rounded-md bg-branco px-1.5 py-1 text-[10px] leading-tight text-textSecondary shadow-sm">
                  {r}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mockup: cartão de treino do dia. */
function MockTreino() {
  return (
    <div className="rounded-card bg-branco p-5 shadow-[0_24px_50px_-18px_rgba(27,42,74,0.25)]">
      <div className="row">
        <div>
          <p className="mut !text-[11px]">Hoje · Quarta</p>
          <p className="font-display text-lg font-bold">Treino de pernas</p>
        </div>
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
          <span className="text-xs font-bold text-accent">45s</span>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[
          { n: 'Agachamento livre', s: '4× 12' },
          { n: 'Leg press', s: '3× 15' },
          { n: 'Cadeira extensora', s: '3× 12' },
        ].map((ex) => (
          <div key={ex.n} className="row rounded-card bg-surface px-3 py-2 text-sm">
            <span>{ex.n}</span>
            <span className="mut !text-xs">{ex.s}</span>
          </div>
        ))}
      </div>
      <div className="btn-outline mt-4 w-full !cursor-default justify-center">
        <Check size={16} /> Marcar como feito
      </div>
    </div>
  );
}

/** Mockup: conversa de exemplo com a Andy, no mesmo visual do chat real. */
function MockAndyChat() {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-card bg-primary shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Sparkles size={16} className="text-accent" />
        <span className="font-display font-bold text-white">Andy</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-accent px-3.5 py-2.5 text-sm text-white">
          Me dá uma receita rápida com frango e batata doce?
        </div>
        <div className="max-w-[90%] rounded-[14px] rounded-tl-[4px] bg-white/10 px-3.5 py-2.5 text-sm text-white">
          <p className="mb-1.5"><b>Frango grelhado com batata doce</b> — 20 min:</p>
          <p>1. Tempere o frango e grelhe 6 min de cada lado.</p>
          <p>2. Cozinhe a batata doce em cubos no vapor.</p>
          <p>3. Finalize com azeite e ervas. ~420 kcal.</p>
        </div>
        <div className="flex max-w-[70%] items-center gap-2 rounded-[14px] rounded-tl-[4px] bg-white/10 px-3.5 py-2.5 text-sm text-white/60">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '120ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '240ms' }} />
          </span>
        </div>
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-[24px] bg-white/10 py-1.5 pl-[18px] pr-2">
        <span className="flex-1 text-sm text-white/50">Escreva uma mensagem…</span>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent text-white">
          <ArrowRight size={15} />
        </span>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card !p-0 transition-shadow duration-300 hover:shadow-[0_16px_32px_-16px_rgba(27,42,74,0.2)]">
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
      {open && <p className="px-4 pb-4 text-sm text-textSecondary animate-fadeIn">{a}</p>}
    </div>
  );
}
