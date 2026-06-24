/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        'background-alt': '#12121A',
        foreground: '#FAFAFA',
        muted: '#1A1A24',
        'muted-foreground': '#71717A',
        accent: '#F59E0B',
        'accent-foreground': '#0A0A0F',
        border: 'rgba(255,255,255,0.08)',
        card: 'rgba(26,26,36,0.6)',
        'card-solid': '#1A1A24',
        ring: '#F59E0B',
        success: '#34D399',
        danger: '#F87171',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-md': '0 0 40px rgba(245, 158, 11, 0.2)',
        'glow-lg': '0 0 60px rgba(245, 158, 11, 0.25)',
        'glow-border': '0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)',
        'success-glow': '0 0 0 1px rgba(52, 211, 153, 0.3), 0 0 40px rgba(52, 211, 153, 0.2)',
        'danger-glow': '0 0 0 1px rgba(248, 113, 113, 0.3), 0 0 40px rgba(248, 113, 113, 0.2)',
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeSlideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' },
        },
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 250ms ease-out',
        'fade-slide-in-left': 'fadeSlideInLeft 250ms ease-out',
        'fade-in': 'fadeIn 250ms ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
