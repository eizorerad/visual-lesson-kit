/* Distribution identity contract; this is not a legal clearance test. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const retired=new RegExp(['3'+'b1b','3'+'blue1brown','three'+'blueonebrown'].join('|'),'i');
const excluded=new Set(['node_modules','dist','tests','verification','__pycache__','.git']);
function files(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(excluded.has(e.name))return [];
  const p=path.join(dir,e.name);
  return e.isDirectory()?files(p):/\.(?:md|js|cjs|css|html|json|py|svg|txt)$/i.test(e.name)?[p]:[];
 });
}
test('active distribution has a neutral identity and no retired visual-reference branding',()=>{
 const readable=p=>fs.readFileSync(p,'utf8').replace(/data:[^;,\s]*;base64,[A-Za-z0-9+/=\r\n]+/g,'[embedded asset]');
 const hits=files(root).filter(p=>retired.test(readable(p))).map(p=>path.relative(root,p));
 assert.deepEqual(hits,[],'retired naming remains in active source or guides');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).name,'visual-lesson-kit');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'starter/lesson-kit.json'))).kit,'visual-lesson-kit');
});
test('new authors can follow the catalogue without consulting a prior presentation',()=>{
 const catalogue=fs.readFileSync(path.join(root,'docs/reference-patterns.md'),'utf8');
 assert.doesNotMatch(catalogue,/file:\/\/|\/Users\/leo\/MBZUAI\/CBIO|references\/ps-lesson\.html/);
 for(const m of catalogue.matchAll(/\]\(([^)]+)\)/g)){
  if(/^(?:https?:|#)/.test(m[1]))continue;
  const target=path.resolve(root,'docs',m[1].split('#')[0]);
  assert.ok(target.startsWith(root+path.sep),'catalogue link leaves kit: '+m[1]);
  assert.ok(fs.existsSync(target),'missing catalogue link: '+m[1]);
 }
});
