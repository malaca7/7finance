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
          black: '#0B0F19', // fundo principal
          dark: '#151A2B', // azul escuro
          darkGray: '#23243A', // cinza azulado
          gray: '#2D3146', // cinza médio
          lightGray: '#3B3F5C', // cinza claro
          blue: '#1A2980', // azul vibrante
          violet: '#39FF14', // verde neon para destaques
          purple: '#39FF14', // verde neon para destaques
          glass: 'rgba(255,255,255,0.08)', // vidro
          glassBorder: 'rgba(255,255,255,0.18)',
          text: '#F0F4FF', // texto claro
          muted: '#A0AEC0', // texto apagado
        },
        primary: '#39FF14', // verde neon principal
        secondary: '#1A2980', // azul
        accent: '#39FF14', // verde neon para destaques
        glass: 'rgba(255,255,255,0.08)',
        glassBorder: 'rgba(255,255,255,0.18)',
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(135deg, #1A2980 0%, #6D4AFF 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(26,41,128,0.7) 0%, rgba(111,76,255,0.5) 100%)',
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