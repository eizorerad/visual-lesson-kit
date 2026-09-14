/* Numbers: a seeded random source, descriptive statistics, a bootstrap, and
   enough dense linear algebra for the toy matrices the scenes factorise.
   Nothing here mutates its input; every function returns a fresh value. */
(function (global) {
  'use strict';

  /* mulberry32: seeded, [0, 1). */
  function rng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = Math.imul(state ^ (state >>> 15), state | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(random) {
    var u = Math.max(random(), 1e-12);
    var v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function sum(xs) { return xs.reduce(function (a, b) { return a + b; }, 0); }
  function mean(xs) { return xs.length ? sum(xs) / xs.length : 0; }

  function sd(xs) {
    if (xs.length < 2) return 0;
    var m = mean(xs);
    return Math.sqrt(sum(xs.map(function (x) { return (x - m) * (x - m); })) / (xs.length - 1));
  }

  function sorted(xs) { return xs.slice().sort(function (a, b) { return a - b; }); }

  function quantile(xs, q) {
    var s = sorted(xs);
    if (!s.length) return NaN;
    var pos = (s.length - 1) * q;
    var lo = Math.floor(pos);
    var hi = Math.min(s.length - 1, lo + 1);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }

  function pearson(xs, ys) {
    var mx = mean(xs), my = mean(ys);
    var sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < xs.length; i += 1) {
      var dx = xs[i] - mx, dy = ys[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
  }

  function ranks(xs) {
    var order = xs.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return a.x - b.x; });
    var out = new Array(xs.length);
    var k = 0;
    while (k < order.length) {
      var j = k;
      while (j + 1 < order.length && order[j + 1].x === order[k].x) j += 1;
      var r = (k + j) / 2 + 1;
      for (var q = k; q <= j; q += 1) out[order[q].i] = r;
      k = j + 1;
    }
    return out;
  }

  function spearman(xs, ys) { return pearson(ranks(xs), ranks(ys)); }

  function bootstrapMeans(values, count, random) {
    var out = [];
    for (var b = 0; b < count; b += 1) {
      var acc = 0;
      for (var i = 0; i < values.length; i += 1) acc += values[Math.floor(random() * values.length)];
      out.push(acc / values.length);
    }
    return out;
  }

  /* ---------- matrices (arrays of rows) ---------- */

  function zeros(rows, cols) {
    return Array.from({ length: rows }, function () { return new Array(cols).fill(0); });
  }

  function identity(n) {
    return zeros(n, n).map(function (row, i) { return row.map(function (_, j) { return i === j ? 1 : 0; }); });
  }

  function transpose(A) {
    return A[0].map(function (_, j) { return A.map(function (row) { return row[j]; }); });
  }

  function mul(A, B) {
    var C = zeros(A.length, B[0].length);
    for (var i = 0; i < A.length; i += 1) {
      for (var k = 0; k < B.length; k += 1) {
        var a = A[i][k];
        if (a === 0) continue;
        for (var j = 0; j < B[0].length; j += 1) C[i][j] += a * B[k][j];
      }
    }
    return C;
  }

  function add(A, B) { return A.map(function (row, i) { return row.map(function (v, j) { return v + B[i][j]; }); }); }
  function sub(A, B) { return A.map(function (row, i) { return row.map(function (v, j) { return v - B[i][j]; }); }); }
  function scale(A, c) { return A.map(function (row) { return row.map(function (v) { return v * c; }); }); }
  function frob(A) { return Math.sqrt(sum(A.map(function (row) { return sum(row.map(function (v) { return v * v; })); }))); }

  function inverse(input) {
    var n = input.length;
    var M = input.map(function (row, i) {
      return row.concat(Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; }));
    });
    for (var col = 0; col < n; col += 1) {
      var pivot = col;
      for (var r = col + 1; r < n; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      var swap = M[col]; M[col] = M[pivot]; M[pivot] = swap;
      var d = M[col][col] || 1e-12;
      M[col] = M[col].map(function (v) { return v / d; });
      for (var r2 = 0; r2 < n; r2 += 1) {
        if (r2 === col || M[r2][col] === 0) continue;
        var factor = M[r2][col];
        M[r2] = M[r2].map(function (v, c) { return v - factor * M[col][c]; });
      }
    }
    return M.map(function (row) { return row.slice(n); });
  }

  /* Ridge regression, W = (XᵀX + λI)⁻¹ XᵀY, columns of Y fitted together. */
  function ridge(X, Y, lambda) {
    var Xt = transpose(X);
    var G = mul(Xt, X);
    var reg = G.map(function (row, i) { return row.map(function (v, j) { return i === j ? v + lambda : v; }); });
    return mul(inverse(reg), mul(Xt, Y));
  }

  /* Jacobi eigendecomposition of a symmetric matrix, eigenvalues descending. */
  function jacobiEigen(input) {
    var n = input.length;
    var A = input.map(function (row) { return row.slice(); });
    var V = identity(n);
    for (var sweep = 0; sweep < 120; sweep += 1) {
      var off = 0;
      for (var p = 0; p < n; p += 1) for (var q = p + 1; q < n; q += 1) off += A[p][q] * A[p][q];
      if (off < 1e-18) break;
      for (var p2 = 0; p2 < n; p2 += 1) {
        for (var q2 = p2 + 1; q2 < n; q2 += 1) {
          if (Math.abs(A[p2][q2]) < 1e-15) continue;
          var theta = (A[q2][q2] - A[p2][p2]) / (2 * A[p2][q2]);
          var t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1);
          var s = t * c;
          for (var k = 0; k < n; k += 1) {
            var akp = A[k][p2], akq = A[k][q2];
            A[k][p2] = c * akp - s * akq;
            A[k][q2] = s * akp + c * akq;
          }
          for (var k2 = 0; k2 < n; k2 += 1) {
            var apk = A[p2][k2], aqk = A[q2][k2];
            A[p2][k2] = c * apk - s * aqk;
            A[q2][k2] = s * apk + c * aqk;
            var vkp = V[k2][p2], vkq = V[k2][q2];
            V[k2][p2] = c * vkp - s * vkq;
            V[k2][q2] = s * vkp + c * vkq;
          }
        }
      }
    }
    var order = A.map(function (row, i) { return { value: row[i], i: i }; }).sort(function (a, b) { return b.value - a.value; });
    return {
      values: order.map(function (o) { return o.value; }),
      vectors: order.map(function (o) { return V.map(function (row) { return row[o.i]; }); })
    };
  }

  /* Thin SVD of an m×n matrix through the eigenvectors of AᵀA. Returns
     singular values descending, with U (m×r) and V (n×r) as column lists. */
  function svd(A) {
    var At = transpose(A);
    var eig = jacobiEigen(mul(At, A));
    var r = Math.min(A.length, A[0].length);
    var S = [], U = [], V = [];
    for (var k = 0; k < r; k += 1) {
      var sigma = Math.sqrt(Math.max(0, eig.values[k]));
      var v = eig.vectors[k];
      var u = A.map(function (row) { return sigma > 1e-12 ? sum(row.map(function (a, j) { return a * v[j]; })) / sigma : 0; });
      S.push(sigma); U.push(u); V.push(v);
    }
    return { S: S, U: U, V: V };
  }

  /* Rank-k reconstruction from a thin SVD. */
  function lowRank(decomp, k, rows, cols) {
    var out = zeros(rows, cols);
    for (var layer = 0; layer < k && layer < decomp.S.length; layer += 1) {
      var s = decomp.S[layer], u = decomp.U[layer], v = decomp.V[layer];
      out = out.map(function (row, i) { return row.map(function (val, j) { return val + s * u[i] * v[j]; }); });
    }
    return out;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function fmt(x, digits) {
    if (x === null || x === undefined || isNaN(x)) return '–';
    var d = digits === undefined ? 2 : digits;
    var s = Math.abs(x).toFixed(d);
    return (x < 0 ? '−' : '') + s;
  }

  function fmtInt(x) {
    return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  global.N = {
    rng: rng, gaussian: gaussian, sum: sum, mean: mean, sd: sd, sorted: sorted, quantile: quantile,
    pearson: pearson, spearman: spearman, ranks: ranks, bootstrapMeans: bootstrapMeans,
    zeros: zeros, identity: identity, transpose: transpose, mul: mul, add: add, sub: sub, scale: scale, frob: frob,
    inverse: inverse, ridge: ridge, jacobiEigen: jacobiEigen, svd: svd, lowRank: lowRank,
    clamp: clamp, lerp: lerp, fmt: fmt, fmtInt: fmtInt
  };
})(window);
