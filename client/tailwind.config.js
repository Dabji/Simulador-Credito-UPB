/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        upb: {
          green: '#006838',
          gold: '#FFD100',
          dark: '#1a1a2e',
        },
      },
    },
  },
  plugins: [],
};
