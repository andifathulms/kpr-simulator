/**
 * Announces a result that changed without the user navigating to it.
 *
 * Typing a rate replaces an empty panel with a full schedule. On screen that
 * is obvious; without sight there was nothing at all — no event, no focus
 * move, no reason to go looking. WCAG 4.1.3 Status Messages.
 *
 * `role="status"` is the exception to native-elements-first: a status message
 * has no native equivalent. It already implies aria-live="polite" and
 * aria-atomic="true", so neither is repeated here.
 *
 * Keep what is passed in to a sentence or two — the headline figures, not the
 * schedule. This is read out on every change, and a paragraph would be
 * punishing to sit through while typing.
 */
export function LiveRegion({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  )
}
