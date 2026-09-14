# Geometry as an operation

Load `js/geometry.js` after `film`, `layout` and `patterns`. It extends `K`. The runnable recipe `js/recipes/methods-geometry.js` contains three independently adaptable scenes: circle → wave, cloud → projection, and grid → linear map. Use `methods.html` to see them.

These helpers use explicit two-dimensional values and radians. They do not infer depth, fit UMAP or animate arbitrary data into a supposed biological trajectory. The existing `K.spatialScene` remains the camera tool. A camera rotation changes a view; a linear map changes coordinates.

## Pure numerical models

```js
K.circleComponents(Math.PI/3); // {angle, cos: .5, sin: √3/2}
K.projectOnto2D([-3,4], [2,0]); // signed score -3, projection [-3,0], residual [0,4]
K.pca2D([[-2,-2],[-1,-1],[1,1],[2,2]]);
K.linearMap2D([[2,1],[0,1]]); // determinant 2, area 2, mapped unit square
```

`projectOnto2D` returns a normalized axis, signed scalar score, projected/residual vectors and their squared lengths. A zero direction is invalid. Negative scores are valid and must remain signed in the explanation.

`pca2D` requires at least two finite 2D points. It subtracts column means and uses sample covariance (denominator n−1); it does **not** scale columns to equal variance. Its frozen result contains mean, centered values, covariance, two axes, angle, eigenvalues, scores, totalVariance, explainedFraction and axisUnique. Eigenvectors have arbitrary sign. Repeated eigenvalues have no unique leading direction. When all points coincide, explainedFraction is null, not zero or 100%. This is a small geometric teaching calculation; use established analysis software for real high-dimensional inference.

`linearMap2D` returns matrix, images of basis vectors in columns, mapped square, signed determinant, absolute area and orientation (−1/0/+1). A singular map is supported, because collapse is meaningful. Overflow or nonfinite inputs are rejected.

## Persistent views

```js
const circle = K.unitCircleView(parent, {
  cx:320, cy:360, radius:130,
  traceFrame:{x:670,y:230,width:470,height:260}
});
circle.setAngle(Math.PI/3); // valid trace range 0…2π

const projection = K.projectionView(parent, {
  records:[{id:'a',xy:[-1,-1]},{id:'b',xy:[1,1]}],
  cx:420,cy:360,scale:85,extent:2.65
});
projection.setState({angle:Math.PI/4, progress:1});

const mapping = K.linearMapView(parent, {
  matrix:[[2,1],[0,1]], cx:430,cy:410,scale:95,extent:3.1
});
mapping.setProgress(1);
```

Each view returns `.g`, named persistent nodes and `.snapshot()`. None owns a timer. Animate a state with `F.driver`, call setters from `paint`, and dispose the driver through `ctx.onDispose`. Setters validate before updating the displayed state.

`unitCircleView` rotates through the supplied angle and derives both components and the trace from sin/cos at every frame. Never interpolate endpoint Cartesian coordinates: that follows a chord. The trace may retract when the angle decreases. Its circle radius and graph amplitude are visual scales, with identical dimensionless underlying height.

`projectionView` keeps hollow source markers at centered coordinates; moving points interpolate to their orthogonal projections, with residual segments linking back to the source. IDs and source coordinates are retained on the nodes. `progress=0` shows the source positions, `1` the projections. Angles change the direction, never the source data. `extent` is a fixed symmetric data-space radius; source distances must fit it. Label centering and units in the surrounding scene.

`linearMapView` animates the matrix from identity to its target. `setMatrix(matrix)` replaces the target and preserves progress. Determinant and area are recomputed from the actual displayed matrix, including intermediate singular matrices. A −1…1 grid is mapped, and `extent` bounds every mapped corner. Invalid targets are rejected before touching nodes. The helper supplies basis lines, endpoints and a filled unit square; the recipe supplies the explanatory labels and controls.

## Composition and verification

These are pieces, not a slideshow template. Combine projection with the existing `K.histogram` to collect signed scores, or with a source window to separate a paper’s measured embedding from a geometric toy. Use a new local SVG construction if the paper needs something else. Do not force these three scenes into every lesson.

Tests in `tests/geometry.cjs` independently check the signed projection (−3,4), sample covariance, tied and zero eigenvalues, affine-scale translation invariance of centered PCA, determinant/area/reflection/collapse, persistent nodes and rejection without partial mutation. Browser checks must additionally measure labels and intermediate frames in both languages and text families. Numeric tests do not establish readable layout.

Primary teaching references: [OpenStax unit circle](https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-3-unit-circle), [OpenStax dot product and projection](https://openstax.org/books/calculus-volume-3/pages/2-3-the-dot-product), [MIT linear maps](https://ocw.mit.edu/ans7870/18/18.013a/textbook/chapter04/section02.html), [MIT signed determinant and area](https://ocw.mit.edu/ans7870/18/18.013a/textbook/chapter04/section01.html), [scikit-learn PCA definitions](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html).
