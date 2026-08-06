import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only. Components never carry a raw hex.
 *
 * PRD §8:
 *   unknown   — amber, reserved for the floating-rate band and anything the
 *               app does not know. Nothing else may use it.
 *   threshold — red, reserved for the affordability limit and its breach.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blueprint: '#1B3A5C',
        recess: '#142B44',
        print: '#E8EDF2',
        annotation: '#7FB2CC',
        unknown: '#D9A441',
        threshold: '#C9584A',
      },
      fontFamily: {
        sheet: ['var(--font-sheet)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        prose: ['var(--font-prose)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        figure: ['var(--font-figure)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        sheet: '0.14em',
      },
    },
  },
  plugins: [],
}

export default config
