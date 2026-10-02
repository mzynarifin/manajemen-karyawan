import type { Config } from 'tailwindcss'

// PRD section 56-62: one neutral scale, one brand colour, subtle shadows.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        canvas: '#f7f8fa',
        surface: '#ffffff',
        ink: '#18181b',
        muted: '#71717a',
        line: '#e4e4e7',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pop: '0 1px 2px 0 rgb(24 24 27 / 0.06), 0 8px 24px -12px rgb(24 24 27 / 0.18)',
        dialog: '0 12px 40px -12px rgb(24 24 27 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config