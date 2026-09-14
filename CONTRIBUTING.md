# Contributing

Start with [AGENTS.md](AGENTS.md), [the capability map](docs/START.md) and the relevant API guide. Keep existing lessons and public APIs working. Add source attribution for scientific data and distinguish schematic motion from measured coordinates or computed dynamics.

## Local checks

Lesson generation and bundling use Python 3.10+ and its standard library. Development tests use Node.js **22.22.2+, 24.15.0+, or 26+** within the major versions supported by the locked jsdom dependency. Node 24.15.0+ is a suitable choice.

Run from the repository root:

```sh
npm ci
npm test
python3 -m unittest discover -s tests -v
python3 tools/install-codex-skill.py --help
python3 tools/build-molecular-views.py --check
```

`tools/build-*.py --check` compares a checked-in example with a fresh build. A generated project's `build/bundle.py --check` validates inputs without writing output; it does not compare an existing export. Rebuild affected examples when changing shared runtime or bundled notices.

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

The repository includes source, docs, templates and standalone examples. Local histories, private authoring artifacts, dependency installations and screenshots from development sessions are excluded by `.gitignore`.
