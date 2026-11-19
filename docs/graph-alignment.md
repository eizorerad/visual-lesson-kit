# Graph alignment and QUBO

The `q-align` template teaches Q-Align from first principles in 26
bilingual scenes and 100 states. It begins with an explicitly invented four-person
example: dots → friendships → pairing → preserved connections. Then it introduces
search size, the source six-node instance, scores, traps, controlled risk,
actual SA traces, graphlets and pattern counts, evidence, binary assignments,
and the possible later Qiskit experiment. After thirteen opening scenes,
twelve detail scenes follow the Tutorial and Phase 1 code before the final
research summary. Each formula follows its plain-language meaning.

The detail chapter covers the three-level experiment, graph generation and
noise, QUBO rewards and exact penalty convention, the binary counterexample,
swap neighborhoods and plateaus, single versus combined optimum basins,
worked graphlet entropy, SA cooling and budgets, all six reproduced regressions,
FDC reference sensitivity, the neutral random walk and directional minimax
barriers. It explicitly distinguishes Kendall inversions from arbitrary swaps,
corrected teaching counts from the original survey, and MDS illustration from
exact physical geometry.

The optional `js/recipes/q-align.js` research recipe is retained and is not
loaded by this beginner template. Both versions keep input graph positions fixed
when changing a correspondence.

```sh
python3 create.py /absolute/new-lesson --template q-align --lean \
  --title "Q-Align: объяснение с нуля" --lang ru --palette ocean
```

## API

`js/graph-alignment.js` supplies numerical functions independent of drawing and
persistent SVG actors:

- `GA.conserved(adj1, adj2, perm)` counts conserved undirected edges.
- `GA.energy(adj1, adj2, perm, weights)` reproduces the notebook energy on valid
  equal-size permutations: `−2αC−βn`.
- `GA.binaryEnergy(adj1, adj2, X, weights)` evaluates the full binary objective,
  including row and column penalties, with the notebook's omitted constant.
- `GA.oneHot(perm)`, `GA.neighbors(perm)` and `GA.entropy(counts)` implement the
  stated binary assignment, swap neighborhood and Shannon-entropy conventions.
- `GA.network(parent, {id, adj, positions, labels, color, r})` creates each node
  and edge once; `setPositions(...)` changes the layout and `highlight(...)`
  changes emphasis while preserving identities and the edge set.
- `GA.assignments(parent, {id, n})` draws distinct dashed correspondence lines.
- `GA.paired(parent, {id, a, b, left, right, leftLabels, rightLabels, r})`
  creates two graphs with fixed input layouts. `set(perm, {visible, emphasis,
  focus})` updates only correspondence lines and highlights, returning the
  conserved-edge count. It never rearranges either graph to make a pairing look
  successful.
- `GA.matrix(parent, {id, n, x, y, size, labels})` paints one-hot assignments.
- `GA.motif(parent, {id, name, x, y, width, height, color})` supplies the eight
  small connected motif glyphs used in the notebook.

Use live `C` roles. Actor text has `L.textBox` contracts. `network` positions
are visual coordinates; node indices and adjacency remain scientific data.
The component validates simple undirected graphs and complete bijections.

## Source and scientific scope

The checked-in `js/q-align-data.js` records source commit and hashes. The shared
instance is Erdős–Rényi, six vertices, noise 0.1, seed 105. Its 720 permutations,
60 non-strict local minima, four global optima and complete SA trajectories are
computed from source functions. The example barrier is an exact minimax escape
path on the swap graph. The optional research recipe uses lexicographic landscape indices, not
distances. Both recipes use only the recorded discrete states on the escape path.

The evidence scene uses the reproduced 225-instance Tutorial results. It
distinguishes correlation from causality and held-out predictive performance.
The four-person example is invented and labelled. Its 24 pairings are checked
independently; the transition to source data is explicit. Quantum computing is
a proposed later comparison; the source code runs classical SA.

The graphlet view deliberately checks induced-subgraph connectivity. This
corrects the notebook's triangle-plus-isolated-vertex classification only for
the teaching view. It does not retroactively change the source survey results.
Notes and questions also cover multiple optima, plateau minima, the permutation
versus binary state space, and insufficient default QUBO penalties.

Rebuild numerical data with the source checkout's scientific Python environment:

```sh
python build/q-align-data.py --repository /absolute/Q-Align \
  --survey /absolute/Q-Align/outputs/tutorial_survey_verification.json
```

The generator only executes imports and function definitions from source
notebooks. It checks the trajectory sampler against the original SA outcomes.
The data also contain all 225 verified survey rows, both FDC distance
conventions, the 801-value neutral walk and the 40/150-step budget comparison.
If the external survey JSON is unavailable, regeneration reuses the provenance
and rows bundled with this template; it does not silently invent survey data.

## Verification and export

```sh
node qa/q-align/numerics.cjs
node qa/q-align/scenes.cjs /tmp/q-align-frames.json
python3 build/bundle.py
python3 build/bundle.py --check
```

The 11 numerical checks verify exact energies, local minima, basins, minimax,
SA traces, graphlet conventions, FDC, autocorrelation and survey R². The portable
scene smoke check exercises 26 scenes, 100 states, five numeric tween samples
and direct control callbacks, with one RU/EN note per state. It does not test
native browser input or CSS. `static-review.cjs` can independently measure both
bundled fonts and export the authored SVG using a supplied @napi-rs/canvas
module path; that review also does not replace browser testing.

Inspect endpoints and actual intermediate frames in the browser. Check fixed node and input-edge geometry across every pairing choice. Check each
slider and run-selection button, keyboard navigation, RU/EN notes and questions,
both backgrounds and fonts, and a narrow landscape viewport. Manual input must
cancel guided animation. The kit's `qa/film/review.cjs` can review the scene pack
where its Playwright/browser dependencies are available; it does not establish
scientific validity or test physical touch gestures.
