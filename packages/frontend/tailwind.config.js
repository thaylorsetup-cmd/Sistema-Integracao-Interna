/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BBT Benfica Brand Colors - Official Palette
        benfica: {
          red: '#ED1C24',      // Vermelho Benfica - Alertas, CTAs, Erros
          blue: '#0072BC',     // Azul Benfica - Dados primários, rotas ativas
          silver: '#B1B3B6',   // Prata - Bordas sutis, textos secundários
          dark: '#020617',     // Base escura (Slate-950)
          crimson: '#9F1239',  // BBT Crimson - Ação principal (novo)
        },
        // Professional Dark Theme Colors (from visual-example.md)
        midnight: {
          base: '#0F172A',      // Midnight Logistics - Superfície Base
          elevated: '#1E293B',  // Slate Grey - Superfície Elevada (Cards)
          hover: '#334155',     // Hover state
        },
        // Neon Turquoise - Ação Secundária/Foco
        neon: {
          turquoise: '#22D3EE',
          cyan: '#06B6D4',
          glow: 'rgba(34, 211, 238, 0.5)',
        },
        // Text colors for dark mode
        text: {
          primary: '#F1F5F9',   // Cloud White
          secondary: '#94A3B8', // Steel Grey
          muted: '#64748B',
        },
        // Primary = Benfica Red
        primary: {
          DEFAULT: '#ED1C24',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#ED1C24',
          700: '#C81A20',
          800: '#A3171C',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        // Accent = Benfica Blue
        accent: {
          DEFAULT: '#0072BC',
          50: '#EFF8FF',
          100: '#DEF0FF',
          200: '#B6E3FF',
          300: '#75CEFF',
          400: '#2CB5FF',
          500: '#0099FF',
          600: '#0072BC',
          700: '#005A99',
          800: '#004D7F',
          900: '#003D66',
          950: '#002647',
        },
        // Secondary = Silver
        secondary: {
          DEFAULT: '#B1B3B6',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#B1B3B6',
          600: '#6B7280',
          700: '#4B5563',
          800: '#374151',
          900: '#1F2937',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#0072BC',
        light: '#F9FAFB',
        dark: '#020617',
        // Extended slate for glass effects
        slate: {
          850: '#1a2234',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // Fonte monoespaçada para dados críticos (placas, CNPJs, códigos)
        mono: [
          'JetBrains Mono',
          'Roboto Mono',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(237, 28, 36, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(237, 28, 36, 0.6)' },
        },
        glowBlue: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 114, 188, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 114, 188, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        // Animation for trucks moving
        drive: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        driveReverse: {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        bounce: 'bounce 1s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite',
        glowBlue: 'glowBlue 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        spin: 'spin 1s linear infinite',
        drive: 'drive 20s linear infinite',
        driveReverse: 'driveReverse 25s linear infinite',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 6, 23, 0.37)',
        'glass-strong': '0 8px 32px 0 rgba(2, 6, 23, 0.5)',
        'glow-red': '0 0 30px rgba(237, 28, 36, 0.4)',
        'glow-blue': '0 0 30px rgba(0, 114, 188, 0.4)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-neon': '0 0 30px rgba(34, 211, 238, 0.4)',
        'glow-crimson': '0 0 30px rgba(159, 18, 57, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        // Inset shadow for inputs
        'input-focus': '0 0 0 3px rgba(34, 211, 238, 0.3)',
        'input-error': '0 0 0 3px rgba(239, 68, 68, 0.3)',
        'input-success': '0 0 0 3px rgba(34, 197, 94, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'dark-glass-gradient': 'linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(15,23,42,0.9) 100%)',
        // Benfica Gradients
        'gradient-benfica': 'linear-gradient(135deg, #ED1C24 0%, #C81A20 100%)',
        'gradient-blue': 'linear-gradient(135deg, #0072BC 0%, #005A99 100%)',
        'gradient-dark': 'linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
        'glass-light': 'rgba(255, 255, 255, 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
