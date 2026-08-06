import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KPR Simulator',
  description:
    'Simulasi KPR yang menampilkan masa bunga tetap dan periode mengambang secara terpisah. Proyek pribadi, bukan nasihat keuangan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
