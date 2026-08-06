import { formatAmount } from '@/lib/money/format'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import type { ComputationTrace } from '@/lib/amortise/types'

/**
 * The derivation, step by step. Rounding appears as its own step naming the
 * convention it followed, so a divergence of a few rupiah from a bank
 * statement can be pointed at rather than argued about.
 */
export function TraceView({ trace, locale }: { trace: ComputationTrace; locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)

  return (
    <ol className="space-y-3 border-l border-annotation/30 pl-5 text-sm">
      {trace.map((step, index) => {
        switch (step.type) {
          case 'input':
            return (
              <Step key={index} kind={t.common.computed} label={step.label}>
                <span className="figure">{step.value}</span>
              </Step>
            )
          case 'parameter':
            return (
              <Step key={index} kind={step.parameterId} label={step.label}>
                <span className="figure">{step.value}</span>
                <span className="mt-1 block text-xs text-annotation">
                  {step.basis} ·{' '}
                  <a className="underline" href={step.sourceUrl} rel="noreferrer noopener">
                    {t.common.source}
                  </a>
                </span>
              </Step>
            )
          case 'formula':
            return (
              <Step key={index} kind="=" label={step.label}>
                <span className="figure break-all text-print/80">{step.expression}</span>
                <span className="figure mt-1 block">{step.exact.toFixed(4)}</span>
              </Step>
            )
          case 'rounding':
            return (
              <Step key={index} kind={step.convention} label={step.label}>
                <span className="figure">
                  {step.exact.toFixed(4)} → {formatAmount(step.rounded, intl)}
                </span>
              </Step>
            )
          case 'assumption':
            return (
              <Step key={index} kind={t.common.assumption} label={step.label} amber>
                <span className="text-unknown">{step.detail}</span>
              </Step>
            )
          case 'conservation':
            return (
              <Step key={index} kind="✓" label={step.label}>
                <ul className="space-y-0.5 text-xs text-print/75">
                  {step.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </Step>
            )
          default: {
            const exhaustive: never = step
            return exhaustive
          }
        }
      })}
    </ol>
  )
}

function Step({
  kind,
  label,
  amber,
  children,
}: {
  kind: string
  label: string
  amber?: boolean
  children: React.ReactNode
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[1.42rem] top-1.5 block h-1.5 w-1.5 rounded-full ${
          amber ? 'bg-unknown' : 'bg-annotation'
        }`}
        aria-hidden
      />
      <p className={`sheet-label text-xs ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {kind}
      </p>
      <p className={amber ? 'text-unknown' : 'text-print'}>{label}</p>
      <div className="mt-0.5">{children}</div>
    </li>
  )
}
