# Portable ATAC-film verification

Run these scripts in a generated `--template atac-seq` project, after `python3 build/atac-film.py`. Each resolves project files relative to its own path; calling it by absolute path from another current directory works. Outputs always go to that project's `qa-output/atac/`. No script downloads source data or modifies the assembled lesson.

## Requirements

- Python 3 (standard library) for offline source extraction and the bundle.
- Node.js for independent numerical checks.
- `playwright` for browser checks; `pngjs` additionally for `text-paint.cjs`.
- An installed Chromium browser. The shared `qa/trna/browser.cjs` launcher uses Playwright's Chromium and falls back to installed Chrome only when that executable is missing. Set `PLAYWRIGHT_CHANNEL=chrome` to explicitly choose Chrome. There is no browser download inside a test.

If these packages and a browser are not already provided by your environment, a local setup is:

```sh
npm install --no-save playwright pngjs
npx playwright install chromium
```

## Default film: exact commands

```sh
python3 build/atac-film.py
python3 build/atac-film.py --check
node qa/atac/science.cjs
node qa/atac/narrative.cjs
node qa/atac/identity.cjs
node qa/atac/tn5-identity.cjs
node qa/atac/origin.cjs
node qa/atac/3d.cjs
node qa/atac/reading.cjs
node qa/atac/histones.cjs
node qa/atac/zoom.cjs
node qa/atac/local-story.cjs
node qa/atac/text-paint.cjs
node qa/atac/visual.cjs
node qa/atac/contact.cjs
```

`visual.cjs --quick` covers only RU/sans/black: 46 endpoints plus 135 intermediate samples. It is useful during editing and is **not** the complete 503-frame sweep. `contact.cjs` requires a successful visual report matching the current artifact hash, then makes 12 Russian endpoint contact sheets. Open and inspect the screenshots; numerical containment does not establish that an explanation is clear.

## What each check establishes

| Script | Scope | Main report / captures under `qa-output/atac/` |
|---|---|---|
| `science.cjs` | Independent interval/count/FRiP arithmetic; 46-cue source copy and default 240.6-second timeline; every extracted point against raw mmCIF, saved hashes and isolated reproducibility. Node.js + Python 3 standard library; no browser. | `science-report.json` with audited source hashes |
| `narrative.cjs` | DNA opening; 21 samples of example→150-record histogram handoff; final bins independently counted; adapter 3′ to target 5′ sides; reverse seeking. | `narrative/report.json`, `narrative/*.png` |
| `identity.cjs` | Actual source vertices through nucleosome camera handoffs; deliberate displacement controls; source immutability and retained nodes. | `identity/report.json`, `identity/*.png` |
| `tn5-identity.cjs` | Actual 1MUH trace correspondence in compact/detail views and both docking events; breaks, backseek and source identity. | `tn5-identity-report.json`, `tn5-identity/*.png` |
| `origin.cjs` | Independently projected source knots, eight histones, uncertainty dashes; 33 contour-preserving samples; protein-removal order and stable nodes. | `origin-report.json`, `origin/*.png` |
| `3d.cjs` | Structural bounds, context locators, immutable source geometry and origin integration. | `3d-report.json`, `3d/*.png` |
| `reading.cjs` | Rendered R1/R2 polarity, growth, opposite templates, locator and 3D→coordinate handoff. | `reading-report.json`, `reading/*.png` |
| `histones.cjs` | Source-derived chains/helices, source occupancy semantics, tail visibility and theme behavior. | `histone-report.json`, `histones/*.png` |
| `zoom.cjs` | Camera transforms and continuous nucleosome entry/return. | `zoom-report.json`, `zoom/*.png` |
| `local-story.cjs` | Nearby callout anchors/clearance, camera continuity, unchanged source arrays and actual actor-node identities; text/leader defects and an inserted node are negative controls. | `local-story-report.json`, `local-story/*.png` |
| `text-paint.cjs` | Actual rasterized text coverage at selected poses; deliberate dropped/shifted glyph controls. Requires `pngjs`. | `text-paint/report.json`, `text-paint/*.png` |
| `visual.cjs` | All 46 endpoints in RU/EN × sans/serif × black/white plus 135 intermediate samples: 503 frames; layout, text overlap, finite geometry, persistent nodes, offline requests and player behavior. | `visual-report.json`, `screenshots/*.png` |
| `contact.cjs` | Contact-sheet assembly from a matching successful visual run; no new correctness claim. | `contact-01.png` through `contact-12.png` |

Browser checks above explicitly compare every cue with the canonical build, including the 46-cue order, per-cue timing, bilingual copy, source links and numeric targets. The full duration remains 240.6 seconds. If a remix changes any of these, the preflight stops with an explanatory error rather than silently skipping absent scenes. Science QA audits the packaged **default** source route, not a custom configuration. Small alternate-artifact options in `identity.cjs`, `narrative.cjs`, `tn5-identity.cjs` and `text-paint.cjs` remain intended for comparing built artifacts; they never inject edited runtime modules.

## Remix and component reuse

```sh
node qa/atac/remix.cjs
node qa/film/review.cjs
```

`qa/film/review.cjs` reviews the route you actually configured: it renders every cue endpoint and transition midpoint, lists non-adjacent cue pairs that dissolve instead of moving continuously (`dissolve-edge`), and writes contact sheets to `qa-output/film-review/`.

This checks route/configuration mechanics. It does not certify newly authored captions or the scientific adequacy of a subset. Run source science checks when data are retained; inspect every selected cue and intermediate handoff in all relevant languages/themes; independently verify any changed counts, source geometry, chemistry, camera registration or measurement units. Use only the relevant component checks for an isolated actor, adapting their fixture explicitly rather than claiming the whole-film suite passed. Preserve the synthetic-data and structural-source boundaries in [assets/atac/SOURCES.md](../../assets/atac/SOURCES.md).

No check validates biological samples, a production peak caller, molecular dynamics, full sequencing chemistry, physical touch gestures or accessibility on every device. Test results belong to the artifact/source hashes reported by the run. Historical source-film checks are documented separately and must not be reported as fresh verification of an edited lesson.

## Independent components template

For `--template atac-components`, build with `python3 build/atac-film.py`, then run `node qa/atac/components.cjs`. This verifies four scenes / 16 states in all eight language/font/background modes, intermediate states in the main mode, immutable source data, retained actor geometry and repeatable reverse selection. It requires Playwright and a local browser; it does not load the full-film controller. Reports and captures go to `qa-output/atac/components/`.
