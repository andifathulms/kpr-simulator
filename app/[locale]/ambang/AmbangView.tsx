'use client'

import { useEffect, useMemo, useState } from 'react'
import { rupiah } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { solveThreshold } from '@/lib/rate/threshold'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { MoneyField, NumberField, RateField } from '@/components/field/Field'
import { ThresholdNotice, UnknownNotice } from '@/components/notice/Notice'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'
import { decodeHash, encodeHash, readNumber } from '@/lib/url/hash'

/**
 * The threshold view. One figure, stated plainly, with the instalment it
 * produces beside it — and nothing resembling a judgement about whether that
 * figure is comfortable.
 */

interface State {
  plafon: number
  tenorTahun: number
  masaTetapTahun: number
  bungaTetap: number
  penghasilan: number
  porsi: number
  mulaiTahun: number
  mulaiBulan: number
}

const INITIAL: State = {
  plafon: 0,
  tenorTahun: 15,
  masaTetapTahun: 3,
  bungaTetap: 0,
  penghasilan: 0,
  porsi: 0.3,
  mulaiTahun: 2026,
  mulaiBulan: 9,
}

export function AmbangView({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'
  const [state, setState] = useState<State>(INITIAL)

  useEffect(() => {
    const hash = decodeHash(window.location.hash)
    if (Object.keys(hash).length === 0) return
    setState((current) => ({
      plafon: readNumber(hash, 'p', current.plafon),
      tenorTahun: readNumber(hash, 'tn', current.tenorTahun),
      masaTetapTahun: readNumber(hash, 'mt', current.masaTetapTahun),
      bungaTetap: readNumber(hash, 'bt', current.bungaTetap),
      penghasilan: readNumber(hash, 'in', current.penghasilan),
      porsi: readNumber(hash, 'ps', current.porsi),
      mulaiTahun: readNumber(hash, 'my', current.mulaiTahun),
      mulaiBulan: readNumber(hash, 'mm', current.mulaiBulan),
    }))
  }, [])

  useEffect(() => {
    window.history.replaceState(
      null,
      '',
      `#${encodeHash({
        p: state.plafon,
        tn: state.tenorTahun,
        mt: state.masaTetapTahun,
        bt: state.bungaTetap,
        in: state.penghasilan,
        ps: state.porsi,
        my: state.mulaiTahun,
        mm: state.mulaiBulan,
      })}`,
    )
  }, [state])

  const termMonths = Math.round(state.tenorTahun * 12)
  const fixedMonths = Math.min(Math.round(state.masaTetapTahun * 12), Math.max(termMonths - 1, 0))
  const ready =
    state.plafon > 0 &&
    state.penghasilan > 0 &&
    state.bungaTetap > 0 &&
    fixedMonths > 0 &&
    fixedMonths < termMonths

  const result = useMemo(() => {
    if (!ready) return null
    try {
      const outcome = solveThreshold({
        principal: rupiah(state.plafon),
        start: period(state.mulaiTahun, state.mulaiBulan),
        termMonths,
        fixedMonths,
        fixedAnnualRate: state.bungaTetap,
        income: rupiah(state.penghasilan),
        share: state.porsi,
        rounding: 'pembulatan-terdekat',
      })

      // The round trip, shown rather than merely asserted: the rate is fed
      // back through the engine and the resulting schedule is what is drawn.
      const schedule =
        outcome.kind === 'found'
          ? buildSchedule({
              principal: rupiah(state.plafon),
              start: period(state.mulaiTahun, state.mulaiBulan),
              termMonths,
              rounding: 'pembulatan-terdekat',
              segments: [
                {
                  months: fixedMonths,
                  annualRate: state.bungaTetap,
                  phase: 'tetap',
                  assumed: false,
                },
                {
                  months: termMonths - fixedMonths,
                  annualRate: outcome.annualRate,
                  phase: 'mengambang',
                  assumed: true,
                },
              ],
            })
          : undefined

      return { kind: 'ok' as const, outcome, schedule }
    } catch (error) {
      return {
        kind: 'error' as const,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [ready, state, termMonths, fixedMonths])

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="sheet-label text-2xl">{t.nav.ambang}</h1>
        <p className="mt-2 text-print/80">
          {id
            ? 'Pada suku bunga mengambang berapa angsuran Anda melewati porsi penghasilan yang Anda tetapkan? Satu angka, untuk dibawa dan ditanyakan langsung ke bank.'
            : 'At what floating rate does your instalment cross the share of income you set? One figure, to carry into a bank meeting and ask about directly.'}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <form
          className="print-hidden space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <MoneyField
            label={t.form.plafon}
            value={state.plafon}
            onChange={(plafon) => setState({ ...state, plafon })}
          />
          <NumberField
            label={t.form.tenorTahun}
            value={state.tenorTahun}
            onChange={(tenorTahun) => setState({ ...state, tenorTahun })}
            min={2}
            max={40}
            suffix={id ? 'thn' : 'yr'}
          />
          <RateField
            label={t.form.bungaTetap}
            value={state.bungaTetap}
            onChange={(bungaTetap) => setState({ ...state, bungaTetap })}
          />
          <NumberField
            label={t.form.masaTetapTahun}
            value={state.masaTetapTahun}
            onChange={(masaTetapTahun) => setState({ ...state, masaTetapTahun })}
            min={1}
            max={Math.max(state.tenorTahun - 1, 1)}
            suffix={id ? 'thn' : 'yr'}
          />
          <MoneyField
            label={t.form.penghasilan}
            value={state.penghasilan}
            onChange={(penghasilan) => setState({ ...state, penghasilan })}
            hint={
              id
                ? 'Tidak dikirim ke mana pun. Masukan tersimpan di tanda pagar alamat, bukan di kueri.'
                : 'Sent nowhere. Inputs live in the URL fragment, never the query string.'
            }
          />
          <RateField
            label={t.form.porsiPenghasilan}
            value={state.porsi}
            onChange={(porsi) => setState({ ...state, porsi: Math.min(Math.max(porsi, 0.01), 1) })}
            max={100}
            step={1}
            hint={
              id
                ? 'Porsi yang Anda pilih. Aplikasi ini tidak menyatakan porsi mana yang wajar.'
                : 'The share you choose. The app does not say which share is sensible.'
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={id ? 'Tahun mulai' : 'Start year'}
              value={state.mulaiTahun}
              onChange={(mulaiTahun) => setState({ ...state, mulaiTahun })}
              min={2000}
              max={2100}
            />
            <NumberField
              label={id ? 'Bulan mulai' : 'Start month'}
              value={state.mulaiBulan}
              onChange={(mulaiBulan) => setState({ ...state, mulaiBulan })}
              min={1}
              max={12}
            />
          </div>
        </form>

        <div className="space-y-8">
          <ShareBar locale={locale} />
          {!ready && (
            <UnknownNotice title={id ? 'Belum ada yang dihitung' : 'Nothing computed yet'}>
              {id
                ? 'Isi plafon, bunga tetap yang dikutip, masa tetapnya, dan penghasilan per bulan.'
                : 'Enter the amount financed, the fixed rate you were quoted, its length, and your monthly income.'}
            </UnknownNotice>
          )}

          {result?.kind === 'error' && (
            <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
              {result.error}
            </UnknownNotice>
          )}

          {result?.kind === 'ok' && (
            <>
              {result.outcome.kind === 'found' && (
                <section className="border-2 border-threshold bg-threshold/10 px-6 py-5">
                  <p className="sheet-label text-xs text-threshold">
                    {id ? 'Ambang — bunga mengambang' : 'Threshold — floating rate'}
                  </p>
                  <p className="figure mt-1 text-5xl text-threshold">
                    {formatRate(result.outcome.annualRate, intl)}
                  </p>
                  <p className="mt-3 text-print/90">
                    {id
                      ? 'Pada bunga ini, angsuran setelah masa tetap menjadi '
                      : 'At this rate, the instalment after the fixed period becomes '}
                    <span className="figure">{formatRupiah(result.outcome.limit, intl)}</span>
                    {id
                      ? ` — tepat ${formatRate(state.porsi, intl)} dari penghasilan yang Anda isikan.`
                      : ` — exactly ${formatRate(state.porsi, intl)} of the income you entered.`}
                  </p>
                </section>
              )}

              {result.outcome.kind === 'breached-at-zero' && (
                <ThresholdNotice
                  title={id ? 'Tidak ada ambang untuk dicari' : 'There is no threshold to find'}
                >
                  {id
                    ? 'Bahkan pada bunga mengambang 0%, angsuran setelah masa tetap sudah '
                    : 'Even at a 0% floating rate, the instalment after the fixed period is already '}
                  <span className="figure">
                    {formatRupiah(result.outcome.paymentAtZero, intl)}
                  </span>
                  {id ? ', melewati batas ' : ', past the limit of '}
                  <span className="figure">{formatRupiah(result.outcome.limit, intl)}</span>.
                </ThresholdNotice>
              )}

              {result.outcome.kind === 'above-ceiling' && (
                <UnknownNotice title={id ? 'Di atas rentang pencarian' : 'Above the search range'}>
                  {id
                    ? `Batas Anda masih terpenuhi pada bunga ${formatRate(result.outcome.ceiling, intl)}, yaitu ujung rentang yang dicari aplikasi ini. Tidak ada angka ambang yang dinyatakan, karena tidak ada yang ditemukan.`
                    : `Your limit still holds at ${formatRate(result.outcome.ceiling, intl)}, the top of the range this app searches. No threshold figure is stated, because none was found.`}
                </UnknownNotice>
              )}

              <section className="grid gap-4 sm:grid-cols-3">
                <Figure
                  label={id ? 'Angsuran masa tetap' : 'Instalment, fixed period'}
                  value={formatRupiah(result.outcome.fixedPayment, intl)}
                />
                <Figure
                  label={id ? 'Batas yang Anda tetapkan' : 'The limit you set'}
                  value={formatRupiah(result.outcome.limit, intl)}
                  threshold
                />
                <Figure
                  label={
                    id
                      ? `Sisa pokok saat masa tetap berakhir (bulan ${fixedMonths})`
                      : `Balance when the fixed period ends (month ${fixedMonths})`
                  }
                  value={formatRupiah(result.outcome.balanceAtBoundary, intl)}
                  note={
                    id
                      ? `${result.outcome.remainingMonths} bulan tersisa`
                      : `${result.outcome.remainingMonths} months remaining`
                  }
                />
              </section>

              <UnknownNotice title={t.floating.title}>{t.floating.body}</UnknownNotice>

              {result.schedule && (
                <section className="space-y-3">
                  <h2 className="sheet-label text-sm text-annotation">
                    {id
                      ? 'Jadwal pada suku bunga ambang'
                      : 'The schedule at the threshold rate'}
                  </h2>
                  <p className="text-sm text-print/75">
                    {id
                      ? 'Suku bunga di atas dikembalikan ke mesin perhitungan; inilah jadwal yang dihasilkannya. Angsuran pertama setelah batas sama persis dengan batas yang Anda tetapkan.'
                      : 'The rate above was fed back through the engine; this is the schedule it produces. The first instalment past the boundary equals the limit you set, to the rupiah.'}
                  </p>
                  <ScheduleElevation
                    schedule={result.schedule}
                    locale={locale}
                    boundaryMonth={fixedMonths}
                  />
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  note,
  threshold,
}: {
  label: string
  value: string
  note?: string
  threshold?: boolean
}) {
  return (
    <div
      className={`border px-4 py-3 ${
        threshold ? 'border-threshold/60 bg-threshold/10' : 'border-annotation/25 bg-recess'
      }`}
    >
      <p className={`sheet-label text-xs ${threshold ? 'text-threshold' : 'text-annotation'}`}>
        {label}
      </p>
      <p className={`figure mt-1 text-xl ${threshold ? 'text-threshold' : 'text-print'}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-print/70">{note}</p>}
    </div>
  )
}
