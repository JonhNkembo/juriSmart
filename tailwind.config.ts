import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { display: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'] }, colors: { paper: { 50: '#f7f9fb', 100: '#eef2f6', 200: '#dce4ec', 300: '#c5d1de' }, brand: { 50: '#f0f7ff', 100: '#e0effe', 500: '#0284c7', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' } } } },
  plugins: [],
} satisfies Config
