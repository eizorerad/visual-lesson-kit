/* Small, independently testable physical chemistry models. See guide/physical-chemistry.md. */
(function () {
  'use strict';
  const freeze = Object.freeze;
  const PLANCK = 6.62607015e-34; // J s, exact SI definition
  const LIGHT = 299792458; // m s^-1, vacuum, exact
  const CHARGE = 1.602176634e-19; // C, exact; also joules per eV
  const BOLTZMANN = 1.380649e-23; // J K^-1, exact

  function finite(value, name) {
    if (!Number.isFinite(value)) throw new TypeError(name + ' must be a finite number');
    return value;
  }
  function nonnegative(value, name) {
    finite(value, name);
    if (value < 0) throw new RangeError(name + ' must be nonnegative');
    return value;
  }
  function positive(value, name) {
    finite(value, name);
    if (value <= 0) throw new RangeError(name + ' must be positive');
    return value;
  }
  function result(value, name) {
    if (!Number.isFinite(value)) throw new RangeError(name + ' exceeds the finite numeric range');
    return value;
  }
  function dense(input, name) {
    if (!Array.isArray(input) || !input.length) throw new TypeError(name + ' must be a nonempty array');
    return Array.from(input);
  }
  function options(input) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('options must be an object');
    return input;
  }

  // Positive force increases separation; U(infinity) = 0 and F = -dU/dr.
  function lennardJones(r, input = {}) {
    const { sigma = 1, epsilon = 1 } = options(input);
    positive(r, 'r'); positive(sigma, 'sigma'); nonnegative(epsilon, 'epsilon');
    if (epsilon === 0) return freeze({ energy: 0, force: 0 });
    const sixth = result((sigma / r) ** 6, '(sigma/r)^6');
    const energy = result(4 * epsilon * sixth * (sixth - 1), 'energy');
    const force = result(24 * epsilon / r * sixth * (2 * sixth - 1), 'force');
    return freeze({ energy, force });
  }

  // Physical dipole convention, sum(q_i r_i), in the supplied coordinate frame.
  function dipole(atoms) {
    let x = 0, y = 0;
    for (const atom of dense(atoms, 'atoms')) {
      if (atom === null || typeof atom !== 'object') throw new TypeError('each atom must supply x, y and q');
      finite(atom.x, 'atom.x'); finite(atom.y, 'atom.y'); finite(atom.q, 'atom.q');
      x = result(x + result(atom.q * atom.x, 'charge-weighted x'), 'dipole x');
      y = result(y + result(atom.q * atom.y, 'charge-weighted y'), 'dipole y');
    }
    return freeze({ x, y, magnitude: result(Math.hypot(x, y), 'dipole magnitude') });
  }

  // Independent one-site equilibrium, with free (not total) ligand concentration.
  function occupancy(cFree, kd) {
    nonnegative(cFree, 'cFree'); positive(kd, 'kd');
    if (cFree >= kd) return 1 / (1 + kd / cFree);
    const ratio = cFree / kd;
    return ratio / (1 + ratio);
  }

  function protonated(pH, pKa) {
    finite(pH, 'pH'); finite(pKa, 'pKa');
    const difference = pH - pKa;
    // Both branches avoid an overflowing positive exponential.
    if (difference >= 0) {
      const inverse = 10 ** -difference;
      return inverse / (1 + inverse);
    }
    return 1 / (1 + 10 ** difference);
  }

  function reaction(initial, stoich) {
    const concentrations = dense(initial, 'initial').map(c => nonnegative(c, 'concentration'));
    const coefficients = dense(stoich, 'stoich').map(nu => finite(nu, 'stoichiometric coefficient'));
    if (concentrations.length !== coefficients.length) throw new RangeError('initial and stoich must have equal lengths');
    let maximum = Infinity, consumed = false;
    coefficients.forEach((nu, i) => {
      if (nu < 0) { consumed = true; maximum = Math.min(maximum, concentrations[i] / -nu); }
    });
    if (!consumed) throw new RangeError('a forward reaction needs at least one negative stoichiometric coefficient');
    result(maximum, 'maximum extent');
    return { concentrations, coefficients, maximum };
  }

  function maxExtent(initial, stoich) { return reaction(initial, stoich).maximum; }

  function reactionExtent(initial, stoich, extent) {
    const { concentrations, coefficients, maximum } = reaction(initial, stoich);
    nonnegative(extent, 'extent');
    if (extent > maximum) throw new RangeError('extent exceeds the limiting reactant');
    return freeze(concentrations.map((c, i) => {
      const change = result(coefficients[i] * extent, 'concentration change');
      // With extent bounded above, only roundoff can put a reactant below zero.
      return Math.max(0, result(c + change, 'concentration'));
    }));
  }

  // Cell-centered reflecting ends: only the interior-facing edge transports mass.
  function diffuseStep(values, alpha) {
    const c = dense(values, 'values').map(value => nonnegative(value, 'value'));
    nonnegative(alpha, 'alpha');
    if (alpha > .5) throw new RangeError('explicit diffusion requires alpha <= 0.5');
    return freeze(c.map((value, i) => {
      const hasLeft = i > 0, hasRight = i + 1 < c.length;
      const neighbors = Number(hasLeft) + Number(hasRight);
      return result((1 - neighbors * alpha) * value + (hasLeft ? alpha * c[i - 1] : 0) + (hasRight ? alpha * c[i + 1] : 0), 'diffused value');
    }));
  }

  function bindingStep(theta, input) {
    const { kon, koff, concentration, dt } = options(input);
    nonnegative(theta, 'theta');
    if (theta > 1) throw new RangeError('theta must be in [0,1]');
    nonnegative(kon, 'kon'); nonnegative(koff, 'koff');
    nonnegative(concentration, 'concentration'); nonnegative(dt, 'dt');
    const association = result(kon * concentration, 'association rate');
    const rate = result(association + koff, 'total rate');
    if (rate === 0 || dt === 0) return theta;
    const equilibrium = association / rate;
    const elapsed = rate * dt; // Infinite elapsed exponent has the finite limit exp(-elapsed) = 0.
    const retained = Math.exp(-elapsed), approached = -Math.expm1(-elapsed);
    return Math.min(1, Math.max(0, theta * retained + equilibrium * approached));
  }

  // V_inside - V_outside. R/F = k_B/e; use log differences for extreme ratios.
  function nernst(outside, inside, input = {}) {
    const { z = 1, T = 298.15 } = options(input);
    positive(outside, 'outside'); positive(inside, 'inside'); positive(T, 'T'); finite(z, 'z');
    if (!Number.isSafeInteger(z) || z === 0) throw new RangeError('z must be a nonzero safe integer valence');
    return result((BOLTZMANN / CHARGE) * (T / z) * (Math.log(outside) - Math.log(inside)), 'Nernst voltage');
  }

  function photon(wavelengthNm) {
    positive(wavelengthNm, 'wavelengthNm');
    const joules = result(PLANCK * LIGHT * 1e9 / wavelengthNm, 'photon energy');
    const eV = result(joules / CHARGE, 'photon energy in eV');
    if (joules === 0 || eV === 0) throw new RangeError('photon energy is below the positive numeric range');
    return freeze({ joules, eV });
  }

  function firstOrder(initial, k, time) {
    nonnegative(initial, 'initial'); nonnegative(k, 'k'); nonnegative(time, 'time');
    return initial * Math.exp(-k * time);
  }

  globalThis.PH = freeze({ lennardJones, dipole, occupancy, protonated, reactionExtent, maxExtent, diffuseStep, bindingStep, nernst, photon, firstOrder });
})();
