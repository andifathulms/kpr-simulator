'use client'

import { useEffect, useMemo, useState } from 'react'
import { rupiah, type RoundingConvention } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { buildFlatSchedule } from '@/lib/amortise/flat'
import { scheduleIrr } from '@/lib/rate/irr'
import { effectiveFromFlat } from '@/lib/rate/effective'
import { buildBand } from '@/lib/scenario/band'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'
import { AmortisationTable } from '@/components/table/AmortisationTable'
import { TraceView } from '@/components/trace/TraceView'
import { MoneyField, NumberField, RateField, SelectField } from '@/components/field/Field'
import { UnknownNotice } from '@/components/notice/Notice'
import { decodeHash, encodeHash, readNumber, readString } from '@/lib/url/hash'

/**
 * The container calls the engine and hands results down. The components it
 * renders compute nothing.
 *
 * Note what is *not* here: no default rate. Every rate field starts empty and
 * the schedule appears only once the user has stated one, because a pre-filled
 * rate is indistinguishable from data on the screen.
 */

const ROUNDINGS: readonly RoundingConvention[] = [
  'pembulatan-terdekat',
  'pembulatan-ke-bawah',
  'pembulatan-ke-atas',
]

interface State {
  harga: number
  uangMuka: number
  tenorTahun: number
  masaTetapTahun: number
  bungaTetap: number
  bungaMengambang: number
  marginBawah: number
  marginAtas: number
  mulaiTahun: number
  mulaiBulan: number
  rounding: RoundingConvention
}

const INITIAL: State = {
  harga: 0,
  uangMuka: 0,
  tenorTahun: 15,
  masaTetapTahun: 3,
  // Zero, not a plausible figure. The app never supplies a rate.
  bungaTetap: 0,
  bungaMengambang: 0,
  marginBawah: 0,
  marginAtas: 0,
  mulaiTahun: 2026,
  mulaiBulan: 9,
  rounding: 'pembulatan-terdekat',
}

