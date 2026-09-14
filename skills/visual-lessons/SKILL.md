---
name: visual-lessons
description: "Create or edit animated scientific HTML/SVG lessons with Visual Lesson Kit, including source-backed molecular 3D views, reusable visual operations and standalone offline export."
---

# Visual lessons

This skill belongs to a **complete Visual Lesson Kit checkout**. Locate `scripts/kit.py` relative to this SKILL.md's actual path from the skill catalog; do not assume the current working directory or a fixed username. Run its `root` command to obtain the library root and `doctor` if the installation is uncertain. The helper resolves symlinks and can dispatch the public tools without copying their implementation:

```sh
python3 "/path/to/visual-lessons/scripts/kit.py" root
python3 "/path/to/visual-lessons/scripts/kit.py" route "protein RNA complex"
python3 "/path/to/visual-lessons/scripts/kit.py" route --read molecular-views
python3 "/path/to/visual-lessons/scripts/kit.py" create /absolute/new-lesson --template molecular-views --title "Telomerase" --lang en
```

Replace the helper path with the discovered location. If the checkout is missing, use `docs/codex-setup.md` in the repository to restore the full installation; the skill folder alone does not contain the library.

## Select only the needed contract

Begin with the library's `docs/START.md` and short `starter/AGENTS.md`. In an existing generated project these are `guide/START.md` and `AGENTS.md`. Use the metadata selector through `kit.py route` with the teaching question; `--tree` lists branches, `--show ID` shows a card and `--read ID` reads selected guide sections. Open implementation only for adaptation, debugging or a missing contract. Custom SVG constructions and local helpers are welcome.

For a protein–RNA complex, telomerase-style 3D overview or atomic close-up with a locator, select **`molecular-views`**. Start with `--template molecular-views` and its two `MolecularScenes.overview(...)` / `.detail(...)` calls in `js/recipes/molecular-views.js`. Change verified source data, component roles and explanatory states. Camera, depth sorting, persistent geometry and manual controls are supplied. Use the independent MV bricks for a different composition; read the lower-level MC contract only when needed. The template includes a bounded offline PDB importer; it does not infer a biological assembly or reconstruct absent atoms.

For RNA folding, pairing/stacking, A-minor contacts or hydrated magnesium, select **`rna-folding`** first. It provides a complete editable template, source coordinates and portable QA. Select `molecular-coordinates` to reuse the fragment renderer and locator elsewhere. Preserve source/model/coordinate identity and actual connectivity. Rotation and emphasis explain a structure; they do not compute folding or molecular dynamics.

A new episode can use `scene` and `story`; a repair can go directly to `layout`, `clearance`, `motion`, `hit-audit` or the relevant domain. Cards distinguish ready components, compositions and missing external capabilities. Do not force a scientific question into an unrelated example.

## Create, verify and export

Create a fresh project outside the kit using `kit.py create`; pass verified source URL/label, language and appearance options appropriate to the task. Existing projects own runtime copies: use the `upgrade` card instead of regenerating over them. If an older project lacks the navigator, consult the central kit and verify selected APIs exist in that project's runtime.

Ground claims in the supplied material and primary sources, and label invented data. Preserve the shared scientific object across states, compact shell, live theme, RU/EN text, accessible controls and cancellable motion contracts. Choose an explanatory sequence with explicit bridges between questions.

Before delivery, select `export-qa` and the component's checks. Inspect intended text regions and actual intermediate motion, run `python3 build/bundle.py` and then `python3 build/bundle.py --check` inside the lesson, and inspect the final `dist/lesson.html`. The bundle check validates build inputs; it does not prove that an old output matches them. Molecular browser QA needs Node, Playwright and a browser; see the selected guide and the kit's `docs/codex-setup.md`. When Codex supplies `load_workspace_dependencies`, use its reported runtime paths rather than guessing. Report actual coverage honestly, including any untested physical gestures.
