/**
 * DEVELOPMENT ONLY. Never shipped, never imported by the app.
 *
 * Records outputs from published bank calculators for a fixture set and
 * compares them with this engine. A difference is *classified in writing* —
 * usually a rounding convention — and the classification is written down
 * either way. Nothing is ever auto-aligned: silently nudging the engine to
 * match someone else's rounding would destroy the only reason to trust it.
 *
 * There is no scraping here. Published calculators are interactive pages, and
 * the honest way to record one is by hand, once, with the date. This script
 * takes a recording you enter into tests/banks/corpus.json and tells you
 * whether it agrees, and by how much.
 *
 * Usage:  pnpm banks:record
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { rupiah } from '@/lib/money/rupiah'
import { parsePeriod } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { buildFlatSchedule } from '@/lib/amortise/flat'

const recordingSchema = z.object({
  /** Opaque — a bank is never named in this repository. See PRD §9. */
  key: z.string().min(1),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  convention: z.enum(['efektif', 'flat']),
  principal: z.number().int().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().int().positive(),
  start: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  /** The instalment the published calculator displayed. */
  publishedPayment: z.number().int(),
  /** Empty until a difference has actually been explained. */
  classification: z.string().nullable(),
})

const corpusSchema = z.object({
  note: z.string(),
  recordings: z.array(recordingSchema),
  classifications: z.array(
    z.object({ key: z.string(), title: z.string(), detail: z.string() }),
  ),
})

const corpus = corpusSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), 'tests', 'banks', 'corpus.json'), 'utf8')),
)

const known = new Set(corpus.classifications.map((entry) => entry.key))

if (corpus.recordings.length === 0) {
  console.log('banks:record — belum ada rekaman.')
  console.log(
    '\nKalkulator bank adalah halaman interaktif; cara jujur merekamnya adalah manual,\n' +
      'sekali, dengan tanggalnya. Tambahkan entri ke tests/banks/corpus.json lalu jalankan\n' +
      'ulang perintah ini. Perbedaan diklasifikasikan, tidak pernah disamakan otomatis.\n',
  )
  console.log(`Klasifikasi yang tersedia: ${[...known].join(', ')}`)
  process.exit(0)
}

let unexplained = 0

for (const recording of corpus.recordings) {
  const common = {
    principal: rupiah(recording.principal),
    start: parsePeriod(recording.start),
    termMonths: recording.termMonths,
    rounding: 'pembulatan-terdekat' as const,
  }

  const schedule =
    recording.convention === 'flat'
      ? buildFlatSchedule({ ...common, annualRate: recording.annualRate, assumed: false })
      : buildSchedule({
          ...common,
          segments: [
            {
              months: recording.termMonths,
              annualRate: recording.annualRate,
              phase: 'tetap',
              assumed: false,
            },
          ],
        })

  const ours = schedule.instalments[0]?.payment ?? 0
  const difference = recording.publishedPayment - ours

  console.log(`\n${recording.key} · ${recording.recordedAt} · ${recording.convention}`)
  console.log(`  mesin ini   ${ours}`)
  console.log(`  diterbitkan ${recording.publishedPayment}`)
  console.log(`  selisih     ${difference}`)

  if (difference === 0) {
    console.log('  ✓ sama persis')
    continue
  }
  if (recording.classification === null) {
    console.log('  ✗ BELUM DIKLASIFIKASIKAN — tulis penjelasannya, jangan sesuaikan mesinnya')
    unexplained += 1
  } else if (!known.has(recording.classification)) {
    console.log(`  ✗ klasifikasi "${recording.classification}" tidak dikenal`)
    unexplained += 1
  } else {
    console.log(`  · diklasifikasikan: ${recording.classification}`)
  }
}

if (unexplained > 0) {
  console.error(`\n${unexplained} selisih belum dijelaskan.\n`)
  process.exit(1)
}
