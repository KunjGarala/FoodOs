/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── FoodOS Primary & Secondary Brand Tokens ─────────────────────
        primary: {
          DEFAULT: '#E85D04',
          hover: '#C94D03',
          glow: 'rgba(232, 93, 4, 0.15)',
          light: 'rgba(232, 93, 4, 0.08)',
        },
        orange: {
          DEFAULT: '#E85D04',
          50: 'rgba(232, 93, 4, 0.05)',
          100: 'rgba(232, 93, 4, 0.10)',
          200: 'rgba(232, 93, 4, 0.20)',
          500: '#E85D04',
          600: '#C94D03',
          700: '#A73F02',
        },
        navy: {
          DEFAULT: '#17202A',
          900: '#17202A',
          800: '#1F2B37',
          700: '#273645',
          600: '#34465B',
        },
        ivory: {
          DEFAULT: '#FFFDF8',
          canvas: '#FFFDF8',
        },
        cream: {
          DEFAULT: '#FFF8ED',
          surface: '#FFF8ED',
          hover: '#FFF3E0',
        },
        amber: {
          DEFAULT: '#F4A261',
          light: 'rgba(244, 162, 97, 0.15)',
        },
        success: {
          DEFAULT: '#4F772D',
          bright: '#4F772D',
          deep: '#3B5922',
          light: 'rgba(79, 119, 45, 0.10)',
        },
        danger: {
          DEFAULT: '#D64545',
          deep: '#B83232',
          light: 'rgba(214, 69, 69, 0.10)',
        },

        // ── Component & Legacy Tokens mapped to FoodOS system ─────────
        ink: {
          DEFAULT: '#17202A',
          700: '#17202A',
          panel: '#17202A',
          card: 'rgba(255, 248, 237, 0.85)',
          card2: '#FFF8ED',
          line: '#E7DED2',
          text: '#17202A',
        },
        marigold: {
          DEFAULT: '#E85D04',
          soft: 'rgba(232, 93, 4, 0.15)',
        },
        gold: '#F4A261',
        paper: {
          DEFAULT: '#FFFDF8',
          card: 'rgba(255, 248, 237, 0.80)',
          2: '#FFF8ED',
          3: '#FFF3E0',
        },
        line: {
          DEFAULT: '#E7DED2',
          light: '#E7DED2',
          input: '#E7DED2',
        },
        txt: {
          dark: '#17202A',
          muted: '#667085',
          faint: '#667085',
          light: '#FFFDF8',
          mutedDark: '#667085',
          faintDark: '#667085',
        },
        table: {
          free: '#E7DED2',
          occupied: '#E85D04',
          billing: '#4F772D',
          open: '#FFF8ED',
          dirty: '#D64545',
          reserved: '#F4A261',
        },

        background: '#FFFDF8',
        surface: '#FFF8ED',
        muted: { DEFAULT: '#FFF8ED', foreground: '#667085' },
        accent: { DEFAULT: '#FFF8ED', foreground: '#17202A' },
        border: '#E7DED2',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(23, 32, 42, 0.04)',
        glass: '0 8px 32px 0 rgba(23, 32, 42, 0.05)',
        float: '0 16px 40px -10px rgba(23, 32, 42, 0.08)',
      },
      borderRadius: { card: '16px', tile: '14px', input: '11px' },
    },
  },
  plugins: [],
}
