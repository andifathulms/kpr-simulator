# Updating a rule pack

Written for a stranger — possibly you, in two years, when a figure on the site has gone stale and you no longer remember how any of this fits together.

## The one rule

**Read the regulation. Not a news article, not a summary, not this file.**

Every parameter in `data/rules/` has a `sourceUrl`. Open it. Find the article or the annex the `basis` field names. Read the number there. If you cannot find it, that parameter does not get updated — it gets moved to `data/gaps.json` and the app starts refusing to compute with it, by name. That is a correct outcome, not a failure.

## Finding what is stale

```bash
pnpm rules:report
```

Every parameter with its basis, source, effective period, and verification date. Anything past its `expectedReview` is flagged `⚠ LEWAT TINJAUAN`. A flagged parameter is not necessarily wrong — it means nobody has looked lately.

## Changing a value

A parameter's value never changes in place. You **close the old entry and open a new one**, because someone calculating for a past period must still get the figure that was in force then.

1. Set `effectiveTo` on the existing entry to the last month the old value applied — `"2026-12"`.
2. Add a new entry for the same `id` with `effectiveFrom` set to the very next month — `"2027-01"`.
3. Give the new entry its own `basis`, `sourceUrl`, and today's `verifiedAt`.
4. `pnpm rules:validate`.

The validator enforces that the periods are contiguous — no gap, no overlap, and at most one entry left open-ended. A gap fails the build on purpose: the resolver never falls back to a nearby period, so a gap in the data is a refusal waiting to surprise a user.

**Do not put a year in the identifier.** `flpp.harga.ceiling.jawa.sumatera` is right; `flpp.harga.ceiling.jawa.sumatera.2027` is rejected. The effective period disambiguates, never the key.

## Re-verifying a value that has not changed

Open the source, confirm the figure, and update `verifiedAt` to today. Nothing else. That is the whole point of having the field separate from `effectiveFrom`.

## Adding a parameter

1. Add it to the right pack under `data/rules/<pack>/`, with all of `basis`, `sourceUrl`, `effectiveFrom`, `effectiveTo`, and `verifiedAt`.
2. The identifier must begin with the pack name and contain no year or version.
3. `pnpm rules:validate`.
4. Add a resolver test asserting it applies to the right periods **and not to the adjacent ones**. Both directions — in range computes, out of range refuses.

## When you cannot verify something

Put it in `data/gaps.json` with a `detail` in both languages explaining, in plain words, what could not be confirmed and what the app does instead. This is not an apology. It is the most valuable thing on the parameter page: someone comparing this tool against one that shows a confident number for the same quantity deserves to know which of the two actually checked.

The current gaps are LTV ratios, FLPP tenor and minimum down payment, SBUM, per-kabupaten NPOPTKP, bank fees, and SBDK snapshots.

## Recording an SBDK snapshot

`data/sbdk/snapshots.json` is deliberately empty, and the reason is in its own `coverageNote`: SBDK is published per bank, and PRD §9 says a bank name appears in this product only because the user typed it.

If OJK's integrated portal (`data.ojk.go.id/SJKPublic`, under Perbankan → Bank Umum → Kelompok Informasi Acuan → Suku Bunga Dasar Kredit) publishes an **aggregate** for the KPR segment, that can be recorded: it is a segment-level figure and names no institution. Give it its `observedAt`, its `basis`, its `sourceUrl`, and the date you recorded it. It is rendered as a dated reference and never pre-filled into a rate field.

## Cross-checking against a bank's own calculator

```bash
pnpm banks:record
```

Development only; it never ships. Bank calculators are interactive pages, so you record one by hand, once, with the date, into `tests/banks/corpus.json`.

When the figures disagree, **classify the difference in writing** and never adjust the engine to match. The classifications already listed cover rounding of the instalment, rounding of monthly interest, day-count convention, and the final instalment. If the difference is `flat-vs-efektif`, it is not a rounding difference at all — it is the confusion this whole project exists to separate, and it must never be filed as one.

## Before you push

```bash
pnpm test:run
pnpm rules:validate
pnpm build
pnpm preview     # then check the pages under the production basePath
```
