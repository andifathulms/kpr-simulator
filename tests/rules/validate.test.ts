import { describe, expect, it } from 'vitest'
import { validateRulePacks, type ValidationInput } from '@/lib/rules/validate'

const TODAY = '2026-08-06'

function parameter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contoh.batas',
    label: { id: 'Batas contoh', en: 'Example ceiling' },
    value: { kind: 'money', amount: 166_000_000 },
    effectiveFrom: '2024-01',
    effectiveTo: null,
    basis: 'Contoh Peraturan 1/2024 Pasal 2',
    sourceUrl: 'https://example.gov.id/1-2024',
    verifiedAt: '2026-01-01',
    ...overrides,
  }
}

function pack(parameters: unknown[], packName = 'contoh'): ValidationInput {
  return {
    pack: `${packName}/pack.json`,
    directory: packName,
    raw: {
      pack: packName,
      title: { id: 'Paket contoh', en: 'Example pack' },
      parameters,
    },
  }
}

function messages(inputs: ValidationInput[]): string[] {
  return validateRulePacks(inputs, TODAY).violations.map((violation) => violation.message)
}

describe('rule-pack validator', () => {
  it('accepts a fully cited parameter', () => {
    const result = validateRulePacks([pack([parameter()])], TODAY)
    expect(result.violations).toEqual([])
    expect(result.packs).toHaveLength(1)
  })

  it('rejects a parameter with no legal basis', () => {
    expect(messages([pack([parameter({ basis: '' })])]).join()).toMatch(/basis/)
  })

  it('rejects a source that is not https', () => {
    expect(messages([pack([parameter({ sourceUrl: 'http://example.gov.id/1' })])]).join()).toMatch(
      /https/,
    )
    expect(messages([pack([parameter({ sourceUrl: 'lihat lampiran' })])])).not.toEqual([])
  })

  it('rejects a missing verification date', () => {
    expect(messages([pack([parameter({ verifiedAt: undefined })])])).not.toEqual([])
  })

  it('rejects a verification date in the future', () => {
    expect(messages([pack([parameter({ verifiedAt: '2099-01-01' })])]).join()).toMatch(/masa depan/)
  })

  it('rejects a year or a version inside an identifier', () => {
    expect(messages([pack([parameter({ id: 'contoh.batas.2024' })])]).join()).toMatch(/periode/i)
    expect(messages([pack([parameter({ id: 'contoh.batas.v2' })])]).join()).toMatch(/periode/i)
  })

  it('rejects an identifier outside its pack namespace', () => {
    expect(messages([pack([parameter({ id: 'lain.batas' })])]).join()).toMatch(/diawali/)
  })

  it('rejects a pack whose name disagrees with its directory', () => {
    const input = pack([parameter()])
    expect(messages([{ ...input, directory: 'berbeda' }]).join()).toMatch(/tidak cocok/)
  })

  it('rejects overlapping effective periods for one identifier', () => {
    const violations = messages([
      pack([
        parameter({ effectiveFrom: '2023-07', effectiveTo: '2024-06' }),
        parameter({ effectiveFrom: '2024-01', effectiveTo: null }),
      ]),
    ])
    expect(violations.join()).toMatch(/tumpang tindih/)
  })

  it('rejects a gap between effective periods', () => {
    const violations = messages([
      pack([
        parameter({ effectiveFrom: '2023-07', effectiveTo: '2023-12' }),
        parameter({ effectiveFrom: '2024-06', effectiveTo: null }),
      ]),
    ])
    expect(violations.join()).toMatch(/celah periode/)
  })

  it('accepts contiguous effective periods', () => {
    const result = validateRulePacks(
      [
        pack([
          parameter({ effectiveFrom: '2023-07', effectiveTo: '2023-12' }),
          parameter({ effectiveFrom: '2024-01', effectiveTo: null }),
        ]),
      ],
      TODAY,
    )
    expect(result.violations).toEqual([])
  })

  it('rejects two open-ended entries for one identifier', () => {
    const violations = messages([
      pack([
        parameter({ effectiveFrom: '2023-07', effectiveTo: null }),
        parameter({ effectiveFrom: '2024-01', effectiveTo: null }),
      ]),
    ])
    expect(violations.join()).toMatch(/hanya satu yang boleh terbuka/)
  })

  it('rejects effectiveTo preceding effectiveFrom', () => {
    expect(
      messages([pack([parameter({ effectiveFrom: '2024-06', effectiveTo: '2024-01' })])]).join(),
    ).toMatch(/mendahului/)
  })

  it('rejects a rate expressed as a percentage rather than a decimal', () => {
    expect(messages([pack([parameter({ value: { kind: 'rate', decimal: 5 } })])])).not.toEqual([])
  })

  it('rejects money that is not a whole number of rupiah', () => {
    expect(
      messages([pack([parameter({ value: { kind: 'money', amount: 166_000_000.5 } })])]),
    ).not.toEqual([])
  })

  it('reports malformed JSON rather than throwing', () => {
    const violations = messages([{ pack: 'contoh/pack.json', directory: 'contoh', raw: null }])
    expect(violations.length).toBeGreaterThan(0)
  })
})
