const {test}=require('node:test'),assert=require('node:assert/strict');
const {setup,xy,atom,near}=require('./context-harness.js');
const values=n=>n.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
const shaft=a=>values(a.querySelector('[data-arrow-shaft]'));
const charge=n=>+n.querySelector('[data-formal-charge]').dataset.formalCharge;
const visible=n=>{for(let a=n;a&&a.nodeType===1;a=a.parentElement){if(a.getAttribute('display')==='none'||a.style.opacity==='0'||a.getAttribute('opacity')==='0')return false;}return true;};

test('ATP protonation preserves the local atoms and charge while coupling a fixed stator to the c8 rotor',()=>{
 const {w,draw}=setup(),a=draw('atp'),mol=a.g.querySelector('[data-atp-carboxyl]'),atoms=[...mol.querySelectorAll('[data-atom-id]')],stator=a.g.querySelector('[data-atp-stator]'),statorPath=stator.getAttribute('d'),rotor=a.g.querySelector('[data-atp-rotor]');
 assert.equal(rotor.querySelectorAll('[data-c-subunit]').length,8);assert.equal(a.g.querySelectorAll('[data-proton-half-channel]').length,2);
 for(const p of [0,.2,.279999,.28,.4,.549999,.55,.58,.6,.8,.9,.96,1]){
  a.paint(p);assert.deepEqual([...mol.querySelectorAll('[data-atom-id]')],atoms);assert.equal(atoms.reduce((s,n)=>s+charge(n),0),0);assert.equal(a.metrics.localPairCharge,0);
  const bound=a.metrics.carboxylProtonated,bond=mol.querySelector('[data-bond-id="O-H"]');assert.equal(+bond.dataset.bondOrder,bound?1:0);assert.equal(charge(atom(mol,'O2')),bound?0:-1);assert.equal(charge(atom(mol,'H')),bound?0:1);
  if(bound){assert.notEqual(bond.getAttribute('display'),'none');const l=bond.querySelector('line');assert.ok(Math.hypot(+l.getAttribute('x2')-+l.getAttribute('x1'),+l.getAttribute('y2')-+l.getAttribute('y1'))>1);}
  assert.equal(stator.getAttribute('d'),statorPath);near(+rotor.getAttribute('transform').match(/rotate\(([^)]+)\)/)[1],a.metrics.angle);assert.equal(a.metrics.oneProtonPer120Degrees,false);
 }
 a.paint(.58);near(a.metrics.angle,120);a.paint(.8);near(a.metrics.angle,240);a.paint(.98);near(a.metrics.angle,360);w.close();
});

test('ATP retains three phosphate groups, joins beta to gamma and releases the intact packet below the opened site',()=>{
 const {w,draw}=setup(),a=draw('atp'),packet=a.g.querySelector('[data-atp-phosphates]'),circles=[...packet.querySelectorAll('circle')],units=circles.map(c=>c.parentElement),link=packet.querySelector('[data-atp-new-link]');assert.equal(circles.length,3);
 for(const p of [.6,.719999,.72,.8,.9,.959999,.96,1,.6]){
  a.paint(p);assert.deepEqual([...packet.querySelectorAll('circle')],circles);assert.equal(a.metrics.adpPhosphates+a.metrics.freePhosphate+a.metrics.atpPhosphates,3);
  const joined=a.metrics.atpPhosphates===3;assert.equal(visible(link),joined);assert.equal(units[2].textContent,joined?'γ':'Pᵢ');assert.equal(units[0].textContent,'α');assert.equal(units[1].textContent,'β');
  if(joined){near(+link.getAttribute('x1'),xy(units[1])[0]+(+circles[1].getAttribute('r')));near(+link.getAttribute('x2'),xy(units[2])[0]-(+circles[2].getAttribute('r')));}
  const lift=xy(packet)[1];assert.ok(lift>=0);if(a.metrics.atpReleased){assert.ok(lift>=80);assert.ok(350+lift-20>397,'the entire phosphate group is below the closed-site baseline');assert.ok(350+lift+20<462,'released groups clear the explanatory label');assert.match(a.g.textContent,/O · ATP освобождена/);}else assert.doesNotMatch(a.g.textContent,/O · ATP освобождена/);
 }
 w.close();
});

