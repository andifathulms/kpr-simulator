# PRD — Ambang

**A KPR simulator built around the question every other calculator hides: what happens when the fixed period ends.**

> *ambang* (Indonesian) — a threshold. Both the doorstep of a house and the limit past which something breaks.
> Rename freely; the slug is used throughout as `ambang`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, public utility |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary |
| **Sibling** | Rinci. Same cited-rule-pack architecture, same refuse-rather-than-guess discipline. |

---

## 1. Problem

KPR is the largest financial commitment most Indonesian households ever make, and every calculator available to them is wrong in the same way.

**They assume one rate for the whole term.** You type a rate, you get a monthly figure, you plan your life around it. For commercial KPR that assumption is *always false*. Banks quote a fixed rate for two or three years and then the loan floats. A family budgeting around Rp3,2 juta discovers Rp4,8 juta in year four. **This is the single largest financial uncertainty in the product and no calculator represents it at all.**

**They conflate *bunga flat* with *bunga efektif*, or ignore the distinction.** Indonesian consumer credit advertises both, they are not comparable, and a "flat 5%" is roughly a 9% effective rate. Even reporting on subsidised KPR routinely describes its fixed 5% as "flat", which is a different claim. Most borrowers cannot tell which they are being quoted.

**They show a number, not a derivation.** No breakdown of how much of an early payment is pure interest, no total cost of ownership, no acknowledgement of what is a legal parameter versus a bank's discretionary choice.

**And they are advertising.** Nearly every KPR calculator in Indonesian search results exists to generate leads for a bank or a property portal.

## 2. What data actually exists

Worth stating plainly, because it determines the whole design.

**Fully documented and citable:**
- **FLPP (subsidised)** — 5% fixed for the entire term, inclusive of life, fire, and credit insurance; down payment from 1%; tenor up to 20 years; exempt from PPN. Regional price ceilings in Kepmen PUPR 689/KPTS/M/2023, ranging from Rp166 juta for Java outside Jabodetabek and most of Sumatra up to Rp240 juta for the Papua provinces. Income ceiling in Permen PKP 5/2025. Annual quota published.
- **LTV framework** — PBI 21/13/2019 amending PBI 20/8/2018, with ratio tables by house type and ownership order. With a crucial wrinkle: **BI released the maximum LTV for first-home purchases to bank discretion**, so "how much down payment do I need" has no single legal answer for a first home.
- **Taxes and transaction costs** — BPHTB, PPh final on the seller, PPN, notary tariffs. All regulated.
- **The arithmetic** — amortisation, effective rate, prepayment recalculation. Pure math, no data required.

**Not available, and never will be:**
- **The rate a given bank will offer a given borrower.** Promo rates shift constantly per bank and per campaign. No machine-readable feed exists.
- **The floating rate after the fixed period.** Banks publish a base lending rate (SBDK) by segment under OJK rules, which gives a legitimate floor, but the margin added on top is bank-internal and unpublished.
- **Bank fees** — provisi, administrasi, appraisal, insurance premiums. Vary by bank and campaign, not centrally published.

**The design consequence: never invent a rate.** Rates are user inputs. SBDK values ship as *dated snapshots* clearly labelled as reference points, never as live data. Everything the app asserts is either arithmetic or a cited regulation.

## 3. Product thesis

**Make the floating period the centrepiece rather than a footnote.**

A commercial KPR is two loans stitched together: a known one and an unknown one. So model it that way — fixed rate and fixed period as explicit inputs, because that is what a bank actually quotes, and then a *band* of outcomes rather than a single line.

The headline question becomes **"at what floating rate does this stop being affordable?"** — a number the borrower can carry into a bank meeting and ask about directly.

**And keep the subsidised path clean.** FLPP is fully determined and fully cited, so it computes exactly with no uncertainty at all. The contrast between the two paths — one knowable, one not — is itself the most useful thing the app can teach.

## 4. Non-goals

- **No advice, no recommendations, no rankings.** The app computes scenarios. It never says which bank, which product, or whether to buy. See §9 — this is binding.
- **No live rate feed, no bank comparison table, no affiliate links, no lead generation.** Ever.
- **No property listings.**
- **No credit scoring or approval prediction.** SLIK, BI Checking, and bank underwriting are opaque and modelling them would be fiction.
- **No syariah products in v1.** Murabahah and musyarakah mutanaqisah have genuinely different mathematics and deserve proper treatment rather than a checkbox.
- **No investment analysis** — rent versus buy, property appreciation, opportunity cost. Reasonable adjacent questions, all requiring assumptions the app has no basis for.
- **No accounts, no server.** Inputs share by URL hash, never a query string.

## 5. Features

### 5.1 The schedule — signature view
The payment schedule as stacked principal and interest over the full term. Two things become immediately visible that most borrowers have never seen: how overwhelmingly early payments are interest, and — for commercial KPR — **the step at the end of the fixed period**, drawn as a dimension line with the scenario band opening out beyond it.

