# PORTFOLIO_CONTEXT.md — KPR Simulator

Raw material for a client-facing case study. Factual, drawn from the repo as of 2026-08-07.

---

## 1. One-line summary

A free, ad-free Indonesian mortgage (KPR) calculator that shows what happens **after** the bank's fixed-rate period ends — the part every other calculator leaves out — and tells you the exact floating interest rate at which your instalment stops being affordable.

---

## 2. The problem

**Who it's for:** Indonesian households taking out a KPR — the largest financial commitment most of them will ever make. Both the subsidised (FLPP) path for lower-income buyers and the commercial path.

**The pain point, in four parts:**

1. **Every calculator assumes one interest rate for the whole 20 years.** Indonesian banks quote a fixed rate for 2–3 years and then the loan floats. A family budgeting around Rp3,2 juta a month discovers Rp4,8 juta in year four. This is the single largest financial uncertainty in the product, and no calculator represents it at all.
2. **"Flat" and "efektif" interest are routinely conflated.** They are not comparable, both are advertised, and most borrowers cannot tell which they are being quoted. Even news coverage of subsidised KPR describes its fixed 5% as "flat", which is a different claim.
3. **Calculators show a number, not a derivation.** No breakdown of how much of an early payment is pure interest, no total cost of ownership, no distinction between what is a legal parameter and what is a bank's discretionary choice.
4. **They are advertising.** Nearly every KPR calculator in Indonesian search results exists to generate leads for a bank or a property portal.

The project's answer is to reframe the question. Not *"can I afford Rp3,2 juta?"* but *"my loan breaks at 13,4%, and my bank's margin over the base rate is unpublished — what is it?"* That is a question a borrower can carry into a bank meeting and ask directly.

---

## 3. My role

**Sole author.** `git shortlog` shows 37 of 37 commits by one person. Everything below the framework line was written for this project:

- The **entire financial engine** — integer-rupiah arithmetic, annuity and flat amortisation, prepayment with early-settlement penalty, effective-rate derivation, an independent IRR solver, and the affordability-threshold bisection solver. No finance library was used; the maths *is* the project.
- The **cited rule-pack system** — Zod schema, period resolver, build-time validator that fails the build on an uncited parameter, plus the researched regulatory data itself (FLPP price and income ceilings, BPHTB/PPh rates) traced to Kepmen PUPR, Permen PKP, and tax law.
- The **whole UI** — a blueprint/cyanotype design system, the schedule drawn as a hand-built SVG elevation with a draughtsman's dimension line at the fixed-period boundary, the amortisation table, the expandable computation trace, and a shared component shell (`PageHeader`, `Panel`, `StatCard`, `Legend`, `Glossary`).
- **Bilingual copy** (Indonesian-first, English secondary) written from scratch, including every plain-language explanation of a banking term.
- **Test suite, CI, deployment, and the brand mark** — 1.614 assertions, a GitHub Actions pipeline that gates deploys on rule validation, an offline-purity checker, and the icon/favicon/OG asset set.

**Inherited / used as-is:** Next.js, React, Tailwind, Zod, Vitest, TypeScript. Nothing else — the dependency list is four production packages long.

---

## 4. Technical approach

**A pure engine with no idea what day it is.** The core is `(inputs, product, rulePacks) => Schedule`. No React, no DOM, no `new Date()` anywhere in `lib/`. The time period is always passed in as an explicit `{ year, month }` argument. This means a calculation is reproducible forever: the same inputs always produce a byte-identical result, which matters when someone is checking a figure against a bank statement six months later.

**Money is an integer, always.** Rupiah never touches a floating-point number. Rounding is an explicit, named operation that appears as its own labelled step in the derivation and states which convention it follows. This is exactly where calculators drift a few rupiah away from bank statements — being able to point at the step where it happened is treated as a feature, not a detail.

**Facts live in data, never in code.** Every regulated figure — subsidy rate, regional price ceiling, income ceiling, tax rate — lives in `data/rules/` with its legal basis, source URL, effective-from date, and verification date. The build *fails* if a parameter lacks a citation. 27 parameters currently ship this way.

**Refuse rather than guess.** If no rule pack covers the requested period, or a parameter is missing, the engine returns a structured refusal naming exactly what is missing. It never extrapolates to the nearest year, never clamps, never substitutes a plausible number. Seven values are declared as known gaps in `data/gaps.json` and refused by name on screen — LTV ratios, FLPP tenor, minimum down payment, SBUM, per-kabupaten NPOPTKP, bank fees, and base-rate snapshots.

**Two independent routes to the same number.** `lib/rate/irr.ts` and `lib/rate/effective.ts` deliberately share no code. If they shared a helper they would validate each other's bugs; instead each is a genuine check on the other, and the IRR solver is used in both the tests and the displayed figure.

