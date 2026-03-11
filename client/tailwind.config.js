/**
 * Tailwind CSS v4 — La configuración principal vive en index.css via @theme.
 * Este archivo se conserva como referencia y para herramientas que lo lean.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        upb: {
          green: '#006838',
          'green-light': '#00864a',
          gold: '#FFD100',
          'gold-dark': '#e6bc00',
          dark: '#1a1a2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
