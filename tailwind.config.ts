import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // User-editable composition files (landing.tsx, footer.tsx) live here
    // and use Tailwind classes — they MUST be scanned or the grid/flex
    // utilities get tree-shaken and the layout collapses to block flow.
    './content/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        shell: 'var(--shell-bg)',
        fg: 'var(--fg)',
        primary: 'var(--primary)',
        'primary-muted': 'var(--primary-muted)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
    },
  },
  plugins: [],
}

export default config
