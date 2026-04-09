/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          black: '#050505',
          dark: '#0D0D0D',
          darkGray: '#141414',
          gray: '#1F1F1F',
          lightGray: '#2A2A2A',
          gold: '#D4AF37',
          goldLight: '#E5C158',
          goldDark: '#B8962F',
          text: '#F0F0F0',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 2px 10px rgba(0, 0, 0, 0.3)',
        'premium-lg': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.2)',
      },
      borderRadius: {
        'premium': '16px',
        'premium-lg': '24px',
        'app': '16px',
        'app-lg': '24px',
      }
    },
  },
  plugins: [],
}