**Amber means unknown.** The palette carries the honesty. One reserved colour marks the floating-rate band and every assumed value; a second reserved red marks the affordability limit and its breach. Nothing else in the app may use either. The result is that the interface separates *computed* from *assumed* without needing a paragraph of caveats.

**No server, no analytics, no network.** Static export to GitHub Pages. Inputs encode into the URL **hash**, never the query string, so income and loan figures physically cannot reach a server log. A build-time script (`check:offline`) asserts the exported site makes no external request at all.

---

## 5. Actual tech stack

Verified against `package.json`.

**Production dependencies — four:**
- Next.js 14.2.15 (App Router, `output: 'export'` — static only)
- React 18.3.1 / React DOM 18.3.1
- Zod 3.23.8 (rule-pack schema validation)

**Dev / tooling:**
- TypeScript 5.5.3, `strict: true`, no `any` in engine code
- Tailwind CSS 3.4.6 with semantic tokens (`blueprint`, `recess`, `print`, `annotation`, `unknown`, `threshold`) — no raw hex in components
- Vitest 2.0.5
- tsx 4.16.2 (for the validator/report/record scripts)
- ESLint 8.57 + `eslint-config-next`
- pnpm 9.15.9
- GitHub Actions (verify + deploy to Pages)

**Deliberately absent:** any finance, currency, date, or charting library. Amortisation and IRR are hand-written; `{ year, month }` integers replace a date library; `Intl.NumberFormat` covers display; the schedule elevation is hand-built SVG. Fonts (Barlow, Barlow Condensed, Roboto Mono) are self-hosted as woff2 rather than fetched from a CDN, so the site is genuinely offline after first load.

---

## 6. Notable features

- **The schedule elevation** — the full payment schedule drawn as stacked principal and interest across the whole term, with the end of the fixed period marked by a proper draughtsman's dimension line and the uncertainty band opening out beyond it. Shaded, not lined, because three crisp curves would misrepresent what is actually known.
- **The threshold solver (`ambang`)** — bisection over the amortisation engine to find the exact floating rate at which the instalment crosses a user-chosen share of income. It also handles the honest edge cases: *already breached at a zero rate* and *still affordable above the search ceiling* are distinct, named outcomes rather than a fudged number.
- **Flat versus efektif, side by side** — the same nominal rate computed both ways with the effective rate of the flat quote derived and displayed, resolving the most widespread misunderstanding in Indonesian consumer credit.
- **The subsidised (FLPP) path with a per-criterion eligibility check** — states *which* criterion fails rather than returning a yes/no verdict, with every ceiling cited to its regulation.
- **Total cost of ownership** — BPHTB, PPh, notary, provisi, administration, appraisal, insurance. Regulated items are cited; bank-discretionary items are user-editable and labelled *typical*, never authoritative.
- **Extra-payment simulator** — what a lump sum or raised monthly payment actually saves, in both modes (shorten the tenor or reduce the instalment), with the early-settlement penalty included as an input because it materially changes the answer.
- **A parameter browser** — every figure the app uses, with its legal basis, source link, and verification date, browsable by anyone who wants to check the work.
- **Full bilingual site (id/en)** with the locale as a root URL segment so each page carries the correct `lang` attribute, plus a print layout and hash-based sharing.

---

## 7. Challenges & tradeoffs

**Writing the maths instead of importing it.** No finance library exists that models a fixed-then-floating Indonesian KPR with integer rupiah, and using one would have hidden exactly the rounding behaviour the project wants to expose. The cost was several days of amortisation and IRR work; the payoff is that every rupiah is explainable.

**Building the safety net before the thing it catches.** The commit order is deliberate and visible in the log: `feat(rules): rule-pack schema, resolver, and build-time validator` lands *before* any rule data, and `feat(amortise): conservation assertion and trace types, before the loop` lands before the amortisation loop itself. Writing the conservation assertion first is what surfaces a rounding bug in the same hour you write it rather than three weeks later.

**Research kept killing features — and that was allowed to stand.** The original PRD confidently listed LTV ratios, a 1% minimum down payment, and a 20-year FLPP tenor ceiling as "fully documented and citable". When those were chased to an actual article of a regulation still in force, they could not be verified — Bank Indonesia had relaxed LTV to 100% and extended it repeatedly, and for a first home had released the maximum to bank discretion outright. Rather than ship a plausible number, seven such values became declared gaps that the app refuses by name and explains in both languages. **A calculator that shows you seven things it doesn't know is a harder sell than one that shows you a number, and that tradeoff was taken on purpose.**

**A documented figure in the PRD turned out to be wrong.** The brief asserted that "a flat 5% is roughly a 9% effective rate". That holds over 1–5 year tenors (9,11%–9,32%) but not over a mortgage term — the computed figure is 7,95% at 20 years. The tests assert the computed shape and the app states the computed number; the brief was corrected rather than the code bent to match it.

