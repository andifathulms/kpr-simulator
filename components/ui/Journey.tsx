import Link from 'next/link'
import { dictionary } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import type { Route } from '@/components/chrome/Chrome'

/**
 * The four questions a buyer usually works through, in order. The numbers say
 * what comes after what; they are not a ranking, and step 3 offers both paths
 * side by side rather than steering towards either.
 */
const STEPS: readonly {
  readonly routes: readonly Exclude<Route, 'parameter'>[]
  readonly title: { readonly id: string; readonly en: string }
  readonly question: { readonly id: string; readonly en: string }
}[] = [
  {
    routes: ['hitung'],
    title: { id: 'Hitung angsuran', en: 'Work out the instalment' },
    question: {
      id: 'Berapa angsuran saya, sebelum dan sesudah masa bunga tetap?',
      en: 'What is my instalment, before and after the fixed period?',
    },
  },
  {
    routes: ['ambang'],
    title: { id: 'Uji batas Anda', en: 'Test your limit' },
    question: {
      id: 'Sampai bunga berapa angsuran masih di bawah batas saya?',
      en: 'How high can the rate go before the instalment passes my limit?',
    },
  },
  {
    routes: ['subsidi', 'banding'],
    title: { id: 'Pilih jalur', en: 'Choose a path' },
    question: {
      id: 'KPR subsidi FLPP atau komersial — apa bedanya untuk saya?',
      en: 'Subsidised FLPP or commercial — what differs for me?',
    },
  },
  {
    routes: ['biaya'],
    title: { id: 'Siapkan biaya awal', en: 'Prepare the upfront costs' },
    question: {
      id: 'Berapa yang harus saya siapkan sebelum akad?',
      en: 'What do I need to have ready before signing?',
    },
  },
]

/** The full strip, for the home page. */
export function Journey({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const id = locale === 'id'
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-annotation/25 bg-annotation/20 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title.en} className="flex flex-col gap-3 bg-surface p-5">
          <span className="figure text-caption text-annotation">
            {index + 1} / {STEPS.length}
          </span>
          <p className="sheet-title text-subhead text-print">{id ? step.title.id : step.title.en}</p>
          <p className="flex-1 text-caption text-muted">{id ? step.question.id : step.question.en}</p>
          <div className="flex flex-wrap gap-2">
            {step.routes.map((route, i) => (
              <Link
                key={route}
                href={`/${locale}/${route}`}
                className={i === 0 && index === 0 ? 'btn-primary' : 'btn-secondary'}
              >
                {t.nav[route]}
                <span aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * The link to the next question, at the foot of a page. When the page holds
 * figures the next one can use, `hash` carries them across — in the fragment,
 * as everywhere else, so they never reach a server log.
 */
export function NextStep({
  locale,
  to,
  hash,
}: {
  locale: Locale
  to: Exclude<Route, 'parameter' | 'hitung'>
  hash?: string
}) {
  const t = dictionary(locale)
  const id = locale === 'id'
  const index = STEPS.findIndex((step) => step.routes.includes(to))
  const step = STEPS[index]
  if (!step) return null

  return (
    <Link
      href={`/${locale}/${to}${hash ? `#${hash}` : ''}`}
      className="sheet-panel sheet-panel-hover print-hidden group flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4"
    >
      <span className="min-w-0 flex-1">
        <span className="sheet-label block text-caption text-annotation">
          {id ? 'Langkah berikutnya' : 'Next step'} · {index + 1} / {STEPS.length}
        </span>
        <span className="sheet-title mt-1 block text-subhead text-print">{t.nav[to]}</span>
        <span className="mt-1 block text-caption text-muted">
          {id ? step.question.id : step.question.en}
        </span>
        {hash && (
          <span className="mt-1 block text-caption text-annotation">
            {id
              ? 'Plafon, tenor, dan bunga tetap Anda ikut terbawa.'
              : 'Your loan amount, term, and fixed rate come with you.'}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="text-title text-annotation transition-colors group-hover:text-print"
      >
        →
      </span>
    </Link>
  )
}
