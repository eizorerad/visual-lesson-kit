# A recurring branched pipeline

`js/recipes/pipeline-synthesis.js` is an optional four-scene, thirteen-state teaching composition. It keeps one small map in fixed positions at three checkpoints, then lets the learner change its two parameters. It is an example to adapt, not a required outline for future lessons.

All values are original, invented, and in arbitrary units. The two sampled cells are `c1=1`, `c2=3`, with mean `m=2`. A proposed shift `δ` and a retained-spread parameter `s` construct

`y_i = m + δ + s(c_i − m)`.

The independent teaching reference `[3,5]` is used only after constructing the prediction. Two distinct discrepancies are computed: `|mean(y)−mean(reference)|` and `|range(y)−range(reference)|`. They are not combined into a scientific score. Matching a mean does not guarantee matching variation. For this deliberately tiny two-value toy, mean and range determine the unordered pair; these summaries do not characterize arbitrary larger distributions, identify a biological mechanism, or establish statistical evidence.

## Operation map

| Scene | Question | Visible operation | Result | Preserved |
|---|---|---|---|---|
| `pipeline-inputs` · 3 states | Does a correct mean imply correct individual cells? | Trace proposed response and actual sampled cells into construction, then fork the resulting pair into two checks | The model needs both inputs; the reference enters only evaluation | Cell IDs, sample values, map positions, units |
| `pipeline-shift` · 3 states | What does a common shift change? | Animate `δ: 0 → 1 → 2` on the same two bars | Mean moves from 2 to 4 while range stays 2 | Same cell IDs, same fixed bar scale, same reference |
| `pipeline-spread` · 3 states | Can a correct mean hide different cells? | Animate `s: 1 → 0 → 1` at `δ=2` | `[3,5] → [4,4] → [3,5]`; mean error stays 0, range error changes | Sample, mean, IDs, units, scale |
| `pipeline-synthesis` · 4 states | Which part of the prediction did each operation change? | Repair the mean, restore spread, then deliberately shift past the reference; allow named parameter buttons and route tracing | The same state drives every bar, formula, summary and discrepancy | Entire diagram and both separate evaluation questions |

Every state has Russian and English notes. Scene Q&A covers model inputs, reference separation, translation, spread, and the limits of the toy. Labels and numerical values occupy separate lanes from paths and decorative cell glyphs.

## Progress through the map

Author each beat around its current operation: name the question, active objects, ordered local edges and explanatory caption. The number of beats follows the argument; do not map three clicks to three highlighted nodes while retracing the same whole route each time. A beat may change a model parameter, explain a branch or compare an output. Map attention and numerical state are separate: changing emphasis does not itself change the prediction.

Use separate actors for the persistent revealed route and its motion overlay. Next retains known connections and animates only the current operation's edges. Choose whether to follow parallel branches together or inspect them one after another; the timing must serve the explanation. Active objects stand out; known labels remain readable and future context stays quieter. Test these distinctions in both backgrounds, without relying only on a new outline. Keep the immediate numerical feedback readable during manual exploration.

Explicit replay is available in all four scenes and disabled before any connections have been revealed. It traces only the available route and preserves the current beat, parameters and manual selection, then restores its prior attention. If an adaptation adds node selection, inspecting a future node must not disclose its unrevealed paths. Back reconstructs the earlier authored state through the player. These semantics belong to the composition, not to a mandatory player-wide map pattern.

## Reuse

Load the usual runtime, `layout.js`, `patterns.js` and `interaction-regions.js` before the recipe. As with the other recipes, evaluating the script registers its four scenes with `D.deck.register`; there is no second initialization call. The recipe uses `F.driver` with scene cleanup and `F.phase` for route tracing. `T.svgButton` supplies keyboard-accessible regions; visible labels are ordinary measured `L.textBox` actors. Styling uses live semantic `C` roles.

The small exported `PIPELINE_SYNTHESIS_EXAMPLE` object exposes immutable cells/reference, the scene IDs, and `calculate(shift, spread, reference?)` for verification. It is a worked-example fixture, not a new general scientific API. The prediction is computed before the optional reference is read; supplying a different reference changes only evaluation. Parameters must be finite with `0 ≤ shift ≤ 4` and `0 ≤ spread ≤ 1`. A custom reference must be a dense array of exactly two finite values, with representable finite summaries and discrepancies; invalid or overflowing inputs are rejected.

When adapting, replace the model first and name each input's information source. Choose motifs and branches that fit the new scientific question. A model might output a sequence, graph, image or distribution rather than cells, and may need one or several evaluation branches. Keep the positions and IDs only when they continue to mean the same thing. Do not transfer the teaching numbers or the two-summary sufficiency of this toy to another dataset. Write new notes and Q&A alongside the operations; do not preserve irrelevant private project names, links or scores.

For QA, `[data-pipeline-node]` names fixed motifs; `[data-pipeline-cell]` and `[data-pipeline-bar]` identify persistent sampled/output cells. The scene root stores `data-pipeline-state` and `data-pipeline-result` as JSON, plus `data-motion-phase`, so values and intermediate bar lengths can be compared without reverse-engineering text. Progression hooks are `data-pipeline-beat`, `data-pipeline-attention` (JSON nodes/edges) and `data-pipeline-revealed` (JSON edge-to-progress). Retained `[data-pipeline-path]` and animated `[data-pipeline-flow]` actors have `data-pipeline-progress`; retained actors also expose `data-pipeline-active`. These are development hooks, not learner-facing labels.

Independently list the expected operation and revealed routes for each beat, then compare real Next/Back/replay/selection behaviour with that list. Geometry tests alone cannot detect repeated whole-map tracing or a misleading change of attention. Real browser review must also inspect contrast, label-to-shape and label-to-path clearance in both languages, both fonts and intermediate motion.
