import type { Locale } from '@/lib/i18n/locales'

/**
 * The worked example, and the sign that says it is one.
 *
 * Invariant 6 forbids the app supplying a rate. What it is actually guarding
 * is stated in the invariant itself: the UI must never let a user mistake an
 * assumption for a fact. So this scenario is not a default and never loads on
 * its own — the user asks for it, every figure it sets is amber, this banner
 * stays until it is cleared, and one button empties it.
 *
 * The figures are round on purpose. 6,00% and 12,00% are not a market quote
 * and are not meant to look like one; they are legible arithmetic for someone
 * seeing an amortisation schedule for the first time. A plausible-looking
 * 7,35% would be the thing this project exists not to do.
 */
export const EXAMPLE_HITUNG = {
  harga: 800_000_000,
  uangMuka: 160_000_000,
  tenorTahun: 15,
  masaTetapTahun: 3,
  bungaTetap: 0.06,
  bungaMengambang: 0.12,
  marginBawah: 0.02,
  marginAtas: 0.02,
} as const

export const EXAMPLE_AMBANG = {
  plafon: 640_000_000,
  tenorTahun: 15,
  masaTetapTahun: 3,
  bungaTetap: 0.06,
  penghasilan: 25_000_000,
  porsi: 0.3,
} as const

export function ExampleBanner({ locale, onClear }: { locale: Locale; onClear: () => void }) {
  const id = locale === 'id'
  return (
    <aside className="print-hidden flex flex-wrap items-start justify-between gap-4 border-l-2 border-unknown bg-unknown/[0.08] px-4 py-3">
      <div>
        <p className="sheet-label text-caption text-unknown">
          {id ? 'Contoh — angka karangan' : 'Worked example — invented figures'}
        </p>
        <p className="measure mt-1 text-caption text-print">
          {id
            ? 'Angka-angka ini dibuat-buat dan dibulatkan supaya mudah diikuti. Ini bukan penawaran bank, bukan bunga pasaran, dan bukan data. Ganti dengan angka Anda sendiri, atau kosongkan.'
            : 'These figures are invented and rounded so they are easy to follow. They are not a bank offer, not a market rate, and not data. Replace them with your own, or clear them.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="sheet-label shrink-0 border border-unknown/60 px-4 py-2 text-caption text-unknown hover:border-unknown hover:text-print"
      >
        {id ? 'Kosongkan' : 'Clear'}
      </button>
    </aside>
  )
}

/** The button that loads it. Never fires on its own. */
export function ExampleButton({ locale, onLoad }: { locale: Locale; onLoad: () => void }) {
  const id = locale === 'id'
  return (
    <button
      type="button"
      onClick={onLoad}
      className="sheet-label border border-annotation/60 px-4 py-2 text-caption text-annotation hover:border-annotation hover:text-print"
    >
      {id ? 'Isi dengan contoh' : 'Fill in a worked example'}
    </button>
  )
}
