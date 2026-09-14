/* The exported source figure must be valid standalone SVG, with intact local fonts. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const kit=path.resolve(__dirname,'..'),starter=process.env.LESSON_TEST_DIR||path.join(kit,'starter');
test('illustrative source SVG parses as XML and preserves scientific marks, font bytes and full notice',t=>{
 const text=fs.readFileSync(path.join(starter,'assets/illustrative-figure.svg'),'utf8');
 const dom=new JSDOM('');t.after(()=>dom.window.close());
 const xml=new dom.window.DOMParser().parseFromString(text,'image/svg+xml');
 assert.equal(xml.querySelector('parsererror'),null,'standalone source SVG must parse without an XML parsererror');
 assert.equal(xml.documentElement.namespaceURI,'http://www.w3.org/2000/svg');assert.equal(xml.documentElement.getAttribute('viewBox'),'0 0 1024 640');
 assert.deepEqual(Array.from(xml.querySelectorAll('circle'),node=>['cx','cy','r'].map(key=>+node.getAttribute(key))),[[208,413,9],[222,382,9],[236,351,9],[350,289,9],[364,258,9],[378,227,9]]);
 assert.equal(xml.querySelectorAll('rect[width="90"][height="90"]').length,9);
 const css=xml.querySelector('style').textContent,notice=fs.readFileSync(path.join(kit,'licenses/SourceSans3-OFL.md'),'utf8').replace(/\r\n/g,'\n').trim();assert.ok(css.includes(notice),'complete font license survives XML parsing');
 const payloads=Array.from(css.matchAll(/url\(["']?data:font\/woff2;base64,([A-Za-z0-9+/=]+)["']?\)/g),match=>Buffer.from(match[1],'base64'));
 const manifest=JSON.parse(fs.readFileSync(path.join(kit,'licenses/font-manifest.json'),'utf8'));
 const expected=manifest.fonts.filter(font=>font.family==='Source Sans 3'&&font.style==='normal'&&[400,700].includes(font.weight)).map(font=>font.sha256).sort();
 assert.equal(payloads.length,2);assert.deepEqual(payloads.map(bytes=>crypto.createHash('sha256').update(bytes).digest('hex')).sort(),expected);
});
