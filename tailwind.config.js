/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:        'rgb(var(--c-bg) / <alpha-value>)',
          surface:   'rgb(var(--c-surface) / <alpha-value>)',
          border:    'rgb(var(--c-border) / <alpha-value>)',
          primary:   'rgb(var(--c-primary) / <alpha-value>)',
          glow:      'rgb(var(--c-glow) / <alpha-value>)',
          secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
          accent:    'rgb(var(--c-accent) / <alpha-value>)',
          highlight: 'rgb(var(--c-highlight) / <alpha-value>)',
          success:   'rgb(var(--c-success) / <alpha-value>)',
          danger:    'rgb(var(--c-danger) / <alpha-value>)',
          text:      'rgb(var(--c-text) / <alpha-value>)',
          muted:     'rgb(var(--c-muted) / <alpha-value>)',
        }
      },
      fontFamily: {
        display: 'var(--font-display)',
        ui:      'var(--font-ui)',
        body:    'var(--font-body)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
    },
  },
  plugins: [],
}
