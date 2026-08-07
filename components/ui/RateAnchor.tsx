import anchor from '@/data/acuan/bi-rate.json'
import { formatRate } from '@/lib/money/format'
import { intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

/**
 * A scale reference for the one field the app refuses to fill.
 *
 * The floating-rate input starts empty, correctly — but a refusal without an
 * anchor just moves the fabrication from the app to the user, who types a
 * round number because nothing on screen suggests what order of magnitude is
 * even plausible. The PRD sanctions exactly this (§5.2: dated snapshots as
 * reference anchors, labelled with source and date, never presented as current
 * data), and the app shipped without it.
 *
 * It is deliberately a decomposition rather than a suggestion. Nothing here
 * proposes a floating rate. It states a published, dated, cited figure and the
 * distance between it and whatever the user typed — and names that distance as
 * the thing nobody publishes. Someone who types 12% learns that they have
 * implicitly assumed a spread, which is the actual structure of the number
 * they were guessing at.
 *
 * One snapshot, not a series: only the current value could be verified against
 * two independent sources, and shipping a history assembled from a page
 * summary would be exactly the reconstruct-from-memory this project forbids.
 */
export function RateAnchor({
  locale,
  assumedRate,
}: {
  locale: Locale
  /** The user's floating-rate assumption, or 0 if they have not stated one. */
  assumedRate: number
}) {
  const id = locale === 'id'
  const intl = intlLocale(locale)
  const snapshot = anchor.snapshots[0]
  if (!snapshot) return null

  const spread = assumedRate > 0 ? assumedRate - snapshot.value : undefined

  return (
    <div className="border border-annotation/25 bg-recess px-4 py-3">
      <p className="sheet-label text-caption text-annotation">
        {id ? anchor.label.id : anchor.label.en}
      </p>
      <p className="figure mt-1 text-subhead">{formatRate(snapshot.value, intl)}</p>
      <p className="mt-1 text-caption text-muted">
        {id ? 'Berlaku sejak' : 'In force from'}{' '}
        <span className="figure">{snapshot.effectiveFrom}</span> ·{' '}
        {id ? 'diverifikasi' : 'verified'}{' '}
        <span className="figure">{snapshot.verifiedAt}</span>
        {' · '}
        <a className="underline" href={snapshot.sourceUrl} rel="noreferrer noopener">
          {snapshot.basis}
        </a>
      </p>

      {spread !== undefined && (
        <p className="measure mt-3 text-caption text-unknown">
          {id
            ? `Bunga mengambang yang Anda isikan ${formatRate(spread, intl)} di atas angka itu. Selisih itulah yang tidak diumumkan siapa pun: di dalamnya ada SBDK bank Anda dan marjinnya. Aplikasi ini tidak tahu berapa seharusnya — Anda yang menetapkannya.`
            : `The floating rate you entered sits ${formatRate(spread, intl)} above that figure. That gap is the part nobody publishes: your bank's SBDK and its margin are both inside it. This app does not know what it should be — you set it.`}
        </p>
      )}

      <p className="measure mt-3 text-caption text-muted">{id ? anchor.note.id : anchor.note.en}</p>
    </div>
  )
}
