# Build an explanation, not a catalog tour

See [explanation-design.md](explanation-design.md) for a recurring conceptual map, formula-to-substitution bridges, synchronized readouts and a visual ending that answers the opening question. The optional `explanations.html` recipe demonstrates these together; it is not a required outline.

The library is a toolbox. You **may and should create new SVG constructions, local helpers, interactions and compositions** when the scientific question calls for them. Preserve the shell, scientific identities and lifecycle contracts; the available scenes do not limit what you may explain. Reusing a module is optional. A lesson composed entirely of identical three-state reveals is not a successful use of the kit.

There are two runnable menus: `index.html` contains the original thirteen basic examples; `methods.html` contains nine deeper operations. Neither is a required presentation outline. A new methods project can be created with `create.py destination --template methods`. Its primary entry and offline build then use the laboratory. To author another topic, select or replace episode scripts; the helpers remain available.

## Choose the operation from the question

| Question | Visible operation | Modules and limits |
|---|---|---|
| How spread out are the observations, and how precise is their mean? | Grow residuals, square them, then compare named SD and SEM intervals | `statistics.md`; independent-unit assumptions remain essential |
| Could the group difference arise under reassignment? | Keep records, shuffle memberships, accumulate the statistic | `statistics.md`; exact small unpaired permutation under exchangeability |
| Why does testing many genes change the decision? | Keep hypothesis IDs, sort p-values, find the final passing rank and select its whole prefix | `statistics.md`; BH assumptions, not posterior truth probability |
| How do cells become sample-level evidence? | Group by donor and cell type, then sum raw contributions into new aggregates | `biology.md`; aggregation does not perform differential expression |
| What did normalization change? | Retain raw counts, disclose each row factor, then separately apply log1p | `biology.md`; scaled values are derived values, not new molecules |
| How do individual genotypes determine allele frequencies? | Split each diploid pair into two named copies, count, then build a separate model expectation | `biology.md`; HWE probabilities are not observed genotypes |
| Why does rotation make a wave? | Rotate a radius and trace its signed height against angle | `geometry.md`; radians and sign visible |
| What is lost in reducing dimensions? | Project each point, retain its source marker and draw the discarded residual | `geometry.md`; exact 2D PCA with stated centering |
| What does a matrix do? | Move basis directions and the grid together; compute area from each displayed matrix | `geometry.md`; signed determinant differs from ordinary area |

Use existing components for distributions (`K.histogram`), bootstrap copies (`K.resampleMean`), classification thresholds, matrices, imported embeddings, sequence positions and orthographic views. Do not duplicate them merely to add a domain label. Link a selected cell back to its row or sequence when identity matters. A custom graphical link can be simpler and clearer than a new universal chart class.

## A scene should earn its motion

Before coding, write the question and the action needed to answer it. Name what stays fixed and what changes: units, values, membership, coordinate representation or camera. Specify one checkpoint at which a viewer can make a prediction. Then show the operation, allow inspection or intervention when useful, and make the reason for the next question visible.

For example, a count-depth lesson need not show the entire laboratory. It can begin with two cells having the same proportions but different totals, compare raw counts, apply a visible common-total factor, and finish with a counterexample where proportions differ. The next scene may use a histogram or donor-level aggregation. There is no mandatory number of steps or chart types. A static source figure is appropriate when the evidence is static; animation should not claim an unmeasured trajectory.

Distinguish **record**, **copy**, **aggregate**, **estimate**, **null simulation** and **model expectation**. Reuse color roles only when identity actually continues. Never morph an observed individual into a mean or a hypothetical genotype merely because both are circles. Animate contributions or relationships while keeping the original evidence as an anchor.

## Extending the library safely

1. If a primitive is missing, compose F/S/L locally and document the input/output meaning. You do not need permission to add an ordinary topic-specific helper.
2. Promote it into K only when it has a reusable contract and more than one reasonable use. Separate numerical models from views, make data immutable, and validate before DOM mutation.
3. Provide a short worked composition with full RU/EN notes and questions. Give independently calculable fixtures and sources for the method, not only a API call list.
4. Test scientific invariants, invalid inputs, persistent identity and cancellation. Then measure actual text and intermediate motion. A valid number or an in-canvas label does not prove a good explanation.
5. Ask a fresh author to solve a different small teaching task using the library alone. Record where they had to invent a component or misunderstood an API; fix the library or guide and check again.

The current numerical methods intentionally cover small explicit examples. For real scRNA-seq or genomic inference, import verified outputs and provenance from appropriate analysis tools. Do not add a browser implementation of UMAP, differential expression or causal inference simply to make a scene appear more sophisticated.

Primary definitions and worked fixtures are linked in [statistics](statistics.md), [biology](biology.md) and [geometry](geometry.md). The original research review is retained in the release verification material.

## Worked independent composition

`js/recipes/independent-evidence.js` (inside `starter/` in the kit) is a separately authored four-scene lesson. It uses `K.aggregateCounts` and `K.sampleSummary` with its own cell actors, contribution view, SEM comparison and a small random-intercept variance model. Its source is included in generated projects without being loaded automatically. The standalone library example is `examples/independent-evidence.html`. Study how it chooses local views for twelve cells instead of forcing them into a smaller ready-made display. The model assumptions and invented values are part of its explanation.
