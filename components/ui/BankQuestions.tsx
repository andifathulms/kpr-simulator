import type { Locale } from '@/lib/i18n/locales'

/**
 * The questions, generated from what the user had to assume.
 *
 * This app's whole claim is that the missing number is unknowable from outside
 * and perfectly knowable by the one party that has it. That makes "what to ask
 * the bank" the terminus of a calculation rather than an extra: the app's job
 * ends exactly where the bank's disclosure begins, and it knows precisely
 * which of its own inputs were guesses.
 *
 * Every question is neutral and answerable at a counter. None of them implies
 * the answer should be a particular thing — that would be advice, and the list
 * would stop being useful the moment it read as an accusation.
 *
 * It prints. The printed sheet is the artefact that crosses the desk.
 */
export interface AskedContext {
  /** The user supplied a floating-rate assumption, so its basis is askable. */
  readonly hasFloatingAssumption: boolean
  /** A fixed period exists, so what happens at its end is askable. */
  readonly hasFixedPeriod: boolean
  /** A prepayment was modelled, so the penalty matters. */
  readonly modelledPrepayment: boolean
  /** Bank fees were entered as the user's own figures. */
  readonly enteredBankFees: boolean
}

interface Question {
  readonly id: string
  readonly show: (context: AskedContext) => boolean
  readonly id_: string
  readonly en: string
  /** Why this is being asked — the assumption it would replace. */
  readonly whyId: string
  readonly whyEn: string
}

const QUESTIONS: readonly Question[] = [
  {
    id: 'margin',
    show: (c) => c.hasFixedPeriod,
    id_: 'Setelah masa bunga tetap berakhir, bunga saya dihitung dari acuan apa, dan berapa marjin yang ditambahkan di atasnya?',
    en: 'Once the fixed period ends, what reference rate is mine based on, and what margin is added on top of it?',
    whyId: 'Ini satu-satunya angka yang membuat sisa tenor Anda tidak bisa dihitung siapa pun di luar bank.',
    whyEn: 'This is the one number that makes the rest of your term uncomputable by anyone outside the bank.',
  },
  {
    id: 'cadence',
    show: (c) => c.hasFixedPeriod,
    id_: 'Berapa sering bunga itu ditinjau — tiap 3, 6, atau 12 bulan?',
    en: 'How often is that rate reviewed — every 3, 6, or 12 months?',
    whyId: 'Menentukan berapa kali angsuran Anda bisa berubah sepanjang sisa tenor.',
    whyEn: 'It decides how many times your instalment can change over the rest of the term.',
  },
  {
    id: 'formula',
    show: (c) => c.hasFixedPeriod,
    id_: 'Apakah cara menghitung bunga mengambang itu tertulis di perjanjian kredit, atau diserahkan pada kebijakan bank?',
    en: 'Is the way the floating rate is set written into the credit agreement, or left to the bank’s discretion?',
    whyId: 'Yang tertulis bisa Anda pegang; yang tidak tertulis bisa berubah tanpa Anda bisa merujuk apa pun.',
    whyEn: 'What is written you can hold them to; what is not can change with nothing for you to point at.',
  },
  {
    id: 'cap',
    show: (c) => c.hasFloatingAssumption,
    id_: 'Ada batas atas untuk bunga mengambang saya? Kalau ada, berapa, dan berlaku sampai kapan?',
    en: 'Is there a cap on my floating rate? If so, what is it, and how long does it hold?',
    whyId: 'Kalau ada batas atas, angka ambang di aplikasi ini bisa Anda bandingkan langsung dengannya.',
    whyEn: 'If a cap exists, the threshold figure in this app can be compared against it directly.',
  },
  {
    id: 'notice',
    show: (c) => c.hasFixedPeriod,
    id_: 'Kalau bunga naik, saya diberi tahu berapa lama sebelum angsuran baru mulai ditagih?',
    en: 'If the rate rises, how much notice do I get before the new instalment is charged?',
    whyId: 'Menentukan berapa lama waktu Anda menyesuaikan anggaran rumah tangga.',
    whyEn: 'It decides how long you have to adjust a household budget.',
  },
  {
    id: 'penalty',
    show: (c) => c.modelledPrepayment,
    id_: 'Berapa penalti kalau saya melunasi lebih cepat, dan apakah penaltinya berbeda selama masa bunga tetap?',
    en: 'What is the penalty for settling early, and does it differ during the fixed period?',
    whyId: 'Penalti mengubah hasil simulasi pelunasan dipercepat secara material.',
    whyEn: 'The penalty materially changes the outcome of the extra-payment simulation.',
  },
  {
    id: 'fees',
    show: (c) => c.enteredBankFees,
    id_: 'Biaya provisi, administrasi, appraisal, dan asuransi saya masing-masing berapa, dan mana yang bisa dibayar di luar plafon?',
    en: 'What exactly are my provisi, administration, appraisal, and insurance charges, and which can be paid outside the plafon?',
    whyId: 'Biaya bank tidak dipublikasikan di mana pun, jadi angka di halaman Biaya adalah isian Anda sendiri.',
    whyEn: 'Bank fees are published nowhere, so the figures on the Costs page are your own entries.',
  },
]

export function BankQuestions({
  locale,
  context,
}: {
  locale: Locale
  context: AskedContext
}) {
  const id = locale === 'id'
  const asked = QUESTIONS.filter((question) => question.show(context))
  if (asked.length === 0) return null

  return (
    <ol className="space-y-4">
      {asked.map((question, index) => (
        <li key={question.id} className="border-l-2 border-annotation/40 pl-4">
          <p className="flex gap-3">
            <span className="figure text-annotation">{index + 1}</span>
            <span className="text-print">{id ? question.id_ : question.en}</span>
          </p>
          <p className="measure mt-1 pl-7 text-caption text-muted">
            {id ? question.whyId : question.whyEn}
          </p>
        </li>
      ))}
    </ol>
  )
}
