'use client'

import { useState } from 'react'
import { formatAmount, formatRate } from '@/lib/money/format'
import { formatPeriod } from '@/lib/period/period'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import type { Instalment, Schedule } from '@/lib/amortise/types'
import { LiveRegion } from '@/components/ui/LiveRegion'

/**
 * The full amortisation table, to the rupiah — the artefact someone takes to
 * a bank meeting. Every row expands to its derivation.
 *
 * Tabular numerals, right-aligned, on every rupiah column. Without exception.
 */
export function AmortisationTable({ schedule, locale }: { schedule: Schedule; locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const rows = showAll ? schedule.instalments : schedule.instalments.slice(0, 24)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-annotation/25">
        <table className="w-full min-w-[52rem] border-collapse text-caption">
          <caption className="sr-only">
            {locale === 'id'
              ? 'Tabel angsuran: saldo, angsuran, bunga, dan pokok per bulan.'
              : 'Amortisation table: balance, instalment, interest, and principal by month.'}
          </caption>
          <thead>
            <tr className="border-b border-annotation/40 bg-recess">
              <Th align="left">{t.table.bulan}</Th>
              <Th align="left">{t.table.periode}</Th>
              <Th align="right">{t.table.saldoAwal}</Th>
              <Th align="right">{t.table.angsuran}</Th>
              <Th align="right">{t.table.bunga}</Th>
              <Th align="right">{t.table.pokok}</Th>
              <Th align="right">{t.table.saldoAkhir}</Th>
              <Th align="left">{t.table.fase}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((instalment) => (
              <Row
                key={instalment.index}
                instalment={instalment}
                locale={locale}
                intl={intl}
                expanded={expanded === instalment.index}
                onToggle={() =>
                  setExpanded(expanded === instalment.index ? null : instalment.index)
                }
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-annotation/40 bg-recess">
              <td className="px-3 py-2 sheet-label text-micro text-annotation" colSpan={4}>
                {t.table.total}
              </td>
              <td className="figure px-3 py-2 text-right">
                {formatAmount(schedule.totalInterest, intl)}
              </td>
              <td className="figure px-3 py-2 text-right">
                {formatAmount(schedule.principal, intl)}
              </td>
              <td className="figure px-3 py-2 text-right">
                {formatAmount(schedule.totalPaid, intl)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <LiveRegion>
        {locale === 'id'
          ? `Menampilkan ${rows.length} dari ${schedule.instalments.length} bulan.`
          : `Showing ${rows.length} of ${schedule.instalments.length} months.`}
      </LiveRegion>

      {schedule.instalments.length > 24 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="sheet-label border border-annotation/40 px-4 py-2 text-micro text-annotation hover:text-print"
        >
          {showAll
            ? locale === 'id'
              ? 'Tampilkan 24 bulan pertama'
              : 'Show the first 24 months'
            : locale === 'id'
              ? `Tampilkan seluruh ${schedule.instalments.length} bulan`
              : `Show all ${schedule.instalments.length} months`}
        </button>
      )}
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`sheet-label px-3 py-2 text-micro font-normal text-annotation ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Row({
  instalment,
  locale,
  intl,
  expanded,
  onToggle,
}: {
  instalment: Instalment
  locale: Locale
  intl: string
  expanded: boolean
  onToggle: () => void
}) {
  const t = dictionary(locale)
  const assumed = instalment.assumed

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-annotation/15 hover:bg-recess/60 ${
          assumed ? 'text-unknown' : ''
        }`}
      >
        {/*
         * The row stays clickable for a mouse, but the month number is a real
         * button so the derivation can be reached by keyboard at all. The
         * button stops the click propagating, or the row handler behind it
         * would toggle a second time and cancel it out.
         *
         * aria-expanded is the one thing with no native equivalent for a
         * disclosure; aria-controls is deliberately omitted, because the panel
         * it would point at does not exist while the row is collapsed.
         */}
        <td className="px-0 py-0">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation()
              onToggle()
            }}
            className="figure w-full px-3 py-1.5 text-left underline decoration-annotation/40 underline-offset-4 hover:decoration-annotation"
          >
            {instalment.index}
            <span className="sr-only">
              {` — ${t.common.derivation}${expanded ? '' : '…'}`}
            </span>
          </button>
        </td>
        <td className="figure px-3 py-1.5">{formatPeriod(instalment.period)}</td>
        <td className="figure px-3 py-1.5 text-right">
          {formatAmount(instalment.openingBalance, intl)}
        </td>
        <td className="figure px-3 py-1.5 text-right">{formatAmount(instalment.payment, intl)}</td>
        <td className="figure px-3 py-1.5 text-right">{formatAmount(instalment.interest, intl)}</td>
        <td className="figure px-3 py-1.5 text-right">{formatAmount(instalment.principal, intl)}</td>
        <td className="figure px-3 py-1.5 text-right">
          {formatAmount(instalment.closingBalance, intl)}
        </td>
        <td className="px-3 py-1.5 text-micro">
          {instalment.phase === 'tetap' ? t.table.tetap : t.table.mengambang}
          {assumed && <span className="ml-2 text-unknown">·{t.common.assumption}</span>}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-annotation/15 bg-recess">
          <td colSpan={8} className="px-3 py-3 text-micro">
            <p className="sheet-label mb-2 text-annotation">{t.common.derivation}</p>
            <ul className="figure space-y-1 text-muted">
              <li>
                {t.table.bunga} = {formatAmount(instalment.openingBalance, intl)} ×{' '}
                {formatRate(instalment.annualRate, intl)} ÷ 12 ={' '}
                {formatAmount(instalment.interest, intl)}
              </li>
              <li>
                {t.table.pokok} = {formatAmount(instalment.payment, intl)} −{' '}
                {formatAmount(instalment.interest, intl)} ={' '}
                {formatAmount(instalment.principal, intl)}
              </li>
              <li>
                {t.table.saldoAkhir} = {formatAmount(instalment.openingBalance, intl)} −{' '}
                {formatAmount(instalment.principal, intl)} ={' '}
                {formatAmount(instalment.closingBalance, intl)}
              </li>
            </ul>
            {assumed && (
              <p className="mt-2 text-unknown">{dictionary(locale).floating.short}</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
