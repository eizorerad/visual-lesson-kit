const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup,atom,near}=require('./context-harness.js');
const visible=n=>{for(let a=n;a&&a.nodeType===1;a=a.parentElement){if(a.getAttribute('display')==='none'||a.getAttribute('aria-hidden')==='true'||a.style.opacity==='0'||a.getAttribute('opacity')==='0')return false;}return true;};
const coords=p=>p.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number).reduce((out,v,i,all)=>{if(i%2===0)out.push([v,all[i+1]]);return out;},[]);
const curveY=(points,x)=>{const i=points.findIndex(p=>p[0]>=x);if(i<=0)return points[Math.max(0,i)][1];const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);};
test('catalysis draws equal endpoints and measures each barrier from its actual local minimum',()=>{
 const {w,draw}=setup(),a=draw('catalysis');a.paint(.8);
 const high=coords(a.g.querySelector('[data-energy-path="uncatalyzed"]')),low=coords(a.g.querySelector('[data-energy-path="catalyzed"]'));
 assert.deepEqual(high[0],low[0]);assert.deepEqual(high.at(-1),low.at(-1));
 const pixelsPerUnit=low.at(-1)[1]-low[0][1];assert.ok(pixelsPerUnit>0);
 for(const [id,height,origin,offset] of [['uncatalyzed',3,0,17],['catalyzed-1',1.4,0,15],['catalyzed-2',1.2,.5,15]]){
  const b=a.g.querySelector(`[data-barrier="${id}"] line`),x=+b.getAttribute('x1'),base=+b.getAttribute('y1'),peak=+b.getAttribute('y2'),points=id==='uncatalyzed'?high:low;
  near((base-peak)/pixelsPerUnit,height);near(base,curveY(points,low[0][0]+origin*(low.at(-1)[0]-low[0][0])));near(peak,curveY(points,x-offset),.1);
 }
 assert.ok(+a.g.querySelector('[data-barrier="catalyzed-2"] line').getAttribute('y1')>low[0][1],'second step starts below the reactant level');
 for(const p of [0,.2,.4,.6,.8,1]){a.paint(p);assert.equal(a.metrics.delta,-1);assert.equal(a.metrics.time,false);}w.close();
});
test('occupancy shows twenty binary sites, exact half occupancy and a graph marker for the same equilibrium',()=>{
 const {w,draw}=setup(),a=draw('occupancy');
 for(const p of [0,.2,.4,.599999,.6,.65,.799999,.8,.86,.95,1]){
  a.paint(p);const m=a.metrics,sites=[...a.g.querySelectorAll('[data-site-ensemble] [data-binding-site]')];assert.equal(sites.length,20);
  assert.equal(sites.filter(s=>s.dataset.bound==='true').length,m.occupied);if(m.equilibrium)assert.equal(m.occupied,Math.round(20*m.theta));near(m.theta,m.ratio/(1+m.ratio));
  sites.forEach(s=>{const ligand=s.querySelector('[data-bound-ligand]');if(s.dataset.bound==='true'){assert.equal(ligand.style.opacity,'1');near(+ligand.getAttribute('cx'),0);near(+ligand.getAttribute('cy'),-25);}});
  const marker=a.g.querySelector('[data-occupancy-marker]');assert.ok(marker);near(+marker.getAttribute('cx'),820+(Math.log10(m.ratio)+2)*338/4);near(+marker.getAttribute('cy'),413-m.theta*125);
  if(p>=.7&&p<=.8){assert.equal(m.ratio,1);assert.equal(m.occupied,10);assert.equal(m.theta,.5);}
 }
 a.paint(.2);assert.equal([...a.g.querySelectorAll('[data-binding-site]')].filter(visible).length,1);assert.ok(visible(a.g.querySelector('[data-hero-ligand]')));assert.equal(a.metrics.trajectory,false);w.close();
});
test('HP1 recognition preserves quaternary nitrogen, three methyl groups and noncovalent contact semantics',()=>{
 const {w,draw}=setup(),a=draw('histone'),mol=a.g.querySelector('[data-recognition-fragment]');
 for(const p of [0,.2,.4,.6,.8,1,.1]){
  a.paint(p);const n=atom(mol,'N'),bonds=[...mol.querySelectorAll('[data-bond-id]')];assert.equal(n.querySelector('[data-formal-charge]').dataset.formalCharge,'1');assert.equal(n.querySelector('[data-formal-charge]').textContent,'+');
  const attached=bonds.filter(b=>b.dataset.bondA==='N'||b.dataset.bondB==='N');assert.equal(attached.length,4);assert.equal(attached.reduce((s,b)=>s+(+b.dataset.bondOrder),0),4);
  for(const b of attached){const other=atom(mol,b.dataset.bondA==='N'?b.dataset.bondB:b.dataset.bondA);assert.equal(other.querySelector('[data-element]').dataset.element,'C');}
  for(const id of ['C1','C2','C3']){const label=atom(mol,id).querySelector('[data-element]');assert.equal(label.textContent,'CH₃');assert.equal(label.dataset.hydrogens,'3');}
  assert.deepEqual(JSON.parse(JSON.stringify(a.metrics.composition)),{elements:{C:4,H:11,N:1},charge:1,remainderCount:1});assert.equal(bonds.length,5);
  const rings=[...a.g.querySelectorAll('[data-aromatic-group]')];assert.equal(rings.length,3);rings.forEach(r=>{assert.equal(r.querySelectorAll('path').length,1);assert.equal(r.querySelectorAll('circle').length,1);});
  const contacts=[...a.g.querySelectorAll('[data-recognition-contacts] [data-chemistry-contact]')];assert.equal(contacts.length,3);contacts.forEach((c,i)=>{assert.equal(c.querySelector('line').getAttribute('stroke-dasharray'),'4 5');assert.equal(visible(c),a.metrics.motion.contactProgress[i]>0);});assert.equal(visible(a.g.querySelector('[data-chromatin-context]')),a.metrics.motion.contextZoom>0);
 }w.close();
});
test('binding-context scenes keep their geometry nodes and synchronize captions at every phase boundary',()=>{
 const {w,scenes,draw}=setup();
 for(const id of ['catalysis','occupancy','histone']){
  const spec=w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id);assert.equal(spec.stages.length,5);assert.equal(spec.captions.length,5);assert.equal(spec.enCaptions.length,5);assert.equal(spec.duration,48000);
  const a=draw(id),shapes=()=>[...a.g.querySelectorAll('g,path,line,circle,ellipse,rect,polygon')],initial=shapes(),start=JSON.stringify(a.metrics),dispose=[];
  const root=scenes.find(s=>s.id==='chem-'+id).build({index:0,onDispose(fn){dispose.push(fn);},step(){throw Error('Unexpected hidden step');}});w.document.querySelector('main').append(root);
  for(const p of [1,.23,.77,.2-1e-9,.2,.4-1e-9,.4,.6-1e-9,.6,.8-1e-9,.8,0]){
   a.paint(p);assert.deepEqual(shapes(),initial);assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity/);
   const input=root.querySelector('input');input.value=String(p*100);input.dispatchEvent(new w.Event('input',{bubbles:true}));const m=JSON.parse(root.dataset.metrics);assert.equal(m.stage,+root.dataset.explanationPhase,id+' visible explanation matches its caption');
   if(id==='occupancy'&&p>=.7&&p<=.8){assert.equal(m.theta,.5);assert.equal(m.occupied,10);}
  }
  assert.equal(JSON.stringify(a.metrics),start);dispose.reverse().forEach(fn=>fn());root.remove();
 }w.close();
});

