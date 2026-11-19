const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function imageURL(page) {
  const { window } = await JSDOM.fromFile(page, { runScripts: 'dangerously', resources: 'usable' });
  try {
    if (window.document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }
    return window.document.querySelector('svg image').getAttribute('href');
  } finally {
    window.close();
  }
}

test('F.image reads a selected SVG in the generated lesson and embeds its bytes in the isolated export', async t => {
  const root = path.join(__dirname, '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vlk-assets-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const kit = path.join(tmp, 'kit');
  for (const rel of ['create.py', 'VERSION', 'starter/index.html', 'starter/assets/illustrative-figure.svg',
    'starter/build/bundle.py', 'starter/js/lib/dom.js', 'starter/js/lesson.js', 'starter/js/film.js']) {
    fs.mkdirSync(path.dirname(path.join(kit, rel)), { recursive: true });
    fs.copyFileSync(path.join(root, rel), path.join(kit, rel));
  }
  const asset = 'assets/shared.svg';
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>\n');
  const starter = path.join(kit, 'starter');
  fs.writeFileSync(path.join(starter, asset), svg);
  fs.writeFileSync(path.join(starter, 'assets/unused.svg'), svg);
  fs.writeFileSync(path.join(starter, 'blank.html'), `<!doctype html><title>Fixture</title>
    <a href="${asset}">Source figure</a><svg></svg>
    <script src="js/lib/dom.js"></script><script src="js/lesson.js"></script><script src="js/film.js"></script>
    <script>F.image(document.querySelector('svg'), 'shared.svg', 0, 0, 8, 8, 'Circle');</script>`);

  for (const profile of ['full', 'lean']) {
    const lesson = path.join(tmp, profile);
    execFileSync('python3', [path.join(kit, 'create.py'), lesson, ...(profile === 'lean' ? ['--lean'] : [])]);
    const { files } = JSON.parse(fs.readFileSync(path.join(lesson, 'lesson-kit.json'), 'utf8'));
    assert.equal(files[asset], createHash('sha256').update(svg).digest('hex'));
    assert.equal(fs.existsSync(path.join(lesson, 'assets/unused.svg')), profile === 'full');
    const href = await imageURL(path.join(lesson, 'index.html'));
    assert.equal(href, asset);
    assert.deepEqual(fs.readFileSync(path.join(lesson, href)), svg);

    const standalone = path.join(tmp, profile + '-isolated', 'lesson.html');
    execFileSync('python3', [path.join(lesson, 'build/bundle.py'), '-o', standalone]);
    const embedded = await imageURL(standalone);
    assert.match(embedded, /^data:image\/svg\+xml;base64,/);
    assert.deepEqual(Buffer.from(embedded.split(',')[1], 'base64'), svg);
  }
});
