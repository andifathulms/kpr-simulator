import { Tag, type Tone } from './StatCard'

/**
 * The page's answer in one line: the instalment the bank quoted, the step at
 * the end of the fixed period, and the instalment after it. Every figure
 * arrives formatted from the container; nothing here computes.
 *
 * The two halves keep their meanings apart — the computed figure in print
 * white, the assumed one in amber with its word pill — so the strip reads
 * correctly in greyscale too.
 */
export interface SummaryFigure {
  readonly label: string
  readonly value: string
  readonly note?: string
  readonly tag?: string
  readonly tone?: Tone
}

export function SummaryStrip({
  before,
  after,
  step,
  details,
}: {
  before: SummaryFigure
  /** Absent when there is no second period to speak of. */
  after?: SummaryFigure
  /** The change between the two, already formatted — "+34,6%". */
  step?: string
  details?: readonly SummaryFigure[]
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-annotation/40 bg-surface shadow-[0_24px_48px_-32px_rgb(0_0_0/0.7)]">
      <div className={`grid ${after ? 'md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : ''}`}>
        <Half figure={before} />
        {after && (
          <>
            <div
              aria-hidden
              className="flex items-center gap-2 px-5 text-caption text-muted md:flex-col md:justify-center md:px-3"
            >
              <svg width="34" height="14" viewBox="0 0 34 14" className="rotate-90 md:rotate-0">
                <path
                  d="M1 7h30M25 2l6 5-6 5"
                  fill="none"
                  strokeWidth="1.5"
                  className="stroke-muted"
                />
              </svg>
              {step && <span className="figure">{step}</span>}
            </div>
            <Half figure={after} divided />
          </>
        )}
      </div>

      {details && details.length > 0 && (
        <dl
          className={`grid gap-px border-t border-annotation/20 bg-annotation/15 ${
            details.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {details.map((detail) => {
            const amber = detail.tone === 'unknown'
            return (
              <div key={detail.label} className="bg-surface px-5 py-3">
                <dt className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>
                  {detail.label}
                </dt>
                <dd className={`figure mt-0.5 text-body ${amber ? 'text-unknown' : 'text-print'}`}>
                  {detail.value}
                  {detail.tag && (
                    <span className="ml-2 align-middle">
                      <Tag tone={detail.tone ?? 'computed'}>{detail.tag}</Tag>
                    </span>
                  )}
                </dd>
                {detail.note && (
                  <dd className={`mt-0.5 text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>
                    {detail.note}
                  </dd>
                )}
              </div>
            )
          })}
        </dl>
      )}
    </section>
  )
}

function Half({ figure, divided = false }: { figure: SummaryFigure; divided?: boolean }) {
  const tone = figure.tone ?? 'computed'
  const amber = tone === 'unknown'
  const red = tone === 'threshold'
  const ink = amber ? 'text-unknown' : red ? 'text-threshold' : 'text-print'
  return (
    <div
      className={`min-w-0 px-5 py-4 ${
        amber ? 'bg-unknown/[0.07]' : red ? 'bg-threshold/[0.07]' : ''
      } ${divided ? (amber ? 'border-t border-unknown/40 md:border-l md:border-t-0' : 'border-t border-annotation/20 md:border-l md:border-t-0') : ''}`}
    >
      <p className={`field-label flex flex-wrap items-center gap-x-2 gap-y-1 ${amber || red ? ink : 'text-muted'}`}>
        <span>{figure.label}</span>
        {figure.tag && <Tag tone={tone}>{figure.tag}</Tag>}
      </p>
      <p className={`figure-display mt-1 text-headline ${ink}`}>{figure.value}</p>
      {figure.note && (
        <p className={`mt-1 text-caption ${amber || red ? ink : 'text-muted'}`}>{figure.note}</p>
      )}
    </div>
  )
}
