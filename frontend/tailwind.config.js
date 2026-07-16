/** @type {import('tailwindcss').Config} */

// Cores que variam com o tema (claro/escuro) — lidas de variáveis CSS "triplet"
// (ex.: --color-ink: 27 42 74;) para o Tailwind poder compor opacidade:
// bg-ink/10 vira rgb(var(--color-ink) / 0.1). Ver frontend/src/index.css.
function withOpacity(variavelCss) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variavelCss}))`
      : `rgb(var(${variavelCss}) / ${opacityValue})`;
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Marca — constantes nos dois temas.
        primary: '#1B2A4A',
        accent: '#B5622A',
        verde: '#4CAF82',
        vermelho: '#E05252',
        agua: '#3E8CC6',
        // Superfícies/texto — variam entre claro e escuro.
        surface: withOpacity('--color-surface'),
        branco: withOpacity('--color-branco'),
        textSecondary: withOpacity('--color-text-secondary'),
        ink: withOpacity('--color-ink'),
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.07)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.3s ease-out both',
        fadeIn: 'fadeIn 0.2s ease-out both',
        scaleIn: 'scaleIn 0.2s ease-out both',
        float: 'float 5s ease-in-out infinite',
        glowPulse: 'glowPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
