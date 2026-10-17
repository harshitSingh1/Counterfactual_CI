/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#070b16',
          900: '#0b1222',
          850: '#0f172a',
          800: '#111a2e',
          750: '#16203a',
          700: '#1c2742',
        },
        accent: {
          violet: '#8b5cf6',
          blue: '#38bdf8',
        },
        status: {
          ok: '#22c55e',
          bad: '#ef4444',
          warn: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
