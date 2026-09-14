# Chemistry diagrams

`CH` adds persistent SVG chemistry actors to the lesson kit. Load `js/chemistry.js` after `lesson.js`, `film.js`, and `layout.js`. It uses `D.dom`, live semantic `C` colors, and `L` text contracts; it does not depend on the molecular illustration or geometry modules.

## API

### `CH.molecule(parent, options)`

```js
const water = CH.molecule(svg, {
  ...CH.presets('water'), x: 300, y: 310, scale: 1.4
});
water.set({partials: {O: -.8, H1: .4, H2: .4}, showPartials: true});
water.focus(['O']);
water.place(440, 310, 1.8);
```

The numbers in this example are **illustrative assigned partial charges**, not fitted or computed charges. Show that qualification in the lesson when using them.

| Option | Contract |
|---|---|
| `atoms` | Nonempty array of `{id, element, x, y, charge?, partial?, lonePairs?, hydrogens?}`. IDs must be unique nonempty strings of at most 80 characters. Element labels accept element symbols and `R`, meaning an explicitly truncated remainder. |
| `bonds` | Array of `{id?, a, b, order?}`, joining existing distinct atom IDs. Default ID is `` `${a}-${b}` ``. Duplicate endpoint pairs are rejected. |
| `order` | Integer `0`, `1`, `2`, or `3`; default `1`. `0` retains a hidden bond for a reviewed later state. Fractional/aromatic orders are unsupported. |
| `hydrogens` | Author-declared grouped H count, integer `0` to `4`, default `0`. `{element:"C", hydrogens:3}` displays `CH₃` while the underlying element remains C. A count of one displays `CH`; zero displays `C`. Positive grouped counts are supported for known elements other than H; `R` cannot declare grouped H. No count is inferred from valence. |
| `charge` | Formal charge, integer from −99 to +99; default `0`. This is a drawing limit, not a chemical valence rule. |
| `partial` | A finite signed number, default `0`. The drawing displays only `δ+` or `δ−`; the numeric value is retained in state and `data-partial-charge`. The author must name its model/method and units or explain that it is illustrative. |
| `lonePairs` | Integer from `0` to `4`, default `0`. Each visible pair is two dots. Their diagram positions avoid nearby bond directions and visible charge labels where space permits. |
| `x`, `y`, `scale` | Group translation and positive scale; defaults `0`, `0`, `1`. Local x increases rightward and y downward. |
| `showCharges`, `showPartials`, `showLonePairs` | Booleans. Defaults are `true`, `false`, `false`. A zero charge has no annotation. |

The actor exposes:

- `g`: the persistent SVG group.
- `atoms`: object mapping atom ID to its persistent SVG group (`data-atom-id`).
- `state`: frozen current atom/bond data, including declared grouped hydrogens, annotation flags, and placement. Use setters to change it.
- `x`, `y`, `scale`: read-only current placement properties, also available in `state`; these support inspection helpers when native SVG geometry is unavailable.
- `anchors`: frozen map from atom ID to its **local** `[x,y]` center. An external stage anchor is `[state.x + localX*state.scale, state.y + localY*state.scale]` when the parent has no additional transform.
- `bounds`: local `{x,y,width,height}` covering atom centers with a conservative annotation margin: 48 units vertically, half the allocated label width plus 32 units horizontally. This is an authored allocation, not a measured font or molecular surface bound.
- `set({positions?, charges?, partials?, lonePairs?, hydrogens?, bondOrders?, showCharges?, showPartials?, showLonePairs?})`: maps atom IDs to values, except `bondOrders`, which maps bond IDs. Positions are `[x,y]`. Validates the entire update before changing DOM or state. Returns the actor.
- `focus(atomIds)` or `focus(null)`: add thin halos to selected atoms and dim other atoms/bonds; retains element labels and bond order. An empty array dims the whole molecule. Returns the actor.
- `place(x,y,scale?)`: move/scale the group while preserving local chemistry; omitted scale retains current scale. Returns the actor.

All atom, bond-line, and annotation nodes persist across updates, including a grouped-H count change. A grouped label allocates additional text width; bond-end clearance, charge positions, focus ellipse, lone-pair placement, and bounds follow that width. A bond has three allocated line nodes; unused orders are hidden. The line ends stop outside the explicitly reserved element-label regions. If centers become too close to leave that clearance, the bond is hidden until they separate. Authors must inspect intermediate layouts; hidden short bonds do not denote bond breaking. For a chemical change, set its order explicitly.

Coordinates are bounded to ±1,000,000 stage units, and scale to `(0,10000]`, to keep this diagram renderer within a finite, practical numeric range. Formal-charge magnitude and lone-pair limits are rendering limits. They do not certify that a structure is chemically valid.

