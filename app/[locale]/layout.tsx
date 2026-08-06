import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  return <div className="min-h-screen bg-blueprint">{children}</div>
}
