/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0f',
          surface: '#12121e',
          border: '#1e1e3a',
          primary: '#7c3aed',
          glow: '#a855f7',
          secondary: '#06b6d4',
          accent: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
          text: '#e2e8f0',
          muted: '#64748b',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

