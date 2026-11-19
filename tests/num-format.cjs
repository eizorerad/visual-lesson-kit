/* N.fmt sign handling. Loads lib/num.js into a bare vm context. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = process.env.LESSON_TEST_DIR || path.resolve(__dirname, '../starter');
const window = {};
const context = vm.createContext({ window });
vm.runInContext(fs.readFileSync(path.join(root, 'js/lib/num.js'), 'utf8'), context);
const N = window.N;

test('small negatives that round to zero carry no minus sign', () => {
  assert.equal(N.fmt(-0.004), '0.00');
  assert.equal(N.fmt(-0.0004, 3), '0.000');
  assert.equal(N.fmt(-0.4, 0), '0');
});
test('normal negatives keep the minus sign', () => {
  assert.equal(N.fmt(-1.5), '−1.50');
  assert.equal(N.fmt(-0.006), '−0.01');
});
test('positives and zero', () => {
  assert.equal(N.fmt(1.5), '1.50');
  assert.equal(N.fmt(0), '0.00');
  assert.equal(N.fmt(3.14159, 3), '3.142');
});
test('null, undefined and NaN give an en dash', () => {
  assert.equal(N.fmt(null), '–');
  assert.equal(N.fmt(undefined), '–');
  assert.equal(N.fmt(NaN), '–');
});
