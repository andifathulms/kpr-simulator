import { describe, expect, it } from 'vitest'
import corpus from '@/tests/banks/corpus.json'

/**
 * The corpus is data, and it has to stay honest even while it is empty: every
 * recorded difference must carry a classification drawn from the known list,
 * and no bank may be named anywhere in it.
 */
describe('bank cross-check corpus', () => {
  const classificationKeys = new Set(corpus.classifications.map((entry) => entry.key))

  it('keeps a classification for every difference, and none invented', () => {
    for (const recording of corpus.recordings as {
      key: string
      publishedPayment: number
      classification: string | null
    }[]) {
      if (recording.classification === null) continue
      expect(classificationKeys.has(recording.classification)).toBe(true)
    }
  })

  it('never treats a convention mismatch as a rounding difference', () => {
    const mismatch = corpus.classifications.find((entry) => entry.key === 'flat-vs-efektif')
    expect(mismatch).toBeDefined()
    expect(mismatch?.detail).toMatch(/never be classified as one|bukan/i)
  })

  it('names no bank, in keeping with PRD §9', () => {
    const serialised = JSON.stringify(corpus).toLowerCase()
    for (const name of ['bri', 'bni', 'mandiri', 'btn', 'bca', 'cimb', 'permata', 'danamon']) {
      expect(serialised).not.toMatch(new RegExp(`"[^"]*\\b${name}\\b[^"]*"`))
    }
  })
})
