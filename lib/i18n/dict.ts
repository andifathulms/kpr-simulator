import type { Locale } from './locales'

/**
 * Indonesian first, written for someone who has never taken a loan. Bank
 * vocabulary is used as banks use it and glossed on first use. Uncertainty is
 * stated in the same plain voice as everything else.
 */
export interface Dictionary {
  readonly nav: Record<'hitung' | 'ambang' | 'subsidi' | 'banding' | 'biaya' | 'parameter', string>
  readonly common: Record<
    | 'appName'
    | 'tagline'
    | 'notAdvice'
    | 'personalProject'
    | 'confirmWithBank'
    | 'approvalNotModelled'
    | 'unknownLegend'
    | 'thresholdLegend'
    | 'assumption'
    | 'computed'
    | 'derivation'
    | 'source'
    | 'verified'
    | 'inForce'
    | 'switchLocale'
    | 'periode'
    | 'gapsTitle',
    string
  >
  readonly floating: Record<'title' | 'body' | 'short', string>
  readonly form: Record<
    | 'harga'
    | 'uangMuka'
    | 'plafon'
    | 'tenorTahun'
    | 'bungaTetap'
    | 'masaTetapTahun'
    | 'bungaMengambang'
    | 'penghasilan'
    | 'porsiPenghasilan'
    | 'mulai'
    | 'acuan'
    | 'margin'
    | 'skenario'
    | 'flat'
    | 'efektif'
    | 'pembulatan',
    string
  >
  readonly table: Record<
    | 'bulan'
    | 'periode'
    | 'saldoAwal'
    | 'angsuran'
    | 'bunga'
    | 'pokok'
    | 'saldoAkhir'
    | 'fase'
    | 'tetap'
    | 'mengambang'
    | 'total'
    | 'totalBunga'
    | 'totalDibayar',
    string
  >
}

const id: Dictionary = {
  nav: {
    hitung: 'Hitung',
    ambang: 'Ambang',
    subsidi: 'Subsidi',
    banding: 'Banding',
    biaya: 'Biaya',
    parameter: 'Parameter',
  },
  common: {
    appName: 'KPR Simulator',
    tagline: 'Simulasi KPR yang menampilkan apa yang terjadi setelah masa bunga tetap berakhir.',
    notAdvice: 'Bukan nasihat keuangan.',
    personalProject: 'Proyek pribadi, sumber terbuka, tanpa afiliasi bank mana pun.',
    confirmWithBank: 'Pastikan setiap angka langsung ke bank Anda.',
    approvalNotModelled: 'Persetujuan kredit tidak dimodelkan di sini.',
    unknownLegend: 'Kuning berarti tidak diketahui — asumsi Anda, bukan data.',
    thresholdLegend: 'Merah menandai batas keterjangkauan dan pelanggarannya.',
    assumption: 'Asumsi',
    computed: 'Dihitung',
    derivation: 'Penurunan',
    source: 'Sumber',
    verified: 'Diverifikasi',
    inForce: 'Berlaku',
    switchLocale: 'English',
    periode: 'Periode',
    gapsTitle: 'Yang tidak diketahui aplikasi ini',
  },
  floating: {
    title: 'Bunga setelah masa tetap',
    body:
      'Bunga setelah masa tetap tidak dipublikasikan bank. Bank menerbitkan suku bunga dasar kredit (SBDK), tetapi marjin yang ditambahkan di atasnya bersifat internal dan tidak diumumkan. Angka di bawah ini asumsi Anda, bukan data.',
    short: 'Asumsi Anda, bukan data.',
  },
  form: {
    harga: 'Harga rumah',
    uangMuka: 'Uang muka',
    plafon: 'Plafon (yang dibiayai)',
    tenorTahun: 'Tenor (tahun)',
    bungaTetap: 'Bunga tetap (% per tahun)',
    masaTetapTahun: 'Masa bunga tetap (tahun)',
    bungaMengambang: 'Bunga mengambang (% per tahun)',
    penghasilan: 'Penghasilan per bulan',
    porsiPenghasilan: 'Porsi penghasilan untuk angsuran',
    mulai: 'Angsuran pertama',
    acuan: 'Suku bunga acuan (% per tahun)',
    margin: 'Marjin bank (% per tahun)',
    skenario: 'Skenario',
    flat: 'Flat',
    efektif: 'Efektif',
    pembulatan: 'Pembulatan',
  },
  table: {
    bulan: 'Bulan',
    periode: 'Periode',
    saldoAwal: 'Saldo awal',
    angsuran: 'Angsuran',
    bunga: 'Bunga',
    pokok: 'Pokok',
    saldoAkhir: 'Saldo akhir',
    fase: 'Fase',
    tetap: 'Tetap',
    mengambang: 'Mengambang',
    total: 'Total',
    totalBunga: 'Total bunga',
    totalDibayar: 'Total dibayar',
  },
}

const en: Dictionary = {
  nav: {
    hitung: 'Calculate',
    ambang: 'Threshold',
    subsidi: 'Subsidised',
    banding: 'Side by side',
    biaya: 'Costs',
    parameter: 'Parameters',
  },
  common: {
    appName: 'KPR Simulator',
    tagline: 'A KPR calculator that shows what happens after the fixed-rate period ends.',
    notAdvice: 'Not financial advice.',
    personalProject: 'A personal, open-source project with no bank affiliation.',
    confirmWithBank: 'Confirm every figure directly with your bank.',
    approvalNotModelled: 'Credit approval is not modelled here.',
    unknownLegend: 'Amber means unknown — your assumption, not data.',
    thresholdLegend: 'Red marks the affordability limit and its breach.',
    assumption: 'Assumption',
    computed: 'Computed',
    derivation: 'Derivation',
    source: 'Source',
    verified: 'Verified',
    inForce: 'In force',
    switchLocale: 'Bahasa Indonesia',
    periode: 'Period',
    gapsTitle: 'What this tool does not know',
  },
  floating: {
    title: 'The rate after the fixed period',
    body:
      'Banks do not publish the rate that applies once the fixed period ends. They publish a base lending rate (SBDK), but the margin added on top is internal and unpublished. The figures below are your assumption, not data.',
    short: 'Your assumption, not data.',
  },
  form: {
    harga: 'House price',
    uangMuka: 'Down payment',
    plafon: 'Amount financed',
    tenorTahun: 'Term (years)',
    bungaTetap: 'Fixed rate (% per year)',
    masaTetapTahun: 'Fixed period (years)',
    bungaMengambang: 'Floating rate (% per year)',
    penghasilan: 'Monthly income',
    porsiPenghasilan: 'Share of income for the instalment',
    mulai: 'First instalment',
    acuan: 'Base rate (% per year)',
    margin: 'Bank margin (% per year)',
    skenario: 'Scenario',
    flat: 'Flat',
    efektif: 'Effective',
    pembulatan: 'Rounding',
  },
  table: {
    bulan: 'Month',
    periode: 'Period',
    saldoAwal: 'Opening balance',
    angsuran: 'Instalment',
    bunga: 'Interest',
    pokok: 'Principal',
    saldoAkhir: 'Closing balance',
    fase: 'Phase',
    tetap: 'Fixed',
    mengambang: 'Floating',
    total: 'Total',
    totalBunga: 'Total interest',
    totalDibayar: 'Total paid',
  },
}

export const DICTIONARIES: Record<Locale, Dictionary> = { id, en }

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** id-ID / en-GB, for Intl only. Money is always formatted Indonesian-style. */
export function intlLocale(locale: Locale): string {
  return locale === 'id' ? 'id-ID' : 'en-GB'
}
