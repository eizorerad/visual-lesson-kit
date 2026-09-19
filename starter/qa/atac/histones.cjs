#!/usr/bin/env node
'use strict';
/* Source-coordinate and rendered-cartoon audit. Timing is a diagnostic from
 * this local browser run, not a calibrated performance benchmark. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.join(root,'dist/lesson.html');
const output=path.join(root,'qa-output/atac/histones');fs.mkdirSync(output,{recursive:true});
const near=(a,b,t=1e-6)=>Math.abs(a-b)<t,dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
(async()=>{
 const report={artifactSha256:digest(fs.readFileSync(artifact)),checks:[],frames:[],errors:[],external:[],performance:[]};
 const check=(name,fn)=>{try{fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const sandbox={window:{}};vm.createContext(sandbox);
 for(const file of ['js/atac-structures.js','js/atac-histone-core-data.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
 const source=JSON.parse(JSON.stringify(sandbox.window.AtacStructures)),data=JSON.parse(JSON.stringify(sandbox.window.AtacHistoneCoreData));
 const cif=fs.readFileSync(path.join(root,data.coordinateFile),'utf8'),by=new Map(source.nucleosome.chains.map(c=>[c.id,c]));
 const annotations=cif.split('\n').filter(l=>l.startsWith('HELX_P ')).map(l=>{const v=l.trim().split(/\s+/);return{id:v[1],chain:v[4],first:+v[5],last:+v[9],authFirst:+v[13],authLast:+v[16],helixClass:+v[17]};});
 const atomColumns=cif.split('\n').filter(l=>l.startsWith('_atom_site.')).map(l=>l.trim()),column=k=>atomColumns.indexOf('_atom_site.'+k);
 const caAtoms=new Map();
 for(const line of cif.split('\n').filter(l=>/^ATOM\s/.test(l))){
  const v=line.trim().split(/\s+/);if(v[column('label_atom_id')]!=='CA'||v[column('pdbx_PDB_model_num')]!=='1'||!['.','A'].includes(v[column('label_alt_id')]))continue;
  caAtoms.set(v[column('label_asym_id')]+':'+v[column('label_seq_id')],{occupancy:+v[column('occupancy')],auth:+v[column('auth_seq_id')],point:['x','y','z'].map(k=>+v[column('Cartn_'+k)])});
 }
 check('The source coordinate file matches the extraction provenance',()=>assert.equal(digest(cif),data.sourceSha256));
 check('The octamer contains two source chains for each of four histone types',()=>{
  assert.equal(data.chains.length,8);assert.equal(new Set(data.chains.map(c=>c.id)).size,8);
  for(const role of ['H2A','H2B','H3','H4'])assert.equal(data.chains.filter(c=>c.role.includes(role)).length,2);
 });
 check('Coordinate registration is a proper rotation and one uniform positive scale',()=>{
  const R=data.frame.rotation;assert(near(det(R),1,3e-8));assert(data.frame.scale>0);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)assert(near(R[i].reduce((s,x,k)=>s+x*R[j][k],0),i===j?1:0,3e-8));
  assert(data.frame.fitRmsd>0&&Number.isFinite(data.frame.fitRmsd));
 });
 let sourceError=0,pairDistanceError=0,helixCount=0,zeroOccupancy=0,tailEdges=0,uncertainTailEdges=0,tailRanges=0;const allSource=[],allLocal=[];
 for(const chain of data.chains){
  check(`${chain.id}: every C-alpha point retains its source identity and uniform transform`,()=>{
   const s=by.get(chain.id);assert(s);assert.equal(s.authorId,chain.authorId);assert.equal(chain.points.length,chain.residues.length);assert.equal(chain.points.length,chain.sourceIndices.length);assert.equal(chain.points.length,s.points.length);assert.deepEqual(chain.sourceIndices,s.points.map((_,i)=>i));
   chain.points.forEach((p,i)=>{
    const si=chain.sourceIndices[i],q=s.points[si];assert.equal(chain.residues[i],+s.residues[si].authSeqId);
    const expected=data.frame.rotation.map((r,k)=>r.reduce((v,x,j)=>v+x*q[j],0)*data.frame.scale+data.frame.translation[k]);
    sourceError=Math.max(sourceError,dist(p,expected));assert(dist(p,expected)<2e-6);allSource.push(q);allLocal.push(p);
   });
  });
  check(`${chain.id}: occupancies agree with every deposited C-alpha atom`,()=>{
   assert.equal(chain.occupancies.length,chain.points.length);
   chain.sourceIndices.forEach((si,i)=>{const s=by.get(chain.id),r=s.residues[si],atom=caAtoms.get(chain.id+':'+r.seqId);assert(atom);assert.equal(atom.auth,chain.residues[i]);assert.equal(atom.occupancy,chain.occupancies[i]);assert.deepEqual(atom.point,s.points[si]);if(atom.occupancy===0)zeroOccupancy++;});
  });
  check(`${chain.id}: terminal traces reach the correct shared core anchors`,()=>{
   const [lo,hi]=chain.authRange,first=chain.residues.indexOf(lo),last=chain.residues.indexOf(hi),expected=[];assert(first>=0&&last>=first);
   if(first>0)expected.push({end:'N',startIndex:0,endIndex:first});if(last<chain.points.length-1)expected.push({end:'C',startIndex:last,endIndex:chain.points.length-1});
   assert.deepEqual(chain.tails,expected);tailRanges+=expected.length;
   for(const tail of expected)for(let i=tail.startIndex;i<tail.endIndex;i++){assert.equal(chain.residues[i+1],chain.residues[i]+1);assert(!chain.breaks.includes(i+1));tailEdges++;if(chain.occupancies[i]===0||chain.occupancies[i+1]===0)uncertainTailEdges++;}
  });
  check(`${chain.id}: displayed helices reproduce deposited CIF assignments`,()=>{
   const expected=annotations.filter(a=>a.chain===chain.id&&a.authFirst>=chain.authRange[0]&&a.authLast<=chain.authRange[1]);
   assert.equal(chain.helices.length,expected.length);
   for(const h of chain.helices){
    const a=expected.find(a=>a.id===h.id);assert(a);assert.equal(h.authStart,a.authFirst);assert.equal(h.authEnd,a.authLast);assert.equal(h.helixClass,a.helixClass);
    assert.equal(chain.residues[h.startIndex],a.authFirst);assert.equal(chain.residues[h.endIndex],a.authLast);
    assert.equal(by.get(chain.id).residues[chain.sourceIndices[h.startIndex]].seqId,a.first);assert.equal(by.get(chain.id).residues[chain.sourceIndices[h.endIndex]].seqId,a.last);
    assert(h.axisStart.every(Number.isFinite)&&h.axisEnd.every(Number.isFinite));assert(dist(h.axisStart,h.axisEnd)>0);helixCount++;
   }
  });
  check(`${chain.id}: compact trace does not erase source breaks`,()=>{
   for(let i=1;i<chain.sourceIndices.length;i++){
    const crossed=chain.sourceIndices[i]!==chain.sourceIndices[i-1]+1||by.get(chain.id).breaks.includes(chain.sourceIndices[i]);
    assert.equal(chain.breaks.includes(i),crossed);
   }
  });
 }
 check('All inter-residue distances preserve the same scale, including between different chains',()=>{
  for(let i=0;i<allSource.length;i++)for(let j=i+1;j<allSource.length;j++)pairDistanceError=Math.max(pairDistanceError,Math.abs(dist(allSource[i],allSource[j])*data.frame.scale-dist(allLocal[i],allLocal[j])));
  assert(pairDistanceError<1e-6);assert.equal(helixCount,36);
 });
 check('All deposited terminal coordinates are retained without adding missing H2B positions',()=>{assert.equal(allSource.length,974);assert.equal(zeroOccupancy,114);assert.equal(tailRanges,10);assert.equal(tailEdges,248);assert.equal(uncertainTailEdges,136);for(const id of ['F','J']){assert.equal(by.get(id).residues[0].seqId,4);assert.equal(data.chains.find(c=>c.id===id).residues[0],1);}});
 report.sourceAudit={points:allSource.length,helices:helixCount,zeroOccupancy,tailRanges,tailEdges,uncertainTailEdges,maximumTransformResidual:sourceError,maximumPairDistanceResidual:pairDistanceError,registration:data.frame};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=histone-cartoon');await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.AtacHistoneCoreData);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   window.histoneSources=JSON.stringify([AtacStructures,AtacHistoneCoreData]);window.histoneNodes=[...ATAC_FILM.actors.chromatin.g.querySelectorAll('*')];
   return{cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion})),data:AtacHistoneCoreData};
  });
  check('The bundled artifact contains the same verified histone data',()=>assert.deepEqual(JSON.parse(JSON.stringify(setup.data)),data));
  const cues=new Map(setup.cues.map(c=>[c.key,c])),zoom=cues.get('nucleosome-real');
  async function frame(time){return page.evaluate(async time=>{
   CINEMA.seek(time);const audit=await L.ready(D.deck.root()),root=ATAC_FILM.actors.chromatin.g;
   const nodes=[...root.querySelectorAll('*')],coreNodes=[...root.querySelectorAll('[data-bio-part="histone-core"]')];
   const cores=coreNodes.map(core=>{
    const parts=[...core.querySelectorAll('[data-protein-cartoon]')],b=core.getBBox();
    return{bp:+core.dataset.genomicCenter,source:core.dataset.source,chains:[...new Set(parts.map(n=>n.dataset.histoneChain))],roles:Object.fromEntries(['H2A','H2B','H3','H4'].map(role=>[role,new Set(parts.filter(n=>n.dataset.histoneRole===role).map(n=>n.dataset.histoneChain)).size])),helices:parts.filter(n=>n.dataset.proteinCartoon==='helix').length,loops:parts.filter(n=>n.dataset.proteinCartoon==='loop').length,tails:parts.filter(n=>n.dataset.proteinCartoon==='tail').length,bounds:{x:b.x,y:b.y,width:b.width,height:b.height},parts:parts.map(n=>({chain:n.dataset.histoneChain,role:n.dataset.histoneRole,kind:n.dataset.proteinCartoon,end:n.dataset.tailEnd,uncertain:n.dataset.zeroOccupancy==='true',d:n.children[1].getAttribute('d'),stroke:n.children[1].getAttribute('stroke'),computed:getComputedStyle(n.children[1]).stroke,dashes:[...n.children].map(p=>p.getAttribute('stroke-dasharray')),caps:[...n.children].map(p=>p.getAttribute('stroke-linecap')),widths:[...n.children].map(p=>+p.getAttribute('stroke-width')),opacity:+n.style.opacity||1}))};
   });
   const pdb=ATAC_FILM.actors.structure.g.querySelector('[data-pdb="1KX5"]'),cartoon=pdb.querySelector('[data-structure-histone-cartoon]');
   const colors=Object.fromEntries([...new Set(cores.flatMap(c=>c.chains))].map(id=>{const n=cartoon.querySelector('[data-histone-chain="'+id+'"]');return[id,{stroke:n.children[1].getAttribute('stroke'),computed:getComputedStyle(n.children[1]).stroke}];}));
   const fullOpacity=n=>{let a=1;while(n?.nodeType===1){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;n=n.parentElement;}return a;};
   const vertices=d=>(d||'').split(/[ML]/).map(s=>s.trim()).filter(Boolean).map(s=>s.split(',').map(Number));
   // The superseded C-alpha traces are retained as a projected source-point
   // oracle only. Assertions below inspect the actually rendered cartoon.
   const rawTraces=[...pdb.querySelectorAll('g[data-kind="protein"]')],projected=new Map();
   for(const n of rawTraces){
    const chain=n.dataset.chain,points=projected.get(chain)||new Map(),ps=vertices(n.children[1].getAttribute('d'));
    ps.forEach((p,i)=>points.set(+n.dataset.startIndex+i,p));projected.set(chain,points);
   }
   const detailed=[...cartoon.querySelectorAll('[data-protein-cartoon]')].map(n=>{
    const kind=n.dataset.proteinCartoon,chain=n.dataset.histoneChain,ps=vertices(n.children[1].getAttribute('d'));
    const mapped=kind==='helix'?[]:ps.map(p=>[...projected.get(chain)].map(([index,q])=>({index,error:Math.hypot(p[0]-q[0],p[1]-q[1])})).sort((a,b)=>a.error-b.error)[0]);
    return{chain,kind,end:n.dataset.tailEnd,part:+n.dataset.histonePart,uncertain:n.dataset.zeroOccupancy==='true',indices:mapped.map(p=>p.index),maximumSourcePointResidual:Math.max(0,...mapped.map(p=>p.error)),dashes:[...n.children].map(p=>p.getAttribute('stroke-dasharray')),caps:[...n.children].map(p=>p.getAttribute('stroke-linecap')),widths:[...n.children].map(p=>+p.getAttribute('stroke-width')),opacity:fullOpacity(n)};
   });
   const detailedState={cartoonOpacity:fullOpacity(cartoon),structureOpacity:fullOpacity(pdb),hiddenTraceMaximumOpacity:Math.max(...rawTraces.map(fullOpacity)),cartoonParts:detailed.length,helices:detailed.filter(p=>p.kind==='helix').length};
   const tailLabel=D.deck.root().querySelector('[data-atac-annotation="tails"]'),tailLine=tailLabel?.querySelector('line'),tailAnnotation=tailLabel?{opacity:+getComputedStyle(tailLabel).opacity,anchor:ATAC_FILM.snapshot.anchors.tails,line:tailLine?['x1','y1','x2','y2'].map(k=>+tailLine.getAttribute(k)):null}:null;
   const invalid=nodes.filter(n=>['d','transform','x','y','cx','cy','r','rx','ry'].some(k=>/NaN|Infinity/.test(n.getAttribute(k)||''))).length;
   return{time,key:ATAC_FILM.snapshot.key,cores,colors,detailed,detailedState,tailAnnotation,values:ATAC_FILM.snapshot.values,invalid,issues:audit.issues,stable:nodes.length===histoneNodes.length&&histoneNodes.every(n=>nodes.includes(n)),immutable:histoneSources===JSON.stringify([AtacStructures,AtacHistoneCoreData])};
  },time);}
  const shots=[['chromatin',cues.get('chromatin').time],['nucleosome',cues.get('nucleosome').time],['zoom-50',zoom.arrive+zoom.motion*.5],['zoom-75',zoom.arrive+zoom.motion*.75],['nucleosome-real',cues.get('nucleosome-real').time],['histone-octamer',cues.get('histone-octamer').time],['wrapped-dna',cues.get('wrapped-dna').time],['tn5',cues.get('tn5').time],['dock',cues.get('dock').time]];
  let nucleosomeReference;
  for(const [name,time]of shots){
   const row=await frame(time);report.frames.push({name,...row});
   check(`${name}: four finite persistent source-derived octamers`,()=>{
    assert.equal(row.cores.length,4);assert(row.stable&&row.immutable);assert.equal(row.invalid,0);assert.equal(row.issues.length,0);
    for(const c of row.cores){assert.equal(c.source,'1KX5');assert.equal(c.chains.length,8);assert.equal(c.helices,36);assert(Object.values(c.roles).every(n=>n===2));assert(Object.values(c.bounds).every(Number.isFinite));assert(c.bounds.width>0&&c.bounds.height>0);}
   });
   check(`${name}: source-chain colors remain consistent with the experimental PDB view`,()=>{for(const c of row.cores)for(const p of c.parts){assert.equal(p.stroke,row.colors[p.chain].stroke);assert.equal(p.computed,row.colors[p.chain].computed);}});
   check(`${name}: uncertain tail segments are dashed consistently in both representations`,()=>{
    const hasDash=value=>typeof value==='string'&&value.trim()!==''&&value!=='none'&&value.split(/[ ,]+/).every(v=>Number(v)>0);
    for(const core of row.cores){assert(core.tails>0);assert.equal(new Set(core.parts.filter(p=>p.kind==='tail').map(p=>p.chain+':'+p.end)).size,10);for(const p of core.parts){assert(p.dashes.every(v=>hasDash(v)===p.uncertain));if(p.uncertain)for(let i=0;i<p.dashes.length;i++)if(p.caps[i]==='round')assert(+p.dashes[i].split(/[ ,]+/)[1]>p.widths[i],'Round caps close the uncertainty dash gaps');}}
    assert.equal(row.detailedState.helices,36);assert.equal(row.detailedState.hiddenTraceMaximumOpacity,0,'Superseded C-alpha traces must not compete with the visible cartoon');
    if(row.detailedState.structureOpacity>.001){assert(row.detailedState.cartoonOpacity>0);assert(row.detailed.every(p=>p.opacity>0),'Actual structural cartoon segments must remain visible');}
    const edges=[],tails=[];let uncertain=0;
    for(const p of row.detailed){
     const c=data.chains.find(c=>c.id===p.chain);assert(c);assert(p.dashes.every(v=>hasDash(v)===p.uncertain));
     if(p.uncertain)for(let i=0;i<p.dashes.length;i++)if(p.caps[i]==='round')assert(+p.dashes[i].split(/[ ,]+/)[1]>p.widths[i],'Structural cartoon round caps close uncertainty gaps');
     if(p.kind==='helix')continue;
     assert(p.maximumSourcePointResidual<.02,'Visible structural cartoon does not pass through projected source C-alpha points');assert(p.indices.length>=2);
     for(let j=1;j<p.indices.length;j++){const i=p.indices[j-1];assert.equal(p.indices[j],i+1);assert(!c.breaks.includes(i+1));assert.equal(p.uncertain,c.occupancies[i]===0||c.occupancies[i+1]===0);edges.push(p.chain+':'+i);if(p.kind==='tail')tails.push(p.chain+':'+p.end+':'+i);if(p.uncertain)uncertain++;}
    }
    const expected=[],expectedTails=[];
    for(const c of data.chains)for(let i=0;i<c.points.length-1;i++){
     if(c.breaks.includes(i+1))continue;
     const tail=c.tails.find(t=>i>=t.startIndex&&i<t.endIndex);
     if(tail)expectedTails.push(c.id+':'+tail.end+':'+i);
     if(tail||!c.helices.some(h=>i>=h.startIndex&&i+1<=h.endIndex))expected.push(c.id+':'+i);
    }
    assert.deepEqual(edges.sort(),expected.sort());assert.equal(new Set(edges).size,edges.length);assert.deepEqual(tails.sort(),expectedTails.sort());assert.equal(tails.length,248);assert.equal(uncertain,136);
   });
   if(name==='nucleosome')nucleosomeReference=row;
   await page.screenshot({path:path.join(output,name+'.png')});
  }
  check('The tail callout identifies resolved H3 G:12 on the selected nucleosome',()=>{
   const row=nucleosomeReference,label=row.tailAnnotation,c=data.chains.find(c=>c.id==='G'),i=c.residues.indexOf(12);assert(i>=0);assert.equal(c.occupancies[i],1);assert(label&&label.opacity>.99&&label.line);
   const p=c.points[i],tilt=18*Math.PI/180,world=[-124+p[0]*Math.cos(tilt)-p[1]*Math.sin(tilt),30+p[0]*Math.sin(tilt)+p[1]*Math.cos(tilt),10+p[2]];
   const turn=row.values.turn*Math.PI/180,pitch=18*Math.PI/180+turn,yaw=.22*Math.sin(turn),x=Math.cos(yaw)*world[0]+Math.sin(yaw)*world[2],z=-Math.sin(yaw)*world[0]+Math.cos(yaw)*world[2],y=Math.cos(pitch)*world[1]-Math.sin(pitch)*z,scale=.64+.36*row.values.focus;
   assert(dist(label.anchor,[640+scale*x,385+scale*y])<1e-5);assert(near(dist(label.line.slice(2),label.anchor),8,.02));
  });
  for(const time of [cues.get('protected').arrive+.4,zoom.arrive+zoom.motion*.75,cues.get('chromatin').time,cues.get('nucleosome').time,cues.get('protected').time,cues.get('nucleosome').time]){
   const row=await frame(time);check(`Reverse camera seek ${time.toFixed(3)}s is deterministic`,()=>{assert(row.stable&&row.immutable);assert.equal(row.invalid,0);if(row.key==='nucleosome')assert.deepEqual(row.cores,nucleosomeReference.cores);});
  }
  await page.evaluate(()=>{D.i18n.setLang('en');D.appearance.set({font:'serif',background:'white',palette:'ocean'});});
  for(const [name,time]of [['light-nucleosome',cues.get('nucleosome').time],['light-zoom-50',zoom.arrive+zoom.motion*.5],['light-protected',cues.get('protected').time]]){
   const row=await frame(time);report.frames.push({name,...row});check(`${name}: theme switching retains geometry, source identity and readable contracts`,()=>{assert(row.stable&&row.immutable);assert.equal(row.invalid,0);assert.equal(row.issues.length,0);for(const c of row.cores)for(const p of c.parts)assert.equal(p.computed,row.colors[p.chain].computed);});await page.screenshot({path:path.join(output,name+'.png')});
  }
  // An isolated renderer instance uses an identity projector. Its actual SVG
  // segments are checked against all permitted source-adjacent residue edges.
  const segmentAudit=await page.evaluate(()=>{
   const data=AtacHistoneCoreData,ns='http://www.w3.org/2000/svg';
   function inspect(modified){
    const scratch=document.createElementNS(ns,'svg'),make=(tag,attrs,parent)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.appendChild(n);return n;};
    const previous=window.AtacHistoneCoreData;window.AtacHistoneCoreData=modified;let cartoon;
    try{cartoon=AtacHistoneCartoon.create(scratch,make);}finally{window.AtacHistoneCoreData=previous;}
    cartoon.paint(p=>({x:p[0],y:p[1],depth:p[2]}),1);
    const loops=[...scratch.querySelectorAll('[data-protein-cartoon="loop"]')],tails=[...scratch.querySelectorAll('[data-protein-cartoon="tail"]')],actual=[],actualTails=[],actualTailAnchors=[];
    let maximumPolylineVertices=0;
    for(const n of loops){
     const coords=n.children[1].getAttribute('d').split(/[ML]/).map(s=>s.trim()).filter(Boolean);
     maximumPolylineVertices=Math.max(maximumPolylineVertices,coords.length);
     for(let i=1;i<coords.length;i++)actual.push(n.dataset.histoneChain+':M'+coords[i-1]+' L'+coords[i]);
    }
    actual.sort();
    let uncertainEdges=0,tailDashConsistent=true;
    for(const n of tails){
     const coords=n.children[1].getAttribute('d').split(/[ML]/).map(s=>s.trim()).filter(Boolean),weak=n.dataset.zeroOccupancy==='true';
     maximumPolylineVertices=Math.max(maximumPolylineVertices,coords.length);
     for(const p of n.children)tailDashConsistent&&=!!p.getAttribute('stroke-dasharray')===weak;
     for(let i=1;i<coords.length;i++){actualTails.push(n.dataset.histoneChain+':'+n.dataset.tailEnd+':'+weak+':M'+coords[i-1]+' L'+coords[i]);if(weak)uncertainEdges++;}
     actualTailAnchors.push(n.dataset.histoneChain+':'+coords[0],n.dataset.histoneChain+':'+coords.at(-1));
    }
    const expected=[],expectedTails=[],expectedTailAnchors=[];
    for(const c of modified.chains){
     const inside=new Map(),tailEdges=new Map();c.helices.forEach((h,k)=>{for(let i=h.startIndex;i<=h.endIndex;i++)inside.set(i,k);});
     for(const t of c.tails){for(let i=t.startIndex;i<t.endIndex;i++)tailEdges.set(i,t.end);const anchor=c.points[t.end==='N'?t.endIndex:t.startIndex];expectedTailAnchors.push(c.id+':'+anchor[0].toFixed(3)+','+anchor[1].toFixed(3));}
     for(let i=0;i<c.points.length-1;i++){
      if(c.breaks.includes(i+1))continue;
      const edge=c.points.slice(i,i+2).map((p,j)=>(j?'L':'M')+p[0].toFixed(3)+','+p[1].toFixed(3)).join(' ');
      if(tailEdges.has(i)){expectedTails.push(c.id+':'+tailEdges.get(i)+':'+(c.occupancies[i]===0||c.occupancies[i+1]===0)+':'+edge);continue;}
      if(inside.has(i)&&inside.get(i)===inside.get(i+1))continue;expected.push(c.id+':'+edge);
     }
    }
    return{actual,expected:expected.sort(),actualTails:actualTails.sort(),expectedTails:expectedTails.sort(),tailDashConsistent,uncertainEdges,anchorsRetained:expectedTailAnchors.every(p=>actualTailAnchors.includes(p)),parts:scratch.querySelectorAll('[data-protein-cartoon]').length,loopPolylines:loops.length,tailPolylines:tails.length,maximumPolylineVertices};
   }
   const original=inspect(data),controls=[];
   for(const region of ['loop','tail']){
    const changed=JSON.parse(JSON.stringify(data)),c=changed.chains[0],inside=new Map(),tailEdges=new Set();c.helices.forEach((h,k)=>{for(let i=h.startIndex;i<=h.endIndex;i++)inside.set(i,k);});c.tails.forEach(t=>{for(let i=t.startIndex;i<t.endIndex;i++)tailEdges.add(i);});
    const breakAt=c.points.findIndex((_,i)=>i>0&&(region==='tail'?tailEdges.has(i-1):!tailEdges.has(i-1)&&!(inside.has(i-1)&&inside.get(i-1)===inside.get(i))));c.breaks.push(breakAt);controls.push({region,breakAt,...inspect(changed)});
   }
   return{original,controls,immutable:histoneSources===JSON.stringify([AtacStructures,AtacHistoneCoreData])};
  });
  check('Every rendered loop is a valid adjacent source edge outside helix interiors',()=>{assert.deepEqual(segmentAudit.original.actual,segmentAudit.original.expected);assert(segmentAudit.original.maximumPolylineVertices<=7);});
  check('Every deposited terminal edge and all ten core-tail junctions remain connected',()=>{const a=segmentAudit.original;assert.deepEqual(a.actualTails,a.expectedTails);assert.equal(a.actualTails.length,248);assert.equal(a.uncertainEdges,136);assert(a.anchorsRetained&&a.tailDashConsistent);});
  for(const c of segmentAudit.controls)check(`Injected ${c.region} chain-break control suppresses the corresponding connector`,()=>{assert(c.breakAt>0);assert.deepEqual(c.actual,c.expected);assert.deepEqual(c.actualTails,c.expectedTails);assert.equal(c.actual.length+c.actualTails.length,segmentAudit.original.actual.length+segmentAudit.original.actualTails.length-1);assert(segmentAudit.immutable);});
  report.loopAudit={segmentsPerCore:segmentAudit.original.actual.length,loopPolylinesPerCore:segmentAudit.original.loopPolylines,terminalEdgesPerCore:segmentAudit.original.actualTails.length,tailPolylinesPerCore:segmentAudit.original.tailPolylines,uncertainTailEdgesPerCore:segmentAudit.original.uncertainEdges,cartoonPrimitivesPerCore:segmentAudit.original.parts,totalCartoonPrimitives:segmentAudit.original.parts*4,totalShadedSvgPaths:segmentAudit.original.parts*4*3,maximumPolylineVertices:segmentAudit.original.maximumPolylineVertices,chainBreakControls:segmentAudit.controls.map(c=>({region:c.region,index:c.breakAt}))};
  await page.evaluate(()=>{D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});});
  for(const key of ['nucleosome','nucleosome-real','protected']){
   const measurement=await page.evaluate(async time=>{
    CINEMA.seek(time);await L.ready(D.deck.root());const intervals=[];let previous=null,first=null;const filmStart=CINEMA.current().time;
    CINEMA.play();await new Promise(resolve=>{function tick(now){if(first===null)first=now;if(previous!==null)intervals.push(now-previous);previous=now;if(now-first>=2200){resolve();return;}requestAnimationFrame(tick);}requestAnimationFrame(tick);});CINEMA.pause();
    const sorted=intervals.slice().sort((a,b)=>a-b),quantile=q=>sorted[Math.min(sorted.length-1,Math.floor(q*(sorted.length-1)))];
    return{samples:intervals.length,elapsedMs:intervals.reduce((a,b)=>a+b,0),medianMs:quantile(.5),p95Ms:quantile(.95),maximumMs:Math.max(...intervals),averageFramesPerSecond:1000*intervals.length/intervals.reduce((a,b)=>a+b,0),filmAdvancedSeconds:CINEMA.current().time-filmStart};
   },cues.get(key).arrive);report.performance.push({key,...measurement});
   check(`${key}: bounded real playback advances the film with finite frame timing`,()=>{assert(measurement.samples>0);assert(Object.values(measurement).every(Number.isFinite));assert(measurement.filmAdvancedSeconds>0);});
  }
  report.performanceNote='Diagnostic headless requestAnimationFrame intervals during actual film playback, 2.2 seconds per segment. May include concurrent desktop/QA load; no calibrated baseline or pass threshold for frame rate.';
  check('No browser errors or external requests',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);});
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass);fs.writeFileSync(path.join(root,'qa-output/atac/histone-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,loopAudit:report.loopAudit,performance:report.performance,failures:report.checks.filter(c=>!c.pass)},null,2));if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
