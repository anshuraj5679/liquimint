import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          50: '#edf4ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary palette
        secondary: {
          50: '#fffaf5',
          100: '#fff1e6',
          200: '#ffe4cc',
          300: '#ffd1a3',
          400: '#ffb870',
          500: '#ff9966',
          600: '#f97352',
          700: '#e35c3f',
          800: '#bf4833',
          900: '#963c2d',
        },
        // Success
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Error
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Warning
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Neutral
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#64748b',
          400: '#475569',
          500: '#334155',
          600: '#1f2937',
          700: '#111827',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // App surface tokens (kept under "dark" key to avoid broad class renames)
        dark: {
          bg: {
            primary: '#f7f9fc',
            secondary: '#ffffff',
            tertiary: '#f1f5fb',
            elevated: '#ffffff',
            hover: '#edf3fb',
          },
          text: {
            primary: '#0f172a',
            secondary: '#334155',
            tertiary: '#64748b',
            disabled: '#94a3b8',
          },
          border: {
            primary: '#d7e1ef',
            secondary: '#e7edf7',
            focus: '#3b82f6',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sora)', 'var(--font-jakarta)', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      borderRadius: {
        sm: '0.25rem',
        base: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Custom glow shadows; cast to any to satisfy Tailwind's stricter TS types
        glow: {
          primary: '0 0 20px rgba(59, 130, 246, 0.35)',
          secondary: '0 0 20px rgba(255, 153, 102, 0.35)',
          success: '0 0 20px rgba(16, 185, 129, 0.3)',
          error: '0 0 20px rgba(239, 68, 68, 0.35)',
        } as any,
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in',
        slideUp: 'slideUp 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
