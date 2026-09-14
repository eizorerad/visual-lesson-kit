# Appearance: background, palette and fonts

Visual Lesson Kit 0.15.0 lets the reader choose appearance inside **More → Appearance**. The five bottom controls remain fixed. Background is exactly black or white. Three palettes use the same five semantic roles; two font options change text across the canvas, notes, questions, guide and controls.

| Setting | IDs | Meaning |
|---|---|---|
| Background | `black`, `white` | Pure black or white canvas/page, with matching readable text and diagram colors |
| Palette | `warm`, `ocean`, `botanical` | Five coordinated accent roles; each palette has separate shades for the two backgrounds |
| Font | `sans`, `serif` | Source Sans 3 or Source Serif 4; code remains Source Code Pro |

Defaults are black / warm / sans. The user can change them at any point without restarting the scene. CSS tokens update existing objects: current language, inputs, selections, progress and animation remain intact. Reader preferences are saved when browser storage is available. The generator accepts author defaults explicitly:

```sh
python3 /path/to/visual-lesson-kit/create.py /absolute/path/to/new-lesson \
  --title "New visual lesson" --background white --palette ocean --font serif
```

The same defaults live in `js/config.js`:

```js
window.LESSON = {
  title: 'New visual lesson',
  lang: 'ru',
  appearance: { background: 'black', palette: 'warm', font: 'sans' }
};
```

The appearance module loads immediately after configuration in the head, before styles and the first scene. Keep that order in exports; do not duplicate configuration at the end of the page.

## Programmatic configuration

`D.appearance.get()` returns the current `{background, palette, font}`. `D.appearance.set({font: 'serif'})` changes only named valid fields and saves the choice. Unknown values are ignored. `D.appearance.presets` is a deeply frozen inventory of backgrounds, palettes and fonts. Selection precedence is built-in defaults, then valid author defaults, then valid saved reader choices. The storage key is `visual-lesson-kit.appearance.v1`; storage belongs to the current browser origin. If storage is unavailable or malformed, in-memory selection still works.

Authors can add a palette under `LESSON.appearance.palettes` before the appearance module loads:

```js
appearance: {
  background: 'white', palette: 'seminar', font: 'serif',
  palettes: {
    seminar: {
      label: {ru: 'Семинар', en: 'Seminar'},
      black: ['#73BFEA', '#63CDB5', '#EAC878', '#EC92B3', '#B4A7EC'],
      white: ['#18658E', '#176B58', '#826000', '#A33261', '#644AA0']
    }
  }
}
```

Array order is primary, secondary, focus, contrast, auxiliary. Each background needs exactly five distinct six-digit hex colors, each with contrast of at least 4.5:1 on that background. Invalid presets are ignored, and built-in IDs cannot be replaced. Create a new ID to customize a palette; this avoids silently redefining a saved built-in choice. Palette changes replace the existing five roles rather than adding categories.

For another locally bundled family, add `LESSON.appearance.fonts.custom = {label: {ru: 'Мой шрифт', en: 'My font'}, family: 'Local Family', fallback: 'serif'}` and set `font: 'custom'`. The fallback can be `serif` or `sans-serif`. Register its actual local files in CSS, supply the corresponding license and provenance, and verify both glyphs and layout. Naming a family in configuration does not download or install it. Preset IDs use lowercase letters, numbers and hyphens, beginning with a letter.

## Color roles, not literal hues

Use `C` values in SVG and CSS custom properties in HTML. They are live references, not hex strings. Historical API names remain compatibility aliases; they do not describe a mandatory visible hue.

| Semantic role | Existing `C` keys |
|---|---|
| Primary | `blue`, `blueD`, `blueE`, `blueB`, `orange` |
| Secondary | `teal`, `green`, `greenE` |
| Focus | `gold`, `yellow`, `yellowD` |
| Contrast | `red`, `redE`, `maroon`, `pink` |
| Auxiliary | `purple`, `purpleB` |
| Main text | `white` |
| Secondary text | `grey`, `greyB` |
| Quiet geometry | `dim`, `greyD` |
| Canvas | `bg`, `greyE` |

A scientific identity keeps the same role throughout a transformation. Describe it by name, shape, label or position rather than “the blue one”: the reader can change the palette. Extra shades from quantitative interpolation encode values, not additional categories. Keep scales and numerical values unchanged when appearance changes.

Do not concatenate alpha suffixes onto `C` values or parse them as hexadecimal. Use separate `fill-opacity` / `stroke-opacity`, CSS opacity, or the supported color-mixing helpers. `P.mixHex` retains numeric interpolation for literal hex inputs and supports live role colors for theme-aware ramps. Do not cache a resolved RGB value across theme switches. Source images retain their actual scientific colors; never invert them with a global CSS filter.

Built-in main/secondary text and accent colors target at least 4.5:1 contrast on their associated canvas. Quiet separators and low-opacity illustrative fills are not text. Contrast alone does not distinguish categories; add labels, spatial structure or shape. White-background colors intentionally become darker rather than reusing pale colors designed for black.

## Typography and offline fonts

Source Sans 3 is the default; Source Serif 4 is the selectable serif family. Headings, captions, SVG labels, mathematical text, notes, questions and controls follow the active text stack. Code and explicitly monospaced labels retain Source Code Pro. Numeric text uses tabular figures. Formula fragments use the selected text family instead of a separate visual style.

DejaVu Sans is a local fallback for scientific glyphs absent from a primary family, including ᵢ, ⱼ, ℝ and ∈. Glyph availability does not establish support for arbitrary mathematical typesetting. Inspect both selected fonts after `document.fonts.ready`: switching family can change widths and line breaks. Leave room inside labels and frames instead of relying on one family's exact metrics.

All font files are unmodified upstream binaries, loaded locally and embedded by the standalone bundler. [The manifest](../licenses/font-manifest.json) records source URLs, sizes, hashes and licenses. Retain complete [Source Sans 3](../licenses/SourceSans3-OFL.md), [Source Serif 4](../licenses/SourceSerif4-OFL.md), [Source Code Pro](../licenses/SourceCodePro-OFL.md) and [DejaVu](../licenses/DejaVuSans-LICENSE.txt) notices, including their readable copies in exported CSS. Adobe families use OFL 1.1; DejaVu retains its actual Bitstream/Arev notices with DejaVu changes in the public domain. Font licenses do not change ownership of article content or runtime code.

## Checks

Run the Node appearance and theme tests for preference state, validation, contrast, derived colors, font bytes and licenses. Run `uv run --with fonttools --with brotli python tests/check_font_glyphs.py`; add `--lesson /absolute/path/to/lesson` for another lesson. The audit checks local declared font stacks without counting installed system fonts.

Then change background, palette and font in a real browser with an active selection and during an animation. Check matrices, ramps and reading panels; inspect both fonts and languages for collisions, including intermediate motion. Test portrait and short landscape menus. Finite geometry and synthetic gesture events do not prove readable browser layout or physical touchscreen behavior.
