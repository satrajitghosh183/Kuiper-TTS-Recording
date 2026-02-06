/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Studio design system (glassmorphism + soft UI)
        background: 'var(--studio-bg-0)',
        surface: 'var(--studio-bg-1)',
        border: 'var(--studio-border)',
        accent: {
          DEFAULT: 'var(--studio-accent)',
          hover: 'var(--studio-accent-hover)',
          active: 'var(--studio-accent)',
          glow: 'var(--studio-accent-muted)',
        },
        'accent-recording': 'var(--studio-accent-recording)',
        text: {
          primary: 'var(--studio-text-0)',
          secondary: 'var(--studio-text-1)',
          muted: 'var(--studio-text-2)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"TT Otilito Sans"', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['72px', { lineHeight: '80px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['48px', { lineHeight: '56px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h2': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', letterSpacing: '-0.005em', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '20px', letterSpacing: '0.005em', fontWeight: '400' }],
        'micro': ['11px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
        '4xl': '128px',
      },
      borderRadius: {
        DEFAULT: '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': 'var(--studio-card-radius)',
      },
      boxShadow: {
        'card': 'var(--studio-shadow-outer)',
        'card-hover': '0 28px 56px -14px rgba(0, 0, 0, 0.5), 0 14px 28px -10px rgba(0, 0, 0, 0.35)',
        'glow': '0 0 0 3px var(--studio-accent-muted)',
      },
      backdropBlur: {
        'modal': '12px',
        'glass': 'var(--studio-blur)',
      },
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'entrance': 'cubic-bezier(0, 0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'micro': '100ms',
        'fast': '150ms',
        'standard': '200ms',
        'slow': '300ms',
        'complex': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 150ms ease-in',
        'scale-in': 'scaleIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}

