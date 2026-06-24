/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Redesign tokens (marigold + gold on navy ink) ───────────────
        ink: {
          DEFAULT: '#0d1b2a',
          700: '#091420',
          panel: '#0a1622',
          card: '#122639',
          card2: '#16283b',
          line: '#34465b',
          text: '#16202b', // primary text on light — use text-ink-text
        },
        marigold: { DEFAULT: '#fca311', soft: '#fcd9a0' },
        gold: '#e5c185',
        paper: { DEFAULT: '#f4eee2', card: '#fffdf8', 2: '#faf5ec', 3: '#f7f1e5' },
        line: { light: '#e7ddca', input: '#d9cfbb' },
        // text shades
        txt: {
          dark: '#16202b',
          muted: '#897f6c',
          faint: '#9a8f7a',
          light: '#f3ede2',
          mutedDark: '#a9b6c4',
          faintDark: '#62748a',
        },
        success: { DEFAULT: '#25b277', bright: '#3fd393', deep: '#1c8e5e' },
        danger: { DEFAULT: '#ef5350', deep: '#c0392b' },
        // table status (Live Floor)
        table: {
          free: '#e2e8f0',
          occupied: '#fca311',
          billing: '#25b277',
          open: '#16283b',
          dirty: '#1e1416',
          reserved: '#e5c185',
        },

        // ── Legacy tokens (kept so not-yet-reskinned screens keep working) ─
        background: '#f8f9fa',
        surface: '#ffffff',
        primary: { DEFAULT: '#3b82f6', foreground: '#ffffff' },
        secondary: { DEFAULT: '#64748b', foreground: '#ffffff' },
        muted: { DEFAULT: '#f1f5f9', foreground: '#64748b' },
        accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
        warning: '#f59e0b',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,27,42,.06)',
        float: '0 30px 70px -30px rgba(13,27,42,.55)',
      },
      borderRadius: { card: '16px', tile: '14px', input: '11px' },
    },
  },
  plugins: [],
}
