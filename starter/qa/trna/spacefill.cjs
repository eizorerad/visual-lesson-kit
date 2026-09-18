/* Source identity and deterministic space-fill rendering audit.
 * Run with jsdom installed, or set JSDOM_MODULE / NODE_PATH. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const root=path.resolve(__dirname,'../..'),fixture=JSON.parse(fs.readFileSync(path.join(root,'assets/trna/spacefill-1ehz.json'),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b,label='coordinate')=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`);
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const BASE={fold:1,simple:1,model:1,landmarks:2,angle:15,spacefill:1,surfaceAngle:0};
function setup(t){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','white','purple'].map(k=>[k,'var(--color-'+k+')']));
 for(const file of ['lib/dom.js','film.js','layout.js','trna-data.js','trna-atoms.js','trna-elbow-data.js','trna-elbow.js','trna-spacefill-data.js','trna-sphere-renderer.js','trna-spacefill.js','trna-world.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 return {w,S:w.TrnaSpacefill,W:w.TrnaWorld,T:w.TrnaAtoms,svg:w.document.querySelector('svg')};
}
function renderedBounds(nodes){
 const points=nodes.map(dot=>({id:+dot.dataset.spacefillAtom,x:+dot.getAttribute('cx'),y:+dot.getAttribute('cy'),r:+dot.getAttribute('r')}));
 const extremes=[['minX',p=>p.x-p.r,Math.min],['maxX',p=>p.x+p.r,Math.max],['minY',p=>p.y-p.r,Math.min],['maxY',p=>p.y+p.r,Math.max]];
 return Object.fromEntries(extremes.map(([key,value,fn])=>{const boundary=fn(...points.map(value)),atom=points.find(p=>value(p)===boundary).id;return [key,{value:boundary,atom}];}));
}

test('one persistent sphere per deposited heavy atom preserves all 1652 IDs, elements, components and 76 residues',t=>{
 const {S,svg}=setup(t);assert.deepEqual(plain(S.data),fixture);const actor=S.create(svg),dots=[...actor.g.querySelectorAll('[data-spacefill-atom]')];
 assert.equal(actor.actors.length,1652);assert.equal(dots.length,1652);assert.equal(new Set(dots.map(d=>d.dataset.spacefillAtom)).size,1652);
 assert.deepEqual([...new Set(dots.map(d=>+d.dataset.spacefillResidue))].sort((a,b)=>a-b),Array.from({length:76},(_,i)=>i+1));
 dots.forEach((dot,i)=>{const source=fixture.atoms[i];assert.equal(+dot.dataset.spacefillAtom,source.id);assert.equal(+dot.dataset.spacefillResidue,source.residue);assert.equal(dot.dataset.spacefillElement,source.element);assert.equal(dot.querySelector('title').textContent,`1EHZ · ${source.component}${source.residue} · ${source.name}`);});
 assert.deepEqual([...new Set(dots.map(d=>d.dataset.spacefillElement))].sort(),['C','N','O','P']);
 assert.equal(dots.filter(d=>+d.dataset.spacefillResidue===34).length,24,'OMG34 remains modified');
 assert.equal(dots.filter(d=>+d.dataset.spacefillResidue===37).length,39,'YYG37 is not reduced to a parent-base atom count');
});

test('full sphere radii equal conventional vdW radii times camera scale for every displayed element',t=>{
 const {S,W,svg}=setup(t),actor=S.create(svg);
 for(const surfaceAngle of [0,35]){
  const camera=W.cameraFor({...BASE,surfaceAngle});actor.render(camera,1);
  for(const {atom,dot} of actor.actors)near(+dot.getAttribute('r'),fixture.radii[atom.element]*camera.scale,'full vdW radius');
 }
 assert.deepEqual(plain(S.data.radii),{C:1.7,N:1.55,O:1.52,P:1.8,S:1.8});
});

test('growing spheres keep their source centers and share all 76 C4 anchors with the whole trace',t=>{
 const {W,T,svg}=setup(t),world=W.create(svg);t.after(world.dispose);
 const dots=new Map([...world.g.querySelectorAll('[data-spacefill-atom]')].map(d=>[+d.dataset.spacefillAtom,d]));
 for(const amount of [.05,.2,.5,.8,1])for(const surfaceAngle of [0,35]){
  const out=world.paint({...BASE,spacefill:amount,surfaceAngle});assert.equal(out.spaceView.count,1652);
  for(const atom of fixture.atoms){
   const dot=dots.get(atom.id),projected=T.project(atom.xyz,out.camera);near(+dot.getAttribute('cx'),projected[0]);near(+dot.getAttribute('cy'),projected[1]);
   assert.ok(+dot.getAttribute('r')>0&&+dot.getAttribute('r')<=fixture.radii[atom.element]*out.camera.scale+1e-10,'representation growth stays within conventional full radius');
   if(atom.name==="C4'")projected.forEach((v,i)=>near(v,out.points[atom.residue-1][i],'shared C4 anchor'));
  }
 }
});

test('one shared surface renderer receives all 1652 spheres in the same depth units as their radii',t=>{
 const {S,W,T,svg}=setup(t),actor=S.create(svg);t.after(actor.dispose);
 for(const surfaceAngle of [0,17.5,35]){
  const camera=W.cameraFor({...BASE,surfaceAngle});actor.render(camera,1);
  for(const o of actor.actors){const p=T.project(o.atom.xyz,camera);near(o.center[0],p[0]);near(o.center[1],p[1]);near(o.center[2],p[2]*camera.scale);near(o.radius,fixture.radii[o.atom.element]*camera.scale);}
  assert.equal(actor.g.querySelectorAll('canvas').length,1,'one shared depth buffer');
 }
});

test('paused frames do not rewrite spheres and reverse seeking restores exact geometry without replacing DOM',t=>{
 const {w,S,W,svg}=setup(t),actor=S.create(svg),nodes=new Set(actor.g.querySelectorAll('*')),sourceBefore=JSON.stringify(w.TRNA_SPACEFILL_DATA),wholeBefore=JSON.stringify(w.TRNA_DATA);
 const states=[{amount:.1,angle:0},{amount:.5,angle:0},{amount:1,angle:0},{amount:1,angle:35}],snapshots=states.map(s=>{actor.render(W.cameraFor({...BASE,spacefill:s.amount,surfaceAngle:s.angle}),s.amount);return digest(actor.g.outerHTML);});
 const last=states[3],camera=W.cameraFor({...BASE,surfaceAngle:last.angle}),layer=actor.actors[0].dot.parentNode,observer=new w.MutationObserver(()=>{});observer.observe(layer,{attributes:true,childList:true,subtree:true});
 actor.render(camera,1);assert.equal(observer.takeRecords().length,0,'same frame leaves all sphere geometry and order untouched');observer.disconnect();
 for(let i=states.length-1;i>=0;i--){const s=states[i];actor.render(W.cameraFor({...BASE,spacefill:s.amount,surfaceAngle:s.angle}),s.amount);assert.equal(digest(actor.g.outerHTML),snapshots[i]);assert.deepEqual(new Set(actor.g.querySelectorAll('*')),nodes);}
 actor.render(camera,0);assert.equal(actor.g.style.display,'none');actor.render(camera,1);assert.equal(digest(actor.g.outerHTML),snapshots[3]);
 assert.equal(JSON.stringify(w.TRNA_SPACEFILL_DATA),sourceBefore);assert.equal(JSON.stringify(w.TRNA_DATA),wholeBefore);
});

test('entire heavy-atom envelope stays inside the main clip throughout the final 35-degree turn',t=>{
 const {W,svg}=setup(t),world=W.create(svg);t.after(world.dispose);const dots=[...world.g.querySelectorAll('[data-spacefill-atom]')],frames=[];
 const rect=world.g.querySelector('clipPath rect'),clip={x:+rect.getAttribute('x'),y:+rect.getAttribute('y'),width:+rect.getAttribute('width'),height:+rect.getAttribute('height')};
 for(const surfaceAngle of [0,5,10,15,20,25,30,35]){
  world.paint({...BASE,surfaceAngle});const b=renderedBounds(dots);frames.push({surfaceAngle,...b});
  assert.ok(b.minX.value>=clip.x&&b.maxX.value<=clip.x+clip.width&&b.minY.value>=clip.y&&b.maxY.value<=clip.y+clip.height,JSON.stringify({surfaceAngle,bounds:b,clip}));
 }
 t.diagnostic('Final-turn envelope extremes: '+JSON.stringify({minX:Math.min(...frames.map(f=>f.minX.value)),maxX:Math.max(...frames.map(f=>f.maxX.value)),minY:Math.min(...frames.map(f=>f.minY.value)),maxY:Math.max(...frames.map(f=>f.maxY.value)),endpoints:[frames[0],frames.at(-1)],clip}));
});
