import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { pageMetadata } from '@/lib/metadata'
import { SubsidiView } from './SubsidiView'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'subsidi')
}

export default function Subsidi({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Chrome locale={params.locale} active="subsidi">
      <SubsidiView locale={params.locale} />
    </Chrome>
  )
}
