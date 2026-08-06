/**
 * Gates `pnpm build` and CI. An uncited parameter, a gap in a parameter's
 * history, or a source URL that is not https fails the build rather than
 * reaching a user who is about to make a twenty-year decision.
 */
import { validateRulePacks } from '@/lib/rules/validate'
import { loadPackInputs, todayISO } from './load-packs'

const inputs = loadPackInputs()
const { packs, violations } = validateRulePacks(inputs, todayISO())

const parameterCount = packs.reduce((total, pack) => total + pack.parameters.length, 0)

if (violations.length > 0) {
  console.error(`\nrules:validate — ${violations.length} pelanggaran\n`)
  for (const violation of violations) {
    const where = violation.parameterId ? `${violation.pack} → ${violation.parameterId}` : violation.pack
    console.error(`  ✗ ${where}\n    ${violation.message}`)
  }
  console.error('')
  process.exit(1)
}

console.log(
  `rules:validate — ${packs.length} paket, ${parameterCount} parameter, semua tersitasi. ✓`,
)
if (inputs.length === 0) {
  console.log('  (belum ada paket aturan; validator siap lebih dulu, sesuai urutan M0)')
}
