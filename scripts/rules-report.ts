/**
 * Every parameter with its basis and verification date, so staleness is
 * visible without opening the JSON. Flags anything past its expected review.
 */
import { validateRulePacks } from '@/lib/rules/validate'
import { loadPackInputs, todayISO } from './load-packs'
import biRate from '@/data/acuan/bi-rate.json'

const today = todayISO()
const { packs, violations } = validateRulePacks(loadPackInputs(), today)

if (violations.length > 0) {
  console.error('Paket aturan tidak sah — jalankan `pnpm rules:validate` lebih dulu.')
  process.exit(1)
}

const currentMonth = today.slice(0, 7)

for (const pack of packs) {
  console.log(`\n${pack.pack.toUpperCase()} — ${pack.title.id}`)
  console.log('─'.repeat(78))
  const sorted = [...pack.parameters].sort((a, b) => a.id.localeCompare(b.id))
  for (const parameter of sorted) {
    const until = parameter.effectiveTo ?? 'berlaku'
    const overdue = parameter.expectedReview !== undefined && parameter.expectedReview < currentMonth
    console.log(`  ${parameter.id}`)
    console.log(`    nilai      ${JSON.stringify(parameter.value)}`)
    console.log(`    berlaku    ${parameter.effectiveFrom} → ${until}`)
    console.log(`    dasar      ${parameter.basis}`)
    console.log(`    sumber     ${parameter.sourceUrl}`)
    console.log(
      `    verifikasi ${parameter.verifiedAt}` +
        (parameter.expectedReview ? `  · tinjau ${parameter.expectedReview}` : '') +
        (overdue ? '  ⚠ LEWAT TINJAUAN' : ''),
    )
  }
}

/*
 * Reference anchors are not rule packs — they are dated observations of a
 * published figure, not values from a regulation — but they go stale the same
 * way and faster, so one command has to surface both. A reader running
 * `pnpm rules:report` to find what needs looking at should not have to know
 * that this one lives somewhere else.
 */
console.log(`\nACUAN — titik rujukan berkala (bukan paket aturan)`)
console.log('─'.repeat(78))
for (const snapshot of biRate.snapshots) {
  const overdue = snapshot.expectedReview !== undefined && snapshot.expectedReview < currentMonth
  console.log(`  ${biRate.id}`)
  console.log(`    nilai      ${snapshot.value}`)
  console.log(`    berlaku    ${snapshot.effectiveFrom} →`)
  console.log(`    dasar      ${snapshot.basis}`)
  console.log(`    sumber     ${snapshot.sourceUrl}`)
  console.log(
    `    verifikasi ${snapshot.verifiedAt}` +
      (snapshot.expectedReview ? `  · tinjau ${snapshot.expectedReview}` : '') +
      (overdue ? '  ⚠ LEWAT TINJAUAN' : ''),
  )
  console.log(`    catatan    ${biRate.reviewCadence.id}`)
}
console.log('')
