import Link from 'next/link'
import { Chrome } from '@/components/chrome/Chrome'
import { Glossary } from '@/components/ui/Glossary'
import { Panel } from '@/components/ui/Panel'
import { Mark } from '@/components/ui/Mark'
import { FixedFloatingDiagram } from '@/components/ui/FixedFloatingDiagram'
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
      <div className="space-y-20">
        {/*
         * The front door. Someone landing here has usually just been quoted a
         * rate by a bank and does not yet know that the quote covers two or
         * three years out of twenty. That sentence has to arrive first, before
         * any vocabulary, any form, or any figure.
         */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            {/* The mark stays under 96px, so the dashed boundary marker is left
                off — below that size the kink alone carries it (brand kit). */}
            <div className="flex items-center gap-3">
              <Mark size={40} />
              <p className="sheet-label text-caption text-annotation">
                {id ? 'Kalkulator KPR' : 'KPR calculator'}
              </p>
            </div>
            <h1 className="sheet-title mt-4 text-display">
              {id
                ? 'Bunga yang dikutip bank hanya berlaku beberapa tahun. Sisanya, tidak ada yang tahu.'
                : 'The rate your bank quotes lasts a few years. Nobody knows the rest.'}
            </h1>
            <p className="measure mt-5 text-lead text-muted">
              {id
                ? 'Hitung angsuran KPR Anda untuk kedua bagian itu secara terpisah — yang dikunci bank, dan yang datang sesudahnya.'
                : 'Work out your KPR instalment for both parts separately — the one the bank locks, and the one that comes after it.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/hitung`}
                className="sheet-label bg-print px-6 py-3 text-caption text-blueprint transition-colors hover:bg-annotation"
              >
                {id ? 'Hitung angsuran saya' : 'Work out my instalment'}
              </Link>
              <Link
                href={`/${locale}/ambang`}
                className="sheet-label border border-annotation/60 px-6 py-3 text-caption text-annotation transition-colors hover:border-annotation hover:text-print"
              >
                {id ? 'Cari titik tak terjangkau' : 'Find where it stops being affordable'}
              </Link>
            </div>

            <p className="measure mt-5 text-caption text-muted">
              {id
                ? 'Gratis, tanpa akun, tanpa iklan bank. Proyek pribadi, bukan nasihat keuangan. Angka yang Anda ketik dihitung di peramban Anda sendiri dan tidak dikirim ke mana pun.'
                : 'Free, no account, no bank advertising. A personal project, not financial advice. What you type is computed in your own browser and sent nowhere.'}
            </p>
          </div>

          {/* Shows what the app is for before a word of it is read. No numerals,
              so there is nothing here to mistake for data. */}
          <FixedFloatingDiagram locale={locale} />
        </section>

        <p className="measure text-muted">
          {id
            ? 'Kalkulator KPR lain memakai satu bunga untuk seluruh tenor. Untuk KPR komersial itu selalu keliru: bank mengunci bunga dua atau tiga tahun, lalu sisanya mengambang. Aplikasi ini menghitung kedua bagian itu terpisah, dan mengatakan dengan jelas bagian mana yang tidak diketahui siapa pun.'
            : 'Other KPR calculators apply one rate across the whole term. For a commercial KPR that is always wrong: the bank locks a rate for two or three years, then the loan floats. This tool computes the two parts separately, and says plainly which part nobody knows.'}
        </p>

        {/*
         * The concrete illustration. Amber throughout and labelled as an
         * illustration in words, because the moment a number like this reads
         * as data the whole project has failed.
         */}
        <section className="border-l-2 border-unknown bg-unknown/[0.08] px-6 py-6">
          <p className="sheet-label text-caption text-unknown">
            {id ? 'Contoh — angka karangan, bukan data' : 'An illustration — invented, not data'}
          </p>
          <p className="measure mt-3 text-print">
            {id
              ? 'Sebuah keluarga menyusun anggaran di angsuran Rp3,2 juta sebulan, angka yang dikutip bank. Di tahun keempat, setelah masa bunga tetap habis, angsuran itu bisa menjadi Rp4,8 juta. Tidak ada yang berubah pada rumahnya, dan tidak ada yang salah pada perhitungan bank — bunga mengambang memang tidak diumumkan di muka.'
              : 'A family budgets around an instalment of Rp3,2 juta a month, the figure the bank quoted. In year four, once the fixed period ends, that instalment can become Rp4,8 juta. Nothing changed about the house, and nothing was wrong with the bank’s arithmetic — the floating rate is simply not announced in advance.'}
          </p>
          <p className="measure mt-3 text-caption text-unknown">
            {id
              ? 'Aplikasi ini tidak pernah menebak angka itu untuk Anda. Anda yang mengisikan asumsinya, dan setiap angka yang bersandar padanya berwarna kuning seperti kotak ini.'
              : 'This tool never guesses that figure for you. You supply the assumption, and everything resting on it is amber, like this box.'}
          </p>
        </section>

        <Panel
          title={id ? 'Cara memakainya' : 'How to use it'}
          note={
            id
              ? 'Tiga langkah. Yang Anda butuhkan hanyalah penawaran dari bank — atau tebakan kasar, kalau belum ada.'
              : 'Three steps. All you need is an offer from a bank — or a rough guess, if you do not have one yet.'
          }
        >
          <ol className="grid gap-6 sm:grid-cols-3">
            <Step
              n="1"
              title={id ? 'Isi yang dikutip bank' : 'Enter what the bank quoted'}
              body={
                id
                  ? 'Harga rumah, uang muka, tenor, bunga tetap dan berapa lama bunga itu dikunci.'
                  : 'House price, down payment, term, the fixed rate and how long it is locked.'
              }
            />
            <Step
              n="2"
              title={id ? 'Tebak bunga setelahnya' : 'Guess the rate after that'}
              body={
                id
                  ? 'Ini asumsi Anda, dan aplikasi menandainya kuning. Coba beberapa angka; itu justru gunanya.'
                  : 'This is your assumption, and the app marks it amber. Try several; that is rather the point.'
              }
            />
            <Step
              n="3"
              title={id ? 'Lihat kapan batasnya lewat' : 'See where your limit breaks'}
              body={
                id
                  ? 'Satu angka: pada bunga berapa angsuran melewati porsi penghasilan yang Anda tetapkan.'
                  : 'One figure: the rate at which the instalment crosses the share of income you set.'
              }
            />
          </ol>
        </Panel>

        <Panel
          title={id ? 'Halaman' : 'The pages'}
          note={
            id
              ? 'Masing-masing menjawab satu pertanyaan. Mulai dari mana saja.'
              : 'Each answers one question. Start anywhere.'
          }
        >
          <nav className="grid gap-3 sm:grid-cols-2">
            <Card
              href={`/${locale}/hitung`}
              title={t.nav.hitung}
              question={
                id ? 'Berapa angsuran saya tiap bulan?' : 'What is my instalment each month?'
              }
              body={
                id
                  ? 'Jadwal angsuran penuh, masa tetap dan mengambang terpisah, dengan penurunannya.'
                  : 'The full schedule, fixed and floating shown apart, with its derivation.'
              }
            />
            <Card
              href={`/${locale}/ambang`}
              title={t.nav.ambang}
              question={
                id
                  ? 'Sampai bunga berapa saya masih sanggup?'
                  : 'How high can the rate go before I cannot pay?'
              }
              body={
                id
                  ? 'Satu angka untuk dibawa dan ditanyakan langsung ke bank.'
                  : 'One figure to carry into a bank meeting and ask about directly.'
              }
            />
            <Card
              href={`/${locale}/subsidi`}
              title={t.nav.subsidi}
              question={id ? 'Apakah saya bisa ikut FLPP?' : 'Do I qualify for FLPP?'}
              body={
                id
                  ? '5% tetap sampai akhir tenor, dengan pemeriksaan kriteria tersitasi.'
                  : '5% fixed to the end of the term, with cited eligibility criteria.'
              }
            />
            <Card
              href={`/${locale}/banding`}
              title={t.nav.banding}
              question={
                id ? 'Subsidi atau komersial, apa bedanya?' : 'Subsidised or commercial — what differs?'
              }
              body={
                id
                  ? 'Satu profil, kedua jalur berdampingan — dan seberapa pasti masing-masing angka.'
                  : 'One profile, both paths side by side — and how certain each figure actually is.'
              }
            />
            <Card
              href={`/${locale}/biaya`}
              title={t.nav.biaya}
              question={
                id ? 'Berapa yang harus saya siapkan di awal?' : 'What do I need up front?'
              }
              body={
                id
                  ? 'BPHTB, PPh, notaris, dan biaya bank — yang diatur dikutip, yang tidak ditandai.'
                  : 'BPHTB, income tax, notary, and bank fees — regulated items cited, the rest marked.'
              }
            />
            <Card
              href={`/${locale}/parameter`}
              title={t.nav.parameter}
              question={id ? 'Dari mana angka-angka ini?' : 'Where do these numbers come from?'}
              body={
                id
                  ? 'Setiap parameter dengan dasar hukum, sumber, dan tanggal verifikasinya.'
                  : 'Every parameter with its legal basis, source, and verification date.'
              }
            />
          </nav>
        </Panel>

        <Panel
          title={id ? 'Istilah yang akan Anda temui' : 'Words you will meet'}
          note={
            id
              ? 'Dipakai persis seperti bank memakainya, supaya cocok dengan surat penawaran Anda.'
              : 'Used exactly as banks use them, so they match the letter you were given.'
          }
        >
          <Glossary locale={locale} />
        </Panel>

        <Panel title={id ? 'Yang tidak dilakukan aplikasi ini' : 'What this tool does not do'}>
          <ul className="grid gap-x-10 gap-y-3 text-caption text-muted sm:grid-cols-2">
            {(id
              ? [
                  'Tidak menyarankan bank, produk, atau kapan membeli. Tidak ada peringkat, tidak ada tautan afiliasi.',
                  'Tidak menebak bunga. Tidak ada satu pun suku bunga yang diisikan aplikasi ini sebagai bawaan.',
                  'Tidak memodelkan persetujuan kredit. SLIK dan penilaian bank tidak bisa ditiru di sini.',
                  'Tidak menyimpan apa pun. Tanpa akun, tanpa server, tanpa pelacakan angka yang Anda ketik.',
                ]
              : [
                  'It recommends no bank, no product, and no moment to buy. No rankings, no affiliate links.',
                  'It never guesses a rate. Not one interest rate on this site is pre-filled by the app.',
                  'It does not model approval. SLIK and a bank’s underwriting cannot be reproduced here.',
                  'It stores nothing. No account, no server, no tracking of the figures you type.',
                ]
            ).map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-annotation" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <section className="border-l-2 border-unknown bg-unknown/[0.08] px-6 py-5">
          <p className="sheet-label text-caption text-unknown">{t.floating.title}</p>
          <p className="measure mt-2 text-caption text-print">{t.floating.body}</p>
        </section>
      </div>
    </Chrome>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="border-t border-annotation/30 pt-4">
      <span className="figure text-subhead text-annotation">{n}</span>
      <p className="sheet-label mt-2 text-caption text-print">{title}</p>
      <p className="mt-1 text-caption text-muted">{body}</p>
    </li>
  )
}

function Card({
  href,
  title,
  question,
  body,
}: {
  href: string
  title: string
  question: string
  body: string
}) {
  return (
    <Link href={href} className="sheet-panel sheet-panel-hover block px-5 py-4">
      <p className="sheet-label text-caption text-annotation">{title}</p>
      <p className="sheet-title mt-1 text-lead text-print">{question}</p>
      <p className="mt-2 text-caption text-muted">{body}</p>
    </Link>
  )
}
