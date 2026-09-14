# Physical chemistry calculations

`js/physical-chemistry.js` provides the global `PH` object. It loads without a DOM, rendering library, or other kit script. Use its numbers with any authored SVG view. Each call is deterministic, leaves its inputs unchanged, and returns a number or a frozen object/array. The `PH` namespace is frozen.

## Scientific scope

These are bounded equations for teaching: a pair potential, a point-charge dipole, single-site binding and protonation, a prescribed reaction extent, reflecting 1D diffusion, one-ion equilibrium voltage, photon energy, and first-order decay. The API does not infer chemical species, partial charges, balanced reactions, parameters, or units from a drawing. Supply those explicitly and retain them in captions and sources.

The numerical models do not calculate molecular electron density, covalent bonding, solvent structure, a folding trajectory, or a cell's complete membrane dynamics. An interpolated reaction-coordinate drawing remains a schematic unless a separately justified energy model supplies it. There is no `PH.energyProfile` operation.

All numeric inputs must be finite JavaScript numbers; numeric strings, `NaN`, and infinities are rejected. Invalid types raise `TypeError`; invalid domains and unrepresentable intermediate/output values raise `RangeError`. Arrays must be dense and nonempty. Ordinary floating-point roundoff applies. Saturating fractions and long-time decays may round to their limiting values; diffusion conservation is within floating-point tolerance. This is not an arbitrary-precision package. Parameter ranges in a lesson should be substantially narrower than JavaScript's numeric limits.

## API

### Lennard–Jones pair

```js
PH.lennardJones(r, { sigma = 1, epsilon = 1 } = {})
// -> { energy, force }
```

`r > 0` and `sigma > 0` share a distance unit; `epsilon >= 0` is an energy scale. Results have units of energy and energy/distance respectively. Defaults define reduced units. With `s = sigma/r`, the model is `U = 4 epsilon (s^12 - s^6)` and radial `F = -dU/dr = (24 epsilon/r)(2s^12 - s^6)`. Positive force increases separation. There is no cutoff or energy shift; the reference is `U(infinity) = 0`.

