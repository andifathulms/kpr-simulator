'use client'

import { useMemo, useState } from 'react'
import { rupiah } from '@/lib/money/rupiah'
import { formatRate, formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { RULES } from '@/lib/rules/registry'
import { resolveRate } from '@/lib/rules/resolver'
import { checkEligibility, type HargaWilayah, type Status, type Zona } from '@/lib/rules/flpp'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { MoneyField, NumberField, SelectField } from '@/components/field/Field'
import { RefusalNotice, UnknownNotice } from '@/components/notice/Notice'
import { ScheduleElevation } from '@/components/elevation/ScheduleElevation'
import { AmortisationTable } from '@/components/table/AmortisationTable'

/**
 * The subsidised path. FLPP is fully determined and fully cited, so it
 * computes exactly, with no floating period and nothing amber in the
 * schedule at all. The contrast with /hitung is the most useful thing this
 * app can show: one path knowable, one not.
 *
 * The eligibility check states which criterion fails against which cited
 * ceiling. It never returns a verdict.
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

export function SubsidiView({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'

  const [zona, setZona] = useState<Zona>('satu')
  const [status, setStatus] = useState<Status>('kawin')
  const [wilayah, setWilayah] = useState<HargaWilayah>('jawa.sumatera')
  const [penghasilan, setPenghasilan] = useState(0)
  const [harga, setHarga] = useState(0)
  const [uangMuka, setUangMuka] = useState(0)
  const [luas, setLuas] = useState(36)
  const [tenorTahun, setTenorTahun] = useState(20)
  const [tahun, setTahun] = useState(2026)
  const [bulan, setBulan] = useState(9)

  const at = useMemo(() => period(tahun, bulan), [tahun, bulan])

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

  const rate = useMemo(() => resolveRate(RULES, 'flpp.rate', at), [at])

  const schedule = useMemo(() => {
    const plafon = Math.max(harga - uangMuka, 0)
    if (rate.type !== 'computed' || plafon <= 0 || tenorTahun <= 0) return null
    try {
      return buildSchedule({
        principal: rupiah(plafon),
        start: at,
        termMonths: Math.round(tenorTahun * 12),
        rounding: 'pembulatan-terdekat',
        segments: [
          {
            months: Math.round(tenorTahun * 12),
            annualRate: rate.value.value,
            phase: 'tetap',
            // Cited, fixed to the end of the term. Nothing assumed.
            assumed: false,
          },
        ],
      })
    } catch {
      return null
    }
  }, [rate, harga, uangMuka, tenorTahun, at])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t.nav.subsidi}
        title={
          id
            ? 'Apakah saya memenuhi syarat FLPP — dan berapa angsurannya?'
            : 'Do I qualify for FLPP — and what would the instalment be?'
        }
        lede={
          id
            ? 'FLPP bersuku bunga tetap sampai akhir tenor, jadi jalur ini terhitung persis: tidak ada periode mengambang dan tidak ada satu pun angka kuning di jadwalnya. Perbandingan dengan jalur komersial adalah inti dari aplikasi ini.'
            : 'FLPP is fixed to the end of the term, so this path computes exactly: no floating period and nothing amber in its schedule at all. The contrast with the commercial path is the point of this tool.'
        }
      />

      <div className="grid gap-10 lg:grid-cols-[21rem_1fr]">
        <form
          className="print-hidden space-y-4 lg:sticky lg:top-36 lg:self-start"
          onSubmit={(event) => event.preventDefault()}
        >
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
          <MoneyField label={t.form.penghasilan} value={penghasilan} onChange={setPenghasilan} />
          <MoneyField label={t.form.harga} value={harga} onChange={setHarga} />
          <MoneyField
            label={t.form.uangMuka}
            value={uangMuka}
            onChange={setUangMuka}
            hint={
              id
                ? 'Angka Anda. Uang muka minimum FLPP tidak dimuat sebagai parameter — lihat halaman Parameter.'
                : 'Your figure. The minimum FLPP down payment is not carried as a parameter — see Parameters.'
            }
          />
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
            min={1}
            max={40}
            suffix={id ? 'thn' : 'yr'}
            hint={
              id
                ? 'Tenor maksimum FLPP tidak dimuat sebagai parameter — lihat halaman Parameter.'
                : 'The maximum FLPP tenor is not carried as a parameter — see Parameters.'
            }
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
          <section className="space-y-3">
            <h2 className="sheet-label text-caption text-annotation">
              {id ? 'Pemeriksaan kriteria' : 'Criteria check'}
            </h2>

            {eligibility.type === 'unsupported' ? (
              <RefusalNotice outcome={eligibility} locale={locale} />
            ) : (
              <ul className="space-y-2">
                {eligibility.value.criteria.map((criterion) => (
                  <li
                    key={criterion.key}
                    className={`border-l-2 px-4 py-3 ${
                      criterion.met
                        ? 'border-annotation/50 bg-recess'
                        : 'border-threshold bg-threshold/[0.08]'
                    }`}
                  >
                    <p className="sheet-label text-caption text-annotation">
                      {id ? criterion.label.id : criterion.label.en}
                    </p>
                    <p className="figure mt-1">
                      {criterion.stated}
                      <span className={criterion.met ? 'text-muted' : 'text-threshold'}>
                        {' '}
                        {criterion.met ? '≤' : '>'} {criterion.ceiling}
                      </span>
                    </p>
                    <p className="mt-1 text-caption text-annotation">
                      {criterion.parameter.basis} ·{' '}
                      <a
                        className="underline"
                        href={criterion.parameter.sourceUrl}
                        rel="noreferrer noopener"
                      >
                        {t.common.source}
                      </a>{' '}
                      · {t.common.verified} {criterion.parameter.verifiedAt}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <UnknownNotice title={id ? 'Kuota' : 'Quota'}>
              {id
                ? 'Memenuhi setiap kriteria di atas tidak berarti tempatnya tersedia. Kuota FLPP ditetapkan per tahun dan bisa habis. Aplikasi ini tidak memodelkan sisa kuota, dan juga tidak memodelkan persetujuan kredit.'
                : 'Meeting every criterion above does not mean a place is available. The FLPP quota is set annually and can run out. This app does not model the remaining quota, and does not model credit approval either.'}
            </UnknownNotice>
          </section>

          <section className="space-y-3">
            <h2 className="sheet-label text-caption text-annotation">
              {id ? 'Jadwal angsuran' : 'Payment schedule'}
            </h2>

            {rate.type === 'unsupported' ? (
              <RefusalNotice outcome={rate} locale={locale} />
            ) : (
              <>
                <p className="text-caption text-muted">
                  {id ? 'Suku bunga ' : 'Rate '}
                  <span className="figure">{formatRate(rate.value.value, intl)}</span>
                  {id ? ' efektif, tetap sampai akhir tenor. ' : ' effective, fixed to the end of the term. '}
                  <span className="text-annotation">
                    {rate.value.parameter.basis} ·{' '}
                    <a
                      className="underline"
                      href={rate.value.parameter.sourceUrl}
                      rel="noreferrer noopener"
                    >
                      {t.common.source}
                    </a>
                  </span>
                </p>
                {rate.value.parameter.note && (
                  <p className="text-caption text-unknown">
                    {id ? rate.value.parameter.note.id : rate.value.parameter.note.en}
                  </p>
                )}
              </>
            )}

            {schedule ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label={t.table.angsuran}
                    value={formatRupiah(schedule.instalments[0]?.payment ?? rupiah(0), intl)}
                  />
                  <StatCard
                    label={t.table.totalBunga}
                    value={formatRupiah(schedule.totalInterest, intl)}
                  />
                  <StatCard
                    label={t.table.totalDibayar}
                    value={formatRupiah(schedule.totalPaid, intl)}
                  />
                </div>
                <ScheduleElevation schedule={schedule} locale={locale} />
                <AmortisationTable schedule={schedule} locale={locale} />
              </>
            ) : (
              <UnknownNotice title={id ? 'Belum ada yang dihitung' : 'Nothing computed yet'}>
                {id
                  ? 'Isi harga rumah dan uang muka untuk melihat jadwalnya.'
                  : 'Enter a house price and a down payment to see the schedule.'}
              </UnknownNotice>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
