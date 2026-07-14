import { create } from 'zustand';

export type Tema = 'light' | 'dark';

const CHAVE = 'deficit_theme';

function temaInicial(): Tema {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo === 'light' || salvo === 'dark') return salvo;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function aplicar(tema: Tema) {
  document.documentElement.setAttribute('data-theme', tema);
}

interface ThemeState {
  tema: Tema;
  setTema: (t: Tema) => void;
  alternar: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  tema: temaInicial(),
  setTema: (t) => {
    localStorage.setItem(CHAVE, t);
    aplicar(t);
    set({ tema: t });
  },
  alternar: () => get().setTema(get().tema === 'dark' ? 'light' : 'dark'),
}));

// Garante consistência mesmo se o script inline do index.html não rodar
// (ex.: ambiente de teste sem esse script).
aplicar(useThemeStore.getState().tema);
