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
          black: '#0A0F1C',
          dark: '#111827',
          darkGray: '#1F2937',
          gray: '#374151',
          lightGray: '#6B7280',
          gold: '#D4AF37',
        },
        primary: '#22C55E',
        secondary: '#16A34A',
        accent: '#065F46',
        positive: '#22C55E',
        negative: '#EF4444',
        neutral: '#6B7280',
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #065F46 100%)',
        'card-gradient': 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        'glow-green': 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(6,95,70,0.1) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(34,197,94,0.25)',
        'glow-green-sm': '0 0 15px rgba(34,197,94,0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'app': '16px',
        'app-lg': '24px',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}