test('each binding story chapter changes authored geometry or a meaningful trace, with a continuous narrator',()=>{
 const {w,draw}=setup();try{
  const samples={catalysis:[[.04,.15],[.22,.35],[.44,.55],[.62,.75],[.84,.95]],occupancy:[[.03,.15],[.23,.37],[.43,.57],[.62,.75],[.83,.95]],histone:[[.04,.15],[.23,.35],[.43,.57],[.62,.75],[.83,.95]]};
  for(const id of Object.keys(samples)){const s=w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id);assert.ok(s.duration>=44000&&s.duration<=52000);assert.ok(s.narration.length>=9&&s.narration.length<=12);assert.equal(s.narration[0].at,0);s.narration.forEach((n,i)=>{assert.ok(n.ru&&n.en);if(i)assert.ok(n.at>s.narration[i-1].at);});const a=draw(id),moving=[...a.g.querySelectorAll('[data-motion-role]')];assert.ok(moving.length>0);const geometry=()=>moving.map(n=>['transform','d','cx','cy','x1','y1','x2','y2','stroke-dashoffset'].map(k=>n.getAttribute(k)));for(const [p,q]of samples[id]){a.paint(p);const before=geometry();a.paint(q);assert.notDeepEqual(geometry(),before,id+' has purposeful motion in chapter '+Math.floor(p*5));assert.ok(a.metrics.motion&&a.metrics.motion.authored===true);}}
 }finally{w.close();}
});

