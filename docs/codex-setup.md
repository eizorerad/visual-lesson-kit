# Use Visual Lesson Kit with Codex

Visual Lesson Kit is a local library with a Codex skill. The skill tells the agent how to find the right components, create an editable lesson, and verify its standalone HTML. Keep the complete repository on the computer where Codex runs. The finished lesson opens offline in a browser.

The kit itself requires no MCP server, API key or additional account. Codex uses its normal sign-in. Internet access is useful for checking scientific sources and downloading a new structure; viewing and rebuilding the supplied examples is local.

## Install on macOS or Linux

You need Git and Python 3.10 or newer. Node.js is only needed for automated JavaScript/browser tests. These commands run in Terminal or a Codex terminal.

1. Clone the entire [Visual Lesson Kit repository](https://github.com/eizorerad/visual-lesson-kit) into a location you will keep:

   ```sh
   git clone https://github.com/eizorerad/visual-lesson-kit.git
   cd visual-lesson-kit
   ```

   Alternatively, download and unpack the complete repository ZIP, then open a terminal in the extracted folder. A clone is easier to update.

2. Link its skill into your personal Codex skills and verify the installation:

   ```sh
   python3 tools/install-codex-skill.py
   python3 tools/install-codex-skill.py --check
   python3 "$HOME/.agents/skills/visual-lessons/scripts/kit.py" doctor
   ```

   The installer creates `~/.agents/skills/visual-lessons` as a symlink to `skills/visual-lessons` in this checkout. Running it again for the same checkout is safe. It does not replace an existing skill directory or edit Codex settings.

3. Open a Codex task in the parent directory where you want the new lesson. Invoke **`$visual-lessons`** in your request. Codex detects skill changes automatically; restart Codex if it does not appear. A project must allow Codex to read the library checkout and write the new lesson folder under its normal file permissions.

These locations and symlink support follow the [official Codex skill documentation](https://learn.chatgpt.com/docs/build-skills). The skill is also eligible for automatic selection when a request matches its description.

Do **not** install only `skills/visual-lessons` with a generic skill installer: it references the rest of this repository. The provided installer preserves that relationship. Paths containing spaces work; always quote paths in shell commands.

## A first request

Paste this into Codex; change the topic and destination as needed:

```text
Use $visual-lessons to create an explanatory HTML lesson about telomerase
in a new folder called telomerase-lesson beside the kit. Check primary
sources. Start with the molecular-views template: show the source-backed
TERT–RNA–DNA complex, then its RNA/DNA close-up with a persistent locator.
Use the existing scene presets and MV bricks, explain what each change
of viewpoint reveals, and add clear transitions between the ideas.
Keep RU/EN text, live themes and manual rotation. Label the limits of
the structural model. Build the offline HTML and inspect both text and
intermediate motion before giving me the result.
```

The molecular template has a complete two-scene recipe, PDB 7BG9, prepared coordinates and a configurable importer. It supplies depth sorting, camera fitting, persistent objects, annotations and an interruptible rotation control. The agent can compose a new lesson by changing the source, roles and states in `js/recipes/molecular-views.js`; a camera change is not a folding simulation. See [the assembly guide](molecular-views.md) and [the individual bricks](molecular-views-api.md). Some domain guides are in Russian; generated lessons support both Russian and English.

## Confirm the complete workflow yourself

From the repository root, create a fresh sibling lesson and build it:

```sh
python3 create.py ../telomerase-demo --template molecular-views --title "Telomerase: complex and template" --lang en --palette ocean
python3 ../telomerase-demo/build/bundle.py
python3 ../telomerase-demo/build/bundle.py --check
```

Open `../telomerase-demo/dist/lesson.html` in a modern browser. The generated folder owns its own runtime and guides, so it remains usable when this checkout changes. The destination must be new or empty and outside the kit. `bundle.py --check` validates the inputs without writing; always build first, because this check does not compare an existing HTML file against its inputs.

For the molecular template's browser verification, install Node.js 24.15.0+ (also suitable for the library’s locked development dependencies), then run from the generated lesson:

```sh
cd ../telomerase-demo
npm install --no-save playwright
npx playwright install chromium
VLK_BROWSER_CHANNEL=chromium node qa/molecular-views/verify.cjs
```

This downloads a browser into Playwright's cache. On Linux, missing system libraries may require `npx playwright install --with-deps chromium`. If Google Chrome is already installed, `node qa/molecular-views/verify.cjs` uses it by default. Browser installation and channels are described in [Playwright's browser guide](https://playwright.dev/docs/browsers).

The check writes `verification/molecular-views/report.json` and screenshots. It covers every state in RU/EN, both fonts and backgrounds, all three palettes, intermediate animation frames, preserved geometry, and manual interruption. Inspect the screenshots as well: text bounds alone do not prove that labels clear every line or atom. The report does not establish physical touch-gesture behavior or the scientific validity of a newly chosen structure.

In Codex environments that expose `load_workspace_dependencies`, the agent can use its returned Node and Playwright installation instead of installing another copy. Set `NODE_PATH` to the returned `node_modules` directory when needed; do not copy another machine's runtime path into the lesson. Other templates have their own component checks reached through `guide/START.md`.

## Scope, updates and troubleshooting

For a project-scoped installation, pass the **full destination skill path**:

```sh
python3 tools/install-codex-skill.py --target /absolute/project/.agents/skills/visual-lessons
```

Codex discovers `.agents/skills` along the current project's ancestor directories. Use a personal installation if the same kit should be available across unrelated projects. Install within WSL when Codex runs there; paths and symlinks must be readable inside that environment. Native Windows symlink permissions vary, so this symlink workflow targets macOS/Linux and was verified on macOS; `--target` can select another supported discovery directory. A remote or cloud Codex environment needs its own complete checkout and skill installation.

If the installer finds an existing directory, it leaves it unchanged. Inspect it and move the previous skill to a backup **outside all discovered skill directories**, then rerun. Also check for a previous `visual-lessons` skill under legacy locations such as `~/.codex/skills` or another project. Same-name skills are not merged; keeping two versions can make selection ambiguous.

To update a clean Git checkout, run `git pull --ff-only` in the kit and then `python3 tools/install-codex-skill.py --check`. This updates the installed skill through its link. Existing generated lessons keep their own runtime; follow [the upgrade guide](upgrading.md) for intentional changes to them.

If you move the checkout, the old absolute symlink may stop working. From the new checkout location, inspect the destination, then explicitly replace that symlink:

```sh
python3 tools/install-codex-skill.py --replace-symlink
python3 tools/install-codex-skill.py --check
```

`--replace-symlink` only replaces a link, never a directory or file. If you used a custom target, include the same `--target` in both commands. To uninstall a default installation, first confirm `~/.agents/skills/visual-lessons` is the symlink created above, then remove that link; the repository and generated lessons remain intact.

## Коротко по-русски

Скачайте **весь [репозиторий](https://github.com/eizorerad/visual-lesson-kit)**, откройте терминал в его папке и выполните `python3 tools/install-codex-skill.py`, затем `python3 tools/install-codex-skill.py --check`. Установщик создаёт ссылку в `~/.agents/skills/visual-lessons`; существующую папку он не перезаписывает. Если навык не появился, перезапустите Codex.

В новой задаче напишите: «Используй $visual-lessons. Создай урок о теломеразе в новой соседней папке: общий трёхмерный комплекс и атомный крупный план с локатором через шаблон molecular-views. Проверь первичные источники, сделай связные объяснения и проверь итоговый HTML». Подключение не требует отдельного MCP или API-ключа. Готовый `dist/lesson.html` работает офлайн; для автоматической проверки браузером нужны Node, Playwright и браузер, как в командах выше.
