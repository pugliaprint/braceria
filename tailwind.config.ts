import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette braceria: caldi, scuri, fuoco
        brace: {
          nero:     '#0A0A0A',
          carbone:  '#1A1410',
          cenere:   '#2A2018',
          fumo:     '#3D3028',
          rosso:    '#C0392B',
          'rosso-vivo': '#E74C3C',
          brace:    '#D35400',
          arancio:  '#E67E22',
          fiamma:   '#F39C12',
          oro:      '#F1C40F',
          crema:    '#FAF0E6',
          'testo':  '#EDE0D0',
          'testo-soft': '#B8A898',
        }
      },
      fontFamily: {
        // Display: elegante e forte per titoli
        display: ['var(--font-display)', 'Georgia', 'serif'],
        // Body: leggibile su mobile
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        // Mono: per numeri ordini, prezzi
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-fuoco': 'linear-gradient(135deg, #C0392B 0%, #D35400 50%, #E67E22 100%)',
        'gradient-carbone': 'linear-gradient(180deg, #1A1410 0%, #0A0A0A 100%)',
        'gradient-brace': 'radial-gradient(ellipse at center, #3D3028 0%, #1A1410 70%)',
      },
      boxShadow: {
        'fuoco': '0 0 20px rgba(211, 84, 0, 0.4)',
        'fuoco-lg': '0 0 40px rgba(211, 84, 0, 0.6)',
        'rosso': '0 0 20px rgba(192, 57, 43, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'flicker': 'flicker 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '70%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
