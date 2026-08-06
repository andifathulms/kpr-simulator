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
        /* One step above the ground, for a panel that has to lift off the
           sheet without becoming a second colour. Same hue, nothing new. */
        raised: '#22486F',
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
      /* A drawing sheet has a small number of sizes, used consistently. These
         are the only display sizes; body text uses the Tailwind defaults. */
      fontSize: {
        display: ['clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)', { lineHeight: '1.02' }],
        title: ['clamp(1.6rem, 1.3rem + 1.2vw, 2.25rem)', { lineHeight: '1.1' }],
        headline: ['clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)', { lineHeight: '1.05' }],
      },
      letterSpacing: {
        sheet: '0.14em',
      },
      maxWidth: {
        /* ~68 characters of Barlow. Prose never runs wider than this. */
        measure: '38rem',
      },
    },
  },
  plugins: [],
}

export default config