test('the same ligand binds, leaves and returns before its original site becomes the first ensemble member',()=>{
 const {w,draw}=setup();try{const a=draw('occupancy'),hero=a.g.querySelector('[data-hero-binding-site]'),ligand=a.g.querySelector('[data-hero-ligand]'),sites=[...a.g.querySelectorAll('[data-binding-site]')],distance=()=>Math.hypot(+ligand.getAttribute('cx'),+ligand.getAttribute('cy')+25),position=()=>[+ligand.getAttribute('cx'),+ligand.getAttribute('cy')];
  a.paint(.03);const far=distance();assert.equal(hero.dataset.bound,'false');a.paint(.15);assert.ok(distance()<far);a.paint(.18);near(distance(),0);assert.equal(hero.dataset.bound,'true');
  a.paint(.27);assert.ok(distance()>100);assert.equal(hero.dataset.bound,'false');a.paint(.39);near(distance(),0);assert.equal(hero.dataset.bound,'true');
  for(const boundary of [.17,.22,.28,.30,.39,.4]){a.paint(boundary-1e-6);const before=position();a.paint(boundary+1e-6);assert.ok(Math.hypot(...position().map((v,i)=>v-before[i]))<.05,'ligand has no trajectory jump at '+boundary);}
  a.paint(.4);const start=hero.getAttribute('transform');a.paint(.5);assert.notEqual(hero.getAttribute('transform'),start);a.paint(.6);const placed=hero.getAttribute('transform').match(/-?[\d.]+/g).map(Number);[138,300,.44].forEach((v,i)=>near(placed[i],v));assert.equal(a.g.querySelector('[data-binding-site="site-0"]'),hero);assert.equal(a.g.querySelector('[data-hero-ligand]'),ligand);assert.deepEqual([...a.g.querySelectorAll('[data-binding-site]')],sites);
  for(let i=60;i<=100;i++){a.paint(i/100);const docked=sites.filter(s=>s.dataset.bound==='true');assert.equal(docked.length,Math.round(20*a.metrics.theta));for(const s of docked){const l=s.querySelector('[data-bound-ligand]');near(+l.getAttribute('cx'),0);near(+l.getAttribute('cy'),-25);}if(i>=70&&i<=80){near(a.metrics.theta,.5);assert.equal(docked.length,10);}}
 }finally{w.close();}
});

