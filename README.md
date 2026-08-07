<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/lockup-horizontal-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/brand/lockup-horizontal-light.png">
  <img src="public/brand/lockup-horizontal-light.png" alt="KPR Simulator" width="620">
</picture>

### A KPR calculator built around the question every other calculator hides:<br>**what happens when the fixed period ends.**

[**Buka aplikasinya →**](https://andifathulms.github.io/kpr-simulator/id/) &nbsp;·&nbsp; [Open in English](https://andifathulms.github.io/kpr-simulator/en/) &nbsp;·&nbsp; [How it decides what it knows](PRD.md)

[![build and verify](https://github.com/andifathulms/kpr-simulator/actions/workflows/deploy.yml/badge.svg)](https://github.com/andifathulms/kpr-simulator/actions/workflows/deploy.yml)
![tests](https://img.shields.io/badge/tests-1614%20passing-1B3A5C)
![rule packs](https://img.shields.io/badge/parameters-27%20cited-7FB2CC)
![no tracking](https://img.shields.io/badge/network%20requests-none-D9A441)

</div>

---

A commercial KPR is two loans stitched together — a known one and an unknown one. The bank locks a rate for two or three years; after that the loan floats, and **no calculator represents that at all.** A family budgeting around Rp3,2 juta can find Rp4,8 juta in year four.

This tool models it the way the loan actually works. The fixed rate and the fixed period are explicit inputs, and past the boundary it draws a **band** of outcomes rather than a single line. The headline figure is the **ambang** — the floating rate at which the instalment crosses a share of income you set yourself. That is a number worth carrying into a bank meeting.

Static site. No backend, no accounts, no runtime network requests. Inputs encode into the URL **hash**, so income and loan figures never reach a server log.

## What this is not

- **It never advises.** No recommendation, no ranking, no bank comparison, no affiliate link, no lead capture. It computes what you ask and shows the derivation.
- **It never invents a rate.** Every rate on screen is either something you typed or a dated, labelled reference snapshot. There is no default rate and no "typical rate" pre-filled as though it were data.
- **It states what it does not know.** The floating rate after the fixed period is bank-internal and unpublished. Bank fees vary. Approval is not modelled. Amber marks every one of those, consistently.

> This is a personal project and not financial advice. Confirm every figure with the bank.

## Pages

| | |
|---|---|
| **`hitung`** | The full schedule, fixed and floating shown apart, flat beside effective, the table, the derivation, and the extra-payment simulator. |
| **`ambang`** | The threshold: the floating rate at which the instalment crosses your stated share of income. |
| **`subsidi`** | The FLPP path — 5% fixed to the end of the term, with each eligibility criterion checked against a cited ceiling. |
| **`banding`** | Both paths side by side for one profile, and how certain each figure actually is. |
| **`biaya`** | BPHTB and taxes cited; bank and notary fees as your own figures. |
| **`parameter`** | Every parameter with its basis, source, and verification date — and every gap the tool refuses to fill. |

Indonesian at `/id`, English at `/en`.

## How it is built to be trusted

Someone may make a twenty-year decision on what this displays, so the guarantees are mechanical rather than aspirational.

- **Integer rupiah, everywhere.** No floating point touches money. Rounding is an explicit, named step that appears in the trace and cites the convention it followed.
- **Conservation on every schedule.** Principal payments sum to the principal exactly, the final balance is exactly zero, total paid equals principal plus interest — asserted across a sweep of tenors, rates, and principals, not on one fixture.
- **The effective rate is checked against an independent IRR solver** that shares no code with it. Two routes to one number; a shared helper would let them validate each other's bugs.
- **The threshold round-trips.** The rate it returns, fed back through the amortisation engine, produces a payment at exactly the stated limit — never a formula asserted against itself.
- **Every regulatory value is cited.** No rate, ceiling, or tax figure is written in application code. Each lives in a rule pack with its legal basis, source URL, effective period, and verification date, and **the build fails on an uncited parameter.**
- **It refuses rather than guesses.** No rule pack for the requested period returns a structured refusal naming exactly what is missing. Never extrapolated, never rounded to the nearest year.
- **Seven known gaps are declared by name** in `data/gaps.json` and shown on the parameter page, rather than filled with a plausible number.

## Development

```bash
pnpm install
pnpm dev

pnpm test:run          # before every commit
pnpm rules:validate    # gates the build and CI
pnpm check:offline     # asserts the export makes no external request
pnpm rules:report      # every parameter with its basis and verification date
pnpm build             # static export to ./out
pnpm preview           # serve ./out under the production basePath
```

Next.js 14 App Router with `output: 'export'`, TypeScript `strict`, Tailwind, Zod, Vitest. **No finance, currency, or date library** — the amortisation, the IRR solver, and the threshold solver are the project.

Deployed to GitHub Pages from `main`; rule validation, types, lint, tests, the build, and the offline check all gate it.

See [CLAUDE.md](CLAUDE.md) for the invariants, [PRD.md](PRD.md) for scope and the design direction, and [UPDATING.md](UPDATING.md) for how to refresh a rule pack when a regulation changes.

## Credits

Designed and built by [Andi Fathul Mukminin](https://andifathulms.github.io/en/) · [GitHub](https://github.com/andifathulms) · [LinkedIn](https://www.linkedin.com/in/andifathulmukminin/)

Brand assets live in `exports/` (untracked); the subset the site serves is in [`public/`](public/).
