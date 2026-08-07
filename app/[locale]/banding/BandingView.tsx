'use client'

import { useMemo, useState } from 'react'
import { rupiah } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { compare, type ComparisonSide } from '@/lib/banding/compare'
import { RULES } from '@/lib/rules/registry'
import { resolveRate } from '@/lib/rules/resolver'
import { checkEligibility, type HargaWilayah, type Status, type Zona } from '@/lib/rules/flpp'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { MoneyField, NumberField, RateField, SelectField } from '@/components/field/Field'
import { RefusalNotice, UnknownNotice } from '@/components/notice/Notice'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'

/**
 * One profile, both paths, side by side.
 *
 * This compares two products, never two banks, and it ranks neither. What it
 * is actually for is the contrast in *certainty*: the subsidised column is a
 * number, and the commercial column is a number that rests on a rate nobody
 * outside the bank has. The difference between them moves — and changes sign
 * — with an assumption the user typed, and the page says so beside the figure
 * rather than underneath it.
 */

const ZONA: readonly { value: Zona; label: string }[] = [
  { value: 'satu', label: 'Zona 1 — Jawa (kecuali Jabodetabek), Sumatera, NTT, NTB' },
  { value: 'dua', label: 'Zona 2 — Kalimantan, Sulawesi, Babel, Kepri, Maluku, Malut, Bali' },
  { value: 'tiga', label: 'Zona 3 — Papua dan sekitarnya' },
  { value: 'empat', label: 'Zona 4 — Jakarta, Bogor, Depok, Tangerang, Bekasi' },
]

const WILAYAH: readonly { value: HargaWilayah; label: string }[] = [
  { value: 'jawa.sumatera', label: 'Jawa (kecuali Jabodetabek) dan Sumatera' },
  { value: 'kalimantan', label: 'Kalimantan' },
  { value: 'sulawesi.kepulauan', label: 'Sulawesi, Babel, Mentawai, Kepri' },
  { value: 'maluku.balinusra.jabodetabek', label: 'Maluku, Bali, Nusa Tenggara, Jabodetabek' },
  { value: 'papua', label: 'Papua dan sekitarnya' },
]