A reviewed coupled step can update several quantities in one paint:

```js
// Example bookkeeping operation on a diagram that already contains these IDs.
view.set({
  bondOrders: {'N-H4': 0},
  charges: {N: 0},
  lonePairs: {N: 1},
  positions: {H4: [120, 0]},
  showLonePairs: true
});
```

This fragment alone is not a complete balanced reaction: the transferred proton's destination, charge, and electron arrows belong in the complete authored scene. Use a separate animation driver for interpolation. `CH` starts no timers.

### `CH.formula(parent, {text, x?, y?, width?, height?})`

Returns `{g, el, set(text)}`. `x` and `y` are the top-left of the allocated text box, defaulting to zero; default box size is `250 × 52`. It uses `L.textBox`, and `set` keeps the text element. Supply complete Unicode text such as `H₂O`, `NH₄⁺`, or `NH₄⁺ + OH⁻ → NH₃ + H₂O`.

This is selectable, contractual text. It does not parse formulas, balance equations, infer composition, render arbitrary TeX, or derive a molecular graph from a formula. Long formulas need a wider box; font size is not silently reduced. Check the actual formula glyphs after the selected font loads.

### `CH.arrow(parent, options)`

Options are `{x1, y1, x2, y2, kind, curve?, color?}`. The result is `{g, set(patch)}`; all shaft, head, and cross nodes persist. Endpoints must differ. The first endpoint is the **tail** and the second is the **tip**. `curve` is a signed perpendicular offset of a quadratic Bézier control point, in local stage units. Electron arrows default to `35`; other arrows default to `0`. The curve midpoint deflection is half the control-point offset. `color` defaults to a live semantic color.

| `kind` | Visible convention and author responsibility |
|---|---|
| `electron-pair` | Curved full head. Anchor the tail to a specific lone pair or bond; it denotes redistribution of two electrons. |
| `electron-single` | Curved half head (fishhook), for one electron. |
| `reaction` | Open full head. Relates reactants and products; the arrow supplies no mechanism or rate law. |
| `equilibrium` | Two parallel, opposing half-headed arrows. These indicate forward and reverse processes. Its shafts remain straight. |
| `resonance` | One shaft with heads at both ends. Connect alternative contributors of one delocalized state, without implying interconversion of species. |
| `force` | Filled triangular head in the physical-vector color. Supply the quantity and units in the scene. |
| `dipole-chemical` | Open head, with a perpendicular cross at the tail. Set the tail at the positive end and the tip toward the negative end. |
| `dipole-physics` | Open vector head with no cross. Set the tail at the negative end and the tip toward the positive end for the electric dipole moment **p**. |

Changing `kind` never silently reverses supplied endpoints. To switch between the chemical and physical dipole conventions for the same charge pair, explicitly exchange tail and tip and update the label. The two dipole arrows describe opposite direction conventions. Curve signs refer to SVG screen coordinates, not stereochemistry.

### `CH.contact(parent, {x1, y1, x2, y2, color?})`

Returns `{g, set(patch)}` for a persistent thin dashed line. It is distinct from a bond actor. Give the contact a nearby explanation (for example “illustrative hydrogen-bond contact”); a dashed line alone neither proves a hydrogen bond nor estimates its energy or binding affinity.

### `CH.presets(name)`

Returns fresh mutable `{atoms,bonds}` data each time, without creating DOM nodes. All displayed carbons and hydrogens are explicit; no hydrogen count is inferred from an unlabeled vertex.

| Name | Stable principal IDs | Content |
|---|---|---|
| `water` | `O`, `H1`, `H2` | H₂O; neutral O with two lone pairs. |
| `methane` | `C`, `H1`…`H4` | CH₄; a 2D cross connectivity drawing, not a planar geometry claim. |
| `ammonia` | `N`, `H1`…`H3` | NH₃; neutral N with one lone pair. |
| `ammonium` | `N`, `H1`…`H4` | NH₄⁺; formal `+` on N, no N lone pair. |
| `hydroxide` | `O`, `H` | OH⁻; formal `−` on O, three lone pairs. |
| `acetate` | `C1`, `C2`, `O1`, `O2`, `H1`…`H3` | CH₃COO⁻; one Lewis contributor with `C2=O1` and formal `−` on `O2`. The real anion is delocalized. |
| `methylammonium` | `C`, `N`, `H1`…`H6` | CH₃NH₃⁺; formal `+` on N. `H1`…`H3` belong to C; `H4`…`H6` to N. |
| `trimethyllysine-fragment` | `R`, `CE`, `N`, `C1`…`C3` | **R–CH₂–N⁺(CH₃)₃**; `CE` is the lysine ε-carbon. `R` explicitly denotes the rest of the lysine-containing molecule beyond that carbon. Eleven H atoms are displayed. |

