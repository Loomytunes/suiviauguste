/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bus: { DEFAULT: '#3b82f6', light: '#93c5fd', soft: '#eff6ff' },
        cantine: { DEFAULT: '#f97316', light: '#fdba74', soft: '#fff7ed' },
        garderie: { DEFAULT: '#8b5cf6', light: '#c4b5fd', soft: '#f5f3ff' },
        recreation: { DEFAULT: '#22c55e', light: '#86efac', soft: '#f0fdf4' },
        classe: { DEFAULT: '#6366f1', light: '#a5b4fc', soft: '#eef2ff' },
        parent: { DEFAULT: '#475569', light: '#94a3b8', soft: '#f1f5f9' }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'card': '0 4px 20px -2px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)',
        'card-hover': '0 12px 28px -4px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.06)'
      },
      animation: {
        'tap': 'tap 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out'
      },
      keyframes: {
        tap: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      transitionDuration: {
        '400': '400ms'
      }
    }
  },
  plugins: []
};
