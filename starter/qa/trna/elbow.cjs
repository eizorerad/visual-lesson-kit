/* Source geometry and deterministic rendering audit; browser readability is separate.
 * Run with jsdom installed, or set JSDOM_MODULE / NODE_PATH. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const root=path.resolve(__dirname,'../..'),fixture=JSON.parse(fs.readFileSync(path.join(root,'assets/trna/elbow-1ehz.json'),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b,label='coordinate')=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`);
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceRows=new Map(fixture.residues.map(r=>[r.id,r]));
const baseName=n=>!n.includes("'")&&n!=='P'&&!n.startsWith('OP');
const atomKey=(id,name)=>id+':'+name;
const pairKey=refs=>refs.map(([id,name])=>atomKey(id,name)).sort().join('|');
const BASE={fold:1,pairs:1,simple:1,model:1,angle:45,elbowZoom:1,elbowAtoms:0,elbowSecond:0,elbowStack:0};
function setup(t){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','white','purple'].map(k=>[k,'var(--color-'+k+')']));
 for(const file of ['lib/dom.js','film.js','layout.js','trna-data.js','trna-atoms.js','trna-elbow-data.js','trna-elbow.js','trna-world.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 return {w,E:w.TrnaElbow,W:w.TrnaWorld,T:w.TrnaAtoms,svg:w.document.querySelector('svg')};
}
function checkBasis(b){
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(b[i].reduce((s,v,k)=>s+v*b[j][k],0),i===j?1:0,'basis dot product');
 const [x,y,z]=b;near(x[0]*(y[1]*z[2]-y[2]*z[1])-x[1]*(y[0]*z[2]-y[2]*z[0])+x[2]*(y[0]*z[1]-y[1]*z[0]),1,'right-handed determinant');
}
function contacts(group){return [...group.querySelectorAll('[data-elbow-contact]')].map(line=>({line,refs:line.dataset.elbowContact.split('-').map(atom=>{const [id,name]=atom.split(':');return [+id,name];})}));}

test('elbow actor displays precisely seven source bases, preserving modified identities and no invented hydrogens',t=>{
 const {E,svg}=setup(t);assert.deepEqual(plain(E.data),fixture);
 const actor=E.create(svg),atoms=[...actor.g.querySelectorAll('[data-elbow-atom]')],expected=fixture.residues.flatMap(r=>Object.keys(r.atoms).filter(baseName).map(n=>atomKey(r.id,n)));
 assert.equal(expected.length,69);assert.deepEqual(atoms.map(n=>n.dataset.elbowAtom).sort(),expected.sort());
 assert.deepEqual([...new Set(atoms.map(n=>+n.dataset.elbowAtom.split(':')[0]))].sort((a,b)=>a-b),[18,19,54,55,56,57,58]);
 for(const node of atoms){const [id,name]=node.dataset.elbowAtom.split(':'),r=sourceRows.get(+id);assert.notEqual(r.elements[name],'H');assert.ok(node.querySelector('title').textContent.includes(r.component+id));}
 assert.ok(atoms.some(n=>n.dataset.elbowAtom==='54:C5M'),'m5U methyl carbon is retained');
 assert.ok(atoms.some(n=>n.dataset.elbowAtom==='58:CM1'),'m1A methyl carbon is retained');
 assert.equal(sourceRows.get(55).component,'PSU');
 assert.equal(actor.g.querySelectorAll('polygon').length,11,'fused rings remain separate ring faces');
});

test('five heavy-atom contact guides have exactly the source endpoints and measured distances',t=>{
 const {E,W,svg}=setup(t),actor=E.create(svg),state={...BASE,elbowAtoms:1,elbowSecond:1},camera=W.cameraFor(state),view=actor.render(state,camera),guides=contacts(actor.g);
 assert.equal(guides.length,5);assert.deepEqual(guides.map(g=>pairKey(g.refs)).sort(),fixture.contacts.map(g=>pairKey(g.refs)).sort());
 for(const {line,refs} of guides){
  const [a,b]=refs.map(([id,n])=>view.atom(id,n));near(+line.getAttribute('x1'),a[0]);near(+line.getAttribute('y1'),a[1]);near(+line.getAttribute('x2'),b[0]);near(+line.getAttribute('y2'),b[1]);
  const record=fixture.contacts.find(g=>pairKey(g.refs)===pairKey(refs)),xyz=refs.map(([id,n])=>sourceRows.get(id).atoms[n]);near(Math.hypot(...xyz[0].map((x,i)=>x-xyz[1][i])),record.distance_angstrom,'source contact length');
  assert.ok(line.getAttribute('stroke-dasharray'),'contacts are distinct from covalent lines');
 }
 assert.deepEqual(guides.filter(g=>g.refs[0][0]===18).map(g=>g.refs[1]),[[55,'O4'],[55,'O4']]);
});

test('base-only bonds match deposited component topology, with no sugar shortcut or extra link between bases',t=>{
 const {E,W,svg}=setup(t),actor=E.create(svg),state={...BASE,elbowAtoms:1,elbowSecond:1,elbowStack:1},camera=W.cameraFor(state),view=actor.render(state,camera);
 const expected=fixture.residues.flatMap(r=>r.covalent_bonds.filter(b=>b.every(baseName)).map(([a,b])=>[view.atom(r.id,a),view.atom(r.id,b)]));
 const actual=[...actor.g.querySelectorAll('line')].filter(n=>!n.dataset.elbowContact);
 assert.equal(expected.length,73);assert.equal(actual.length,expected.length);
 const match=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8),unmatched=expected.map(([a,b])=>[a.slice(0,2),b.slice(0,2)]);
 for(const line of actual){const a=[+line.getAttribute('x1'),+line.getAttribute('y1')],b=[+line.getAttribute('x2'),+line.getAttribute('y2')];
  const i=unmatched.findIndex(([x,y])=>(match(a,x)&&match(b,y))||(match(a,y)&&match(b,x)));assert.ok(i>=0,'Every solid base link is one explicitly curated covalent adjacency');unmatched.splice(i,1);
 }
 assert.equal(unmatched.length,0);
});

test('whole C4 trace, base atom anchors and guide lines share one source camera through elbow transitions',t=>{
 const {W,T,svg}=setup(t),world=W.create(svg);t.after(world.dispose);const group=world.g.querySelector('[data-trna-elbow]');
 for(const elbowAtoms of [0,.2,.5,.8,1])for(const [elbowSecond,elbowStack] of [[0,0],[1,0],[1,1]]){
  const s={...BASE,elbowAtoms,elbowSecond,elbowStack},out=world.paint(s);assert.ok(out.elbowView);checkBasis(out.camera.basis);
  for(const row of fixture.residues){
   const c4=out.elbowView.atom(row.id,"C4'");c4.forEach((v,i)=>near(v,out.points[row.id-1][i],'whole/atomic C4 continuity'));
   for(const name of Object.keys(row.atoms).filter(baseName)){
    const point=out.elbowView.atom(row.id,name),expected=T.project(row.atoms[name],out.camera);point.forEach((v,i)=>near(v,expected[i],'shared atom projection'));
    if(elbowAtoms>0){const node=[...group.querySelectorAll('[data-elbow-atom]')].find(n=>n.dataset.elbowAtom===atomKey(row.id,name));near(+node.getAttribute('cx'),point[0]);near(+node.getAttribute('cy'),point[1]);}
   }
  }
  if(elbowAtoms>0)for(const {line,refs} of contacts(group)){const [a,b]=refs.map(([id,n])=>out.elbowView.atom(id,n));near(+line.getAttribute('x1'),a[0]);near(+line.getAttribute('y1'),a[1]);near(+line.getAttribute('x2'),b[0]);near(+line.getAttribute('y2'),b[1]);}
 }
});

test('reverse seeking restores exact visible geometry and every persistent node without changing source XYZ',t=>{
 const {w,W,svg}=setup(t),world=W.create(svg);t.after(world.dispose);const group=world.g.querySelector('[data-trna-elbow]'),nodes=new Set(group.querySelectorAll('*'));
 const originalElbow=JSON.stringify(w.TRNA_ELBOW_DATA),originalWhole=JSON.stringify(w.TRNA_DATA),originalAtoms=JSON.stringify(w.TrnaAtoms.data);
 const states=[{...BASE,elbowAtoms:.4},{...BASE,elbowAtoms:1},{...BASE,elbowAtoms:1,elbowSecond:1},{...BASE,elbowAtoms:1,elbowSecond:1,elbowStack:1}];
 const snapshots=states.map(s=>{world.paint(s);return digest(group.outerHTML);});
 for(let i=states.length-1;i>=0;i--){world.paint(states[i]);assert.equal(digest(group.outerHTML),snapshots[i],'reverse-seek exact render restoration');assert.deepEqual(new Set(group.querySelectorAll('*')),nodes);}
 world.paint(BASE);assert.equal(group.style.display,'none','hidden at the source-trace endpoint');
 world.paint(states[3]);assert.equal(digest(group.outerHTML),snapshots[3],'hide/reveal reuses the original actors');
 assert.equal(JSON.stringify(w.TRNA_ELBOW_DATA),originalElbow);assert.equal(JSON.stringify(w.TRNA_DATA),originalWhole);assert.equal(JSON.stringify(w.TrnaAtoms.data),originalAtoms);
});

test('staged contacts distinguish first pair, bifurcated second pair and shared stacking context',t=>{
 const {E,W,svg}=setup(t),actor=E.create(svg);
 for(const [elbowAtoms,elbowSecond,elbowStack] of [[.6,0,0],[1,0,0],[1,1,0],[1,1,1]]){
  const s={...BASE,elbowAtoms,elbowSecond,elbowStack};actor.render(s,W.cameraFor(s));
  for(const {line,refs} of contacts(actor.g)){
   const expected=elbowAtoms<=.65||refs[0][0]===18&&elbowSecond===0?0:refs[0][0]===19&&elbowSecond===1&&elbowStack===0?.25:1;
   if(elbowStack===1)assert.ok(+line.style.opacity>0&&+line.style.opacity<1,'stack view retains dim contact guides while emphasizing base planes');
   else near(+line.style.opacity,expected,'staged guide opacity');
  }
 }
});