**A ten-hour deployment mystery that wasn't in the codebase.** GitHub's `actions/deploy-pages` accepted every deployment and then sat at `deployment_in_progress` until its own ten-minute timeout, with the Pages API reporting `status: null` throughout. The workflow was changed to manual dispatch to stop burning CI while the cause was isolated. It began working on 2026-08-07 with no change to the workflow, the export, or the settings — first successful deploy took fourteen seconds — confirming the fault was upstream. The diagnosis is written into `CLAUDE.md` so a future regression is recognised in minutes instead of hours, including the note that the Pages API `status` field is *not* a health check.

**The base-rate (SBDK) snapshot file ships empty, on principle.** SBDK is published per bank, and the project's own binding rule forbids naming or favouring a bank. Rather than break that rule for a convenient reference anchor, `data/sbdk/snapshots.json` is empty by design and `UPDATING.md` documents that an OJK segment-level aggregate would close the gap honestly.

**Design work provoked a restructure, not just a repaint.** Three late commits (`ux(hitung): three named steps instead of eleven stacked controls`, `ux(ambang): the threshold figure, and the question to ask about it`, `copy(home): explain the problem before showing the tool`) show the UI being reorganised around comprehension after the engine was already correct — including collapsing an eleven-control form into three named steps.

---

## 8. Status

- **Live:** `https://andifathulms.github.io/kpr-simulator/`
- **Repo:** `github.com/andifathulms/kpr-simulator` — **public**, open source
- **Maturity:** Production-quality and publicly usable, self-described as a personal project rather than a commercial service. Milestones M0–M6 are complete and green.
- **CI:** GitHub Actions `verify` job green on every push — rule validation, typecheck, lint, tests, build, offline check, and an export sanity check. Deploys to Pages on every push to `main`.
- **Honest caveats it states about itself, in the interface rather than a footer:** it is not financial advice, the floating rate is unknown and unpublished, bank fees vary, loan approval is not modelled, and figures should be confirmed with the bank.

---

## 9. Metrics

| | |
|---|---|
| Commits | 37, all by one author |
| Time span | 2026-08-06 → 2026-08-07 (two days, intensive) |
| Source lines | ~9.500 across `app/`, `lib/`, `components/`, `tests/`, `data/`, `scripts/` |
| Engine (`lib/`) | 26 modules, ~2.700 lines |
| UI (`app/` + `components/`) | 31 files, ~4.400 lines |
| Tests | **1.614 assertions across 14 files**, full run in ~2 seconds |
| Conservation sweep alone | 1.186 assertions across a matrix of tenors, rates, and principals |
| Cited parameters | 27, each with legal basis, source URL, effective-from, and verified-at |
| Declared gaps | 7, refused by name rather than filled |
| Pages | 6 routes (`hitung`, `ambang`, `subsidi`, `banding`, `biaya`, `parameter`) × 2 locales, plus home |
| Production dependencies | 4 |
| Shipped JS | ~964 KB raw across the export (target was ≤200 KB gzipped) |
| Runtime network requests | 0 — asserted by a build-time check |

---

## 10. Suggested screenshots

Four views, in the order a case study should tell the story.

**1. The schedule elevation with the fixed-period boundary and the uncertainty band** — the signature image, and the one that makes the whole thesis legible in a single glance: a solid computed region, a dimension line marking the end of the fixed period, and an amber band fanning out beyond it.
- `components/elevation/ScheduleElevation.tsx` (hand-built SVG)
- `components/dimension/DimensionLine.tsx`
- Rendered by `app/[locale]/hitung/HitungView.tsx`
- Live: `/id/hitung/`

**2. The threshold page — the single number the project exists to produce** — the floating rate at which the loan breaks, stated large, with the resulting instalment beside it and the question to ask the bank written underneath.
- `app/[locale]/ambang/AmbangView.tsx`
- Engine: `lib/rate/threshold.ts`
- Live: `/id/ambang/`

**3. The parameter browser showing citations** — proof of the "never fabricate a number" discipline: every figure with its legal basis, source link, and verification date, alongside the seven values the app openly refuses to supply.
- `app/[locale]/parameter/page.tsx`
- Data: `data/rules/flpp/*.json`, `data/rules/pajak/transaksi.json`, `data/gaps.json`
- Live: `/id/parameter/`

**4. An expanded amortisation row showing its computation trace** — the derivation behind a single month's payment, including the named rounding step and the convention it cites. This is the detail that distinguishes the project from a formula in a box.
- `components/table/AmortisationTable.tsx`
- `components/trace/TraceView.tsx`
- Engine: `lib/amortise/schedule.ts`

*Optional fifth, if a comparison shot is wanted:* the subsidised-versus-commercial view for one profile — `app/[locale]/banding/BandingView.tsx`, live at `/id/banding/`. It shows the contrast the whole product is built around: one path fully knowable and cited, the other irreducibly uncertain.