test('electron arrows originate at bond pairs, force vectors oppose, and dipole conventions differ in direction and cross',()=>{
 const {w,draw}=setup(),a=draw('arrows');a.paint(.22);
 const pair=[...a.g.querySelectorAll('[data-arrow-kind="electron-pair"]')],single=[...a.g.querySelectorAll('[data-arrow-kind="electron-single"]')];assert.equal(pair.length,1);assert.equal(single.length,2);
 for(const arrow of [...pair,...single]){
  const d=shaft(arrow),source=d.slice(0,2),panel=arrow.parentElement,bonds=[...panel.children].filter(n=>n.tagName.toLowerCase()==='line');
  assert.ok(bonds.some(b=>Math.abs((+b.getAttribute('x1')+(+b.getAttribute('x2')))/2-source[0])<1e-8&&Math.abs((+b.getAttribute('y1')+(+b.getAttribute('y2')))/2-source[1])<1e-8));
  assert.ok(d.at(-2)!==source[0]);const head=arrow.querySelector('[data-arrow-head]').getAttribute('d');assert.equal((head.match(/ L/g)||[]).length,arrow.dataset.arrowKind==='electron-pair'?2:1);
 }
 a.paint(.62);const forces=[...a.g.querySelectorAll('[data-arrow-kind="force"]')].map(shaft);assert.equal(forces.length,2);const dx=forces.map(d=>d[2]-d[0]);assert.ok(dx[0]>0&&dx[1]<0);near(dx[0]+dx[1],0);near(forces[0][3]-forces[0][1],0);near(forces[1][3]-forces[1][1],0);
 a.paint(1);const chemical=a.g.querySelector('[data-arrow-kind="dipole-chemical"]'),physical=a.g.querySelector('[data-arrow-kind="dipole-physics"]'),c=shaft(chemical),p=shaft(physical);assert.ok(c[2]>c[0]);assert.ok(p[2]<p[0]);assert.ok(visible(chemical.querySelector('[data-arrow-cross]')));assert.ok(!visible(physical.querySelector('[data-arrow-cross]')));assert.equal(new Set([...a.g.querySelectorAll('[data-arrow-kind]')].map(n=>n.dataset.arrowKind)).size,8);w.close();
});

test('resonance contributors preserve nuclei and net charge while moving bond order and oxygen formal charge',()=>{
 const {w,draw}=setup(),a=draw('arrows'),forms=[...a.g.querySelectorAll('[data-resonance-contributor]')];assert.equal(forms.length,2);
 const geometry=forms.map(f=>[...f.querySelectorAll('[data-atom-id]')].map(n=>[n.dataset.atomId,...xy(n)]));assert.deepEqual(geometry[0],geometry[1]);
 for(const p of [0,.5,.6,.749999,.75,1,.3]){a.paint(p);forms.forEach((f,i)=>{
  assert.deepEqual([...f.querySelectorAll('[data-atom-id]')].map(n=>[n.dataset.atomId,...xy(n)]),geometry[i]);assert.equal([...f.querySelectorAll('[data-atom-id]')].reduce((sum,n)=>sum+charge(n),0),-1);
  assert.equal([...f.querySelectorAll('[data-bond-id]')].reduce((sum,n)=>sum+(+n.dataset.bondOrder),0),4);for(const id of ['O1','O2']){const oxygen=atom(f,id);assert.equal(charge(oxygen),+f.querySelector(`[data-bond-id="C-${id}"]`).dataset.bondOrder-2);if(charge(oxygen)<0){const sign=oxygen.querySelector('[data-formal-charge]'),o=xy(oxygen),c=xy(atom(f,'C')),projection=(+sign.getAttribute('x'))*(c[0]-o[0])+(+sign.getAttribute('y'))*(c[1]-o[1]);assert.ok(projection<0,'negative sign sits outside the oxygen, away from the C–O bond');}}
 });}assert.equal(+forms[0].querySelector('[data-bond-id="C-O1"]').dataset.bondOrder,2);assert.equal(+forms[1].querySelector('[data-bond-id="C-O1"]').dataset.bondOrder,1);w.close();
});

