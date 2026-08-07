# public/

Served verbatim at the site root, under the production `basePath`. Everything
here is copied from the brand kit in `exports/`, which is untracked — this
directory is the subset the site actually serves, so a clone builds without it.

| File | Where it is used |
|---|---|
| `favicon.svg` | Browser tab. Vector, so it stays sharp at any size. |
| `icon-32.png` | Tab fallback for browsers that will not take an SVG icon. |
| `icon-180.png` | iOS home screen (`apple-touch-icon`). |
| `icon-192.png`, `icon-512.png` | Android and the web app manifest. |
| `icon-maskable-512.png` | Android adaptive icon — safe-zone padded, so the launcher may crop it to any shape without clipping the mark. |
| `og.png` | Link preview when the site is shared. |
| `brand/` | Lockups and the large icon, for the README. Not referenced by the app. |

The mark itself is drawn in code, not loaded from here — see
`components/ui/Mark.tsx`. Inlining it keeps the header free of a network
request and lets it take the app's own colour tokens.

**Palette (from the kit):** ink `#16293F`, paper `#EEF3F8`, fixed-period blue
`#5FA0D0`, floating-period amber `#D9A23B`. Blue always means the fixed-rate
period and amber always the floating period after it — never swapped, and
never reused for anything else. That is the same rule the app applies to its
own `unknown` amber.
