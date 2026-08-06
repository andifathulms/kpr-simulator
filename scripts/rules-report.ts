/**
 * Every parameter with its basis and verification date, so staleness is
 * visible without opening the JSON. Flags anything past its expected review.
 */
import { validateRulePacks } from '@/lib/rules/validate'
import { loadPackInputs, todayISO } from './load-packs'

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
console.log('')
