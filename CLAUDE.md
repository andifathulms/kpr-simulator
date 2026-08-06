# CLAUDE.md — KPR Simulator

KPR simulator built around the floating-rate period. Named **KPR Simulator**; `ambang` survives only as the route name of the threshold page, where it is the Indonesian word for threshold rather than a brand. Cited rule packs, integer-rupiah amortisation, scenario bands for the unknown period, and an affordability threshold solver. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task — **§9 in particular**. It fixes scope; this file describes how to work in the repo.

**Three things shape everything:**

1. **Never fabricate a rate.** There is no feed for what a bank will offer, and the floating rate after the fixed period is bank-internal and unpublished. Every rate on screen is either user input or a dated, labelled reference snapshot. No default rate, no "typical rate" pre-filled as though it were data.
2. **This tool never advises.** No recommendation, no ranking, no bank comparison, no affiliate link, no lead capture. It computes what the user asks and shows the derivation. Someone may make a twenty-year decision on what it displays.
3. **Amber means unknown.** The colour carries the separation between computed and assumed, so the interface does not need a paragraph of caveats to stay honest.

**Sibling project:** Rinci. Same cited-rule-pack architecture, same integer money, same refuse-rather-than-guess discipline. Follow those patterns rather than inventing new ones.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Zod for rule-pack schema validation
- Vitest
- pnpm
- **No finance library.** Amortisation and IRR are the project.
- No date library in the engine. Periods are `{ year, month }` integers.

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out; runs rules:validate first
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:conservation      # principal sums, zero balance, total paid
pnpm test:irr               # effective rate vs independently solved IRR
pnpm test:threshold         # threshold solver round-trip
pnpm rules:validate         # schema, citations, period continuity
pnpm check:offline          # no external requests, no analytics, against ./out
pnpm rules:report           # every parameter with basis and verifiedAt
pnpm banks:record           # DEV ONLY — records published bank-calculator outputs
pnpm typecheck
pnpm lint
```

`pnpm rules:validate` gates the build and CI. `pnpm banks:record` is development-only and never ships.

## Layout

```
app/
  [locale]/                 # id (default), en
    hitung/                 # schedule + inputs
    ambang/                 # threshold view
    subsidi/                # FLPP path + eligibility
    biaya/                  # total cost of ownership
    parameter/              # rule browser + citations
components/
  elevation/                # schedule as stacked principal/interest
  band/                     # floating-rate uncertainty band
  table/                    # amortisation table
  dimension/                # fixed-period boundary marker
  ui/                       # PageHeader, Panel, StatCard, FieldGroup,
                            # Legend, Glossary — the shared shell. Reserved
                            # colours are applied here and nowhere else.
lib/
  money/                    # integer rupiah, named rounding ops
  period/                   # { year, month } arithmetic
  amortise/                 # THE CORE. Pure. No React, no DOM, no clock.
    annuity.ts
    flat.ts
    schedule.ts             # Schedule + ComputationTrace
    prepay.ts
  rate/
    effective.ts            # flat → effective
    irr.ts                  # independent IRR solver — tests AND display
    threshold.ts            # solve for affordability limit
  scenario/                 # fixed + floating band
  rules/                    # schema, loader, resolver, validator
data/
  rules/                    # flpp/, ltv/, pajak/, biaya/
  sbdk/                     # dated snapshots, source + date per entry
tests/
  conservation/
  irr/
  banks/                    # recorded bank-calculator outputs + classifications
  refusal/
