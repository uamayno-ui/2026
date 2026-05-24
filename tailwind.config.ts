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
        // Core
        black:  '#0A0A0A',
        white:  '#FFFFFF',
        green:  '#22C55E',

        // Surfaces
        'surface-soft':  '#F8F9FB',
        'surface-blue':  '#E8F0F5',
        'surface-green': '#E8F8EE',

        // Status
        success: '#16A34A',
        warning: '#EAB308',
        danger:  '#DC2626',
        info:    '#0284C7',

        // Neutrals
        ink:      '#0A0A0A',
        'gray-800': '#27272A',
        'gray-500': '#71717A',
        'gray-300': '#D4D4D8',
        'gray-100': '#F4F4F5',

        // Hover/press
        'black-hover': '#1F1F1F',
        'black-press': '#000000',
        'green-hover': '#16A34A',
        'green-press': '#15803D',
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // [size, { lineHeight, fontWeight, letterSpacing }]
        hero: ['64px', { lineHeight: '72px', fontWeight: '700', letterSpacing: '-0.02em' }],
        h1:   ['40px', { lineHeight: '48px', fontWeight: '700', letterSpacing: '-0.02em' }],
        h2:   ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.01em' }],
        h3:   ['20px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '-0.005em' }],
        'body-l': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        small: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        tiny:  ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.02em' }],
        mono:  ['18px', { lineHeight: '24px', fontWeight: '500' }],
      },

      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '7': '48px',
        '8': '64px',
        '9': '96px',
        '10': '128px',
      },

      borderRadius: {
        sm:   '4px',
        DEFAULT: '8px',
        lg:   '12px',
        full: '999px',
      },

      boxShadow: {
        sm:  '0 1px 2px rgba(10,10,10,0.04)',
        DEFAULT: '0 4px 12px rgba(10,10,10,0.06)',
        lg:  '0 12px 24px rgba(10,10,10,0.10)',
      },

      maxWidth: {
        container: '1280px',
      },

      height: {
        header: '64px',
      },

      width: {
        'map-left':  '320px',
        'map-right': '420px',
        'sidebar':   '240px',
      },

      transitionTimingFunction: {
        ease: 'cubic-bezier(0.2, 0, 0, 1)',
      },

      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
}

export default config
