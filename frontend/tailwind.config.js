/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b0e14',
          raised: '#121623',
          card: '#161b2b',
          border: '#232a3d',
        },
        accent: {
          DEFAULT: '#7c5cff',
          hover: '#8f72ff',
          muted: '#3a3266',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(124, 92, 255, 0.45)',
      },
      keyframes: {
        'xp-pop': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.9)' },
          '15%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-12px)' },
        },
        'level-up': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'xp-pop': 'xp-pop 1.6s ease-out forwards',
        'level-up': 'level-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
