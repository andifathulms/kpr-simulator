import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { COVERAGE_GAPS, PACKS } from '@/lib/rules/registry'
import { dictionary } from '@/lib/i18n/dict'
import { PageHeader } from '@/components/ui/PageHeader'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * Every parameter the app uses, with its legal basis, its source, the period
 * it applies to, and the date it was last verified — and, beside them, the
 * things the app deliberately does not carry.
 *
 * Static: the rule packs are known at build time and nothing here depends on
 * user input, so this page ships as plain HTML.
 */
export default function ParameterPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const t = dictionary(locale)
  const id = locale === 'id'

  return (
    <Chrome locale={locale} active="parameter">
      <div className="space-y-12">
        <PageHeader
          eyebrow={t.nav.parameter}
          title={id ? 'Dari mana angka-angka ini berasal?' : 'Where do these numbers come from?'}
          lede={
            id
              ? 'Tidak ada satu pun nilai peraturan yang ditulis di dalam kode. Semuanya ada di paket aturan bersama dasar hukum, tautan sumber, periode berlaku, dan tanggal verifikasinya — dan build ditolak bila ada parameter tanpa sitasi.'
              : 'No regulatory value is written into the application code. Every one lives in a rule pack with its legal basis, source link, effective period, and verification date — and the build is rejected if any parameter lacks a citation.'
          }
        />

        {PACKS.map((pack, packIndex) => (
          <section key={`${pack.pack}-${packIndex}`} className="space-y-4">
            <h2 className="sheet-label text-sm text-annotation">
              {id ? pack.title.id : pack.title.en}
            </h2>
            <div className="overflow-x-auto border border-annotation/25">
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-annotation/40 bg-recess">
                    <Th>{id ? 'Identifier' : 'Identifier'}</Th>
                    <Th>{id ? 'Nilai' : 'Value'}</Th>
                    <Th>{t.common.inForce}</Th>
                    <Th>{id ? 'Dasar hukum' : 'Legal basis'}</Th>
                    <Th>{t.common.verified}</Th>
                  </tr>
                </thead>
                <tbody>
                  {pack.parameters.map((parameter, index) => (
                    <tr
                      key={`${parameter.id}-${parameter.effectiveFrom}-${index}`}
                      className="border-b border-annotation/15 align-top"
                    >
                      <td className="figure px-3 py-2 text-xs">
                        {parameter.id}
                        <span className="mt-1 block font-sans text-print/70">
                          {id ? parameter.label.id : parameter.label.en}
                        </span>
                      </td>
                      <td className="figure px-3 py-2 text-right">{renderValue(parameter.value)}</td>
                      <td className="figure px-3 py-2 text-xs">
                        {parameter.effectiveFrom} →{' '}
                        {parameter.effectiveTo ?? (id ? 'berlaku' : 'in force')}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {parameter.basis}
                        <a
                          className="mt-1 block text-annotation underline"
                          href={parameter.sourceUrl}
                          rel="noreferrer noopener"
                        >
                          {t.common.source}
                        </a>
                        {parameter.note && (
                          <span className="mt-1 block text-unknown">
                            {id ? parameter.note.id : parameter.note.en}
                          </span>
                        )}
                      </td>
                      <td className="figure px-3 py-2 text-xs">
                        {parameter.verifiedAt}
                        {parameter.expectedReview && (
                          <span className="mt-1 block text-annotation">
                            {id ? 'tinjau' : 'review'} {parameter.expectedReview}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="space-y-4">
          <h2 className="sheet-label text-sm text-unknown">{t.common.gapsTitle}</h2>
          <p className="max-w-3xl text-sm text-print/80">
            {id
              ? 'Berikut nilai-nilai yang tidak dimuat karena tidak berhasil diverifikasi ke sumber yang sah. Untuk masing-masing, aplikasi menolak menghitung dan menyebut apa yang kurang, alih-alih mengisinya dengan angka yang masuk akal.'
              : 'These values are not carried because they could not be verified against a sound source. For each, the app refuses to compute and names what is missing rather than filling it with a plausible number.'}
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {COVERAGE_GAPS.map((gap) => (
              <li key={gap.reference} className="border-l-2 border-unknown bg-unknown/10 px-4 py-3">
                <p className="sheet-label text-xs text-unknown">{id ? gap.title.id : gap.title.en}</p>
                <p className="figure mt-0.5 text-xs text-unknown/80">{gap.reference}</p>
                <p className="mt-1 text-sm text-print/85">{id ? gap.detail.id : gap.detail.en}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Chrome>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="sheet-label px-3 py-2 text-left text-xs font-normal text-annotation"
    >
      {children}
    </th>
  )
}

function renderValue(value: (typeof PACKS)[number]['parameters'][number]['value']): string {
  switch (value.kind) {
    case 'money':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      })
        .format(value.amount)
        .replace(/^(Rp)[\s ]+/u, '$1')
    case 'rate':
    case 'ratio':
      return new Intl.NumberFormat('id-ID', {
        style: 'percent',
        minimumFractionDigits: 2,
      }).format(value.decimal)
    case 'months':
      return `${value.count} bln`
    case 'area':
      return `${value.squareMetres} m²`
    case 'text':
      return value.value
    default: {
      const exhaustive: never = value
      return String(exhaustive)
    }
  }
}
