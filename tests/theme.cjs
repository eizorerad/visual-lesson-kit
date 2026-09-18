/* Theme contracts: fixed teaching roles, offline font bytes and complete notices. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const kit = path.resolve(__dirname, '..'), starter = process.env.LESSON_TEST_DIR || path.join(kit, 'starter');
const read = file => fs.readFileSync(path.join(starter, file), 'utf8');
const sourceFiles = directory => fs.readdirSync(path.join(starter, directory), {withFileTypes:true})
  .flatMap(entry => entry.isDirectory() ? sourceFiles(directory+'/'+entry.name)
    : /\.(?:css|js|svg)$/.test(entry.name) ? [directory+'/'+entry.name] : []);
const expected = {
  blue:'var(--color-primary)', blueD:'var(--color-primary)', blueE:'var(--color-primary)', blueB:'var(--color-primary)',
  teal:'var(--color-secondary)', green:'var(--color-secondary)', greenE:'var(--color-secondary)', yellow:'var(--color-focus)', yellowD:'var(--color-focus)', gold:'var(--color-focus)',
  red:'var(--color-contrast)', redE:'var(--color-contrast)', maroon:'var(--color-contrast)', purple:'var(--color-auxiliary)', purpleB:'var(--color-auxiliary)',
  orange:'var(--color-primary)', pink:'var(--color-contrast)', grey:'var(--color-muted)', greyB:'var(--color-muted)', greyD:'var(--color-dim)', greyE:'var(--color-bg)',
  white:'var(--color-text)', bg:'var(--color-bg)', dim:'var(--color-dim)'
};
test('the legacy color API retains its keys and uses only five accent colors', () => {
  const context = {D:{dom:{}}, LESSON:{}}; context.window = context;
  vm.createContext(context);
  for (const file of ['js/lib/plot.js', 'js/lesson.js']) vm.runInContext(read(file), context);
  assert.deepEqual({...context.C}, expected);
  assert.equal(new Set(Object.values(context.C)).size, 9, 'five accents plus four neutrals');
  assert.equal(context.P.diverging(0, 1), 'var(--color-bg)', 'zero uses the canvas background');
});
test('active runtime and styles use reactive roles; source images keep their own colors', () => {
  const files = ['css','js'].flatMap(sourceFiles);
  for (const file of files) {
    const source = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
    if (!['js/appearance.js','css/appearance.css'].includes(file)) {
      assert.doesNotMatch(source, /#[0-9a-f]{6,8}\b/i, file + ' must use roles rather than fixed theme colors');
      assert.doesNotMatch(source, /rgba?\(\s*\d+\s*,/i, file + ' must derive alpha colors from roles');
    }
    assert.doesNotMatch(source, /CM (?:Serif|Sans|Math)|STIX|Computer Modern|manim/i, file);
    assert.doesNotMatch(source, /filter\s*:\s*invert/i, file+' must not invert source-image colors');
  }
  // Canvas molecular renderers legitimately observe palette changes and read
  // CSS colors. Source-image immutability is exercised in appearance.cjs;
  // textual proximity of MutationObserver and "color" cannot prove a rewrite.
});
test('font binaries match the recorded upstream bytes and full upstream notices remain in standalone CSS', () => {
  const manifestPath=path.join(kit,'licenses/font-manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'font provenance manifest exists');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const css=read('css/fonts.css');
  assert.deepEqual([...new Set(manifest.fonts.map(font=>font.family))].sort(), ['DejaVu Sans','Source Code Pro','Source Sans 3','Source Serif 4']);
  assert.equal(new Set(manifest.fonts.map(font=>font.path)).size,manifest.fonts.length);
  for(const font of manifest.fonts){
    const bytes=fs.readFileSync(path.join(starter, font.path));
    assert.ok(bytes.subarray(0,4).equals(Buffer.from('wOF2')) || bytes.readUInt32BE(0)===0x00010000, 'official WOFF2 or TrueType file');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),font.sha256,font.path);
    assert.ok(/^https:\/\/raw\.githubusercontent\.com\/adobe-fonts\/(?:source-sans|source-code-pro|source-serif)\/[0-9a-f]{40}\//.test(font.url) || font.url==='https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2', 'pinned official upstream source');
    assert.ok(css.includes('../'+font.path),font.path+' is loaded locally');
  }
  for(const license of manifest.licenses){
    const text=fs.readFileSync(path.join(kit,license.path),'utf8').replace(/\r\n/g,'\n').trim();
    assert.ok(css.includes(text),'complete '+license.path+' is copied in CSS');
    if(license.kind==='OFL-1.1'){assert.match(text,/SIL OPEN FONT LICENSE Version 1.1/);assert.match(text,/Reserved Font Name/);}
    else {assert.match(text,/Bitstream Vera Fonts Copyright/);assert.match(text,/Arev Fonts Copyright/);assert.match(text,/DejaVu changes are in public domain/);}
  }
  assert.equal((css.match(/@font-face/g)||[]).length,manifest.fonts.length);
  assert.match(css,/font-family:\s*['"]Source Sans 3['"]/);
  assert.match(css,/font-family:\s*['"]Source Code Pro['"]/);
  assert.match(css,/font-family:\s*['"]DejaVu Sans['"]/);
  assert.match(css,/font-family:\s*['"]Source Serif 4['"]/);
  assert.doesNotMatch(css,/url\(['"]?https?:/);
  assert.ok(read('css/russian-font.css').length<500,'compatibility stylesheet contains no old payload');
});
test('local mathematical fallback follows the primary typefaces in every teaching stack', () => {
  const css=read('css/fonts.css');
  for(const variable of ['text','math','sans','ui']) assert.match(css,new RegExp('--f-'+variable+':\\s*"Source Sans 3",\\s*"DejaVu Sans"'));
  assert.match(css,/--f-mono:\s*"Source Code Pro",\s*"Source Sans 3",\s*"DejaVu Sans"/);
});
