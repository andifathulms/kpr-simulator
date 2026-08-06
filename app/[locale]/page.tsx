import Link from 'next/link'
import { Chrome } from '@/components/chrome/Chrome'
import { dictionary } from '@/lib/i18n/dict'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { notFound } from 'next/navigation'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Home({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const t = dictionary(locale)
  const id = locale === 'id'

  return (
    <Chrome locale={locale}>
      <section className="max-w-3xl">
        <h1 className="sheet-label text-4xl">{t.common.appName}</h1>
        <p className="mt-4 text-lg text-print/85">{t.common.tagline}</p>

        <div className="mt-8 space-y-4 text-print/80">
          <p>
            {id
              ? 'KPR komersial sebenarnya dua pinjaman yang dijahit jadi satu: satu yang diketahui, satu yang tidak. Bank menyebut bunga tetap untuk dua atau tiga tahun, lalu sisanya mengambang. Keluarga yang menyusun anggaran di angka Rp3,2 juta bisa menemukan Rp4,8 juta di tahun keempat.'
              : 'A commercial KPR is really two loans stitched together: a known one and an unknown one. A bank quotes a fixed rate for two or three years, and after that the loan floats. A family budgeting around Rp3,2 juta can find Rp4,8 juta in year four.'}
          </p>
          <p>
            {id
              ? 'Aplikasi ini memodelkannya seperti itu — masa tetap dan bunganya sebagai masukan, lalu pita kemungkinan setelah batas itu, bukan satu garis. Pertanyaan utamanya menjadi: pada bunga mengambang berapa angsuran melewati batas yang Anda tetapkan?'
              : 'This tool models it that way — the fixed period and its rate as inputs, then a band of outcomes past the boundary rather than a single line. The headline question becomes: at what floating rate does the instalment cross the limit you set?'}
          </p>
        </div>

        <nav className="mt-10 grid gap-3 sm:grid-cols-2">
          <Card
            href={`/${locale}/hitung`}
            title={t.nav.hitung}
            body={
              id
                ? 'Jadwal angsuran penuh, masa tetap dan mengambang terpisah, dengan penurunannya.'
                : 'The full schedule, fixed and floating shown apart, with its derivation.'
            }
          />
          <Card
            href={`/${locale}/ambang`}
            title={t.nav.ambang}
            body={
              id
                ? 'Pada bunga berapa angsuran melewati porsi penghasilan yang Anda tetapkan.'
                : 'The floating rate at which the instalment crosses your stated share of income.'
            }
          />
          <Card
            href={`/${locale}/subsidi`}
            title={t.nav.subsidi}
            body={
              id
                ? 'Jalur FLPP: 5% tetap sampai akhir tenor, dengan pemeriksaan kriteria tersitasi.'
                : 'The FLPP path: 5% fixed to the end of the term, with cited eligibility criteria.'
            }
          />
          <Card
            href={`/${locale}/banding`}
            title={t.nav.banding}
            body={
              id
                ? 'Satu profil, kedua jalur berdampingan — dan seberapa pasti masing-masing angka.'
                : 'One profile, both paths side by side — and how certain each figure actually is.'
            }
          />
          <Card
            href={`/${locale}/biaya`}
            title={t.nav.biaya}
            body={
              id
                ? 'BPHTB, PPh, notaris, dan biaya bank — yang diatur dikutip, yang tidak ditandai.'
                : 'BPHTB, income tax, notary, and bank fees — regulated items cited, the rest marked.'
            }
          />
        </nav>

        <p className="mt-10 border-l-2 border-unknown bg-unknown/10 px-4 py-3 text-sm text-print/90">
          {t.floating.body}
        </p>
      </section>
    </Chrome>
  )
}

function Card({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="border border-annotation/30 bg-recess px-5 py-4 hover:border-annotation"
    >
      <p className="sheet-label text-sm text-print">{title}</p>
      <p className="mt-1 text-sm text-print/70">{body}</p>
    </Link>
  )
}
