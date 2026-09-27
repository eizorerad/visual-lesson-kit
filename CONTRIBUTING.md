# Contributing

Start with [AGENTS.md](AGENTS.md), [the capability map](docs/START.md) and the relevant API guide. Keep existing lessons and public APIs working. Add source attribution for scientific data and distinguish schematic motion from measured coordinates or computed dynamics.

## Local checks

Lesson generation and bundling use Python 3.9+ and its standard library. Development tests use Node.js **22.22.2+, 24.15.0+, or 26+** within the major versions supported by the locked jsdom dependency. Node 24.15.0+ is a suitable choice.

Run from the repository root:

```sh
npm ci
npm test
python3 -m unittest discover -s tests -v
python3 tools/install-codex-skill.py --help
python3 tools/build-molecular-views.py --check
python3 upgrade.py ../some-generated-lesson
```

`tests/film-template.cjs` compiles the film template without a DOM; `node qa/film/review.cjs` inside a generated project renders and measures its frames. `tests/test_maintenance.py` guards the single template registry, checksum manifests, lean projects and the shared RNA recipes; `tests/test_upgrade.py` exercises `upgrade.py` against a simulated later release.

`tools/build-*.py --check` compares a locally built example with a fresh build, and `python3 tools/build-examples.py --check` compares every fresh build with the digests recorded in `examples/checksums.json`. The HTML files themselves are build products: `python3 tools/build-examples.py` writes them into `examples/` (ignored by git) and refreshes the digests, and the `Publish examples` workflow deploys that folder to GitHub Pages. A generated project's `build/bundle.py --check` validates inputs without writing output; it does not compare an existing export. Rebuild affected examples when changing shared runtime or bundled notices.

## Browser checks

Open the actual exported `dist/lesson.html`. Check explanations and motion, both languages, fonts and backgrounds, manual controls, reading panels and representative narrow viewports. DOM tests cannot prove visual quality or physical touchscreen behavior.

For the molecular constructor's repeatable browser checks, use a separate optional QA environment and an installed Google Chrome:

```sh
mkdir -p ../vlk-browser-qa
npm install --prefix ../vlk-browser-qa playwright
python3 create.py ../molecular-qa --template molecular-views --palette ocean
python3 ../molecular-qa/build/bundle.py
NODE_PATH="$(cd ../vlk-browser-qa/node_modules && pwd)" \
  node ../molecular-qa/qa/molecular-views/verify.cjs
```

The verifier defaults to the `chrome` browser channel. `VLK_BROWSER_CHANNEL` selects another installed Playwright-compatible channel. Keep QA dependencies and reports outside source control. Font glyph coverage checks additionally require the optional Python `fontTools` package.

## Changes and examples

Explain the behavior changed, relevant scientific assumptions and checks performed. Add tests for meaningful invariants or regressions; avoid tests that merely repeat implementation text. Preserve font notices, coordinate provenance and stable object identity during transformations. Update the navigation catalog when adding an API or guide.

The repository includes source, docs, templates and the recorded digests of the standalone examples. Local histories, private authoring artifacts, dependency installations and screenshots from development sessions are excluded by `.gitignore`.

## ATAC templates

`python3 tools/build-atac.py` rebuilds both examples; `--check` compares their exported bytes with a fresh project. `python3 -m unittest discover -s tests -p test_atac_templates.py -v` checks portable generation, source extraction, dependency isolation and discovery. Shared runtime tests include text-node retention, font invalidation, actor disposal and deterministic remixing.

The generated `qa/atac/README.md` separates default-film science/visual regression from arbitrary-route smoke checks and component checks. Browser tests require Playwright and a local browser, are distinct from Node DOM unit tests, and leave diagnostic reports in the generated project. A shared `layout.js` or bundled-notices change requires rebuilding existing examples as well as the new ones.