The band is shaded, not lined. It represents uncertainty, and drawing it as three crisp curves would misrepresent what is actually known.

### 5.2 The floating-rate scenario engine
Fixed rate and fixed period as inputs. Beyond it, three scenarios — optimistic, base, stress — each driven by a base rate plus a margin the user sets. Dated SBDK snapshots ship as reference anchors, labelled with their source and date, never presented as current.

### 5.3 The threshold — the number that matters
**At what floating rate does the payment exceed a stated share of income?** Solved directly and stated as a single figure, with the resulting payment shown beside it.

This reframes the whole exercise. Not "can I afford Rp3,2 juta" but "my loan breaks at 13,4% and my bank's margin over SBDK is unpublished — what is it?" That is a question worth walking into a bank with.

### 5.4 Flat versus efektif
The same nominal rate computed both ways, side by side, with the effective rate of the flat quote derived and displayed. One screen that resolves the most widespread misunderstanding in Indonesian consumer credit.

### 5.5 The subsidised path
FLPP with every parameter cited: rate, tenor, minimum down payment, PPN exemption, regional price ceiling, income ceiling. An eligibility check that states which criterion fails rather than returning a verdict. Quota noted as a real constraint, since eligibility does not guarantee availability.

### 5.6 Total cost of ownership
Beyond the loan: BPHTB, notary and AJB costs, provisi, administration, appraisal, and insurance premiums. Regulated items are cited; bank-discretionary items are user-editable with typical ranges **clearly labelled as typical, not authoritative**.

### 5.7 Extra payment
What a lump sum or increased monthly payment actually saves, in both modes — shorten the tenor or reduce the payment — with the early-settlement penalty most banks charge included as an input, because it materially changes the answer.

### 5.8 The amortisation table
Full, exportable, to the rupiah. Every row expandable to its derivation. The artefact someone takes to a bank meeting.

## 6. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
inputs + product + rule packs
  → resolver        → applicable rules for the period
  → amortise (pure) → Schedule + ComputationTrace
  → scenarios       → band across floating-rate paths
  → threshold       → solve for the affordability limit
```

**The engine is pure.** `(inputs, product, rulePacks) => Schedule` — no clock, no randomness, no DOM. The period is always an explicit argument, never "today".

**Integer rupiah. No floats in money.** Rounding is an explicit, named, cited step in the trace. This is where calculators diverge from bank statements by a few rupiah, and being able to show exactly where is a feature.

**Rule packs, cited, validated at build time.** Each parameter carries value, effective period, legal basis, source URL, and verification date. The build fails on an uncited parameter. Identical to Rinci.

**Refuse rather than guess.** No rule pack covering the requested period, or a missing parameter, returns a structured refusal naming the gap. Never extrapolate, never fall back to the nearest year.

**Rates are never fabricated.** No default rate, no "typical rate" pre-filled as though it were data. SBDK snapshots are dated reference values, visibly labelled.

## 7. Testing

**Conservation — the backbone.** The sum of all principal payments equals the loan principal exactly, to the rupiah. The final balance is exactly zero. Total paid equals principal plus total interest. Asserted on every schedule in every test, at every tenor and rate.

**Independent effective-rate check.** The effective rate derived from a flat quote must match an IRR solved independently from the cash flows. Two routes to one number, sharing no code.

**Bank calculator cross-check.** A development script records outputs from published bank calculators for a fixture set. Differences are investigated and **classified** — usually rounding convention — and the classification is written down. Never auto-aligned.

**Threshold solver.** The rate returned must, when fed back through the amortisation engine, produce a payment at exactly the stated affordability limit. Round-trip, not a formula asserted against itself.

**Rule-pack integrity at build time.** Citations present, effective periods contiguous without gaps or overlaps, source URLs well-formed.

**Determinism.** Same inputs and period produce a byte-identical trace.

**Refusal coverage.** Out-of-range periods and missing parameters refuse with a named gap, asserted in both directions.

## 8. Design direction

The material world is the **blueprint** — the cyanotype print, white line work on Prussian blue, dimension lines, and annotations in a draughtsman's hand. A mortgage schedule is a structure built over time, and drawing it as an elevation is more honest than drawing it as a dashboard.

**Palette.** Blueprint blue `#1B3A5C` as ground, with deeper `#142B44` for recessed panels. Print white `#E8EDF2` for line work, structure, and text. Annotation cyan `#7FB2CC` for dimension lines, labels, and derivations. **Uncertainty amber `#D9A441` reserved for the floating-rate band and anything the app does not know** — so amber consistently means "this is not determined". **Threshold red `#C9584A` reserved for the affordability limit and its breach**, and nothing else.

