'use client'

import { useMemo, useState } from 'react'
import { rupiah, type RoundingConvention } from '@/lib/money/rupiah'
import { formatRupiah } from '@/lib/money/format'
import type { Period } from '@/lib/period/period'
import { simulatePrepayment, type PrepayMode } from '@/lib/amortise/prepay'
import type { RateSegment } from '@/lib/amortise/types'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { MoneyField, NumberField, RateField, SelectField } from '@/components/field/Field'
import { ThresholdNotice, UnknownNotice } from '@/components/notice/Notice'

/**
 * What an extra payment actually saves — in both modes, with the
 * early-settlement penalty included, because it materially changes the answer.
 *
 * The panel shows both modes' figures and does not recommend one.
 */
export function PrepayPanel({
  principal,
  start,
  termMonths,
  segments,
  rounding,
  locale,
}: {
  principal: number
  start: Period
  termMonths: number
  segments: readonly RateSegment[]
  rounding: RoundingConvention
  locale: Locale
}) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'

  const [amount, setAmount] = useState(0)
  const [atMonth, setAtMonth] = useState(Math.min(24, termMonths))
  const [mode, setMode] = useState<PrepayMode>('perpendek-tenor')
  const [penalty, setPenalty] = useState(0)

  const result = useMemo(() => {
    if (amount <= 0 || atMonth < 1 || atMonth > termMonths) return null
    try {
      return simulatePrepayment({
        principal: rupiah(principal),
        start,
        termMonths,
        rounding,
        segments,
        prepayments: [{ atMonth, amount: rupiah(amount) }],
        mode,
        penaltyRate: penalty,
      })
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }, [principal, start, termMonths, segments, rounding, amount, atMonth, mode, penalty])

  return (
    <section className="space-y-4">
      <h2 className="sheet-label text-caption text-annotation">
        {id ? 'Pelunasan sebagian' : 'Extra payment'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyField
          label={id ? 'Jumlah pelunasan' : 'Lump sum'}
          value={amount}
          onChange={setAmount}
        />
        <NumberField
          label={id ? 'Pada bulan ke-' : 'At month'}
          value={atMonth}
          onChange={setAtMonth}
          min={1}
          max={termMonths}
        />
        <SelectField
          label={id ? 'Mode' : 'Mode'}
          value={mode}
          onChange={setMode}
          options={[
            {
              value: 'perpendek-tenor' as PrepayMode,
              label: id ? 'Perpendek tenor' : 'Shorten the term',
            },
            {
              value: 'perkecil-angsuran' as PrepayMode,
              label: id ? 'Perkecil angsuran' : 'Reduce the instalment',
            },
          ]}
        />
        <RateField
          label={id ? 'Penalti pelunasan' : 'Settlement penalty'}
          value={penalty}
          onChange={setPenalty}
          amber
          max={20}
          step={0.25}
          hint={
            id
              ? 'Angka Anda — tertulis di perjanjian kredit.'
              : 'Your figure — it is in the credit agreement.'
          }
        />
      </div>

      {result && 'error' in result && (
        <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
          {result.error}
        </UnknownNotice>
      )}

      {result && !('error' in result) && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Cell
              label={id ? 'Bunga yang dihemat' : 'Interest saved'}
              value={formatRupiah(result.interestSaved, intl)}
            />
            <Cell
              label={id ? 'Penalti' : 'Penalty'}
              value={formatRupiah(result.penalty, intl)}
              amber
            />
            <Cell
              label={id ? 'Hemat bersih' : 'Net saving'}
              value={formatRupiah(result.netSaving, intl)}
              negative={result.netSaving < 0}
            />
            <Cell
              label={id ? 'Bulan yang dipangkas' : 'Months saved'}
              value={String(result.monthsSaved)}
            />
          </div>

          {result.netSaving < 0 && (
            <ThresholdNotice title={id ? 'Rugi bersih' : 'A net loss'}>
              {id
                ? 'Penalti pelunasan lebih besar daripada bunga yang dihemat. Angkanya dinyatakan apa adanya; keputusannya bukan milik aplikasi ini.'
                : 'The settlement penalty exceeds the interest saved. The figure is stated as it is; the decision is not this app’s to make.'}
            </ThresholdNotice>
          )}

          <p className="text-caption text-muted">
            {id
              ? `Tanpa pelunasan sebagian: total bunga ${formatRupiah(result.baseline.totalInterest, intl)} selama ${result.baseline.termMonths} bulan. Dengan pelunasan: ${formatRupiah(result.withPrepayment.totalInterest, intl)} selama ${result.withPrepayment.termMonths} bulan.`
              : `Without the extra payment: ${formatRupiah(result.baseline.totalInterest, intl)} of interest over ${result.baseline.termMonths} months. With it: ${formatRupiah(result.withPrepayment.totalInterest, intl)} over ${result.withPrepayment.termMonths} months.`}
          </p>
          <p className="text-caption text-muted">{t.common.confirmWithBank}</p>
        </>
      )}
    </section>
  )
}

function Cell({
  label,
  value,
  amber,
  negative,
}: {
  label: string
  value: string
  amber?: boolean
  negative?: boolean
}) {
  // Written out rather than interpolated: Tailwind only emits classes it can
  // see as literals in the source.
  const label_tone = negative ? 'text-threshold' : amber ? 'text-unknown' : 'text-annotation'
  return (
    <div
      className={`border px-4 py-3 ${
        negative
          ? 'border-threshold/60 bg-threshold/[0.08]'
          : amber
            ? 'border-unknown/60 bg-unknown/[0.08]'
            : 'border-annotation/25 bg-recess'
      }`}
    >
      <p className={`sheet-label text-caption ${label_tone}`}>{label}</p>
      <p
        className={`figure mt-1 text-lead ${
          negative ? 'text-threshold' : amber ? 'text-unknown' : 'text-print'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
