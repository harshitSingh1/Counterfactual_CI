/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#101114',
          900: '#14161b',
          850: '#17191e',
          800: '#1d2027',
          750: '#242832',
          700: '#303640',
          600: '#424a57',
        },
        accent: {
          violet: '#8b7cf6',
          blue: '#7aa2f7',
        },
        status: {
          ok: '#5fba7d',
          bad: '#e56b73',
          warn: '#d9a441',
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