test('energy scenes retain geometry nodes and synchronize the selected drawing with captions at exact boundaries',()=>{
 const {w,scenes,draw}=setup();for(const id of ['atp','arrows']){const a=draw(id),nodes=()=>[...a.g.querySelectorAll('g,path,line,circle,ellipse,rect,polygon')],initial=nodes(),dispose=[],root=scenes.find(s=>s.id==='chem-'+id).build({index:0,onDispose(fn){dispose.push(fn);},step(){throw Error('Unexpected hidden step');}});w.document.querySelector('main').append(root);
  const boundaries=id==='atp'?[.2,.4,.6,.8]:[.25,.5,.75];for(const p of [0,...boundaries.flatMap(b=>[b-1e-7,b-1e-9,b,b+1e-9]),1,.13]){a.paint(p);assert.deepEqual(nodes(),initial);assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity/);const input=root.querySelector('input');input.value=String(p*100);input.dispatchEvent(new w.Event('input',{bubbles:true}));const metrics=JSON.parse(root.dataset.metrics);assert.equal(metrics[id==='atp'?'phase':'selected'],+root.dataset.explanationPhase);}
  dispose.reverse().forEach(fn=>fn());root.remove();
 }w.close();
});

 test('ATP story carries the same chemical inset to the rotor, then carries the beta site out and releases its retained packet',()=>{const {w,draw}=setup(),a=draw('atp'),acid=a.g.querySelector('[data-atp-carboxyl]'),beta=a.g.querySelector('[data-atp-pocket]').parentElement,packet=a.g.querySelector('[data-atp-phosphates]');
 const at=(p,n)=>{a.paint(p);return n.getAttribute('transform');};
 assert.notEqual(at(.15,acid),at(.20,acid));assert.notEqual(at(.54,acid),at(.58,acid));assert.notEqual(at(.61,beta),at(.65,beta));assert.notEqual(at(.91,packet),at(.96,packet));
 a.paint(.26);const x=xy(atom(acid,'H'))[0];assert.ok(x>136&&x<241);assert.equal(a.metrics.carboxylProtonated,false);a.paint(.32);assert.equal(a.metrics.carboxylProtonated,true);a.paint(.5);assert.equal(a.metrics.carboxylProtonated,false);assert.ok(xy(atom(acid,'H'))[0]>136);
 for(let i=0;i<=200;i++){a.paint(i/200);assert.equal(a.metrics.localPairCharge,0);assert.equal(a.metrics.phosphateGroups,3);assert.ok(a.metrics.angle>=0&&a.metrics.angle<=360);assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity/);}w.close();});
 test('arrow semantics are demonstrated by electron transfer, composition transport, force scaling and opposed traced conventions',()=>{const {w,draw}=setup(),a=draw('arrows');const snap=(p,sel,attr)=>{a.paint(p);return [...a.g.querySelectorAll(sel)].map(n=>n.getAttribute(attr)).join('|');};
 assert.notEqual(snap(.085,'[data-flow-electron]','cx'),snap(.12,'[data-flow-electron]','cx'));
 assert.notEqual(snap(.32,'[data-stoichiometric-count]','cx'),snap(.36,'[data-stoichiometric-count]','cx'));
 a.paint(.64);const before={...a.metrics};a.paint(.70);assert.ok(a.metrics.forceSeparation<before.forceSeparation);assert.ok(a.metrics.forceLength>before.forceLength);near(a.metrics.forceLength/before.forceLength,(before.forceSeparation/a.metrics.forceSeparation)**2);
 assert.notEqual(snap(.79,'[data-dipole-density]','cx'),snap(.815,'[data-dipole-density]','cx'));
 a.paint(.84);const chem=a.g.querySelector('[data-arrow-kind="dipole-chemical"]'),cv=shaft(chem);assert.ok(cv[2]>221&&cv[2]<469);assert.ok(visible(chem.querySelector('[data-arrow-head]')));a.paint(.94);const phys=a.g.querySelector('[data-arrow-kind="dipole-physics"]'),pv=shaft(phys);assert.ok(pv[2]>804&&pv[2]<1052);assert.ok(visible(phys.querySelector('[data-arrow-head]')));w.close();});
