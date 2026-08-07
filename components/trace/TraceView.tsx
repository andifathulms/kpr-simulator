import { formatAmount } from '@/lib/money/format'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import type { ComputationTrace } from '@/lib/amortise/types'

/**
 * The derivation, step by step. Rounding appears as its own step naming the
 * convention it followed, so a divergence of a few rupiah from a bank
 * statement can be pointed at rather than argued about.
 *
 * Each kind of step also says what it is for. The arithmetic was always here
 * and always correct; what was missing was any sentence explaining why this
 * arithmetic — why an annuity, why a rounding convention is a choice at all,
 * why a conservation check is worth showing a reader. Precise labels like
 * `pembulatan-terdekat` are exact and mean nothing to someone meeting them
 * for the first time.
 */
function rationale(locale: Locale): Record<string, string> {
  return locale === 'id'
    ? {
        input: 'Angka yang Anda isikan, dipakai apa adanya.',
        parameter:
          'Nilai dari peraturan, bukan dari aplikasi ini. Dasar hukum dan tautan sumbernya ada di bawah.',
        formula:
          'Rumus anuitas: satu angsuran yang sama tiap bulan, di mana bunga dihitung ulang tiap bulan atas sisa utang yang terus menurun. Inilah yang dipakai bank untuk KPR.',
        rounding:
          'Rupiah tidak mengenal pecahan sen, jadi hasil hitungan harus dibulatkan — dan bank berbeda membulatkan berbeda. Konvensi yang dipakai disebutkan supaya selisih beberapa rupiah dengan tagihan bank bisa ditunjuk letaknya.',
        assumption:
          'Bagian ini tidak diketahui siapa pun dan tidak dihitung dari data. Angkanya berasal dari Anda.',
        conservation:
          'Pemeriksaan penutup: seluruh pembayaran pokok harus berjumlah persis sebesar plafon, dan saldo akhir harus tepat nol. Kalau tidak, jadwal ini salah dan tidak layak dipakai.',
      }
    : {
        input: 'A figure you entered, used exactly as given.',
        parameter:
          'A value from a regulation, not from this app. Its legal basis and source link are below it.',
        formula:
          'The annuity formula: one equal instalment each month, with interest recomputed every month on a balance that keeps falling. This is what banks use for a KPR.',
        rounding:
          'Rupiah has no fractional unit, so the computed figure has to be rounded — and different banks round differently. The convention is named so that a few rupiah of divergence from a bank statement can be pointed at.',
        assumption:
          'Nobody knows this part and it is not derived from data. The figure came from you.',
        conservation:
          'The closing check: every principal payment must sum to exactly the plafon, and the final balance must be exactly zero. If not, the schedule is wrong and should not be used.',
      }
}
export function TraceView({ trace, locale }: { trace: ComputationTrace; locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const why = rationale(locale)

  return (
    <ol className="space-y-3 border-l border-annotation/30 pl-5 text-caption">
      {trace.map((step, index) => {
        switch (step.type) {
          case 'input':
            return (
              <Step key={index} why={why.input} kind={t.common.computed} label={step.label}>
                <span className="figure">{step.value}</span>
              </Step>
            )
          case 'parameter':
            return (
              <Step key={index} why={why.parameter} kind={step.parameterId} label={step.label}>
                <span className="figure">{step.value}</span>
                <span className="mt-1 block text-caption text-annotation">
                  {step.basis} ·{' '}
                  <a className="underline" href={step.sourceUrl} rel="noreferrer noopener">
                    {t.common.source}
                  </a>
                </span>
              </Step>
            )
          case 'formula':
            return (
              <Step key={index} why={why.formula} kind="=" label={step.label}>
                <span className="figure break-all text-muted">{step.expression}</span>
                <span className="figure mt-1 block">{step.exact.toFixed(4)}</span>
              </Step>
            )
          case 'rounding':
            return (
              <Step key={index} why={why.rounding} kind={step.convention} label={step.label}>
                <span className="figure">
                  {step.exact.toFixed(4)} → {formatAmount(step.rounded, intl)}
                </span>
              </Step>
            )
          case 'assumption':
            return (
              <Step key={index} why={why.assumption} kind={t.common.assumption} label={step.label} amber>
                <span className="text-unknown">{step.detail}</span>
              </Step>
            )
          case 'conservation':
            return (
              <Step key={index} why={why.conservation} kind="✓" label={step.label}>
                <ul className="space-y-0.5 text-caption text-muted">
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
  why,
  amber,
  children,
}: {
  kind: string
  label: string
  /** What this kind of step is for, in plain words. */
  why?: string
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
      <p className={`sheet-label text-caption ${amber ? 'text-unknown' : 'text-annotation'}`}>
        {kind}
      </p>
      <p className={amber ? 'text-unknown' : 'text-print'}>{label}</p>
      <div className="mt-0.5">{children}</div>
      {why && <p className="measure mt-1 text-caption text-muted">{why}</p>}
    </li>
  )
}
