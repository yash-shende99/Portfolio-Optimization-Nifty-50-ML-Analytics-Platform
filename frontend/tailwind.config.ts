import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#02050F',
        'bg-surface': '#0A1628',
        'bg-surface2': '#0D1F3C',
        'cyan': '#00D4FF',
        'gold': '#F0B942',
        'green-signal': '#00FF88',
        'red-signal': '#FF4560',
        'text-primary': '#E8F4FD',
        'text-secondary': '#7A9BB5',
        'text-muted': '#3A5470',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['Space Grotesk', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0,212,255,0.3)',
        'glow-gold': '0 0 24px rgba(240,185,66,0.3)',
        'glow-green': '0 0 24px rgba(0,255,136,0.3)',
        'card': '0 8px 32px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        terminal: '4px',
      },
      animation: {
        'ticker': 'tickerScroll 30s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0,255,136,0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 6px rgba(0,255,136,0)' },
        },
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