The trimethyllysine fragment contains 17 displayed nodes: 4 C, 11 H, 1 N, and the `R` remainder label. Its displayed formal charge is `+1`; the unspecified remainder may contain other charged groups. It is not a complete isolated amino acid or a measured protein structure. Every connection to `N` is a single bond; there is no N–H bond or N lone pair in this quaternary ammonium fragment.

### `CH.composition(dataOrState)`

Pure accounting of the authored atom data, including declared grouped H:

```js
const methylammonium = {
  atoms: [
    {id: 'C', element: 'C', hydrogens: 3},
    {id: 'N', element: 'N', hydrogens: 3, charge: 1}
  ]
};
CH.composition(methylammonium);
// {elements: {C: 1, H: 6, N: 1}, charge: 1, remainderCount: 0}
```

Returns frozen `{elements, charge, remainderCount}`. Each explicit atom contributes one of its actual element; its declared `hydrogens` contribute that many additional H. Thus `CH₃` contributes **one C and three H**, without inventing three C atoms or creating H nodes/IDs. Explicit H atoms and grouped H counts are added together: do not represent the same H both ways.

`R` is excluded from `elements` and counted in `remainderCount`. `charge` sums declared formal charges, not partial charges. An unspecified R remainder can contain other atoms and charges; this helper cannot recover them. Its output is a count of the **declared fragment**, not a complete formula or total charge for an unknown molecule.

The input can be preset data, `actor.state`, or an object containing just `atoms`. Each atom needs a unique `id` and an `element`; `charge` and `hydrogens` are optional. Coordinates and bonds are not needed or validated by this accounting helper. It validates the count fields but does not infer valence, chemical validity, or charge conservation across a reaction. It creates no DOM and does not mutate the input. An empty atom array produces empty element counts, zero charge, and zero remainders.

Grouped H is an explicitly authored omission of individual hydrogen geometry and identity. To track a particular proton or anchor an electron arrow to an individual H–atom bond, use an explicit H node and bond instead. Changing `hydrogens` in a state update changes the declared composition; supply the corresponding recipient/donor update and verify the complete scene when illustrating proton transfer.

## Scientific scope

These actors draw authored 2D chemical structures, labels, and annotations. They do not compute trajectories, forces, orbitals, energies, partial charges, geometry optimization, acid–base equilibria, conformational populations, or reaction mechanisms. Use independently verified numerical models where a lesson needs calculated quantities, and label schematic interpolation as such.

A formal charge is integer electron bookkeeping in a chosen Lewis structure. A partial charge is a separate, method-dependent assignment of a distributed charge; a `δ` label must not be used to overwrite a formal charge. The two annotations can be shown together and retain separate state fields. The renderer does not infer either one from element or bond order.

A molecular formula states composition; it does not uniquely determine a structure. The supplied preset layouts are connectivity diagrams and are not coordinates from experiments or optimized 3D structures. `R` is a declared omission, not an atom with a known composition. The acetate preset shows one resonance contributor; switching bond order between contributors must not be narrated as a molecule reacting or oscillating between two species.

There is deliberately no general chemical-validity oracle. The core checks IDs, supported numeric ranges, and graphical state consistency. It does not enforce universal octets, predict products, infer missing H, validate stoichiometry, or certify conservation in an authored reaction. Authors must verify their selected chemistry, total charge, electron sources, and all atom destinations in the complete scene. Aromatic conventions, isotopes, radicals as atom annotations, wedge/hash stereochemistry, coordination bonds, arbitrary grouped labels beyond the declared H counts above, and SMILES/MOL import are outside this bounded API.

Normal strokes are `1.25` with `vector-effect="non-scaling-stroke"`, including focus halos. Element letters remain legible without element colors. Atom text uses `L.contract`; formula text uses `L.textBox`. Check real text bounds and geometry clearance after fonts load, plus intermediate motion, translations, close-ups, and both backgrounds. Unit tests exercise persistence and state consistency; they do not prove font clearance or chemical correctness of a new scene.

Source basis: [IUPAC graphical representation recommendations](https://iupac.qmul.ac.uk/drawing/drawing.html), especially charge/electron annotations; [OpenStax chemical formulas](https://openstax.org/books/chemistry-2e/pages/2-4-chemical-formulas); [OpenStax curved arrows](https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms); [OpenStax resonance forms](https://openstax.org/books/organic-chemistry/pages/2-5-rules-for-resonance-forms); and [IUPAC electric dipole moment](https://old.goldbook.iupac.org/html/E/E01929.html). The diagrams and code are original, using these notation conventions.