```

## Invariants

1. **Integer rupiah. No floating point in money.** Money is an integer type throughout `lib/money` and `lib/amortise`. Rounding is an explicit, named operation that appears as its own step in the trace and cites the convention it follows. Never `Math.round` inline.

2. **Rates and ratios may be floats; amounts may not.** The boundary is explicit and crossed in one place, deliberately.

3. **No parameter value is written in application code.** Rates, ceilings, tenor limits, LTV ratios, tax rates, NPOPTKP — all live in `data/rules/` with a citation. If you are typing a number that came from a regulation into a `.ts` file, stop.

4. **Every parameter carries `basis`, `sourceUrl`, `effectiveFrom`, and `verifiedAt`.** Validator-enforced; the build rejects an uncited parameter.

5. **The engine never reads the clock.** No `new Date()`, no `Date.now()` in `lib/`. The period is always an explicit argument. The clock belongs in the UI, for defaulting a period selector and for staleness warnings.

6. **Never fabricate, default, or pre-fill a rate.** No hardcoded "typical" rate. SBDK entries in `data/sbdk/` carry a source and a date and are rendered as dated references, never as current data. The UI must never let a user mistake an assumption for a fact.

7. **Refuse rather than guess.** Missing rule pack for the period, or a missing parameter, returns a structured `Unsupported` naming exactly what is missing. Never extrapolate, never fall back to the nearest year, never clamp.

8. **Conservation is asserted on every schedule.** Principal payments sum to the principal exactly; the final balance is exactly zero; total paid equals principal plus total interest. Called in every test, not only in `tests/conservation/`.

9. **`lib/rate/irr.ts` shares no code with `lib/rate/effective.ts`.** The IRR solver is the independent check on the effective-rate derivation. If they shared a helper, they would validate each other's bugs.

10. **Flat and effective are never conflated.** Separate functions, separate labels, separate fixtures. Rule packs state which convention a product uses. This is the most widespread confusion in Indonesian consumer credit and reproducing it inside the app would be the worst possible failure.

11. **The threshold solver round-trips.** The rate it returns, fed back through the amortisation engine, must produce a payment at exactly the stated affordability limit. Never assert a formula against itself.

12. **Nothing is computed in a component.** Components render a `Schedule` or a `ComputationTrace`.

13. **Inputs encode into the URL hash, never the query string.** Income and loan figures must never reach a server log. No analytics on input values. No runtime network requests.

14. **No advice, ranking, or bank favouritism anywhere** — in code, copy, data, or metadata. No comparison table, no affiliate link, no lead capture, no partner list. A bank name appears only because the user typed it.

15. **Amber is reserved for the unknown** — the floating-rate band and any assumed value. Threshold red marks the affordability limit and its breach. Nothing else uses either. See PRD §8.

## Working style

- **Read the regulation before implementing a rule.** Kepmen PUPR for price ceilings, Permen PKP for income ceilings, PBI for LTV. Cite the article in a comment and in the pack. Do not reconstruct from memory or from a news article.
- **Rule pack before code.** Add and validate the parameters, then write the logic that consumes them.
- **Conservation assertion before the amortisation loop**, not after. It is how you find the rounding bug the same hour you write it.
- **When a bank-calculator cross-check disagrees, classify it in writing.** Usually a rounding convention. Record the classification in `tests/banks/` either way — never auto-align.
- **Where a bank's practice is discretionary, say so rather than picking.** Bank fees, first-home down payment, floating margin. Label as user input with typical ranges marked *typical*.
- **Small increments.** The subsidised path fully cited beats both paths half-done.
- **Don't touch `next.config.js`, the Actions workflow, the validator, or `banks:record` without saying so explicitly.**
- **Don't add a finance, currency, or date dependency.** `Intl.NumberFormat` covers display; periods are integers.
- **Never weaken a test or the validator to make something pass.**

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for trace steps and for engine results (`Computed` / `Unsupported`), keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in engine code.
- Parameter identifiers stable, namespaced, versionless: `flpp.rate`, `flpp.tenor.max`, `flpp.harga.ceiling.jawa`, `ltv.rumah.tapak.kedua`, `pajak.bphtb.rate`. Periods disambiguate, not the key.
- Comments cite the article they implement — `// Kepmen PUPR 689/KPTS/M/2023` above the ceiling lookup.
- Indonesian banking vocabulary in identifiers and UI: `bungaTetap`, `bungaMengambang`, `provisi`, `penaltiPelunasan`, `angsuran`, `plafon`. Do not substitute English approximations.
- Tabular numerals on every rupiah column, right-aligned on the decimal. Without exception.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `blueprint`, `recess`, `print`, `annotation`, `unknown`, `threshold`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:conservation` and `pnpm test:irr` before any commit touching `lib/amortise` or `lib/rate`.
- **Conservation is asserted on every schedule produced in every test**, across a sweep of tenors, rates, and principals.
- New product type → conservation, IRR agreement, and a rule pack with citations.
- New rule pack → validator passes, plus a resolver test asserting it applies to the right periods and not adjacent ones.
- Flat and effective each get their own fixtures. Never test one through the other.
- Threshold solver → round-trip assertion, never a formula identity.
- Refusals asserted in both directions: out-of-range refuses, in-range computes.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions; rule validation gates it. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Verify with `pnpm preview` before pushing.

## Framing

The site states plainly that it is a personal project, not financial advice, that the floating rate after the fixed period is unknown and unpublished, that bank fees vary, that approval is not modelled, and that figures should be confirmed with the bank. These are first-class statements in the interface, not footer text. No OIKN or government branding anywhere.

## Current state

M0–M6 built and green. `pnpm test:run` covers 1614 assertions; `pnpm rules:validate`, `pnpm typecheck`, and `pnpm lint` are clean; the export serves under the production `basePath` via `pnpm preview`.

Routes: `hitung`, `ambang`, `subsidi`, `banding`, `biaya`, `parameter`, in `id` and `en`. The locale is a root-level segment so each page carries the right `lang`; `/` is a static redirect written by `scripts/finalise-export.mjs`, which also writes `.nojekyll`.

Pushed to `github.com/andifathulms/kpr-simulator`. CI (`verify`) is green on every push: rule validation, types, lint, tests, build, `check:offline`, and an export sanity check.

**Live at `https://andifathulms.github.io/kpr-simulator/`.** Deploys on every push to `main`, and on `workflow_dispatch`.

Pages was stuck for a while: `actions/deploy-pages` was accepted by the deployment API and then sat at `deployment_in_progress` until its own ten-minute timeout, with `repos/.../pages` reporting `status: null` throughout. It started working on 2026-08-07 with no change to the workflow, the export, or the Pages settings — the first successful deployment took fourteen seconds — which confirms the fault was never in this repository. If it regresses it will present the same way: the `deploy` job hangs rather than failing fast, and `verify` stays green.

`repos/.../pages` reports `status: null` even now that deployments succeed, so it is not a health check. Check `repos/.../deployments?environment=github-pages` for the deployment state, or just fetch the live URL.

### Known gaps, all deliberate

Seven values are declared in `data/gaps.json` and refused by name rather than filled with a plausible number: LTV ratios, FLPP tenor, minimum down payment, SBUM, per-kabupaten NPOPTKP, bank fees, and SBDK snapshots. `data/sbdk/snapshots.json` is empty by design — SBDK is published per bank, and §9 forbids naming one, so no reference anchor is offered. Recording an OJK segment-level aggregate would close it; see `UPDATING.md`.

`flpp.rate` is carried at 5% but rests on a ministry statement rather than an article traced to its clause, and its note says so on the parameter page.

`tests/banks/corpus.json` holds the classification vocabulary but no recordings yet. Bank calculators are recorded by hand; `pnpm banks:record` compares one and fails while any difference is unclassified.

### Corrections to earlier assumptions

The PRD's "a flat 5% is roughly a 9% effective rate" holds over 1–5 year tenors (9,11%–9,32%) but not over a KPR tenor: the computed figure is 7,95% at 20 years. Tests assert the computed shape, and the app states the computed number.
