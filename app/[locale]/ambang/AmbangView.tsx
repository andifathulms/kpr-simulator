'use client'

import { useEffect, useMemo, useState } from 'react'
import { rupiah } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { floatingPaymentCurve } from '@/lib/rate/curve'
import { solveThreshold } from '@/lib/rate/threshold'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { MoneyField, NumberField, RateField } from '@/components/field/Field'
import { ThresholdNotice, UnknownNotice } from '@/components/notice/Notice'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'
import { ThresholdCurve } from '@/components/threshold/ThresholdCurve'
import { decodeHash, encodeHash, readNumber } from '@/lib/url/hash'
import { PageHeader } from '@/components/ui/PageHeader'
import { Panel } from '@/components/ui/Panel'
import { StatCard } from '@/components/ui/StatCard'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { Glossary } from '@/components/ui/Glossary'
import { BankQuestions } from '@/components/ui/BankQuestions'
import { LiveRegion } from '@/components/ui/LiveRegion'
import { EmptySheet } from '@/components/ui/EmptySheet'
import { EXAMPLE_AMBANG, ExampleBanner, ExampleButton } from '@/components/ui/ExampleBanner'

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
  /** Set only by the worked-example button. Never defaults on. */
  contoh: boolean
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
  contoh: false,
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
      contoh: readNumber(hash, 'ex', current.contoh ? 1 : 0) === 1,
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
        ex: state.contoh ? 1 : 0,
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

      /*
       * Neighbours of the answer. A single root is a fact to accept; the rates
       * either side of it are a fact to reason with — and the natural next
       * question ("what about 12%? 15%?") should not require retyping.
       *
       * Each row is the engine run again at that rate, not an interpolation.
       */
      const gradient =
        outcome.kind === 'found'
          ? [-0.02, -0.01, 0, 0.01, 0.02]
              .map((offset) => {
                const annualRate = outcome.annualRate + offset
                if (annualRate <= 0) return undefined
                const built = buildSchedule({
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
                      annualRate,
                      phase: 'mengambang',
                      assumed: true,
                    },
                  ],
                })
                const payment = built.instalments[fixedMonths]?.payment
                if (!payment) return undefined
                return { annualRate, payment, isThreshold: offset === 0 }
              })
              .filter((row): row is NonNullable<typeof row> => row !== undefined)
          : []

      /*
       * The whole relationship the answer sits on, for the crossing chart:
       * every half point from 0% to comfortably past the threshold — at least
       * 20%, at most 50%, ending on a round five. Each point is a full
       * schedule from the engine, not an interpolation.
       */
      const curve =
        outcome.kind === 'found'
          ? floatingPaymentCurve(
              {
                principal: rupiah(state.plafon),
                start: period(state.mulaiTahun, state.mulaiBulan),
                termMonths,
                fixedMonths,
                fixedAnnualRate: state.bungaTetap,
                rounding: 'pembulatan-terdekat',
              },
              curveRates(outcome.annualRate),
            )
          : []

      return { kind: 'ok' as const, outcome, schedule, gradient, curve }
    } catch (error) {
      return {
        kind: 'error' as const,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [ready, state, termMonths, fixedMonths])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t.nav.ambang}
        title={t.pages.ambang.title}
        lede={t.pages.ambang.lede}
      />

      <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form
          className="print-hidden space-y-5 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto lg:pb-4 lg:pr-2 lg:[scrollbar-width:thin]"
          onSubmit={(event) => event.preventDefault()}
        >
          <FieldGroup
            step={1}
            done={state.plafon > 0 && state.bungaTetap > 0 && fixedMonths > 0 && fixedMonths < termMonths}
            title={id ? 'Pinjamannya' : 'The loan'}
            note={
              id
                ? 'Yang bank kutip: jumlah yang dipinjam, lamanya, bunga tetap dan berapa lama dikunci.'
                : 'What the bank quoted: the amount, the term, the fixed rate and how long it holds.'
            }
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
              presets={[10, 15, 20, 25]}
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
              presets={[1, 2, 3, 5]}
            />
          </FieldGroup>

          <FieldGroup
            step={2}
            done={state.penghasilan > 0 && state.porsi > 0}
            title={id ? 'Batas yang Anda tetapkan' : 'The limit you set'}
            note={
              id
                ? 'Batas ini milik Anda sepenuhnya. Aplikasi ini tidak menyatakan porsi mana yang wajar.'
                : 'The limit is entirely yours. The app does not say which share is sensible.'
            }
          >
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
            />
          </FieldGroup>

          <details className="border-t border-annotation/25 pt-4">
            <summary className="field-label cursor-pointer text-annotation hover:text-print">
              {id ? 'Rincian teknis' : 'Technical details'}
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-3">
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
          </details>
        </form>

        <div className="min-w-0 space-y-10 [&>[role=status]+*]:!mt-0">
          <LiveRegion>
            {result?.kind === 'ok' && result.outcome.kind === 'found'
              ? id
                ? `Ambang bunga mengambang ${formatRate(result.outcome.annualRate, intl)}. Pada bunga itu angsuran menjadi ${formatRupiah(result.outcome.limit, intl)}.`
                : `Floating-rate threshold ${formatRate(result.outcome.annualRate, intl)}. At that rate the instalment becomes ${formatRupiah(result.outcome.limit, intl)}.`
              : ''}
          </LiveRegion>

          {state.contoh && (
            <ExampleBanner
              locale={locale}
              onClear={() => setState({ ...INITIAL, contoh: false })}
            />
          )}

          {!ready && (
            <EmptySheet
              title={id ? 'Angka ambang Anda akan muncul di sini' : 'Your threshold will appear here'}
              note={
                id
                  ? 'Isi pinjaman yang dikutip bank dan penghasilan per bulan. Aplikasi mencari bunga mengambang yang membuat angsuran tepat menyentuh batas Anda.'
                  : 'Enter the loan the bank quoted and your monthly income. The app finds the floating rate at which the instalment exactly meets your limit.'
              }
              outline={{
                known: id ? 'masa tetap' : 'fixed period',
                unknown: id ? 'sampai batas Anda' : 'up to your limit',
              }}
              progressLabel={
                id ? `${[state.plafon > 0, state.bungaTetap > 0, state.penghasilan > 0].filter(Boolean).length} dari 3 sudah diisi` : `${[state.plafon > 0, state.bungaTetap > 0, state.penghasilan > 0].filter(Boolean).length} of 3 entered`
              }
              needs={[
                { label: t.form.plafon, done: state.plafon > 0 },
                { label: t.form.bungaTetap, done: state.bungaTetap > 0 },
                { label: t.form.penghasilan, done: state.penghasilan > 0 },
              ]}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-annotation/20 pt-5">
                <ExampleButton
                  locale={locale}
                  onLoad={() => setState({ ...state, ...EXAMPLE_AMBANG, contoh: true })}
                />
                <p className="min-w-0 flex-1 text-caption text-muted">
                  {id
                    ? 'Atau lihat contohnya lebih dulu — angkanya dibuat-buat dan ditandai kuning.'
                    : 'Or see it worked through first — the figures are invented and marked amber.'}
                </p>
              </div>
            </EmptySheet>
          )}

          {result?.kind === 'error' && (
            <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
              {result.error}
            </UnknownNotice>
          )}

          {result?.kind === 'ok' && (
            <>
              {result.outcome.kind === 'found' && (
                <section className="rounded-xl border-2 border-threshold bg-threshold/[0.08] px-6 py-6 shadow-[0_24px_48px_-32px_rgb(0_0_0/0.7)]">
                  <p className="sheet-label text-caption text-threshold">
                    {id ? 'Ambang — bunga mengambang' : 'Threshold — floating rate'}
                  </p>
                  <p className="figure-display mt-2 text-[clamp(3.25rem,2rem+4vw,5rem)] font-bold leading-none text-threshold">
                    {formatRate(result.outcome.annualRate, intl)}
                  </p>
                  <p className="measure mt-4 text-print">
                    {id
                      ? 'Pada bunga ini, angsuran setelah masa tetap menjadi '
                      : 'At this rate, the instalment after the fixed period becomes '}
                    <span className="figure">{formatRupiah(result.outcome.limit, intl)}</span>
                    {id
                      ? ` — tepat ${formatRate(state.porsi, intl)} dari penghasilan yang Anda isikan.`
                      : ` — exactly ${formatRate(state.porsi, intl)} of the income you entered.`}
                  </p>
                  <p className="measure mt-3 text-caption text-muted">
                    {id
                      ? 'Pertanyaan untuk bank: berapa marjin yang Anda tambahkan di atas SBDK setelah masa tetap, dan seberapa sering ditinjau? Aplikasi ini tidak menyatakan apakah angka di atas mungkin terjadi.'
                      : 'The question for the bank: what margin do you add over SBDK once the fixed period ends, and how often is it reviewed? This app says nothing about whether the rate above is likely.'}
                  </p>
                </section>
              )}

              {result.outcome.kind === 'found' && result.curve.length > 1 && (
                <Panel
                  title={id ? 'Di mana angsuran bertemu batas Anda' : 'Where the instalment meets your limit'}
                  note={
                    id
                      ? 'Garis kuning adalah angsuran setelah masa tetap pada setiap bunga mengambang — dihitung, tetapi bunganya sendiri tidak diketahui. Garis merah adalah batas Anda. Ambang adalah titik keduanya bertemu.'
                      : 'The amber line is the instalment after the fixed period at each floating rate — computed, though the rate itself is unknown. The red line is your limit. The threshold is where the two meet.'
                  }
                >
                  <ThresholdCurve
                    points={result.curve}
                    limit={result.outcome.limit}
                    thresholdRate={result.outcome.annualRate}
                    fixedRate={state.bungaTetap}
                    locale={locale}
                  />
                </Panel>
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
                <StatCard
                  label={id ? 'Angsuran masa tetap' : 'Instalment, fixed period'}
                  value={formatRupiah(result.outcome.fixedPayment, intl)}
                  tag={t.common.computed}
                  note={
                    id ? 'Dari bunga yang dikutip bank.' : 'From the rate the bank quoted.'
                  }
                />
                <StatCard
                  tone="threshold"
                  label={id ? 'Batas yang Anda tetapkan' : 'The limit you set'}
                  value={formatRupiah(result.outcome.limit, intl)}
                  note={
                    id
                      ? `${formatRate(state.porsi, intl)} dari penghasilan Anda.`
                      : `${formatRate(state.porsi, intl)} of your income.`
                  }
                />
                <StatCard
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

              <ShareBar locale={locale} />

              <UnknownNotice title={t.floating.title}>{t.floating.body}</UnknownNotice>

              {result.gradient.length > 0 && (
                <Panel
                  title={id ? 'Di sekitar angka itu' : 'Around that figure'}
                  note={
                    id
                      ? 'Ambang bukan tebing — angsuran naik terus seiring bunga. Baris bertanda adalah titik saat angsuran tepat menyentuh batas Anda; baris di atasnya masih di bawah batas, di bawahnya sudah lewat. Tiap baris dihitung ulang lewat mesin yang sama, bukan ditaksir.'
                      : 'The threshold is not a cliff — the instalment climbs steadily with the rate. The marked row is where it exactly meets your limit; above it you are still under, below it you are past. Every row is the engine run again at that rate, not an interpolation.'
                  }
                >
                  <div className="overflow-x-auto border border-annotation/25">
                    <table className="w-full min-w-[24rem] border-collapse text-caption">
                      <caption className="sr-only">
                        {id
                          ? 'Angsuran setelah masa tetap pada beberapa bunga mengambang di sekitar ambang.'
                          : 'The instalment after the fixed period at several floating rates around the threshold.'}
                      </caption>
                      <thead>
                        <tr className="border-b border-annotation/40 bg-surface">
                          <th scope="col" className="sheet-label px-3 py-2 text-left text-micro font-medium text-annotation">
                            {id ? 'Bunga mengambang' : 'Floating rate'}
                          </th>
                          <th scope="col" className="sheet-label px-3 py-2 text-right text-micro font-medium text-annotation">
                            {id ? 'Angsuran setelah masa tetap' : 'Instalment after the fixed period'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.gradient.map((row) => (
                          <tr
                            key={row.annualRate}
                            className={`border-b border-annotation/15 ${
                              row.isThreshold ? 'bg-threshold/[0.08] text-threshold' : 'text-unknown'
                            }`}
                          >
                            <td className="figure px-3 py-2">
                              {formatRate(row.annualRate, intl)}
                              {row.isThreshold && (
                                <span className="sheet-label ml-3 text-micro">
                                  {id ? 'batas Anda' : 'your limit'}
                                </span>
                              )}
                            </td>
                            <td className="figure px-3 py-2 text-right">
                              {formatRupiah(row.payment, intl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="measure text-caption text-unknown">
                    {id
                      ? 'Seluruh baris berwarna kuning: tidak satu pun bunga di kolom itu diketahui akan terjadi. Yang dihitung adalah akibatnya bila terjadi.'
                      : 'Every row is amber: not one of those rates is known to be what will happen. What is computed is the consequence if it does.'}
                  </p>
                </Panel>
              )}

              <Panel
                title={id ? 'Yang perlu Anda tanyakan ke bank' : 'What to ask the bank'}
                note={
                  id
                    ? 'Angka ambang di atas ada gunanya kalau Anda tahu bunga mengambang Anda ditentukan bagaimana. Pertanyaan-pertanyaan ini yang menjawabnya.'
                    : 'The threshold figure above is useful once you know how your floating rate is actually set. These are the questions that establish it.'
                }
              >
                <BankQuestions
                  locale={locale}
                  context={{
                    hasFloatingAssumption: true,
                    hasFixedPeriod: true,
                    modelledPrepayment: false,
                    enteredBankFees: false,
                  }}
                />
              </Panel>

              <Panel title={id ? 'Istilah di halaman ini' : 'Words on this page'}>
                <Glossary locale={locale} only={['plafon', 'angsuran', 'tenor', 'bungaMengambang']} />
              </Panel>

              {result.schedule && (
                <Panel
                  title={id ? 'Jadwal pada suku bunga ambang' : 'The schedule at the threshold rate'}
                  note={
                    id
                      ? 'Suku bunga di atas dikembalikan ke mesin perhitungan; inilah jadwal yang dihasilkannya. Angsuran pertama setelah batas sama persis dengan batas yang Anda tetapkan.'
                      : 'The rate above was fed back through the engine; this is the schedule it produces. The first instalment past the boundary equals the limit you set, to the rupiah.'
                  }
                >
                  <ScheduleElevation
                    schedule={result.schedule}
                    locale={locale}
                    boundaryMonth={fixedMonths}
                  />
                </Panel>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** The sampled rates: 0 to a round five past 1.5× the threshold, every 0.5 point. */
function curveRates(threshold: number): number[] {
  const top = Math.min(Math.max(Math.ceil((threshold * 1.5) / 0.05) * 0.05, 0.2), 0.5)
  const count = Math.round(top / 0.005) + 1
  return Array.from({ length: count }, (_, index) => Number((index * 0.005).toFixed(4)))
}
