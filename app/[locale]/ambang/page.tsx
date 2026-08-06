import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { AmbangView } from './AmbangView'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Ambang({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Chrome locale={params.locale} active="ambang">
      <AmbangView locale={params.locale} />
    </Chrome>
  )
}