export function HitungView({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'
  const [state, setState] = useState<State>(INITIAL)

  // Read on mount, write on change. Hash only — never the query string.
  useEffect(() => {
    const hash = decodeHash(window.location.hash)
    if (Object.keys(hash).length === 0) return
    setState((current) => ({
      harga: readNumber(hash, 'h', current.harga),
      uangMuka: readNumber(hash, 'um', current.uangMuka),
      tenorTahun: readNumber(hash, 'tn', current.tenorTahun),
      masaTetapTahun: readNumber(hash, 'mt', current.masaTetapTahun),
      bungaTetap: readNumber(hash, 'bt', current.bungaTetap),
      bungaMengambang: readNumber(hash, 'bm', current.bungaMengambang),
      marginBawah: readNumber(hash, 'mb', current.marginBawah),
      marginAtas: readNumber(hash, 'ma', current.marginAtas),
      mulaiTahun: readNumber(hash, 'my', current.mulaiTahun),
      mulaiBulan: readNumber(hash, 'mm', current.mulaiBulan),
      rounding: readString(hash, 'r', ROUNDINGS, current.rounding),
    }))
  }, [])

  useEffect(() => {
    const encoded = encodeHash({
      h: state.harga,
      um: state.uangMuka,
      tn: state.tenorTahun,
      mt: state.masaTetapTahun,
      bt: state.bungaTetap,
      bm: state.bungaMengambang,
      mb: state.marginBawah,
      ma: state.marginAtas,
      my: state.mulaiTahun,
      mm: state.mulaiBulan,
      r: state.rounding,
    })
    window.history.replaceState(null, '', `#${encoded}`)
  }, [state])

  const plafon = Math.max(state.harga - state.uangMuka, 0)
  const termMonths = Math.round(state.tenorTahun * 12)
  const fixedMonths = Math.min(Math.round(state.masaTetapTahun * 12), Math.max(termMonths - 1, 0))
  const ready = plafon > 0 && termMonths > 0 && state.bungaTetap > 0
  const floatingStated = state.bungaMengambang > 0

  const result = useMemo(() => {
    if (!ready) return null
    try {
      const start = period(state.mulaiTahun, state.mulaiBulan)
      const principal = rupiah(plafon)
      const hasFloating = fixedMonths > 0 && fixedMonths < termMonths && floatingStated

      const schedule = buildSchedule({
        principal,
        start,
        termMonths,
        rounding: state.rounding,
        segments: hasFloating
          ? [
              {
                months: fixedMonths,
                annualRate: state.bungaTetap,
                phase: 'tetap',
                assumed: false,
              },
              {
                months: termMonths - fixedMonths,
                annualRate: state.bungaMengambang,
                phase: 'mengambang',
                assumed: true,
              },
            ]
          : [
              {
                months: termMonths,
                annualRate: state.bungaTetap,
                phase: 'tetap',
                assumed: false,
              },
            ],
      })

      const band =
        hasFloating && (state.marginBawah > 0 || state.marginAtas > 0)
          ? buildBand({
              principal,
              start,
              termMonths,
              fixedMonths,
              fixedAnnualRate: state.bungaTetap,
              rounding: state.rounding,
              scenarios: [
                {
                  key: 'optimis',
                  baseRate: state.bungaMengambang,
                  // The optimistic edge stops at zero rather than going
                  // negative — a negative rate is not an outcome, it is a
                  // symptom of the spread being wider than the rate itself.
                  margin: -Math.min(Math.abs(state.marginBawah), state.bungaMengambang),
                },
                { key: 'dasar', baseRate: state.bungaMengambang, margin: 0 },
                {
                  key: 'tekanan',
                  baseRate: state.bungaMengambang,
                  margin: Math.abs(state.marginAtas),
                },
              ],
            })
          : undefined

      const flat = buildFlatSchedule({
        principal,
        start,
        termMonths,
        annualRate: state.bungaTetap,
        assumed: false,
        rounding: state.rounding,
      })

      return {
        kind: 'ok' as const,
        schedule,
        band,
        hasFloating,
        irr: scheduleIrr(schedule),
        flat,
        flatAsEffective: effectiveFromFlat({
          principal,
          flatAnnualRate: state.bungaTetap,
          termMonths,
        }),
      }
    } catch (error) {
      return { kind: 'error' as const, error: error instanceof Error ? error.message : String(error) }
    }
  }, [ready, plafon, termMonths, fixedMonths, floatingStated, state])

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="sheet-label text-2xl">{t.nav.hitung}</h1>
        <p className="mt-2 text-print/80">
          {id
            ? 'Isi apa yang bank kutip kepada Anda. Tidak ada satu pun suku bunga yang diisikan aplikasi ini.'
            : 'Enter what the bank quoted you. No rate on this page is supplied by the app.'}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <MoneyField
            label={t.form.harga}
            value={state.harga}
            onChange={(harga) => setState({ ...state, harga })}
          />
          <MoneyField
            label={t.form.uangMuka}
            value={state.uangMuka}
            onChange={(uangMuka) => setState({ ...state, uangMuka })}
            hint={
              id
                ? 'Angka Anda. Batas LTV untuk rumah pertama diserahkan BI kepada kebijakan bank.'
                : 'Your figure. BI has released the first-home LTV maximum to bank discretion.'
            }
          />
          <div className="border border-annotation/25 bg-recess px-3 py-2">
            <p className="sheet-label text-xs text-annotation">{t.form.plafon}</p>
            <p className="figure text-lg">{formatRupiah(rupiah(plafon), intl)}</p>
          </div>

          <NumberField
            label={t.form.tenorTahun}
            value={state.tenorTahun}
            onChange={(tenorTahun) => setState({ ...state, tenorTahun })}
            min={1}
            max={40}
            suffix={id ? 'thn' : 'yr'}
          />
          <RateField
            label={t.form.bungaTetap}
            value={state.bungaTetap}
            onChange={(bungaTetap) => setState({ ...state, bungaTetap })}
            hint={id ? 'Yang bank kutip untuk masa tetap.' : 'What the bank quoted for the fixed period.'}
          />
          <NumberField
            label={t.form.masaTetapTahun}
            value={state.masaTetapTahun}
            onChange={(masaTetapTahun) => setState({ ...state, masaTetapTahun })}
            min={0}
            max={Math.max(state.tenorTahun - 1, 0)}
            suffix={id ? 'thn' : 'yr'}
          />

          <div className="border-l-2 border-unknown pl-3">
            <RateField
              label={t.form.bungaMengambang}
              value={state.bungaMengambang}
              onChange={(bungaMengambang) => setState({ ...state, bungaMengambang })}
              amber
              hint={t.floating.short}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <RateField
                label={id ? 'Lebih rendah' : 'Lower by'}
                value={state.marginBawah}
                onChange={(marginBawah) => setState({ ...state, marginBawah })}
                amber
                max={10}
              />
              <RateField
                label={id ? 'Lebih tinggi' : 'Higher by'}
                value={state.marginAtas}
                onChange={(marginAtas) => setState({ ...state, marginAtas })}
                amber
                max={10}
              />
            </div>
          </div>

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

          <SelectField
            label={t.form.pembulatan}
            value={state.rounding}
            onChange={(rounding) => setState({ ...state, rounding })}
            options={ROUNDINGS.map((value) => ({ value, label: value }))}
            hint={
              id
                ? 'Bank berbeda membulatkan berbeda. Selisih beberapa rupiah biasanya berasal dari sini.'
                : 'Banks round differently. A few rupiah of divergence usually starts here.'
            }
          />
        </form>

        <div className="space-y-8">
          {!ready && (
            <UnknownNotice title={id ? 'Belum ada yang dihitung' : 'Nothing computed yet'}>
              {id
                ? 'Isi harga rumah dan bunga tetap yang bank kutip. Aplikasi ini tidak mengisikan suku bunga awal apa pun, karena angka yang sudah terisi akan terbaca seperti data.'
                : 'Enter a house price and the fixed rate you were quoted. The app pre-fills no rate, because a pre-filled figure reads like data.'}
            </UnknownNotice>
          )}

          {result?.kind === 'error' && (
            <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
              {result.error}
            </UnknownNotice>
          )}

          {result?.kind === 'ok' && (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <Figure
                  label={id ? 'Angsuran masa tetap' : 'Instalment, fixed period'}
                  value={formatRupiah(result.schedule.instalments[0]?.payment ?? rupiah(0), intl)}
                />
                <Figure
                  label={id ? 'Angsuran setelah masa tetap' : 'Instalment, after the fixed period'}
                  value={
                    result.hasFloating
                      ? formatRupiah(
                          result.schedule.instalments[fixedMonths]?.payment ?? rupiah(0),
                          intl,
                        )
                      : '—'
                  }
                  amber={result.hasFloating}
                  note={result.hasFloating ? t.floating.short : undefined}
                />
                <Figure
                  label={id ? 'Total dibayar' : 'Total paid'}
                  value={formatRupiah(result.schedule.totalPaid, intl)}
                  note={`${t.table.totalBunga}: ${formatRupiah(result.schedule.totalInterest, intl)}`}
                />
              </section>

              {!result.hasFloating && fixedMonths > 0 && (
                <UnknownNotice title={t.floating.title}>{t.floating.body}</UnknownNotice>
              )}

              <section className="space-y-3">
                <h2 className="sheet-label text-sm text-annotation">
                  {id ? 'Elevasi jadwal' : 'Schedule elevation'}
                </h2>
                <ScheduleElevation
                  schedule={result.schedule}
                  band={result.band}
                  locale={locale}
                  boundaryMonth={result.hasFloating ? fixedMonths : undefined}
                />
              </section>

              <section className="space-y-3">
                <h2 className="sheet-label text-sm text-annotation">
                  {id ? 'Flat dibanding efektif' : 'Flat versus effective'}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-annotation/25 bg-recess px-4 py-3">
                    <p className="sheet-label text-xs text-annotation">
                      {t.form.efektif} {formatRate(state.bungaTetap, intl)}
                    </p>
                    <p className="figure mt-1 text-lg">
                      {formatRupiah(result.schedule.instalments[0]?.payment ?? rupiah(0), intl)}
                    </p>
                    <p className="mt-1 text-xs text-print/70">
                      {id
                        ? 'Bunga atas saldo terutang. IRR jadwal ini: '
                        : 'Interest on the outstanding balance. This schedule’s IRR: '}
                      <span className="figure">{formatRate(result.irr.annualRate, intl)}</span>
                    </p>
                  </div>
                  <div className="border border-annotation/25 bg-recess px-4 py-3">
                    <p className="sheet-label text-xs text-annotation">
                      {t.form.flat} {formatRate(state.bungaTetap, intl)}
                    </p>
                    <p className="figure mt-1 text-lg">
                      {formatRupiah(result.flat.instalments[0]?.payment ?? rupiah(0), intl)}
                    </p>
                    <p className="mt-1 text-xs text-print/70">
                      {id ? 'Setara efektif: ' : 'Equivalent effective rate: '}
                      <span className="figure">
                        {formatRate(result.flatAsEffective.effectiveAnnualRate, intl)}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-print/75">
                  {id
                    ? 'Angka nominal yang sama, dua konvensi yang berbeda. Kutipan flat menghitung bunga atas plafon awal sepanjang tenor, termasuk atas uang yang sudah Anda kembalikan.'
                    : 'The same nominal figure under two different conventions. A flat quote charges interest on the original plafon for the whole term, including on money you have already repaid.'}
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="sheet-label text-sm text-annotation">
                  {id ? 'Tabel angsuran' : 'Amortisation table'}
                </h2>
                <AmortisationTable schedule={result.schedule} locale={locale} />
              </section>

              <section className="space-y-3">
                <h2 className="sheet-label text-sm text-annotation">{t.common.derivation}</h2>
                <TraceView trace={result.schedule.trace} locale={locale} />
              </section>
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
  amber,
}: {
  label: string
  value: string
  note?: string
  amber?: boolean
}) {
  return (
    <div
      className={`border px-4 py-3 ${
        amber ? 'border-unknown/60 bg-unknown/10' : 'border-annotation/25 bg-recess'
      }`}
    >
      <p className={`sheet-label text-xs ${amber ? 'text-unknown' : 'text-annotation'}`}>{label}</p>
      <p className={`figure mt-1 text-xl ${amber ? 'text-unknown' : 'text-print'}`}>{value}</p>
      {note && <p className={`mt-1 text-xs ${amber ? 'text-unknown' : 'text-print/70'}`}>{note}</p>}
    </div>
  )
}
