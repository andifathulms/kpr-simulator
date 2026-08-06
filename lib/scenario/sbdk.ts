import { z } from 'zod'

/**
 * SBDK — the base lending rate a bank publishes by segment under OJK rules.
 *
 * It gives a legitimate *floor* for the floating period, and nothing more:
 * the margin a bank adds on top is internal and unpublished, so an SBDK
 * figure is never an answer to "what will I pay". Snapshots therefore ship as
 * dated reference points carrying their source, and are rendered as such —
 * never as current data, never pre-filled into a rate field.
 *
 * PRD §9 also binds here: a bank name appears only because the user typed it,
 * so snapshots are keyed by segment rather than by institution.
 */
export const sbdkSnapshotSchema = z.object({
  /** The credit segment, as OJK publishes it. KPR is one of several. */
  segment: z.enum(['kpr', 'non-kpr-konsumsi', 'korporasi', 'ritel', 'mikro']),
  /** Observation date of the published figure, not the date it was recorded. */
  observedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Decimal, not a percentage. */
  decimal: z.number().min(0).max(1),
  /** What this figure is — an aggregate, a single publication, a median. */
  basis: z.string().min(4),
  sourceUrl: z.string().url().startsWith('https://'),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const sbdkFileSchema = z.object({
  snapshots: z.array(sbdkSnapshotSchema),
  /** Stated on screen wherever snapshots are offered, empty set or not. */
  coverageNote: z.object({ id: z.string().min(1), en: z.string().min(1) }),
})

export type SbdkSnapshot = z.infer<typeof sbdkSnapshotSchema>
export type SbdkFile = z.infer<typeof sbdkFileSchema>

export function snapshotsFor(file: SbdkFile, segment: SbdkSnapshot['segment']): SbdkSnapshot[] {
  return file.snapshots
    .filter((snapshot) => snapshot.segment === segment)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
}
