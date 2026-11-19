/* Axis tick labels derive their decimals from the tick step. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = process.env.LESSON_TEST_DIR || path.resolve(__dirname, '../starter');
const window = { D: { dom: { s: () => ({}) } } };
const context = vm.createContext({ window, document: {} });
for (const f of ['num.js', 'svg.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/lib', f), 'utf8'), context);
}
const tickFormat = window.S && window.S.tickFormat;

test('tickFormat is exposed', () => assert.equal(typeof tickFormat, 'function'));
test('step 0.001 keeps small ticks distinct', () => {
  assert.equal(tickFormat(0.001, 0.001), '0.001');
  assert.equal(tickFormat(0.0025, 0.0005), '0.0025');
  assert.notEqual(tickFormat(0.001, 0.001), tickFormat(0.002, 0.001));
});
test('step 0.25 shows two decimals', () => {
  assert.equal(tickFormat(1.25, 0.25), '1.25');
  assert.equal(tickFormat(0.5, 0.25), '0.50');
});
test('step 5 shows integers', () => {
  assert.equal(tickFormat(5, 5), '5');
  assert.equal(tickFormat(-10, 5), '−10');
  assert.equal(tickFormat(0, 5), '0');
});
test('negative near zero has no bare minus', () => {
  assert.equal(tickFormat(-0.004, 0.001), '−0.004');
  assert.equal(tickFormat(-0.004, 1), '0');
  assert.equal(tickFormat(-0.004), '−0.004');
});
test('step-less fallback does not collapse small values or round fractions', () => {
  assert.equal(tickFormat(0.001), '0.001');
  assert.equal(tickFormat(0.0025), '0.0025');
  assert.equal(tickFormat(1.25), '1.25');
  assert.equal(tickFormat(10.5), '10.5');
  assert.equal(tickFormat(5), '5');
});
test('values of 1000 and more use grouped integers', () => {
  assert.equal(tickFormat(12500, 2500), window.N.fmtInt(12500));
});
