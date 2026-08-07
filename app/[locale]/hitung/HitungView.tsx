'use client'

import { useEffect, useMemo, useState } from 'react'
import { rupiah, subtract, type RoundingConvention } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { buildFlatSchedule } from '@/lib/amortise/flat'
import { scheduleIrr } from '@/lib/rate/irr'
import { effectiveFromFlat } from '@/lib/rate/effective'
import { buildBand } from '@/lib/scenario/band'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'
import { AmortisationTable } from '@/components/table/AmortisationTable'
import { TraceView } from '@/components/trace/TraceView'
import { MoneyField, NumberField, RateField, SelectField } from '@/components/field/Field'
import { UnknownNotice } from '@/components/notice/Notice'
import { PrepayPanel } from '@/components/prepay/PrepayPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { Panel } from '@/components/ui/Panel'
import { StatCard } from '@/components/ui/StatCard'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { LiveRegion } from '@/components/ui/LiveRegion'
import { EXAMPLE_HITUNG, ExampleBanner, ExampleButton } from '@/components/ui/ExampleBanner'
import type { RateSegment } from '@/lib/amortise/types'
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
  /** Set only by the worked-example button. Never defaults on. */
  contoh: boolean
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
  contoh: false,
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
      contoh: readNumber(hash, 'ex', current.contoh ? 1 : 0) === 1,
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
      ex: state.contoh ? 1 : 0,
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

      const segments: RateSegment[] = hasFloating
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
          ]

      const schedule = buildSchedule({
        principal,
        start,
        termMonths,
        rounding: state.rounding,
        segments,
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

      /*
       * The counterfactual: this loan as every other calculator models it —
       * the quoted rate held for the whole term. Its monthly figure is
       * identical to the fixed-period one, which is exactly why the error is
       * invisible; the divergence is in the total.
       */
      const singleRate = hasFloating
        ? buildSchedule({
            principal,
            start,
            termMonths,
            rounding: state.rounding,
            segments: [
              { months: termMonths, annualRate: state.bungaTetap, phase: 'tetap', assumed: false },
            ],
          })
        : undefined

      const firstPayment = schedule.instalments[0]?.payment ?? rupiah(0)
      const floatingPayment = hasFloating ? schedule.instalments[fixedMonths]?.payment : undefined

      return {
        kind: 'ok' as const,
        schedule,
        segments,
        firstPayment,
        floatingPayment,
        // The step at the boundary, which is the whole subject of this app.
        // Money arithmetic, in the money type, on the container side.
        step: floatingPayment ? subtract(floatingPayment, firstPayment) : undefined,
        /*
         * Two months, read off both schedules: where the conventions agree and
         * where they have come apart. Reading only, nothing computed here.
         *
         * The effective side must be the single-rate schedule, not the real
         * one. A late month of the real schedule sits in the floating segment,
         * so comparing it against a flat quote at the fixed rate would be
         * comparing two different rates and calling the difference convention.
         * Both columns here are the same nominal rate over the same term —
         * which is the only comparison that says anything about convention.
         */
        compare: (() => {
          const effectiveSchedule = singleRate ?? schedule
          const late = Math.max(Math.floor(termMonths * 0.75) - 1, 1)
          return [0, late]
            .map((index) => {
              const effective = effectiveSchedule.instalments[index]
              const flatRow = flat.instalments[index]
              if (!effective || !flatRow) return undefined
              return {
                month: effective.index,
                balance: effective.openingBalance,
                effectiveInterest: effective.interest,
                flatInterest: flatRow.interest,
              }
            })
            .filter((row): row is NonNullable<typeof row> => row !== undefined)
        })(),
        firstInterest: schedule.instalments[0]?.interest ?? rupiah(0),
        firstPrincipal: schedule.instalments[0]?.principal ?? rupiah(0),
        firstPrincipalShare:
          firstPayment === 0 ? 0 : (schedule.instalments[0]?.principal ?? 0) / firstPayment,
        singleRate,
        // What the single-rate assumption leaves out of the total.
        hidden: singleRate ? subtract(schedule.totalPaid, singleRate.totalPaid) : undefined,
        // A ratio, so a float — the one direction across the boundary that is
        // allowed. Display only; nothing downstream is computed from it.
        interestShare:
          schedule.totalPaid === 0 ? 0 : schedule.totalInterest / schedule.totalPaid,
        start,
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
      <PageHeader
        eyebrow={t.nav.hitung}
        title={
          id
            ? 'Berapa angsuran saya, sebelum dan sesudah bunga tetap berakhir?'
            : 'What is my instalment, before and after the fixed rate ends?'
        }
        lede={
          id
            ? 'Isi apa yang bank kutip kepada Anda. Tidak ada satu pun suku bunga yang diisikan aplikasi ini — kolom bunga mulai kosong, karena angka yang sudah terisi akan terbaca seperti data.'
            : 'Enter what the bank quoted you. No rate on this page is supplied by the app — the rate fields start empty, because a pre-filled figure reads like data.'
        }
      />

      <div className="grid gap-10 lg:grid-cols-[21rem_1fr]">
        <form
          className="print-hidden space-y-8 lg:sticky lg:top-36 lg:self-start"
          onSubmit={(event) => event.preventDefault()}
        >
          <FieldGroup
            step={1}
            title={id ? 'Rumah dan uang muka' : 'The house and your deposit'}
            note={
              id
                ? 'Selisihnya adalah plafon — jumlah yang benar-benar dipinjamkan bank.'
                : 'The difference is the plafon — what the bank actually lends you.'
            }
          >
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
              <p className="sheet-label text-caption text-annotation">{t.form.plafon}</p>
              <p className="figure text-lead">{formatRupiah(rupiah(plafon), intl)}</p>
            </div>
          </FieldGroup>

          <FieldGroup
            step={2}
            title={id ? 'Yang dikutip bank' : 'What the bank quoted'}
            note={
              id
                ? 'Salin dari surat penawaran: bunganya, dan berapa tahun bunga itu dikunci.'
                : 'Copy it from the offer letter: the rate, and how many years it is locked for.'
            }
          >
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
          </FieldGroup>

          <FieldGroup
            step={3}
            tone="unknown"
            title={id ? 'Setelah masa tetap habis' : 'Once the fixed period ends'}
            note={
              id
                ? 'Tidak ada yang tahu angka ini, termasuk aplikasi ini. Isi tebakan Anda, lalu coba beberapa angka lain.'
                : 'Nobody knows this figure, this app included. Enter your guess, then try a few others.'
            }
          >
            <RateField
              label={t.form.bungaMengambang}
              value={state.bungaMengambang}
              onChange={(bungaMengambang) => setState({ ...state, bungaMengambang })}
              amber
              hint={t.floating.short}
            />
            <div className="grid grid-cols-2 gap-3">
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
            <p className="text-caption text-unknown">
              {id
                ? 'Kedua angka itu melebarkan pita kemungkinan pada grafik — bukan ramalan, melainkan rentang yang Anda ingin lihat.'
                : 'Those two widen the band of outcomes on the chart — not a forecast, just the range you want to look at.'}
            </p>
          </FieldGroup>

          <details className="border-t border-annotation/25 pt-4">
            <summary className="sheet-label cursor-pointer text-caption text-annotation">
              {id ? 'Rincian teknis' : 'Technical details'}
            </summary>
            <div className="mt-4 space-y-4">
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
            </div>
          </details>
        </form>

        <div className="space-y-10">
          {/* The headline only — this is read out on every keystroke. */}
          <LiveRegion>
            {result?.kind === 'ok'
              ? id
                ? `Angsuran masa tetap ${formatRupiah(result.firstPayment, intl)}.` +
                  (result.floatingPayment && result.step
                    ? ` Setelah masa tetap ${formatRupiah(result.floatingPayment, intl)}, naik ${formatRupiah(result.step, intl)} sebulan.`
                    : '')
                : `Instalment during the fixed period ${formatRupiah(result.firstPayment, intl)}.` +
                  (result.floatingPayment && result.step
                    ? ` After the fixed period ${formatRupiah(result.floatingPayment, intl)}, up ${formatRupiah(result.step, intl)} a month.`
                    : '')
              : ''}
          </LiveRegion>

          {state.contoh && (
            <ExampleBanner
              locale={locale}
              onClear={() => setState({ ...INITIAL, contoh: false })}
            />
          )}

          {!ready && (
            <section className="border border-annotation/25 bg-recess px-6 py-6">
              <p className="sheet-label text-caption text-annotation">
                {id ? 'Belum ada yang dihitung' : 'Nothing computed yet'}
              </p>
              <p className="measure mt-2 text-muted">
                {id
                  ? 'Isi tiga hal di sebelah kiri dan jadwalnya muncul di sini.'
                  : 'Fill in three things on the left and the schedule appears here.'}
              </p>
              <ul className="mt-4 space-y-2 text-caption">
                <Need done={state.harga > 0} label={t.form.harga} locale={locale} />
                <Need done={plafon > 0} label={t.form.plafon} locale={locale} />
                <Need done={state.bungaTetap > 0} label={t.form.bungaTetap} locale={locale} />
              </ul>

              <p className="measure mt-6 text-caption text-muted">
                {id
                  ? 'Belum punya penawaran dari bank? Isi dengan contoh untuk melihat cara kerjanya lebih dulu — angkanya dibuat-buat dan ditandai kuning.'
                  : 'No offer from a bank yet? Fill in a worked example to see how it behaves first — the figures are invented and marked amber.'}
              </p>
              <div className="mt-3">
                <ExampleButton
                  locale={locale}
                  onLoad={() => setState({ ...state, ...EXAMPLE_HITUNG, contoh: true })}
                />
              </div>
            </section>
          )}

          {result?.kind === 'error' && (
            <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
              {result.error}
            </UnknownNotice>
          )}

          {result?.kind === 'ok' && (
            <>
              <section className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    size="lg"
                    label={
                      id
                        ? `Angsuran, ${state.masaTetapTahun} tahun pertama`
                        : `Instalment, first ${state.masaTetapTahun} years`
                    }
                    value={formatRupiah(result.firstPayment, intl)}
                    tag={t.common.computed}
                    note={
                      id
                        ? 'Dari bunga tetap yang Anda isikan.'
                        : 'From the fixed rate you entered.'
                    }
                  />
                  <StatCard
                    size="lg"
                    tone={result.hasFloating ? 'unknown' : 'computed'}
                    label={id ? 'Angsuran setelah itu' : 'Instalment after that'}
                    value={
                      result.floatingPayment ? formatRupiah(result.floatingPayment, intl) : '—'
                    }
                    tag={result.hasFloating ? t.common.assumption : undefined}
                    note={
                      result.step
                        ? id
                          ? `Naik ${formatRupiah(result.step, intl)} sebulan pada bunga yang Anda asumsikan.`
                          : `Up ${formatRupiah(result.step, intl)} a month at the rate you assumed.`
                        : id
                          ? 'Isi bunga mengambang untuk melihat angka ini.'
                          : 'Enter a floating rate to see this figure.'
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label={id ? 'Total dibayar sampai lunas' : 'Total paid over the term'}
                    value={formatRupiah(result.schedule.totalPaid, intl)}
                    note={`${t.table.totalBunga}: ${formatRupiah(result.schedule.totalInterest, intl)}`}
                  />
                  <StatCard
                    label={id ? 'Bunga sebagai bagian dari total' : 'Interest as a share of the total'}
                    value={formatRate(result.interestShare, intl)}
                    note={
                      id
                        ? 'Bagian dari uang Anda yang tidak menjadi rumah.'
                        : 'The share of your money that does not become house.'
                    }
                  />
                </div>
              </section>

              {result.singleRate && result.hidden && (
                <Panel
                  title={id ? 'Yang dilewatkan kalkulator lain' : 'What other calculators leave out'}
                  note={
                    id
                      ? 'Kalkulator KPR pada umumnya memakai satu bunga untuk seluruh tenor. Angka bulanannya sama persis dengan angsuran masa tetap di atas — justru itu sebabnya kekeliruannya tidak terlihat. Yang berbeda adalah totalnya.'
                      : 'A typical KPR calculator applies one rate for the whole term. Its monthly figure is identical to the fixed-period instalment above — which is precisely why the error is invisible. The total is what differs.'
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      label={
                        id
                          ? 'Total bila bunga tidak pernah berubah'
                          : 'Total if the rate never changed'
                      }
                      value={formatRupiah(result.singleRate.totalPaid, intl)}
                      note={
                        id
                          ? `Bunga ${formatRate(state.bungaTetap, intl)} selama ${state.tenorTahun} tahun penuh — asumsi yang tidak dinyatakan kalkulator mana pun.`
                          : `${formatRate(state.bungaTetap, intl)} for all ${state.tenorTahun} years — an assumption no calculator states out loud.`
                      }
                    />
                    <StatCard
                      tone="unknown"
                      label={
                        id ? 'Selisih dengan asumsi Anda' : 'Difference under your assumption'
                      }
                      value={formatRupiah(result.hidden, intl)}
                      tag={t.common.assumption}
                      note={
                        id
                          ? `Sebanyak itu tidak muncul di mana pun bila bunga setelah masa tetap diandaikan tetap ${formatRate(state.bungaTetap, intl)}.`
                          : `That much appears nowhere if the rate after the fixed period is assumed to stay at ${formatRate(state.bungaTetap, intl)}.`
                      }
                    />
                  </div>
                </Panel>
              )}

              {!result.hasFloating && fixedMonths > 0 && (
                <UnknownNotice title={t.floating.title}>{t.floating.body}</UnknownNotice>
              )}

              <ShareBar locale={locale} />

              <Panel
                title={id ? 'Elevasi jadwal' : 'Schedule elevation'}
                note={
                  id
                    ? 'Setiap bulan sebagai satu kolom. Bagian bawah adalah bunga, sisanya pokok — dan bagian bunga itu mengecil perlahan sekali di tahun-tahun awal.'
                    : 'Each month is a column. The lower part is interest, the rest repays the loan — and in the early years that interest part shrinks very slowly indeed.'
                }
              >
                <ScheduleElevation
                  schedule={result.schedule}
                  band={result.band}
                  locale={locale}
                  boundaryMonth={result.hasFloating ? fixedMonths : undefined}
                />

                {/*
                 * PRD §5.1 names two things this drawing should make visible.
                 * The step is unmissable. The other one — how little of an
                 * early payment is actually yours — is invisible unless it is
                 * said, with the reader's own figures.
                 */}
                <p className="measure text-caption text-muted">
                  {id
                    ? `Di bulan pertama, ${formatRupiah(result.firstInterest, intl)} dari angsuran ${formatRupiah(result.firstPayment, intl)} adalah bunga. Utang pokok Anda berkurang ${formatRupiah(result.firstPrincipal, intl)} — sekitar ${formatRate(result.firstPrincipalShare, intl)} dari yang Anda bayar. Itu sebabnya sisa utang hampir tidak bergerak di tahun-tahun awal.`
                    : `In the first month, ${formatRupiah(result.firstInterest, intl)} of the ${formatRupiah(result.firstPayment, intl)} instalment is interest. What you owe falls by ${formatRupiah(result.firstPrincipal, intl)} — about ${formatRate(result.firstPrincipalShare, intl)} of what you paid. That is why the balance barely moves in the early years.`}
                </p>
              </Panel>

              <Panel
                title={id ? 'Flat dibanding efektif' : 'Flat versus effective'}
                note={
                  id
                    ? 'Angka nominal yang sama, dua konvensi yang berbeda. Keduanya menagih bunga yang sama persis di bulan pertama — perbedaannya baru terlihat setelah Anda mulai mengembalikan pokok.'
                    : 'The same nominal figure under two different conventions. Both charge exactly the same interest in month one — the difference only appears once you have started paying the loan back.'
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-annotation/25 bg-recess px-4 py-3">
                    <p className="sheet-label text-caption text-annotation">
                      {t.form.efektif} {formatRate(state.bungaTetap, intl)}
                    </p>
                    <p className="figure mt-1 text-lead">
                      {formatRupiah(result.firstPayment, intl)}
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      {id
                        ? 'Bunga atas saldo terutang. IRR jadwal ini: '
                        : 'Interest on the outstanding balance. This schedule’s IRR: '}
                      <span className="figure">{formatRate(result.irr.annualRate, intl)}</span>
                    </p>
                  </div>
                  <div className="border border-annotation/25 bg-recess px-4 py-3">
                    <p className="sheet-label text-caption text-annotation">
                      {t.form.flat} {formatRate(state.bungaTetap, intl)}
                    </p>
                    <p className="figure mt-1 text-lead">
                      {formatRupiah(result.flat.instalments[0]?.payment ?? rupiah(0), intl)}
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      {id ? 'Setara efektif: ' : 'Equivalent effective rate: '}
                      <span className="figure">
                        {formatRate(result.flatAsEffective.effectiveAnnualRate, intl)}
                      </span>
                    </p>
                  </div>
                </div>

                {result.compare && (
                  <div className="overflow-x-auto border border-annotation/25">
                    <table className="w-full min-w-[36rem] border-collapse text-caption">
                      <caption className="sr-only">
                        {id
                          ? 'Bunga yang ditagih pada dua bulan, di bawah konvensi efektif dan flat, pada bunga nominal yang sama.'
                          : 'Interest charged in two months, under the effective and flat conventions, at the same nominal rate.'}
                      </caption>
                      <thead>
                        <tr className="border-b border-annotation/40 bg-recess">
                          <th scope="col" className="sheet-label px-3 py-2 text-left text-micro font-normal text-annotation">
                            {t.table.bulan}
                          </th>
                          <th scope="col" className="sheet-label px-3 py-2 text-right text-micro font-normal text-annotation">
                            {id ? 'Sisa utang (efektif)' : 'Still owed (effective)'}
                          </th>
                          <th scope="col" className="sheet-label px-3 py-2 text-right text-micro font-normal text-annotation">
                            {id ? 'Bunga — efektif' : 'Interest — effective'}
                          </th>
                          <th scope="col" className="sheet-label px-3 py-2 text-right text-micro font-normal text-annotation">
                            {id ? 'Bunga — flat' : 'Interest — flat'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.compare.map((row) => (
                          <tr key={row.month} className="border-b border-annotation/15">
                            <td className="figure px-3 py-2">{row.month}</td>
                            <td className="figure px-3 py-2 text-right">
                              {formatRupiah(row.balance, intl)}
                            </td>
                            <td className="figure px-3 py-2 text-right">
                              {formatRupiah(row.effectiveInterest, intl)}
                            </td>
                            <td className="figure px-3 py-2 text-right">
                              {formatRupiah(row.flatInterest, intl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="measure text-caption text-muted">
                  {id
                    ? `Kedua kolom memakai bunga nominal yang sama, ${formatRate(state.bungaTetap, intl)}, selama tenor penuh — jadi yang dibandingkan benar-benar konvensinya, bukan dua bunga yang berbeda. Di bulan pertama kedua kolom sama, karena Anda memang masih berutang penuh. Di baris kedua Anda sudah mengembalikan sebagian besar pokok — bunga efektif ikut turun, bunga flat tidak, karena flat tetap menghitung dari plafon awal. Selisih itulah yang membuat “flat 5%” tidak sebanding dengan “efektif 5%”.`
                    : `Both columns use the same nominal rate, ${formatRate(state.bungaTetap, intl)}, over the full term — so what is being compared really is the convention rather than two different rates. In month one the two columns agree, because you really do still owe the whole amount. By the second row you have repaid most of the principal — effective interest has fallen with it, flat interest has not, because flat keeps charging on the original plafon. That gap is why "flat 5%" is not comparable to "effective 5%".`}
                </p>
              </Panel>

              <Panel
                title={id ? 'Tabel angsuran' : 'Amortisation table'}
                note={
                  id
                    ? 'Klik satu baris untuk melihat penurunannya. Inilah lembar yang bisa Anda cetak dan bawa ke bank.'
                    : 'Click a row to see how it was derived. This is the sheet to print and take to the bank.'
                }
              >
                <AmortisationTable schedule={result.schedule} locale={locale} />
              </Panel>

              <Panel
                title={t.common.derivation}
                note={
                  id
                    ? 'Setiap langkah perhitungan, termasuk pembulatan dan konvensi yang dipakainya.'
                    : 'Every step of the computation, rounding and the convention it followed included.'
                }
              >
                <TraceView trace={result.schedule.trace} locale={locale} />
              </Panel>

              <PrepayPanel
                principal={plafon}
                start={result.start}
                termMonths={termMonths}
                segments={result.segments}
                rounding={state.rounding}
                locale={locale}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** One line of the empty state: what is still needed, and what is already in. */
function Need({ done, label, locale }: { done: boolean; label: string; locale: Locale }) {
  return (
    <li className={`flex items-baseline gap-3 ${done ? 'text-muted' : 'text-print'}`}>
      <span aria-hidden className={`figure ${done ? 'text-annotation' : 'text-unknown'}`}>
        {done ? '✓' : '·'}
      </span>
      <span>{label}</span>
      <span className="sr-only">
        {done
          ? locale === 'id'
            ? 'sudah diisi'
            : 'entered'
          : locale === 'id'
            ? 'belum diisi'
            : 'not yet entered'}
      </span>
    </li>
  )
}