That amber-means-unknown rule does the same work Selapan's rubric red does: it separates what is computed from what is assumed, and it does it without a paragraph of caveats.

**Type.** **Barlow Condensed** for headings and labels, uppercase with wide tracking, in the register of drawing-sheet lettering. **Barlow** for prose and controls. **Roboto Mono** with tabular figures for every rupiah amount, rate, and period — money in columns must align, without exception.

**Structure.** The schedule occupies the full width as an elevation, with the fixed-period boundary drawn as a proper dimension line — extension lines, arrowheads, the measurement labelled. Below it, the amortisation table on a ruled grid. Right-aligned rupiah, always.

**Motion.** One orchestrated moment: as the floating-rate margin changes, the band beyond the fixed period breathes wider or narrower, and the threshold marker slides along with its figure updating. Nothing else moves.

**Copy.** Indonesian first, written for someone who has never taken a loan. Bank vocabulary used as banks use it — *bunga tetap*, *bunga mengambang*, *provisi*, *penalti pelunasan dipercepat* — glossed on first use. Uncertainty stated in the same plain voice as everything else: *"Bunga setelah masa tetap tidak dipublikasikan bank. Angka di bawah ini asumsi Anda, bukan data."*

## 9. Framing — binding

This tool touches a decision that can define a household's next twenty years. Three rules follow, and they are as binding as the technical invariants.

**It never advises.** No "you should", no "this is affordable", no recommendation to buy, to wait, or to choose a product. It computes what the user asks and shows the derivation.

**It never ranks or names banks favourably.** No comparison table, no affiliate link, no lead capture, no partner logos. If a bank name appears at all it is because the user typed it.

**It states plainly what it does not know.** The floating rate is unknown. Bank fees vary. Approval is not modelled. These appear as first-class statements in the interface, not as footer disclaimers.

The site says it is a personal project, not financial advice, and that the user should confirm figures with the bank.

## 10. Milestones

| | | |
|---|---|---|
| **M0** | Scaffold | Static export deploying, rule-pack schema and build-time validator. Validator before content. |
| **M1** | Engine | Integer money, annuity and flat amortisation, effective-rate derivation, trace. Conservation and IRR cross-check green. Console only. |
| **M2** | Subsidised path | FLPP rule packs, regional ceilings, eligibility check, all cited. |
| **M3** | UI | Schedule elevation, amortisation table, flat-versus-efektif view. **Ship publicly here.** |
| **M4** | The floating period | Fixed-plus-floating model, scenario band, threshold solver, SBDK snapshots. **The reason the project exists.** |
| **M5** | Total cost | Taxes, notary, bank fees, extra-payment simulator with penalty. |
| **M6** | Comparison + polish | Subsidised versus commercial for one profile, sharing, print layout, a11y. |

M3 is a complete, honest, useful tool for subsidised KPR. M4 is what nothing else does.

## 11. Success criteria

- Principal payments sum to the principal exactly; final balance exactly zero; across every tenor and rate in the corpus.
- Effective rate agrees with an independently solved IRR.
- Every rule-pack parameter carries a citation and verification date, enforced by the build.
- No rate is ever presented as data. Every rate on screen is either user input or a dated, labelled reference.
- The threshold rate round-trips through the engine to the stated affordability limit.
- Differences from published bank calculators are classified and documented, not hidden.
- A user can reach their affordability threshold figure within three interactions.
- Fully offline after first load. JS ≤ 200 KB gzipped.

## 12. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Rule-pack validation gates the deploy. Inputs encode into the URL **hash**, never the query string — income and loan figures must never reach a server log. Verify under the production `basePath` with `pnpm preview` before pushing.

## 13. Risks

| Risk | Mitigation |
|---|---|
| **Someone makes a twenty-year decision on a wrong number.** | Conservation asserted everywhere, independent IRR check, bank-calculator cross-check, cited rules, refusal rather than extrapolation. §9 keeps the tool descriptive rather than advisory. |
| **Presenting an assumed rate as though it were data.** | No default rate. SBDK snapshots dated and labelled. Amber means unknown, consistently, everywhere. |
| **BPHTB's NPOPTKP varies by kabupaten** — hundreds of values, revised locally. | Ship provincial defaults with manual override, and state the coverage gap on the page. Same honest handling as Rinci's UMK. |
| **Rule staleness.** | Per-parameter verification dates, expected-review months for annually-adjusted figures, visible warnings when overdue, and an `UPDATING.md` written for a stranger. |
| **Reads as financial advice, or as a lead-generation site.** | §9 is binding. No bank ranking, no affiliate links, no lead capture. Descriptive language throughout. |
| **Flat versus efektif confusion propagates into the app itself.** | Both computed explicitly, both labelled, never conflated in a rule pack. Fixtures for each. |
| **Scope creep into rent-versus-buy or investment analysis.** | §4 is binding. Those need assumptions the app has no basis for. |
