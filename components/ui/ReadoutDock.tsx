'use client'

import { useEffect, useState } from 'react'
import type { SummaryFigure } from './SummaryStrip'

/**
 * On a phone the form comes first and the answer is a long scroll below it.
 * This keeps the answer in reach: the two headline figures, docked to the
 * bottom of the screen, with a link down to the full result.
 *
 * It steps aside while the summary it repeats is on screen, so the same
 * figure never shows twice at once. Wide screens have the sticky rail beside
 * the results instead and never see it. It is not printed.
 */
export function ReadoutDock({
  before,
  after,
  target,
  linkLabel,
}: {
  before: SummaryFigure
  after?: SummaryFigure
  /** The id of the section the figures summarise. */
  target: string
  linkLabel: string
}) {
  const [summaryVisible, setSummaryVisible] = useState(false)

  useEffect(() => {
    const element = document.getElementById(target)
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setSummaryVisible(entry?.isIntersecting ?? false),
      { threshold: 0.25 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [target])

  return (
    <>
      {/* Room at the foot of the page, so the dock never covers the last line. */}
      <div aria-hidden className="h-32 lg:hidden" />
      <div
        className={`print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-annotation/40 bg-surface/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-3 shadow-[0_-16px_32px_-16px_rgb(0_0_0/0.7)] backdrop-blur lg:hidden ${
          summaryVisible ? 'invisible' : ''
        }`}
      >
        <div className="mx-auto flex max-w-xl items-end justify-between gap-3">
          <Figure figure={before} />
          {after && (
            <>
              <span aria-hidden className="pb-1 text-muted">
                →
              </span>
              <Figure figure={after} alignEnd />
            </>
          )}
        </div>
        <a href={`#${target}`} className="btn-primary mx-auto mt-3 flex w-full max-w-xl">
          {linkLabel}
        </a>
      </div>
    </>
  )
}

/**
 * The figure itself never truncates — a clipped rupiah amount is a wrong one.
 * Only the label gives way, and the right-hand figure keeps its full width.
 */
function Figure({ figure, alignEnd = false }: { figure: SummaryFigure; alignEnd?: boolean }) {
  const ink =
    figure.tone === 'unknown' ? 'text-unknown' : figure.tone === 'threshold' ? 'text-threshold' : 'text-print'
  return (
    <div className={alignEnd ? 'shrink-0 text-right' : 'min-w-0 flex-1'}>
      <p className={`truncate text-micro ${figure.tone && figure.tone !== 'computed' ? ink : 'text-muted'}`}>
        {figure.label}
        {figure.tag && <span className="sheet-label ml-1.5">· {figure.tag}</span>}
      </p>
      <p className={`figure-display whitespace-nowrap text-subhead ${ink}`}>{figure.value}</p>
    </div>
  )
}
