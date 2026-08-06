import type { Locale } from '@/lib/i18n/locales'

/**
 * Bank vocabulary, used as banks use it and glossed plainly. Someone meeting
 * these words for the first time meets them here rather than in a branch, and
 * the words are not translated away: *plafon* is what the form says, what the
 * bank says, and what the offer letter will say.
 */
const TERMS: readonly { readonly term: string; readonly id: string; readonly en: string }[] = [
  {
    term: 'Plafon',
    id: 'Jumlah yang dipinjamkan bank — harga rumah dikurangi uang muka.',
    en: 'The amount the bank lends you: the house price minus your down payment.',
  },
  {
    term: 'Angsuran',
    id: 'Yang Anda bayar tiap bulan. Sebagian bunga, sebagian pokok pinjaman.',
    en: 'What you pay each month. Part interest, part repayment of the loan itself.',
  },
  {
    term: 'Tenor',
    id: 'Lama pinjaman. KPR umumnya 10 sampai 20 tahun.',
    en: 'How long the loan runs. A KPR is commonly 10 to 20 years.',
  },
  {
    term: 'Bunga tetap',
    id: 'Bunga yang dikunci bank, biasanya untuk 2–3 tahun pertama saja.',
    en: 'The rate the bank locks, usually for the first two or three years only.',
  },
  {
    term: 'Bunga mengambang',
    id: 'Bunga setelah masa tetap habis. Bank tidak mengumumkannya di muka.',
    en: 'The rate once the fixed period ends. Banks do not publish it in advance.',
  },
  {
    term: 'Bunga flat vs efektif',
    id: 'Flat menghitung bunga atas plafon awal terus-menerus; efektif atas sisa utang. Angka yang sama berarti beban yang jauh berbeda.',
    en: 'Flat charges interest on the original amount throughout; effective charges it on what you still owe. The same number means a very different cost.',
  },
]

export function Glossary({ locale }: { locale: Locale }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {TERMS.map((entry) => (
        <div key={entry.term}>
          <dt className="sheet-label text-xs text-annotation">{entry.term}</dt>
          <dd className="mt-1 text-sm text-print/80">
            {locale === 'id' ? entry.id : entry.en}
          </dd>
        </div>
      ))}
    </dl>
  )
}
