import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { HitungView } from './HitungView'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Hitung({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Chrome locale={params.locale} active="hitung">
      <HitungView locale={params.locale} />
    </Chrome>
  )
}
