import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Chrome } from '@/components/chrome/Chrome'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { pageMetadata } from '@/lib/metadata'
import { BiayaView } from './BiayaView'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'biaya')
}

export default function Biaya({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Chrome locale={params.locale} active="biaya">
      <BiayaView locale={params.locale} />
    </Chrome>
  )
}
