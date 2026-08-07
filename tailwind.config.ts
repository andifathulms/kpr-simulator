import type { Config } from 'tailwindcss'

/**
 * Tailwind holds no values of its own. Every colour, size, and space here
 * resolves to a custom property declared in app/globals.css, which is the
 * single place any of them is decided — and the only place their measured
 * contrast ratios are recorded.
 *
 * Colours are channel triplets so `<alpha-value>` keeps working: bg-unknown/10
 * still composites correctly against the ground.
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
        blueprint: 'rgb(var(--c-blueprint) / <alpha-value>)',
        recess: 'rgb(var(--c-recess) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        print: 'rgb(var(--c-print) / <alpha-value>)',
        annotation: 'rgb(var(--c-annotation) / <alpha-value>)',
        unknown: 'rgb(var(--c-unknown) / <alpha-value>)',
        threshold: 'rgb(var(--c-threshold) / <alpha-value>)',
        /**
         * Muted body text, at the one opacity that still meets AA on every
         * surface it lands on. Use `text-muted`; never pick an opacity by eye.
         */
        muted: 'var(--ink-muted)',
      },
      fontFamily: {
        sheet: ['var(--font-sheet)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        prose: ['var(--font-prose)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        figure: ['var(--font-figure)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      /**
       * One scale, eight steps. `micro` is for table column labels only —
       * a word repeating down a column of figures. Everything a visitor reads
       * as prose starts at `caption` (14px), and body text is 17px.
       */
      fontSize: {
        micro: ['var(--text-micro)', { lineHeight: 'var(--leading-snug)' }],
        caption: ['var(--text-caption)', { lineHeight: 'var(--leading-snug)' }],
        body: ['var(--text-body)', { lineHeight: 'var(--leading-body)' }],
        lead: ['var(--text-lead)', { lineHeight: 'var(--leading-body)' }],
        subhead: ['var(--text-subhead)', { lineHeight: 'var(--leading-snug)' }],
        title: ['var(--text-title)', { lineHeight: 'var(--leading-tight)' }],
        headline: ['var(--text-headline)', { lineHeight: 'var(--leading-tight)' }],
        display: ['var(--text-display)', { lineHeight: '1.02' }],
      },
      spacing: {
        tight: 'var(--space-tight)',
        block: 'var(--space-block)',
        group: 'var(--space-group)',
        section: 'var(--space-section)',
      },
      letterSpacing: {
        sheet: '0.14em',
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
    },
  },
  plugins: [],
}

export default config
