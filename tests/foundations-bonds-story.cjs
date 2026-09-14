const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup,xy,atom,near,waterAngle,angle}=require('./context-harness.js');
const values=n=>n.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
const vector=g=>{const d=values(g.querySelector('[data-arrow-shaft]'));return [d[2]-d[0],d[3]-d[1]];};
const movingGeometry=nodes=>nodes.map(n=>['transform','d','x','y','cx','cy','rx','ry','x1','y1','x2','y2','stroke-dashoffset'].map(k=>n.getAttribute(k)));
test('the first two stories narrate continuous visual changes in all five chapters',()=>{
 const {w,draw}=setup();try{const samples={formula:[[.02,.12],[.22,.36],[.43,.55],[.63,.76],[.83,.95]],polarity:[[.04,.15],[.23,.34],[.43,.55],[.63,.77],[.83,.97]]};
  for(const id of ['formula','polarity']){const spec=w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id);assert.equal(spec.duration,48000);assert.ok(spec.narration.length>=9&&spec.narration.length<=11);assert.equal(spec.narration[0].at,0);spec.narration.forEach(c=>assert.ok(c.ru&&c.en));const a=draw(id),nodes=[...a.g.querySelectorAll('[data-motion-role]')];assert.ok(nodes.length);for(const [p,q]of samples[id]){a.paint(p);const before=movingGeometry(nodes);a.paint(q);assert.notDeepEqual(movingGeometry(nodes),before,id+' has real motion in chapter '+Math.floor(p*5));assert.equal(a.metrics.motion.authored,true);}}
 }finally{w.close();}
});

test('one persistent C–H selection magnifies from its exact source and returns without moving methane nuclei or changing its electron inventory',()=>{
 const {w,draw}=setup();try{const a=draw('formula'),mol=a.g.querySelector('[data-chem-role="methane"]'),inset=a.g.querySelector('[data-same-bond-inset]'),atoms=[...mol.querySelectorAll('[data-atom-id]')],positions=atoms.map(xy),shapes=[...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')],lens=()=>inset.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
  a.paint(.16);let view=lens();near(view[0]-65*view[2],335+xy(atom(mol,'C'))[0]);near(view[0]+65*view[2],335+xy(atom(mol,'H2'))[0]);near(view[1],356);a.paint(.31);view=lens();near(view[0],952);near(view[1],354);near(view[2],2.4);a.paint(.93);view=lens();near(view[0],400);near(view[1],356);near(view[2],1);
  for(let i=0;i<=100;i++){a.paint(i/100);assert.equal(a.g.querySelector('[data-same-bond-inset]'),inset);assert.deepEqual(atoms.map(xy),positions);assert.deepEqual([...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')],shapes);assert.equal(mol.querySelectorAll('[data-bond-order="1"]').length,4);assert.equal(a.metrics.valenceElectrons,8);assert.equal(a.metrics.atomCount,5);assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity/);}
  const pair=inset.querySelector('[data-pair-notation]');assert.equal(pair.querySelectorAll('circle').length,2);a.paint(.37);const dots=[...pair.querySelectorAll('circle')];near(+dots[0].getAttribute('cx'),0);near(+dots[1].getAttribute('cx'),0);assert.ok(+dots[0].getAttribute('cy')<0&&+dots[1].getAttribute('cy')>0);a.paint(1);assert.equal([...a.g.querySelector('[data-shared-pair-layer]').children].filter(n=>+n.style.opacity>0).length,4);
 }finally{w.close();}
});

test('density, annotations and comparison move while water/CO2 nuclei and every translated vector retain their geometry',()=>{
 const {w,draw}=setup();try{const a=draw('polarity'),water=a.g.querySelector('[data-chem-role="water"]'),co2=a.g.querySelector('[data-chem-role="carbon-dioxide"]'),waterAtoms=[...water.querySelectorAll('[data-atom-id]')],co2Atoms=[...co2.querySelectorAll('[data-atom-id]')],wp=waterAtoms.map(xy),cp=co2Atoms.map(xy),components=[...a.g.querySelectorAll('[data-vector-role="water-component"]')].map(vector),cComponents=[...a.g.querySelectorAll('[data-vector-role="co2-component"]')].map(vector);
  for(let i=0;i<=100;i++){a.paint(i/100);near(waterAngle(water),104.5);near(angle(xy(atom(co2,'C')),xy(atom(co2,'O1')),xy(atom(co2,'O2'))),180);assert.deepEqual(waterAtoms.map(xy),wp);assert.deepEqual(co2Atoms.map(xy),cp);assert.equal(co2.querySelectorAll('[data-bond-order="2"]').length,2);for(const [role,expected]of [['water-copy',components],['co2-copy',cComponents]])[...a.g.querySelectorAll(`[data-vector-role="${role}"]`)].map(vector).forEach((v,j)=>v.forEach((n,k)=>near(n,expected[j][k])));assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity/);}
  a.paint(.795);const copies=[...a.g.querySelectorAll('[data-vector-role="water-copy"]')].map(n=>values(n.querySelector('[data-arrow-shaft]')));copies[0].slice(2).forEach((v,i)=>near(v,copies[1][i]));const sum=vector(a.g.querySelector('[data-vector-role="water-sum"]'));sum.forEach((v,i)=>near(v,components[0][i]+components[1][i]));assert.ok(Math.hypot(...sum)>0);
  a.paint(1);const cCopies=[...a.g.querySelectorAll('[data-vector-role="co2-copy"]')].map(n=>values(n.querySelector('[data-arrow-shaft]')));cCopies[0].slice(2).forEach((v,i)=>near(v,cCopies[1][i]));cCopies[1].slice(2).forEach((v,i)=>near(v,cCopies[0][i]));assert.equal(a.metrics.co2DipolePixels,0);
 }finally{w.close();}
});

test('foundation narration follows cue boundaries in RU/EN, and chapter navigation begins causal playback',()=>{
 const {w,scenes,jobs}=setup();try{for(const id of ['formula','polarity']){const spec=w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id),dispose=[],root=scenes.find(s=>s.id==='chem-'+id).build({index:0,onDispose(fn){dispose.push(fn);},step(){throw Error('No hidden step');}});w.document.querySelector('main').append(root);const input=root.querySelector('input');
  for(const lang of ['ru','en']){w.D.i18n.setLang(lang);for(const [i,cue]of spec.narration.entries()){input.value=String(cue.at*100);input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(+root.dataset.narrationIndex,i);assert.equal(root.querySelector('.film-caption').textContent,cue[lang]);}}
  const phase=root.querySelector('[data-phase-at="0.6"]');phase.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));near(+root.dataset.progress,.6);assert.equal(root.dataset.running,'true');const job=jobs.at(-1);input.value='42';input.dispatchEvent(new w.Event('input',{bubbles:true}));job.fn(.99);near(+root.dataset.progress,.42);dispose.reverse().forEach(fn=>fn());root.remove();
 }}finally{w.close();}
});
