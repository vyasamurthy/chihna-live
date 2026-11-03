# chihna.live

The static site for **Chihna** — the proof layer for what AI systems withstood.

Four pages, no backend, no external JavaScript:

| Page | Purpose |
|---|---|
| `index.html` | The thesis and the honest-statistics rule, with the live portfolio stated honestly |
| `verifier.html` | The engine-shipped receipt verifier, running locally in the browser |
| `artifacts.html` | Every published campaign with its counts and spend, each linking its receipt |
| `limits.html` | What this evidence is and is not |

## Provenance

Content is derived from the AVH engine repository (`vyasamurthy/avh`, master).
Portfolio figures are read from the published passport bundles, not hand-entered:

- 16 campaigns, 608 cases
- 392 passed / 6 failed / 210 inconclusive / 0 not sent (sums to 608)
- $1.3741 total spend against the $150 platform cap
- 387 CI-gated tests

`assets/chihna-verifier.js` is an unmodified copy of
`standards/verifier/chihna-verifier.js` from the engine. The receipt rules are
not reimplemented here.

`receipts/` holds the published `validation_receipt.json` files verbatim.
They contain digests and counts only — no prompts, no responses, no credentials.

## Design

Venture Vertex design system (`docs/SITE-DESIGN-SYSTEM.md`): Newsreader
headlines with one gold emphasis phrase, IBM Plex Sans body, IBM Plex Mono
metadata, hairline rules, sharp corners, gold-dash lists, navy panels with a
3px gold top border.

## Hosting

GitHub Pages from the default branch root. `CNAME` points at `chihna.live`.
