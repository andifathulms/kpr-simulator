import type { Locale } from './locales'

/**
 * Indonesian first, written for someone who has never taken a loan. Bank
 * vocabulary is used as banks use it and glossed on first use. Uncertainty is
 * stated in the same plain voice as everything else.
 */
export interface Dictionary {
  /**
   * Nav labels, not route names. The routes stay `hitung`, `ambang`, and so
   * on; the labels say what the page is for, because a stranger cannot read
   * "Ambang" cold — the PRD itself has to gloss it.
   */
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
  /**
   * The question each page answers, and the paragraph under it. Rendered by
   * PageHeader and used verbatim to generate that route's <title> and
   * description — one source, so a search result cannot describe a page
   * differently from the page itself.
   */
  readonly pages: Record<
    'home' | 'hitung' | 'ambang' | 'subsidi' | 'banding' | 'biaya' | 'parameter',
    { readonly title: string; readonly lede: string }
  >
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
    hitung: 'Hitung angsuran',
    ambang: 'Batas Anda',
    subsidi: 'KPR subsidi',
    banding: 'Bandingkan',
    biaya: 'Biaya awal',
    parameter: 'Sumber angka',
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
  pages: {
    home: {
      title: 'Bunga yang dikutip bank hanya berlaku beberapa tahun. Sisanya, tidak ada yang tahu.',
      lede: 'Hitung angsuran KPR Anda untuk kedua bagian itu secara terpisah — yang dikunci bank, dan yang datang sesudahnya.',
    },
    hitung: {
      title: 'Berapa angsuran saya, sebelum dan sesudah bunga tetap berakhir?',
      lede: 'Isi apa yang bank kutip kepada Anda. Tidak ada satu pun suku bunga yang diisikan aplikasi ini — kolom bunga mulai kosong, karena angka yang sudah terisi akan terbaca seperti data.',
    },
    ambang: {
      title: 'Sampai bunga berapa angsuran ini masih di bawah batas Anda?',
      lede: 'Anda menetapkan berapa bagian penghasilan yang boleh dipakai untuk angsuran; aplikasi mencari suku bunga mengambang yang persis mencapainya. Satu angka, untuk dibawa dan ditanyakan langsung ke bank.',
    },
    subsidi: {
      title: 'Apakah saya memenuhi syarat FLPP — dan berapa angsurannya?',
      lede: 'FLPP bersuku bunga tetap sampai akhir tenor, jadi jalur ini terhitung persis: tidak ada periode mengambang dan tidak ada satu pun angka kuning di jadwalnya. Perbandingan dengan jalur komersial adalah inti dari aplikasi ini.',
    },
    banding: {
      title: 'Subsidi atau komersial — apa bedanya untuk profil saya?',
      lede: 'Satu profil, dua jalur, berdampingan. Yang dibandingkan adalah dua jenis produk, bukan dua bank, dan tidak ada yang diunggulkan. Yang paling berguna di halaman ini bukan selisihnya, melainkan perbedaan seberapa pasti masing-masing angka.',
    },
    biaya: {
      title: 'Berapa yang harus saya siapkan di luar cicilan?',
      lede: 'Biaya di luar pinjaman: pajak, notaris, dan biaya bank. Yang diatur peraturan dikutip sumbernya; yang ditetapkan bank atau notaris adalah angka Anda sendiri dan ditandai kuning.',
    },
    parameter: {
      title: 'Dari mana angka-angka ini berasal?',
      lede: 'Tidak ada satu pun nilai peraturan yang ditulis di dalam kode. Semuanya ada di paket aturan bersama dasar hukum, tautan sumber, periode berlaku, dan tanggal verifikasinya — dan build ditolak bila ada parameter tanpa sitasi.',
    },
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
    hitung: 'Instalment',
    ambang: 'Your limit',
    subsidi: 'Subsidised KPR',
    banding: 'Compare',
    biaya: 'Upfront costs',
    parameter: 'Sources',
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
  pages: {
    home: {
      title: 'The rate your bank quotes lasts a few years. Nobody knows the rest.',
      lede: 'Work out your KPR instalment for both parts separately — the one the bank locks, and the one that comes after it.',
    },
    hitung: {
      title: 'What is my instalment, before and after the fixed rate ends?',
      lede: 'Enter what the bank quoted you. No rate on this page is supplied by the app — the rate fields start empty, because a pre-filled figure reads like data.',
    },
    ambang: {
      title: 'How high can the rate go before the instalment passes your limit?',
      lede: 'You set how much of your income may go to the instalment; the app solves for the floating rate that reaches exactly that. One figure, to carry into a bank meeting and ask about directly.',
    },
    subsidi: {
      title: 'Do I qualify for FLPP — and what would the instalment be?',
      lede: 'FLPP is fixed to the end of the term, so this path computes exactly: no floating period and nothing amber in its schedule at all. The contrast with the commercial path is the point of this tool.',
    },
    banding: {
      title: 'Subsidised or commercial — what differs for my profile?',
      lede: 'One profile, both paths, side by side. This compares two kinds of product, not two banks, and favours neither. The useful thing here is not the difference between the totals — it is the difference in how certain each of them is.',
    },
    biaya: {
      title: 'What do I need to find, beyond the monthly instalment?',
      lede: 'The costs beyond the loan: taxes, notary, and bank fees. Regulated items carry their source; items a bank or notary sets are your own figures and are marked amber.',
    },
    parameter: {
      title: 'Where do these numbers come from?',
      lede: 'No regulatory value is written into the application code. Every one lives in a rule pack with its legal basis, source link, effective period, and verification date — and the build is rejected if any parameter lacks a citation.',
    },
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
