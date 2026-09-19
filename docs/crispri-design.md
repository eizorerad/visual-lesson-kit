# CRISPRi design vocabulary

`js/crispri-design.js` exports `window.PD`. Load it after `lib/dom.js`,
`lib/svg.js`, `lesson.js` and `film.js`; load `layout.js` to include the short
cassette labels in layout audits. Add the script explicitly to the lesson entry
point. This optional module does not change the default starter.

## Reusable eleven-scene lesson

Create a complete editable lesson from the kit root:

```sh
python3 create.py /path/to/new-crispri-lesson --template crispri \
  --title "CRISPRi: from molecule to experiment" --lang en
python3 /path/to/new-crispri-lesson/build/bundle.py
python3 /path/to/new-crispri-lesson/build/bundle.py --check
```

`--lang ru` selects Russian initially; both languages are included. The template
retains the compact lesson shell, notes, questions, source links and appearance
controls. Its SVG diagrams use the kit's persistent molecular actors and the
`PD` model below. Authored molecular motion is schematic. The cell observations
in the evidence scene are explicitly invented, deterministic teaching examples.

| Recipe file in `js/recipes/crispri/` | Viewer question |
| --- | --- |
| `01-objects-crispri.js` | What are the distinct molecular objects in CRISPRi? |
| `02-protein-origin.js` | How does an effector gene enter the nucleus and then produce dCas9–KRAB? |
| `02-delivery.js` | How does a lentiviral genome relate to an integrated DNA construct? |
| `03-guide-factory.js` | How do guide-encoding DNA units produce guide RNAs? |
| `04-repression.js` | How does the guide–dCas9–KRAB complex repress transcription? |
| `05-methods.js` | How do CRISPRi and knockout differ? |
| `06-libraries.js` | What distinguishes single-guide, dual-guide and alternative guide pairs? |
| `07-moi.js` | How does MOI change zero, one and multiple construct occupancy? |
| `08-evidence.js` | What does another guide pair add beyond more cells? |
| `09-studies.js` | Which design conclusions are supported for Replogle and Arc studies? |
| `10-check.js` | Can the viewer distinguish guide count, construct count and independent evidence? |

The reusable entry point is `starter/crispri.html`. It loads
`js/crispri-design.js` before `js/recipes/crispri/crispri-helpers.js`, followed
by the eleven recipe files in order and then the player. Template-specific styling
is in `starter/css/crispri.css`. Every generated project receives these editable
files; only `--template crispri` selects them as the initial lesson. The default
gallery does not execute or style itself with the CRISPRi recipe.

The protein-origin scene shows one common arrangement: cells are prepared to
express dCas9–KRAB before the guide library is delivered. Its nine states begin
with an effector lentivector outside the cell, then show entry of the RNA cargo,
formation of a DNA copy, cargo passage through a nuclear pore and integration
into cellular DNA. Reverse transcription and nuclear import can overlap; the
scene does not require all DNA synthesis to finish in the cytoplasm. The
delivered code specifies an engineered dCas9–KRAB fusion, rather than an isolated
endogenous KRAB gene.

The scene then separates the protein-coding gene → mRNA → fusion-protein pathway
from guide-encoding DNA → sgRNA transcription. The mRNA persists during
translation. Subsequent nuclear import of the fusion protein is distinct from
the earlier transport of vector cargo. It does not imply that guide RNA is
translated, that human cells naturally contain dCas9, or that every CRISPRi
experiment uses this delivery arrangement. The notes link the Replogle studies
that document stable effector-expressing cell lines and primary evidence that
nuclear import can precede completion of reverse transcription.

For template maintenance, the episode files above are the reusable copies of the
corresponding authored lesson's `js/episodes/` files; the helper is copied from
`js/crispri-helpers.js`. Copy final episode/helper/CSS fixes into those template
paths after browser review. When replacing `starter/crispri.html` from an
authored `index.html`, remap the helper and episode script sources to
`js/recipes/crispri/`. Do not copy the authored lesson's `config.js`: the
generator writes new title, language, appearance and source metadata.

## Poisson occupancy

```js
const q = PD.poissonOccupancy(0.3);
// q.zero, q.one, q.multi: probabilities among all modeled cells
// q.oneGivenPositive, q.multiGivenPositive: among cells with N >= 1
```

The input `moi` is a finite, nonnegative number, interpreted as the mean number
of successful construct-delivery events per cell in an idealized Poisson model.
There is no coercion from strings. The returned object is frozen.

For `N ~ Poisson(moi)`, the model evaluates:

- `zero = P(N = 0) = exp(-moi)`.
- `one = P(N = 1) = moi * exp(-moi)`.
- `multi = P(N >= 2) = 1 - zero - one`.
- `oneGivenPositive = one / (1 - zero)`.
- `multiGivenPositive = multi / (1 - zero)`.

At zero MOI, the first three values are `1, 0, 0` and both conditional values are
`null`: the conditioning population has probability zero. Small means use an
equivalent convergent Poisson series to avoid cancellation; numerical output
has ordinary JavaScript floating-point precision. Extremely small unconditional
probabilities may underflow to zero while a conditional probability remains
representable.

This model assumes independent events and a common event rate across cells. It
does not estimate MOI from observations, calibrate marker selection, or predict
integration, expression, guide activity or knockdown. A modeled “positive” cell
means `N >= 1`; it is not automatically identical to a measured selected cell.
Two guide-encoding units on one construct still count as one construct event.

## Persistent cassette and virion actors

```js
const cassette = PD.cassette(svg, {
  x: 100, y: 250, width: 240,
  guides: ['A', 'B'], colors: [C.blue, C.teal]
});
cassette.set({x: 200, y: 280});
// A single-guide comparison retains the same two underlying unit nodes.
cassette.set({guides: ['A'], colors: [C.blue]});

const particle = PD.virion(svg, {x: 700, y: 290, scale: 1, color: C.purple});
particle.set({x: 760, scale: 1.3});
```

Both return `{g, set, anchors, bounds}`. `set(patch)` returns the same API,
validates the complete next state before changing the drawing, and updates
existing nodes. Unknown keys and invalid values throw. Positions must be finite.
Use the returned `.g` with `F.opacity` or a parent transformation. These actors
do not create timers; authored motion can use `F.driver` with the scene's usual
disposal contract.

| Actor | Options and defaults | Meaning |
| --- | --- | --- |
| `PD.cassette` | `x:0`, `y:0`, `width:240`, `guides:['A','B']`, `colors:[C.blue,C.teal]` | Stylized DNA backbone with one or two guide-encoding units and a separate transcription-direction arrow for each unit. |
| `PD.virion` | `x:0`, `y:0`, `scale:1`, `color:C.purple` | Stylized lentiviral envelope and exactly two single-stranded RNA genome copies, representing pseudodiploid packaging. |

All listed options can be changed by `set`. Cassette width must be at least 120;
guide labels and colors must contain matching arrays of one or two nonempty
strings. Pass both arrays when changing the number of units. A single unit is
centered; the second persistent unit group is hidden using `display="none"`.
`g.dataset.guideCount` reports the active number of units. Keep
labels compact (typically `A` and `B`), and provide explanatory prose in the
scene's allocated text regions. The virion's scale must be positive and its
color a nonempty string. Default colors remain semantic CSS variables. Strokes
use `vector-effect="non-scaling-stroke"`.

Coordinates of anchors and bounds are **local**, before the actor's translate
and scale. Their container objects retain identity across updates.

- Cassette origin is the left end of its DNA backbone. Its bounds are
  `{x:0, y:-40, width, height:56}`. Anchors `left`, `right`, `guide0`, `guide1`
  are `[x,y]` pairs. `right` and the guide centers update when width changes.
  In the single-guide state, `guide0` is centered and `guide1` still describes
  the reserved, hidden second unit's position.
- Virion origin is its center. Its local bounds are
  `{x:-46, y:-46, width:92, height:92}`. Anchors are `center`, `left`, `right`,
  `top`, `bottom`, `rna0`, `rna1`. The four edge anchors lie on the envelope
  at radius 34. The returned `.genomes` array contains its two RNA path nodes.

The cassette is DNA encoding future RNA products; its two units are not two
packaged genomes. The virion contains two genome copies, not DNA or two mature
guide RNAs. No relationship between genome copy count and cassette unit count
is computed. These are teaching schematics, without nucleotide sequence,
atomic structure, exact vector architecture, reverse-transcription mechanism,
or a biophysical trajectory. A complete-vector description belongs in the
lesson's sources and narrative.

## Verification

Run from the kit root:

```sh
node --test tests/crispri-design.cjs
python3 -m unittest discover -s tests -p test_scaffold.py
python3 docs/navigation/route.py --show crispri-design
python3 docs/navigation/route.py --check
```

The tests use independent analytic values at MOI `0`, `ln(2)` and `1`, small and
large numerical boundaries, invalid inputs, exact actor part counts and stable
node identity. `LESSON_TEST_DIR=/absolute/path/to/lesson` runs the same checks
against a generated project's runtime. These are model and DOM checks; review
the actual lesson in a browser for text clearance, motion, themes and languages.