`sigma` is the zero of energy. For positive `epsilon`, the minimum is at `r = 2^(1/6) sigma`, with `U = -epsilon` and zero **net** force. Attractive and repulsive terms need not vanish individually. With `epsilon = 0`, both outputs are zero. The standard 12–6 expression and parameter meanings are documented by [LAMMPS](https://docs.lammps.org/pair_lj.html); PH applies that expression without LAMMPS's cutoff. Force is obtained by analytic differentiation. This effective pair model does not describe every chemical bond.

### Charge dipole

```js
PH.dipole([{ x, y, q }, ...])
// -> { x, y, magnitude }
```

Returns the planar physical dipole `p = sum(q_i r_i)` in the supplied coordinate frame. Coordinate and charge units are supplied by the author: meters and coulombs give C m; ångströms and elementary-charge multiples give e Å. Magnitude is `hypot(p.x, p.y)`. Charge may have either sign or be zero.

For a neutral pair the vector points from negative to positive charge, following the [IUPAC physical dipole convention](https://goldbook.iupac.org/terms/view/E01929). A chemistry crossed-tail polarity arrow commonly uses the opposite direction; label any such graphical convention separately. Translating a neutral charge set preserves the dipole; translating a net-charged set changes it. Supplied partial charges are a model input, not a calculation of electron density. SVG's downward-positive y-axis also needs an explicit coordinate transform if the lesson presents Cartesian axes.

### Equilibrium occupancy

```js
PH.occupancy(cFree, kd) // -> theta in [0, 1]
```

`cFree >= 0` and `kd > 0` use the same concentration unit. Returns `theta = cFree/(kd+cFree)`. Thus zero ligand gives zero occupancy and `cFree = kd` gives one-half occupancy. Use free ligand concentration, or justify the ligand-excess approximation before substituting total concentration. Independent identical sites and equilibrium are assumed. The fraction is an ensemble/time-average occupancy; an individual site is bound or unbound.

The reversible one-site mass-action model, conservation of sites, and `Kd = koff/kon` are developed in [Elowitz and Bois, Biological Circuit Design, Chapter 1](https://biocircuits.github.io/chapters/intro_to_circuit_design.html). A downstream biological response requires a separately stated relation between occupancy and output.

### Single-site protonation

```js
PH.protonated(pH, pKa) // -> protonated fraction in [0, 1]
```

Returns `1/(1 + 10^(pH-pKa))` for one protonation equilibrium. Both arguments are dimensionless and may be any finite number; pH is not artificially restricted to 0–14. At equal pH and pKa the fraction is one-half; increasing pH lowers protonation.

This follows by rearranging the Henderson–Hasselbalch concentration ratio for the protonated and deprotonated forms, given in [OpenStax Organic Chemistry §20.3](https://openstax.org/books/organic-chemistry/pages/20-3-biological-acids-and-the-henderson-hasselbalch-equation). It assumes a specified pH reservoir and an appropriate single-site pKa with ideal/consistent activity treatment. It does not solve buffer pH, coupled titration sites, or a protein's changing local pKa.

### Forward reaction extent

```js
PH.maxExtent(initial, stoich) // -> maximum forward extent
PH.reactionExtent(initial, stoich, extent) // -> new concentrations array

PH.reactionExtent([3, 2, 0], [-2, -1, 2], 1.5)
// -> [0, 0.5, 3] for 2 H2 + O2 -> 2 H2O
```

Both arrays have the same nonzero length. Initial concentrations are nonnegative; stoichiometric coefficients are signed finite numbers, negative for consumed species and positive for produced species. Zero coefficients preserve spectators. At least one coefficient must be negative. Fractional coefficients are allowed for a consistently scaled equation.

Returns `c_i = initial_i + stoich_i * extent`, with `0 <= extent <= min(initial_i / -stoich_i)` over consumed species. The extent here is **extent per fixed volume**, in the same concentration unit as `initial`. The usual extensive extent has units of amount; the fixed-volume concentration form follows from the [IUPAC definition](https://goldbook.iupac.org/terms/view/E02283). Input arrays contain no species formulas, so the caller must supply balanced stoichiometry. For a balanced equation, atom counts and charge are conserved; molecule count need not be. This operation prescribes progress and does not calculate equilibrium or a rate law. A tiny negative value caused solely by endpoint roundoff is returned as zero.

### Reflecting 1D diffusion

```js
PH.diffuseStep(values, alpha) // -> new values array
```

`values` are nonnegative concentrations, probabilities, or expected counts in equal-width cells. `alpha = D * dt / dx^2` is dimensionless and must lie in `[0, 0.5]`. For interior cells, `next_i = (1-2alpha)c_i + alpha c_(i-1) + alpha c_(i+1)`. Each end cell has only its inward neighbor, giving `(1-alpha)c_end + alpha c_neighbor`; a singleton is unchanged. These are reflecting cell boundaries with no exterior flux.

The update preserves the sum and nonnegativity within roundoff. Use sufficiently small `alpha` and spatial/time refinement when temporal accuracy matters; stability alone does not establish accuracy. The nearest-neighbor master equation and reflecting boundary updates are presented in [Beeler and Galstyan's Caltech tutorial](https://www.rpgroup.caltech.edu/mbl_pboc/code/diffusion_master_equation.html). Identifying the second spatial difference in that equation gives `D = k dx^2`. For a fluorescent-tracer example, diffusing fluorescence does not imply molecules were deleted during bleaching. The operation has no drift, binding, variable cell widths, or sources/sinks.

### Binding kinetics

```js
PH.bindingStep(theta, { kon, koff, concentration, dt }) // -> next theta
```

`theta` is in `[0,1]`. All four options are required and nonnegative. With concentration unit C and time unit t, `kon` has units C^-1 t^-1, `koff` has t^-1, `concentration` has C, and `dt` has t. Concentration is **free ligand**, constant over the step. With `a = kon*concentration`, `lambda = a+koff`, and `thetaEq = a/lambda`, the exact update is `thetaEq + (theta-thetaEq) exp(-lambda*dt)`. Zero total rate leaves the fraction unchanged.

This is the analytic solution of `dtheta/dt = a(1-theta)-koff*theta`, the same one-site mass-action model cited above. It approaches equilibrium without explicit-Euler overshoot. `kon*concentration` and their sum with `koff` must be representable finite rates. Rates changing during a step, ligand depletion, multiple site classes, and cooperative binding require a different model.

### One-ion Nernst potential

```js
PH.nernst(outside, inside, { z = 1, T = 298.15 } = {}) // -> volts
```

Both concentrations are strictly positive and use the same unit; `T > 0` is kelvin. `z` is the signed nonzero integer valence (represented as a safe JavaScript integer). The convention is `Vinside - Voutside = RT/(zF) ln(outside/inside)`. At 298.15 K, a tenfold excess outside gives approximately `+0.05915935 V` for `z = +1` and the negative of that for `z = -1`. Multiply by 1,000 to display mV.

The sign convention, activity ratio, and zero net flux at the ion's equilibrium potential are stated explicitly by [Hille and Catterall, Basic Neurochemistry](https://www.ncbi.nlm.nih.gov/books/NBK28117/). PH uses the ideal concentration-ratio approximation. This is an individual ion's equilibrium potential; it does not determine an actual membrane voltage when several permeant ions, pumps, or nonequilibrium currents contribute. The implementation uses `R/F = kB/e` and a difference of logarithms to avoid overflowing a concentration ratio.

### Photon energy

```js
PH.photon(wavelengthNm) // -> { joules, eV }
PH.photon(400) // approximately { joules: 4.966114643e-19, eV: 3.099604961 }
```

Supply a strictly positive **vacuum wavelength in nanometers**. Returns energy per photon `E = hc/lambda`, converting nm to m and joules to eV. Both results must be finite and positive. The photon relation is given in [OpenStax College Physics 2e §29.3](https://openstax.org/books/college-physics-2e/pages/29-3-photon-energies-and-the-electromagnetic-spectrum). This calculates the photon's energy, not an absorption probability, transition lifetime, or a molecule's energy levels. A wavelength inside a medium cannot be substituted without accounting for its refractive index.

### First-order decay

```js
PH.firstOrder(initial, k, time) // -> remaining amount/concentration/fraction
```

All arguments are nonnegative. `k` has inverse-time units and `time` uses that time unit; output retains the unit of `initial`. Returns `initial * exp(-k*time)`, with constant rate and no replenishment. The half-life for positive `k` is `ln(2)/k`. This is the integrated first-order rate law in [OpenStax Chemistry 2e §12.4](https://openstax.org/books/chemistry-2e/pages/12-4-integrated-rate-laws). A smooth expectation is not the disappearance time of a particular molecule.

## Constants and verification

The SI-defined values are `h = 6.62607015e-34 J s`, `c = 299792458 m/s`, `e = 1.602176634e-19 C`, and `kB = 1.380649e-23 J/K`. These exact definitions are listed in [NIST SP 330 §2](https://www.nist.gov/pml/special-publication-330/sp-330-section-2). Decimal arithmetic in this implementation uses JavaScript binary floating point. Sources were checked on 13 September 2026; the API is an independent implementation, with no external simulation code or artwork copied.

Run `node --test tests/physical-chemistry.cjs` from the kit root. The suite loads this script in an empty JavaScript context and checks analytic landmarks, a numerical energy derivative, charge sign and neutral translation, atom conservation with a balanced reaction, diffusion mass/positivity/reflection over repeated steps, kinetic time composition and limiting cases, Nernst signs and units, and an independent 400 nm photon fixture. It also checks invalid domains, representative numeric extremes, and input immutability. Rendering and authored motion require their own lesson checks.
