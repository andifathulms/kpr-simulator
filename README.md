# KPR Simulator

A KPR calculator built around the question every other calculator hides: **what happens when the fixed period ends.**

A commercial KPR is two loans stitched together — a known one and an unknown one. This tool models it that way: the fixed rate and fixed period are explicit inputs, and beyond the boundary it draws a *band* of outcomes rather than a single line. The headline figure is the **ambang** — the floating rate at which the payment crosses a stated share of income.

Static site. No backend, no accounts, no runtime network requests. Inputs encode into the URL **hash**, so income and loan figures never reach a server log.

## What this is not

- **It never advises.** No recommendation, no ranking, no bank comparison, no affiliate link, no lead capture. It computes what you ask and shows the derivation.
- **It never invents a rate.** Every rate on screen is either something you typed or a dated, labelled reference snapshot. There is no default rate and no "typical rate" pre-filled as though it were data.
- **It states what it does not know.** The floating rate after the fixed period is bank-internal and unpublished. Bank fees vary. Approval is not modelled. Amber marks every one of those, consistently.

This is a personal project and not financial advice. Confirm every figure with the bank.

## Pages

| | |
|---|---|
| `hitung` | The full schedule, fixed and floating shown apart, flat beside effective, the table, the derivation, and the extra-payment simulator. |
| `ambang` | The threshold: the floating rate at which the instalment crosses your stated share of income. |
| `subsidi` | The FLPP path — 5% fixed to the end of the term, with each eligibility criterion checked against a cited ceiling. |
| `banding` | Both paths side by side for one profile, and how certain each figure actually is. |
| `biaya` | BPHTB and taxes cited; bank and notary fees as your own figures. |
| `parameter` | Every parameter with its basis, source, and verification date — and every gap the tool refuses to fill. |

Indonesian at `/id`, English at `/en`.

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

See [CLAUDE.md](CLAUDE.md) for the invariants, [PRD.md](PRD.md) for scope, and [UPDATING.md](UPDATING.md) for how to refresh a rule pack when a regulation changes.
