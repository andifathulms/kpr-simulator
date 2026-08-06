import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { ValidationInput } from '@/lib/rules/validate'

export const RULES_ROOT = join(process.cwd(), 'data', 'rules')

/**
 * Reads every pack off disk for the scripts. The app itself imports the JSON
 * through `lib/rules/registry.ts` so the packs are bundled into the static
 * export — there is no filesystem and no fetch at runtime.
 */
export function loadPackInputs(root: string = RULES_ROOT): ValidationInput[] {
  let directories: string[]
  try {
    directories = readdirSync(root).filter((entry) => statSync(join(root, entry)).isDirectory())
  } catch {
    return []
  }

  const inputs: ValidationInput[] = []
  for (const directory of directories) {
    const files = readdirSync(join(root, directory)).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const path = join(root, directory, file)
      let raw: unknown
      try {
        raw = JSON.parse(readFileSync(path, 'utf8'))
      } catch (error) {
        raw = { __parseError: error instanceof Error ? error.message : String(error) }
      }
      inputs.push({ pack: `${directory}/${file}`, directory, raw })
    }
  }
  return inputs
}

/** The scripts may read the clock; nothing in lib/ may. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
