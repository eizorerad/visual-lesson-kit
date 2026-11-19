const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const create = path.resolve(__dirname, '../../create.py');
const blank = 'js/episodes/blank.js';
// A full project ships many optional scripts. Only these belong on the blank page.
const blankModules = new Set([
  'js/config.js', 'js/appearance.js', 'js/lib/dom.js', 'js/lib/i18n.js', 'js/i18n/en.js',
  'js/lib/touch.js', 'js/lib/num.js', 'js/lib/anim.js', 'js/lib/plot.js', 'js/lib/svg.js',
  'js/deck.js', 'js/lesson.js', 'js/interaction-regions.js', 'js/film.js', 'js/layout.js',
  'js/motion.js', 'js/patterns.js', blank, 'js/player.js', 'js/boot.js'
]);

function assertBlankModules(paths) {
  assert.deepEqual(paths.filter(name => !blankModules.has(name)), [], 'unexpected lesson scripts');
  for (const name of [blank, 'js/player.js', 'js/boot.js']) {
    assert.ok(paths.includes(name), 'missing ' + name);
  }
}

async function assertBlankFrame(page) {
  assert.deepEqual(await page.locator('.scene-error').allTextContents(), []);
  const state = await page.evaluate(() => {
    const deck = window.D.deck, frame = document.getElementById('frame');
    const current = deck.current();
    return {
      scenes: deck.scenes().map(scene => scene.id), index: current?.index, step: current?.step,
      mounted: frame.childElementCount === 1 && frame.firstElementChild === deck.root()
    };
  });
  assert.deepEqual(state, { scenes: ['blank'], index: 0, step: 0, mounted: true });
  assert.ok(await page.locator('#frame > .scene svg.film-viz').isVisible(), 'blank drawing is visible');
}

async function checkControls(page) {
  await assertBlankFrame(page);
  const overview = page.locator('#overview');
  assert.ok(await overview.isHidden());
  await page.getByRole('button', { name: 'Все сцены', exact: true }).click();
  assert.ok(await overview.isVisible(), 'Overview opened');
  const grid = overview.locator('#overviewGrid');
  assert.equal(await grid.getByRole('button').count(), 1);
  await grid.getByRole('button', { name: /Первая сцена/ }).click();
  assert.ok(await overview.isHidden(), 'selecting the scene closed Overview');
  await assertBlankFrame(page);

  const root = await page.evaluateHandle(() => window.D.deck.root());
  const step = page.locator('#stepCount');
  assert.ok(await step.isVisible());
  assert.equal(await step.innerText(), 'Шаг 1 / 1');
  await page.locator('[data-action="more"]').click();
  for (const [lang, label] of [['en', 'Step 1 / 1'], ['ru', 'Шаг 1 / 1']]) {
    await page.locator('#languageToggle').click();
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.ok(await step.isVisible());
    assert.equal(await step.innerText(), label);
    assert.ok(await root.evaluate(node => node.isConnected && node === window.D.deck.root()),
      'changing language must preserve the mounted scene');
  }
  await assertBlankFrame(page);
}

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function checkPage(t, file, offline) {
  const url = pathToFileURL(file).href;
  const context = await browser.newContext({ offline });
  t.after(() => context.close());
  context.setDefaultTimeout(10_000);
  const requests = [], errors = [];
  context.on('request', request => requests.push(request));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  assert.deepEqual(errors, []);
  await checkControls(page);
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(errors, []);

  if (offline) {
    const external = requests.map(request => request.url()).filter(url => !/^(data|blob):/.test(url));
    assert.deepEqual(external, [url], 'the isolated HTML must be the only file or network request');
    const html = fs.readFileSync(file, 'utf8');
    assertBlankModules(Array.from(html.matchAll(/<script>\s*\/\* ([^*\n]+) \*\//g), m => m[1]));
  } else {
    const base = new URL('.', url).href;
    const scripts = requests.filter(request =>
      request.resourceType() === 'script' || new URL(request.url()).pathname.endsWith('.js'));
    assert.deepEqual(scripts.filter(request => request.failure()).map(request => request.url()), [],
      'source scripts failed to load');
    assertBlankModules(scripts.map(request => request.url().replace(base, '').split(/[?#]/)[0]));
  }
}

for (const [profile, flags] of [['full', []], ['lean', ['--lean']]]) {
  test(profile + ' default lesson', async t => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-startup-'));
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const lesson = path.join(tmp, 'lesson');
    execFileSync('python3', [create, lesson, ...flags]);
    await t.test('generated source', t => checkPage(t, path.join(lesson, 'index.html'), false));

    execFileSync('python3', ['build/bundle.py'], { cwd: lesson });
    const isolated = path.join(tmp, 'isolated');
    fs.mkdirSync(isolated);
    const file = path.join(isolated, 'lesson.html');
    fs.copyFileSync(path.join(lesson, 'dist/lesson.html'), file);
    await t.test('isolated offline export', t => checkPage(t, file, true));
  });
}
