# Visual Lesson Kit

For authoring or library maintenance, start with `docs/START.md`. It provides a small concept tree and a metadata-only selector. Read the selected API sections and open implementation files only when needed. Avoid loading all guides, recipes, archives or bundled HTML to discover capabilities.

The core authoring contract is `starter/AGENTS.md`; generated projects receive it as their own `AGENTS.md`. Custom SVG compositions are welcome. A missing scientific capability is a reason to implement or integrate the right thing, not to force a scene into an unrelated example.

For changes, preserve public behavior, scientific invariants and existing work. Test affected functionality and actual layout/motion when rendering changes. Navigation-only edits need discovery/link/portability checks, not a fresh rendering sweep. Keep `docs/navigation/catalog.json` paths and sections current when adding or renaming capabilities.
