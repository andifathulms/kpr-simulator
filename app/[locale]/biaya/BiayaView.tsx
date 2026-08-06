'use client'

import { useMemo, useState } from 'react'
import { rupiah } from '@/lib/money/rupiah'
import { formatRupiah } from '@/lib/money/format'
import { period } from '@/lib/period/period'
import { RULES, COVERAGE_GAPS } from '@/lib/rules/registry'
import { computeOwnershipCost } from '@/lib/biaya/ownership'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Locale } from '@/lib/i18n/locales'
import { ShareBar } from '@/components/share/ShareBar'
import { MoneyField, NumberField } from '@/components/field/Field'
import { RefusalNotice, UnknownNotice } from '@/components/notice/Notice'

/**
 * Beyond the loan. Regulated lines carry their citation; bank-discretionary
 * lines are the user's own figures and are marked amber, because a number the
 * app cannot source is a number the app does not know.
 */
export function BiayaView({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  const intl = intlLocale(locale)
  const id = locale === 'id'

  const [harga, setHarga] = useState(0)
  const [npoptkp, setNpoptkp] = useState(0)
  const [provisi, setProvisi] = useState(0)
  const [administrasi, setAdministrasi] = useState(0)
  const [appraisal, setAppraisal] = useState(0)
  const [asuransi, setAsuransi] = useState(0)
  const [notaris, setNotaris] = useState(0)
  const [tahun, setTahun] = useState(2026)
  const [bulan, setBulan] = useState(9)

  const report = useMemo(
    () =>
      computeOwnershipCost(RULES, {
        at: period(tahun, bulan),
        housePrice: rupiah(harga),
        npoptkpOverride: npoptkp > 0 ? rupiah(npoptkp) : null,
        bankFees: [
          { key: 'provisi', label: 'Provisi', amount: rupiah(provisi) },
          { key: 'administrasi', label: 'Administrasi', amount: rupiah(administrasi) },
          { key: 'appraisal', label: 'Appraisal', amount: rupiah(appraisal) },
          { key: 'asuransi', label: id ? 'Premi asuransi' : 'Insurance premiums', amount: rupiah(asuransi) },
        ],
        notaris: rupiah(notaris),
      }),
    [tahun, bulan, harga, npoptkp, provisi, administrasi, appraisal, asuransi, notaris, id],
  )

  const gap = COVERAGE_GAPS.find((entry) => entry.reference === 'pajak.bphtb.npoptkp.daerah')
  const feeGap = COVERAGE_GAPS.find((entry) => entry.reference === 'biaya.bank.*')

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t.nav.biaya}
        title={
          id
            ? 'Berapa yang harus saya siapkan di luar cicilan?'
            : 'What do I need to find, beyond the monthly instalment?'
        }
        lede={
          id
            ? 'Biaya di luar pinjaman: pajak, notaris, dan biaya bank. Yang diatur peraturan dikutip sumbernya; yang ditetapkan bank atau notaris adalah angka Anda sendiri dan ditandai kuning.'
            : 'The costs beyond the loan: taxes, notary, and bank fees. Regulated items carry their source; items a bank or notary sets are your own figures and are marked amber.'
        }
      />

      <div className="grid gap-10 lg:grid-cols-[21rem_1fr]">
        <form
          className="print-hidden space-y-4 lg:sticky lg:top-36 lg:self-start"
          onSubmit={(event) => event.preventDefault()}
        >
          <MoneyField label={t.form.harga} value={harga} onChange={setHarga} />
          <MoneyField
            label="NPOPTKP"
            value={npoptkp}
            onChange={setNpoptkp}
            hint={
              id
                ? 'Kosongkan untuk memakai batas bawah nasional Rp80 juta. Isi bila Anda tahu nilai perda daerah Anda.'
                : 'Leave empty to use the national floor of Rp80 million. Enter your kabupaten/kota figure if you know it.'
            }
          />

          <p className="sheet-label pt-2 text-xs text-unknown">
            {id ? 'Biaya bank — angka Anda' : 'Bank fees — your figures'}
          </p>
          <MoneyField label="Provisi" value={provisi} onChange={setProvisi} amber />
          <MoneyField label="Administrasi" value={administrasi} onChange={setAdministrasi} amber />
          <MoneyField label="Appraisal" value={appraisal} onChange={setAppraisal} amber />
          <MoneyField
            label={id ? 'Premi asuransi' : 'Insurance premiums'}
            value={asuransi}
            onChange={setAsuransi}
            amber
          />
          <MoneyField
            label={id ? 'Notaris dan AJB' : 'Notary and deed of sale'}
            value={notaris}
            onChange={setNotaris}
            amber
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
          {report.type === 'unsupported' ? (
            <RefusalNotice outcome={report} locale={locale} />
          ) : (
            <>
              <section className="overflow-x-auto border border-annotation/25">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-annotation/40 bg-recess">
                      <th className="sheet-label px-3 py-2 text-left text-xs font-normal text-annotation">
                        {id ? 'Pos' : 'Item'}
                      </th>
                      <th className="sheet-label px-3 py-2 text-left text-xs font-normal text-annotation">
                        {id ? 'Sifat' : 'Nature'}
                      </th>
                      <th className="sheet-label px-3 py-2 text-right text-xs font-normal text-annotation">
                        {id ? 'Jumlah' : 'Amount'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.value.lines.map((line) => (
                      <tr
                        key={line.key}
                        className={`border-b border-annotation/15 ${
                          line.kind === 'diskresi' ? 'text-unknown' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          {id ? line.label.id : line.label.en}
                          {line.parameter && (
                            <span className="mt-0.5 block text-xs text-annotation">
                              {line.parameter.basis} ·{' '}
                              <a
                                className="underline"
                                href={line.parameter.sourceUrl}
                                rel="noreferrer noopener"
                              >
                                {t.common.source}
                              </a>
                            </span>
                          )}
                          {line.derivation && (
                            <span className="figure mt-0.5 block text-xs text-print/60">
                              {line.derivation}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {line.kind === 'diatur'
                            ? id
                              ? 'Diatur'
                              : 'Regulated'
                            : id
                              ? 'Kebijakan bank/notaris'
                              : 'Bank or notary discretion'}
                        </td>
                        <td className="figure px-3 py-2 text-right">
                          {formatRupiah(line.amount, intl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-annotation/40 bg-recess">
                      <td className="sheet-label px-3 py-2 text-xs text-annotation" colSpan={2}>
                        {id ? 'Total' : 'Total'}
                      </td>
                      <td className="figure px-3 py-2 text-right text-lg">
                        {formatRupiah(report.value.total, intl)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="border border-annotation/25 bg-recess px-4 py-3">
                  <p className="sheet-label text-xs text-annotation">
                    {id ? 'Diatur peraturan' : 'Set by regulation'}
                  </p>
                  <p className="figure mt-1 text-xl">
                    {formatRupiah(report.value.regulatedTotal, intl)}
                  </p>
                </div>
                <div className="border border-unknown/60 bg-unknown/10 px-4 py-3">
                  <p className="sheet-label text-xs text-unknown">
                    {id ? 'Kebijakan bank atau notaris' : 'Bank or notary discretion'}
                  </p>
                  <p className="figure mt-1 text-xl text-unknown">
                    {formatRupiah(report.value.discretionaryTotal, intl)}
                  </p>
                </div>
              </section>
            </>
          )}

          {gap && (
            <UnknownNotice title={id ? gap.title.id : gap.title.en}>
              {id ? gap.detail.id : gap.detail.en}
            </UnknownNotice>
          )}
          {feeGap && (
            <UnknownNotice title={id ? feeGap.title.id : feeGap.title.en}>
              {id ? feeGap.detail.id : feeGap.detail.en}
            </UnknownNotice>
          )}

          <UnknownNotice title={id ? 'PPh final penjual' : 'Final income tax on the seller'}>
            {id
              ? 'PPh final 2,5% atas pengalihan hak ditanggung penjual, bukan pembeli, sehingga tidak dijumlahkan di atas. Parameternya tetap dimuat dan tersitasi di halaman Parameter, karena sering dinegosiasikan menjadi beban pembeli.'
              : 'The 2.5% final tax on transfer is borne by the seller, not the buyer, so it is not added above. The parameter is still carried and cited on the Parameters page, because it is often negotiated onto the buyer.'}
          </UnknownNotice>
        </div>
      </div>
    </div>
  )
}
