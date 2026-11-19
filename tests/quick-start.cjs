const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const kit = path.resolve(__dirname, '..');
for (const guide of ['README.md', 'README.ru.md', 'starter/README.md']) {
  test(guide + ': paste the first edit, build and toggle the exported edge', async t => {
    const lesson = fs.mkdtempSync(path.join(os.tmpdir(), 'quick-start-'));
    t.after(() => fs.rmSync(lesson, { recursive: true, force: true }));
    const python = (...args) => execFileSync('python3', args, { cwd: lesson });
    python(path.join(kit, 'create.py'), lesson);

    const readme = guide === 'starter/README.md' ? path.join(lesson, 'README.md') : path.join(kit, guide);
    const instructions = fs.readFileSync(readme, 'utf8');
    const example = /^```js\n([\s\S]+?)\n```$/m.exec(instructions);
    assert.ok(example, 'missing JavaScript snippet');
    const directions = instructions.slice(0, example.index).trimEnd().split(/\n\s*\n/).pop();
    const scene = directions.match(/`(js\/episodes\/[^`]+\.js)`/)?.[1];
    const anchor = directions.match(/`(return [^`\n]+;)`/)?.[1];
    assert.ok(scene && anchor, 'expected the scene path and quoted insertion line before the snippet');
    const file = path.join(lesson, scene);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const at = lines.findIndex(line => line.trim() === anchor);
    assert.notEqual(at, -1, 'missing insertion line: ' + anchor);
    lines.splice(at, 0, example[1]);
    fs.writeFileSync(file, lines.join('\n'));
    python('build/bundle.py');

    const html = fs.readFileSync(path.join(lesson, 'dist/lesson.html'), 'utf8');
    const { window: w } = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
    t.after(() => w.close());
    await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
    const svg = w.document.querySelector('#frame svg.film-viz');
    assert.ok(svg, 'the edited scene mounted');
    const nodes = Array.from(svg.querySelectorAll('circle'));
    const edge = svg.querySelector('line'), label = svg.querySelector('text');
    const button = svg.querySelector('[role="button"]');
    assert.equal(nodes.length, 2);
    const point = (el, x, y) => [el.getAttribute(x), el.getAttribute(y)];
    const centers = nodes.map(node => point(node, 'cx', 'cy'));
    assert.notDeepEqual(centers[0], centers[1]);
    assert.deepEqual([point(edge, 'x1', 'y1'), point(edge, 'x2', 'y2')], centers);
    const width = () => Number(edge.getAttribute('stroke-width'));
    const thin = width();
    assert.ok(thin > 0);
    assert.equal(label.textContent, '1');

    for (const input of ['click', 'Enter', ' ']) {
      if (input !== 'click') {
        button.focus();
        assert.equal(w.document.activeElement, button);
      }
      for (const weight of [2, 1]) {
        if (input === 'click') {
          edge.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
        } else {
          for (const type of ['keydown', 'keyup']) {
            w.document.activeElement.dispatchEvent(new w.KeyboardEvent(type, {
              key: input, bubbles: true, cancelable: true
            }));
          }
        }
        assert.equal(label.textContent, String(weight));
        if (weight === 2) assert.ok(width() > thin);
        else assert.equal(width(), thin);
        assert.equal(button.getAttribute('aria-pressed'), String(weight === 2));
        assert.ok(svg.isConnected && [edge, label, ...nodes].every(el => svg.contains(el)),
          'the same edge, label and nodes must stay on the stage');
        assert.equal(svg.querySelectorAll('line').length, 1);
        assert.equal(svg.querySelectorAll('circle').length, 2);
        assert.deepEqual(nodes.map(node => point(node, 'cx', 'cy')), centers);
      }
    }
  });
}
