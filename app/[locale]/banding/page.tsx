import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { pageMetadata } from '@/lib/metadata'
import { BandingView } from './BandingView'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'banding')
}

export default function Banding({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Chrome locale={params.locale} active="banding">
      <BandingView locale={params.locale} />
    </Chrome>
  )
}
