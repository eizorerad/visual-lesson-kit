---
name: visual-lessons
description: "Create or edit animated scientific HTML/SVG lessons with Visual Lesson Kit, including source-backed molecular 3D views, reusable visual operations and standalone offline export."
---

# Visual lessons

Locate `scripts/kit.py` relative to this SKILL.md in the skill catalog. Substitute its path in the commands below. The helper's `root` command locates the full checkout; if `doctor` reports an incomplete installation, see `docs/codex-setup.md`.

For a new lesson, start with one blank scene:

```sh
python3 "/path/to/visual-lessons/scripts/kit.py" create /absolute/new-lesson
python3 "/path/to/visual-lessons/scripts/kit.py" route --read scene
```

Choose the assets and drawing components that answer the viewer's question. Compose them in `js/episodes/blank.js`. The generated project's `README.md` shows a first edit: draw two nodes, connect them, and change the edge weight on click.

When the user wants to adapt a ready-made lesson, pass `--template NAME` explicitly. For example, to explore the gallery:

```sh
python3 "/path/to/visual-lessons/scripts/kit.py" create /absolute/my-gallery --template gallery
```

## Select only the needed contract

Begin with the library's `docs/START.md` and short `starter/AGENTS.md`. In an existing generated project these are `guide/START.md` and `AGENTS.md`. Use the metadata selector through `kit.py route` with the teaching question; `--tree` lists branches, `--show ID` shows a card and `--read ID` reads selected guide sections. Open implementation only for adaptation, debugging or a missing contract. Custom SVG constructions and local helpers are welcome.

For a protein–RNA complex overview or atomic close-up, the `molecular-views` card describes reusable MV components for rendering, camera and manual controls. Its two-scene recipe in `js/recipes/molecular-views.js` is an optional starting point. The offline PDB importer does not infer a biological assembly or reconstruct absent atoms.

For RNA folding, pairing/stacking, A-minor contacts or hydrated magnesium, see `molecular-coordinates` for the reusable fragment renderer and locator. The `rna-folding` card also points to source coordinates, portable QA and a complete lesson. Preserve source/model/coordinate identity and actual connectivity. Rotation and emphasis explain a structure; they do not compute folding or molecular dynamics.

For chromatin accessibility, Tn5, paired-end reading or fragment-length distributions, see `atac-components` for independent views. Use `atac-seq` when adapting the full film. Source data, builders and portable QA travel with generated projects; synthetic records and authored docking are explicitly distinguished from PDB coordinates.

A new episode can use `scene` and `story`; a repair can go directly to `layout`, `clearance`, `motion`, `hit-audit` or the relevant domain. Cards distinguish ready components, compositions and missing external capabilities. Do not force a scientific question into an unrelated example.

## Create, verify and export

Create a fresh project outside the kit using `kit.py create`; pass verified source URL/label, language and appearance options appropriate to the task, and `--lean` when the project should carry only its template's pack. Existing projects own runtime copies: bring them to the current release with `kit.py upgrade /absolute/lesson` (report) and `--apply` (see the `upgrade` card) instead of regenerating over them; locally edited kit files are kept unless `--force` is given. If an older project lacks the navigator, consult the central kit and verify selected APIs exist in that project's runtime.

Ground claims in the supplied material and primary sources, and label invented data. Preserve the shared scientific object across states, compact shell, live theme, RU/EN text, accessible controls and cancellable motion contracts. Choose an explanatory sequence with explicit bridges between questions.

Before delivery, select `export-qa` and the component's checks. Inspect intended text regions and actual intermediate motion, run `python3 build/bundle.py` and then `python3 build/bundle.py --check` inside the lesson, and inspect the final `dist/lesson.html`. The bundle check validates build inputs; it does not prove that an old output matches them. Molecular browser QA needs Node, Playwright and a browser; see the selected guide and the kit's `docs/codex-setup.md`. When Codex supplies `load_workspace_dependencies`, use its reported runtime paths rather than guessing. Report actual coverage honestly, including any untested physical gestures.

## Optional narrated video

A video is made only on request. After the main lesson is delivered, you may ask once: «Сделать ещё видеоролик с озвучкой?» If the user agrees, ask which voice to use: a Google AI Studio key for the Gemini API (best intonation), a `gcloud auth login` for Cloud Text-to-Speech (no key, GCP billing) or offline macOS `say` (no key, no intonation). Select the `narrated-video` card, build the film in a fresh project with `--template narrated` (reusing the lesson's drawings as shots), and run `python3 tools/video.py`. Keep keys in environment variables only, never in files, logs or commits; ask before enabling APIs or creating keys in the user's cloud project.