export function BandingView({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'

  const [harga, setHarga] = useState(0)
  const [uangMuka, setUangMuka] = useState(0)
  const [penghasilan, setPenghasilan] = useState(0)
  const [luas, setLuas] = useState(36)
  const [tenorTahun, setTenorTahun] = useState(20)
  const [zona, setZona] = useState<Zona>('satu')
  const [status, setStatus] = useState<Status>('kawin')
  const [wilayah, setWilayah] = useState<HargaWilayah>('jawa.sumatera')
  const [bungaTetap, setBungaTetap] = useState(0)
  const [masaTetapTahun, setMasaTetapTahun] = useState(3)
  const [bungaMengambang, setBungaMengambang] = useState(0)
  const [tahun, setTahun] = useState(2026)
  const [bulan, setBulan] = useState(9)

  const at = useMemo(() => period(tahun, bulan), [tahun, bulan])
  const plafon = Math.max(harga - uangMuka, 0)
  const termMonths = Math.round(tenorTahun * 12)
  const fixedMonths = Math.min(Math.round(masaTetapTahun * 12), Math.max(termMonths - 1, 0))

  const flppRate = useMemo(() => resolveRate(RULES, 'flpp.rate', at), [at])

  const eligibility = useMemo(
    () =>
      checkEligibility(RULES, {
        at,
        zona,
        status,
        wilayah,
        monthlyIncome: rupiah(penghasilan),
        housePrice: rupiah(harga),
        floorArea: luas,
      }),
    [at, zona, status, wilayah, penghasilan, harga, luas],
  )

  const ready =
    plafon > 0 && bungaTetap > 0 && bungaMengambang > 0 && fixedMonths > 0 && flppRate.type === 'computed'

  const result = useMemo(() => {
    if (!ready || flppRate.type !== 'computed') return null
    try {
      const principal = rupiah(plafon)
      const subsidi = buildSchedule({
        principal,
        start: at,
        termMonths,
        rounding: 'pembulatan-terdekat',
        segments: [
          {
            months: termMonths,
            annualRate: flppRate.value.value,
            phase: 'tetap',
            assumed: false,
          },
        ],
      })
      const komersial = buildSchedule({
        principal,
        start: at,
        termMonths,
        rounding: 'pembulatan-terdekat',
        segments: [
          { months: fixedMonths, annualRate: bungaTetap, phase: 'tetap', assumed: false },
          {
            months: termMonths - fixedMonths,
            annualRate: bungaMengambang,
            phase: 'mengambang',
            assumed: true,
          },
        ],
      })
      return { kind: 'ok' as const, comparison: compare(subsidi, komersial, fixedMonths) }
    } catch (error) {
      return {
        kind: 'error' as const,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [ready, flppRate, plafon, at, termMonths, fixedMonths, bungaTetap, bungaMengambang])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t.nav.banding}
        title={
          id
            ? 'Subsidi atau komersial — apa bedanya untuk profil saya?'
            : 'Subsidised or commercial — what differs for my profile?'
        }
        lede={
          id
            ? 'Satu profil, dua jalur, berdampingan. Yang dibandingkan adalah dua jenis produk, bukan dua bank, dan tidak ada yang diunggulkan. Yang paling berguna di halaman ini bukan selisihnya, melainkan perbedaan seberapa pasti masing-masing angka.'
            : 'One profile, both paths, side by side. This compares two kinds of product, not two banks, and favours neither. The useful thing here is not the difference between the totals — it is the difference in how certain each of them is.'
        }
      />

      <div className="grid gap-10 lg:grid-cols-[21rem_1fr]">
        <form
          className="print-hidden space-y-4 lg:sticky lg:top-36 lg:self-start"
          onSubmit={(event) => event.preventDefault()}
        >
          <MoneyField label={t.form.harga} value={harga} onChange={setHarga} />
          <MoneyField label={t.form.uangMuka} value={uangMuka} onChange={setUangMuka} />
          <MoneyField label={t.form.penghasilan} value={penghasilan} onChange={setPenghasilan} />
          <NumberField
            label={id ? 'Luas lantai' : 'Floor area'}
            value={luas}
            onChange={setLuas}
            min={1}
            max={200}
            suffix="m²"
          />
          <NumberField
            label={t.form.tenorTahun}
            value={tenorTahun}
            onChange={setTenorTahun}
            min={2}
            max={40}
            suffix={id ? 'thn' : 'yr'}
          />
          <SelectField
            label={id ? 'Zona penghasilan' : 'Income zone'}
            value={zona}
            options={ZONA}
            onChange={setZona}
          />
          <SelectField
            label={id ? 'Status' : 'Status'}
            value={status}
            options={[
              { value: 'tidak.kawin' as Status, label: id ? 'Tidak kawin' : 'Unmarried' },
              { value: 'kawin' as Status, label: id ? 'Kawin' : 'Married' },
              { value: 'tapera' as Status, label: id ? 'Peserta Tapera' : 'Tapera participant' },
            ]}
            onChange={setStatus}
          />
          <SelectField
            label={id ? 'Wilayah harga' : 'Price region'}
            value={wilayah}
            options={WILAYAH}
            onChange={setWilayah}
          />

          <p className="sheet-label pt-2 text-caption text-annotation">
            {id ? 'Sisi komersial' : 'The commercial side'}
          </p>
          <RateField label={t.form.bungaTetap} value={bungaTetap} onChange={setBungaTetap} />
          <NumberField
            label={t.form.masaTetapTahun}
            value={masaTetapTahun}
            onChange={setMasaTetapTahun}
            min={1}
            max={Math.max(tenorTahun - 1, 1)}
            suffix={id ? 'thn' : 'yr'}
          />
          <RateField
            label={t.form.bungaMengambang}
            value={bungaMengambang}
            onChange={setBungaMengambang}
            amber
            hint={t.floating.short}
          />

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={id ? 'Tahun' : 'Year'}
              value={tahun}
              onChange={setTahun}
              min={2000}
              max={2100}
            />
            <NumberField
              label={id ? 'Bulan' : 'Month'}
              value={bulan}
              onChange={setBulan}
              min={1}
              max={12}
            />
          </div>
        </form>

        <div className="space-y-8">
          <ShareBar locale={locale} />

          {flppRate.type === 'unsupported' && (
            <RefusalNotice outcome={flppRate} locale={locale} />
          )}

          {eligibility.type === 'unsupported' ? (
            <RefusalNotice outcome={eligibility} locale={locale} />
          ) : (
            <section className="space-y-2">
              <h2 className="sheet-label text-caption text-annotation">
                {id ? 'Kelayakan jalur subsidi' : 'Eligibility for the subsidised path'}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-3">
                {eligibility.value.criteria.map((criterion) => (
                  <li
                    key={criterion.key}
                    className={`border-l-2 px-3 py-2 text-caption ${
                      criterion.met
                        ? 'border-annotation/50 bg-recess'
                        : 'border-threshold bg-threshold/[0.08]'
                    }`}
                  >
                    <p className="sheet-label text-caption text-annotation">
                      {id ? criterion.label.id : criterion.label.en}
                    </p>
                    <p className="figure mt-0.5">
                      {criterion.stated}{' '}
                      <span className={criterion.met ? 'text-muted' : 'text-threshold'}>
                        {criterion.met ? '≤' : '>'} {criterion.ceiling}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              {!eligibility.value.allMet && (
                <p className="text-caption text-muted">
                  {id
                    ? 'Sekurang-kurangnya satu kriteria tidak terpenuhi, sehingga kolom subsidi di bawah bersifat hipotetis: angkanya benar secara aritmetika, tetapi jalur itu belum tentu terbuka untuk profil ini. Aplikasi ini tidak menyimpulkan apa yang sebaiknya Anda lakukan.'
                    : 'At least one criterion is not met, so the subsidised column below is hypothetical: its arithmetic is right, but that path may not be open to this profile. The app draws no conclusion about what to do.'}
                </p>
              )}
            </section>
          )}

          {!ready && (
            <UnknownNotice title={id ? 'Belum ada yang dibandingkan' : 'Nothing compared yet'}>
              {id
                ? 'Isi harga rumah, bunga tetap yang dikutip untuk jalur komersial, dan asumsi bunga mengambang Anda. Tanpa asumsi mengambang tidak ada perbandingan yang jujur untuk dibuat — total sisi komersial memang tidak dapat diketahui tanpanya.'
                : 'Enter a house price, the fixed rate quoted for the commercial path, and your floating-rate assumption. Without the assumption there is no honest comparison to make — the commercial total genuinely cannot be known without one.'}
            </UnknownNotice>
          )}

          {result?.kind === 'error' && (
            <UnknownNotice title={id ? 'Tidak dapat dihitung' : 'Cannot be computed'}>
              {result.error}
            </UnknownNotice>
          )}

          {result?.kind === 'ok' && (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                <Column
                  title={id ? 'Subsidi (FLPP)' : 'Subsidised (FLPP)'}
                  side={result.comparison.subsidi}
                  locale={locale}
                  rateLabel={
                    flppRate.type === 'computed'
                      ? `${formatRate(flppRate.value.value, intl)} ${id ? 'efektif, tetap sampai akhir tenor' : 'effective, fixed to the end of the term'}`
                      : ''
                  }
                  certaintyNote={
                    id
                      ? 'Tidak ada satu pun angka di kolom ini yang diasumsikan. Bunganya tetap sampai angsuran terakhir.'
                      : 'Nothing in this column is assumed. The rate is fixed to the final instalment.'
                  }
                />
                <Column
                  title={id ? 'Komersial' : 'Commercial'}
                  side={result.comparison.komersial}
                  locale={locale}
                  rateLabel={`${formatRate(bungaTetap, intl)} ${id ? 'selama' : 'for'} ${masaTetapTahun} ${
                    id ? 'tahun, lalu' : 'years, then'
                  } ${formatRate(bungaMengambang, intl)}`}
                  certaintyNote={t.floating.body}
                />
              </section>

              <section className="border-l-2 border-unknown bg-unknown/[0.08] px-4 py-4">
                <p className="sheet-label text-caption text-unknown">
                  {id ? 'Selisih total dibayar' : 'Difference in total paid'}
                </p>
                <p className="figure mt-1 text-subhead text-unknown">
                  {formatRupiah(result.comparison.totalPaidDifference, intl)}
                </p>
                <p className="mt-2 max-w-2xl text-caption text-print">
                  {id
                    ? `Komersial dikurangi subsidi, dihitung dengan asumsi bunga mengambang ${formatRate(bungaMengambang, intl)} yang Anda isikan. Ubah asumsi itu dan selisih ini ikut berubah — pada asumsi yang cukup rendah, tandanya berbalik. Angka ini aritmetika atas satu asumsi, bukan ramalan dan bukan anjuran.`
                    : `Commercial minus subsidised, computed on the ${formatRate(bungaMengambang, intl)} floating rate you entered. Change that assumption and this figure changes with it — low enough, and it changes sign. It is arithmetic on one assumption, not a forecast and not a recommendation.`}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="sheet-label text-caption text-annotation">
                  {id ? 'Subsidi — seluruh tenor pada satu bunga' : 'Subsidised — one rate, whole term'}
                </h3>
                <ScheduleElevation schedule={result.comparison.subsidi.schedule} locale={locale} />
                <h3 className="sheet-label text-caption text-annotation">
                  {id ? 'Komersial — dengan batas masa tetap' : 'Commercial — with the fixed-period boundary'}
                </h3>
                <ScheduleElevation
                  schedule={result.comparison.komersial.schedule}
                  locale={locale}
                  boundaryMonth={fixedMonths}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Column({
  title,
  side,
  locale,
  rateLabel,
  certaintyNote,
}: {
  title: string
  side: ComparisonSide
  locale: Locale
  rateLabel: string
  certaintyNote: string
}) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'
  const amber = side.contingent

  return (
    <div
      className={`border px-5 py-4 ${
        amber ? 'border-unknown/60 bg-unknown/[0.08]' : 'border-annotation/40 bg-recess'
      }`}
    >
      <p className={`sheet-label text-caption ${amber ? 'text-unknown' : 'text-print'}`}>{title}</p>
      <p className="figure mt-1 text-caption text-muted">{rateLabel}</p>

      <dl className="mt-4 space-y-3">
        <Row label={t.table.angsuran} value={formatRupiah(side.firstPayment, intl)} />
        {side.paymentAfterBoundary !== null && (
          <Row
            label={id ? 'Angsuran setelah masa tetap' : 'Instalment after the fixed period'}
            value={formatRupiah(side.paymentAfterBoundary, intl)}
            amber
          />
        )}
        <Row label={t.table.totalBunga} value={formatRupiah(side.totalInterest, intl)} amber={amber} />
        <Row label={t.table.totalDibayar} value={formatRupiah(side.totalPaid, intl)} amber={amber} />
      </dl>

      <p className={`mt-4 text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>{certaintyNote}</p>
    </div>
  )
}

function Row({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>{label}</dt>
      <dd className={`figure text-right ${amber ? 'text-unknown' : 'text-print'}`}>{value}</dd>
    </div>
  )
}
