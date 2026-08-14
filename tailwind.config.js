/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#070b14',
          900: '#0b1222',
          800: '#151d30',
          700: '#1e293b',
          600: '#334155',
        },
        brand: {
          purple: '#a855f7',
          orange: '#f97316',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0b1222 0%, #151d30 30%, #1a1040 60%, #0f172a 100%)',
        'glow-purple': 'radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(168,85,247,0.2), 0 0 60px rgba(168,85,247,0.05)',
        'glow-emerald': '0 0 15px rgba(16,185,129,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.04) inset',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