test('the coordinate probe tracks the revealed pathway and growing brackets keep their own starting minima',()=>{
 const {w,draw}=setup();try{const a=draw('catalysis'),probe=a.g.querySelector('[data-coordinate-probe]');
  for(const p of [.05,.15,.22,.32,.45,.50,.55,.62,.70,.76]){a.paint(p);const route=a.metrics.motion.probeRoute,path=a.g.querySelector(`[data-energy-path="${route}"]`),points=coords(path),x=+probe.getAttribute('cx'),y=+probe.getAttribute('cy');near(y,curveY(points,x),.12);assert.equal(probe.dataset.coordinateProbe,'explanatory');assert.equal(a.metrics.time,false);assert.ok(+path.getAttribute('stroke-dashoffset')>=0&&+path.getAttribute('stroke-dashoffset')<=1);}
  for(const [id,ps]of [['uncatalyzed',[.18,.22,.25,.28]],['catalyzed-1',[.6,.62,.65,.68]],['catalyzed-2',[.69,.72,.75,.78]]]){const line=a.g.querySelector(`[data-barrier="${id}"] line`),base=+line.getAttribute('y1');let height=-1;for(const p of ps){a.paint(p);assert.equal(+line.getAttribute('y1'),base);const next=Math.abs(+line.getAttribute('y2')-base);assert.ok(next>=height);height=next;}}
 }finally{w.close();}
});

test('HP1 approaches the unchanged fragment, forms contacts in order and zooms the same complex into context',()=>{
 const {w,draw}=setup();try{const a=draw('histone'),mol=a.g.querySelector('[data-recognition-fragment]'),pocket=a.g.querySelector('[data-aromatic-pocket]'),complex=a.g.querySelector('[data-recognition-complex]'),atoms=[...mol.querySelectorAll('[data-atom-id]')],geometry=atoms.map(n=>n.getAttribute('transform')),contacts=[...a.g.querySelectorAll('[data-recognition-contacts] [data-chemistry-contact] line')];
  let last=Infinity;for(const p of [.36,.40,.45,.5,.56,.61]){a.paint(p);const x=+pocket.getAttribute('transform').match(/translate\(([^ ]+)/)[1];assert.ok(x<=last);last=x;assert.deepEqual(atoms.map(n=>n.getAttribute('transform')),geometry);}near(last,0);
  const length=l=>Math.hypot(+l.getAttribute('x2')-+l.getAttribute('x1'),+l.getAttribute('y2')-+l.getAttribute('y1'));
  a.paint(.635);assert.ok(length(contacts[0])>0);near(length(contacts[1]),0);near(length(contacts[2]),0);a.paint(.695);assert.ok(length(contacts[1])>0);near(length(contacts[2]),0);a.paint(.77);assert.ok(length(contacts[2])>0);
  a.paint(.8);const before=complex.getAttribute('transform');a.paint(.9);assert.notEqual(complex.getAttribute('transform'),before);assert.ok(visible(a.g.querySelector('[data-chromatin-context]')));a.paint(1);assert.equal(a.g.querySelector('[data-recognition-fragment]'),mol);assert.deepEqual(atoms.map(n=>n.getAttribute('transform')),geometry);assert.deepEqual(JSON.parse(JSON.stringify(a.metrics.composition)),{elements:{C:4,H:11,N:1},charge:1,remainderCount:1});assert.ok(visible(a.g.querySelector('[data-context-callout]')));
 }finally{w.close();}
});

test('short narration follows its cue in both languages and a chapter starts the story from its beginning',()=>{
 const {w,scenes,jobs}=setup();try{for(const id of ['catalysis','occupancy','histone']){const spec=w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id),dispose=[],root=scenes.find(s=>s.id==='chem-'+id).build({index:0,onDispose(fn){dispose.push(fn);},step(){throw Error('No hidden step');}});w.document.querySelector('main').append(root);const input=root.querySelector('input');
  for(const lang of ['ru','en']){w.D.i18n.setLang(lang);for(const [i,cue]of spec.narration.entries()){input.value=String(cue.at*100);input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(+root.dataset.narrationIndex,i);assert.equal(root.querySelector('.film-caption').textContent,cue[lang]);}}
  const chapter=root.querySelector('[data-phase-at="0.4"]');chapter.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));near(+root.dataset.progress,.4);assert.equal(root.dataset.running,'true');assert.ok(Number(chapter.dataset.phaseSeek)>.4);const job=jobs.at(-1);input.value='61';input.dispatchEvent(new w.Event('input',{bubbles:true}));job.fn(.99);near(+root.dataset.progress,.61);dispose.reverse().forEach(fn=>fn());root.remove();
 }}finally{w.close();}
});
