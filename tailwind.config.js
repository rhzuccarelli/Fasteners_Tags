/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Roboto Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        charcoal: '#1a1a1a',
        surface: '#f5f5f5',
      },
    },
  },
  plugins: [],
};
