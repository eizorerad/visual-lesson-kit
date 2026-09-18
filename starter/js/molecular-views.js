/* Molecular view bricks: persistent source geometry, shared cameras and scene lifecycle.
 * Load after MC, F and T. These are depictions of supplied coordinates, not simulations.
 * See guide/molecular-views-api.md for the explicit source/data contracts.
 */
(function(g){
'use strict';
const finite=(n,label)=>{if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;};
const unit=(n,label)=>{finite(n,label);if(n<0||n>1)throw new RangeError(label+' must be in [0,1]');return n;};
const object=(x,label)=>{if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError(label+' must be an object');return x;};
const list=(xs,label)=>{if(!Array.isArray(xs)||!xs.length)throw new TypeError(label+' must be nonempty');return xs;};
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
function frozenCopy(x){const copy=JSON.parse(JSON.stringify(x));function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}return freeze(copy);}
function xyz(p){if(!Array.isArray(p)||p.length!==3)throw new TypeError('xyz must contain three coordinates');p.forEach(n=>finite(n,'xyz'));return p;}
function geometry(data){object(data,'data');xyz(data.origin);MC.project(data,data.origin);return data;}
function identity(data){
 geometry(data);for(const key of ['pdb_id','source_sha256','coordinate_units'])if(typeof data[key]!=='string'||!data[key].trim())throw new TypeError('Supply source '+key);
 if(!Number.isInteger(data.model)||data.model<1)throw new TypeError('Supply a positive integer source model');return data;
}
function sameSource(a,b){
 identity(b);for(const k of ['pdb_id','model','source_sha256','coordinate_units','altloc'])if(a[k]!==b[k])throw new RangeError('Molecular parts must share source '+k);
 if(a.basis.some((r,i)=>r.some((n,j)=>Math.abs(n-b.basis[i][j])>1e-9)))throw new RangeError('Molecular parts must share the same basis');
}
function rowsById(rows,label){
 list(rows,label);const map=new Map(),strings=new Set();
 for(const row of rows){if(!row||(typeof row.id!=='string'&&!Number.isFinite(row.id))||String(row.id)===''||strings.has(String(row.id)))throw new TypeError(label+' IDs must be unique and nonempty');map.set(row.id,row);strings.add(String(row.id));}return map;
}
function explicitBonds(bonds,rows,label){
 if(!Array.isArray(bonds))throw new TypeError(label+' must be explicit');const seen=new Set();
 for(const pair of bonds){if(!Array.isArray(pair)||pair.length!==2||pair[0]===pair[1]||pair.some(id=>!rows.has(id)))throw new TypeError(label+' endpoints must exist');const key=pair.map(String).sort().join('\u0000');if(seen.has(key))throw new TypeError(label+' must not contain duplicate links');seen.add(key);}
}
function boxValue(value,defaults){const b={...defaults,...value};for(const k of ['x','y','width','height'])finite(b[k],'box '+k);if(b.width<=0||b.height<=0)throw new RangeError('box dimensions must be positive');return b;}
function colorFunction(color,fallback){if(color===undefined)return ()=>fallback;if(typeof color==='string'&&color.trim())return ()=>color;if(typeof color==='function')return color;throw new TypeError('color must be a CSS color string or function');}
function resolvedColors(rows,color){const colors=new Map();for(const row of rows){const c=color(row.id);if(typeof c!=='string'||!c.trim())throw new TypeError('color must return a CSS color string');colors.set(row.id,c);}return id=>colors.get(id);}
function projectAll(data,points,camera){return MC.projectMany(data,points,camera);}

function assembly(parent,input,{chains={}}={}){
 identity(input);list(input.traces,'traces');object(chains,'chains');const traceMap=new Map();
 for(const trace of input.traces){
  if(typeof trace.chain!=='string'||!trace.chain||traceMap.has(trace.chain))throw new TypeError('Trace chains must be unique and nonempty');
  const rows=rowsById(trace.rows,'trace rows');trace.rows.forEach(row=>xyz(row.xyz));explicitBonds(trace.bonds,rows,'trace bonds');traceMap.set(trace.chain,rows);
 }
 for(const chain of Object.keys(chains))if(!traceMap.has(chain))throw new RangeError('Unknown chain style '+chain);
 const styles=new Map();
 for(const trace of input.traces){
  const options=chains[trace.chain]||{},width=options.width===undefined?(trace.atom==='P'?3.2:1.5):finite(options.width,'chain width');object(options,'chain style');if(width<=0)throw new RangeError('chain width must be positive');
  const color=resolvedColors(trace.rows,colorFunction(options.color,trace.atom==='P'?C.gold:C.blue)),highlightColor=colorFunction(options.highlightColor, C.gold);
  styles.set(trace.chain,{width,color,highlightColor:resolvedColors(trace.rows,highlightColor),opacity:unit(options.opacity===undefined?1:options.opacity,'chain opacity')});
 }
 const data=frozenCopy(input),rows=new Map(data.traces.map(t=>[t.chain,new Map(t.rows.map(r=>[r.id,r]))]));
 const q=D.dom.s('g',{'data-mv-kind':'assembly','data-mv-source':data.pdb_id}),actors=[];
 for(const trace of data.traces){const style=styles.get(trace.chain);for(const [a,b] of trace.bonds){
  const node=F.line(q,0,0,0,0,style.color(a),style.width);node.dataset.mvChain=trace.chain;node.dataset.mvSourceBond=JSON.stringify([a,b]);node.dataset.sourceBond=String(a)+'-'+String(b);
  const title=D.dom.s('title');title.textContent=data.pdb_id+' · '+trace.chain+' · '+a+'–'+b+' · '+trace.atom;node.append(title);
  actors.push({node,chain:trace.chain,ids:[a,b],coords:[rows.get(trace.chain).get(a).xyz,rows.get(trace.chain).get(b).xyz]});
 }}
 // Adjacent bonds share source rows. Project each endpoint once, not once per bond.
 const points=[...new Set(actors.flatMap(a=>a.coords))],pointIndex=new Map(points.map((p,i)=>[p,i]));
 actors.forEach(a=>{a.indices=a.coords.map(p=>pointIndex.get(p));});
 let previousCamera=null;
 parent.append(q);
 function paint(camera={},emphasis={}){
  object(emphasis,'assembly emphasis');const opacity=emphasis.opacity||{},highlight=emphasis.highlight||{};object(opacity,'opacity');object(highlight,'highlight');
  for(const [chain,value] of Object.entries(opacity)){if(!rows.has(chain))throw new RangeError('Unknown opacity chain '+chain);unit(value,'chain opacity');}
  const selected=new Map();for(const [chain,ids] of Object.entries(highlight)){if(!rows.has(chain)||!Array.isArray(ids)||ids.some(id=>!rows.get(chain).has(id)))throw new RangeError('highlight must name existing trace row IDs');selected.set(chain,new Set(ids));}
  // Validate even on a cache hit. Copy scalar values: callers may mutate origin.
  MC.project(data,data.origin,camera);
  const values=[...(camera.origin||data.origin),...['cx','cy','scale','angle','pitch'].map(k=>camera[k]===undefined?(k==='scale'?1:0):camera[k])];
  const changed=!previousCamera||values.some((n,i)=>n!==previousCamera[i]),cameraJSON=JSON.stringify(camera);
  let projected;
  if(changed){
   // Prepare the complete frame before its first visible write.
   const ps=projectAll(data,points,camera);
   projected=actors.map(a=>{const [p,r]=a.indices.map(i=>ps[i]);return {a,p,r,z:finite((p.depth+r.depth)/2,'bond depth')};});
  }
  for(const a of actors){const style=styles.get(a.chain),sel=selected.get(a.chain),isSelected=sel&&a.ids.every(id=>sel.has(id)),alpha=isSelected?1:(own(opacity,a.chain)?opacity[a.chain]:style.opacity),stroke=isSelected?style.highlightColor(a.ids[0]):style.color(a.ids[0]);
   if(stroke!==a.stroke){a.node.setAttribute('stroke',stroke);a.stroke=stroke;}
   if(alpha!==a.alpha){
    // These actors contain one stroked line and a title, with no fill or markers.
    // Stroke alpha gives the same blending without a compositing layer per line.
    a.node.setAttribute('stroke-opacity',alpha);const pointerEvents=alpha>.01?'':'none';
    if(a.node.style.pointerEvents!==pointerEvents)a.node.style.pointerEvents=pointerEvents;
    a.alpha=alpha;
   }
  }
  if(changed){
   for(const {a,p,r,z} of projected){F.seg(a.node,p.x,p.y,r.x,r.y);a.node.dataset.mvDepth=z;}
   // Stable source order breaks equal-depth ties. Leave correctly placed nodes alone:
   // moving an SVG line also makes i18n inspect its title in a mutation microtask.
   let cursor=q.firstChild;
   for(const {a} of projected.sort((a,b)=>a.z-b.z)){if(a.node===cursor)cursor=cursor.nextSibling;else q.insertBefore(a.node,cursor);}
   previousCamera=values;
  }
  if(q.dataset.camera!==cameraJSON)q.dataset.camera=cameraJSON;
  return {project:point=>MC.project(data,point,camera),row:(chain,id)=>rows.get(chain)?.get(id)};
 }
 return {g:q,data,paint,row:(chain,id)=>rows.get(chain)?.get(id)};
}

function sourcePoints(data){
 if(Array.isArray(data.traces))return data.traces.flatMap(t=>t.rows.map(r=>r.xyz));
 if(Array.isArray(data.residues))return data.residues.flatMap(r=>r.atoms?Object.values(r.atoms):[r.xyz]);
 throw new TypeError('Supply traces, atomic residues, or explicit fit points');
}
function fit(data,{box,padding=12,angle=0,pitch=0,points}={}){
 geometry(data);const region=boxValue(box,{x:60,y:147,width:1160,height:463});finite(padding,'padding');if(padding<0||2*padding>=Math.min(region.width,region.height))throw new RangeError('padding must leave a positive drawing area');
 finite(angle,'angle');finite(pitch,'pitch');const ps=points===undefined?sourcePoints(data):points;list(ps,'fit points');ps.forEach(xyz);
 const origin=MC.centroid(ps),raw=projectAll(data,ps,{origin,scale:1,cx:0,cy:0,angle,pitch});
 const xmin=Math.min(...raw.map(p=>p.x)),xmax=Math.max(...raw.map(p=>p.x)),ymin=Math.min(...raw.map(p=>p.y)),ymax=Math.max(...raw.map(p=>p.y));
 const width=region.width-2*padding,height=region.height-2*padding,dx=xmax-xmin,dy=ymax-ymin;
 // A coincident projection has no natural span; use one source unit, centered.
 const scale=dx===0&&dy===0?Math.min(width,height):Math.min(dx>0?width/dx:Infinity,dy>0?height/dy:Infinity);
 const camera={origin,cx:region.x+region.width/2-(xmin+xmax)/2*scale,cy:region.y+region.height/2-(ymin+ymax)/2*scale,scale,angle,pitch};
 Object.values(camera).filter(v=>!Array.isArray(v)).forEach(v=>finite(v,'fit camera'));if(scale<=0)throw new RangeError('fit scale must be positive');projectAll(data,ps,camera);return camera;
}

function validateContext(data,selection,options){
 const c=object(data.context,'context data'),rows=rowsById(c.residues,'context residues');geometry(c);c.residues.forEach(r=>xyz(r.xyz));explicitBonds(c.bonds,rows,'context bonds');
 const ids=Array.isArray(selection)?selection:selection&&typeof selection.has==='function'&&typeof selection[Symbol.iterator]==='function'?[...selection]:null;if(!Array.isArray(ids)||!ids.length||ids.some(id=>!rows.has(id)))throw new RangeError('context selection must name existing residues');
 if(new Set(ids).size!==ids.length)throw new RangeError('context selection must not duplicate residues');
 const box=boxValue(options.box,{x:89.5,y:244,width:237,height:272}),leaderX=options.leaderX===undefined?375:finite(options.leaderX,'leaderX');return {ids,box,leaderX};
}
function fragmentActors(model,data,part){
 // Match explicit MC actor identities to source coordinates; never infer geometry from SVG.
 const entries=new Map(),add=(key,value,coords)=>entries.set(key+'\u0000'+value,coords);
 for(const r of data.residues){
  r.rings.forEach((ring,i)=>add('tertiaryRing',r.id+':'+i,ring.map(n=>r.atoms[n])));add('tertiarySugar',r.id,data.sugar_ring.map(n=>r.atoms[n]));
  const glyco=r.glycosidic||["C1'",['A','G'].includes(r.component)?'N9':'N1'];
  for(const [a,b] of [glyco,...data.backbone.slice(1).map((n,j)=>[data.backbone[j],n]),...r.exo])add('tertiaryBond',r.id+':'+a+'-'+b,[r.atoms[a],r.atoms[b]]);
  for(const name of new Set([...r.rings.flat(),...data.sugar_ring,...data.backbone,...r.exo.flat()]))add('tertiaryAtom',r.id+':'+name,[r.atoms[name]]);
 }
 const rows=new Map(data.residues.map(r=>[r.id,r]));for(const [a,b] of data.bonds)add('tertiaryCovalent',a+'-'+b,[rows.get(a).atoms["O3'"],rows.get(b).atoms.P]);
 return [...model.g.children].map(node=>{const key=['tertiaryRing','tertiarySugar','tertiaryBond','tertiaryAtom','tertiaryCovalent'].find(k=>own(node.dataset,k)),coords=entries.get(key+'\u0000'+node.dataset[key]);if(!coords)throw new Error('Unrecognized MC actor; molecular view adapter must be updated');node.dataset.mvPart=part;return {node,coords,part};});
}
function detail(parent,{parts:input,context:contextInput}={}){
 list(input,'parts');const ids=new Set(),prepared=[];identity(input[0].data);
 for(const part of input){
  if(typeof part.id!=='string'||!part.id||ids.has(part.id))throw new TypeError('part IDs must be unique and nonempty');ids.add(part.id);sameSource(input[0].data,part.data);MC.validateRNA(part.data);const rows=rowsById(part.data.residues,'part residues');
  const focusIds=part.focusIds===undefined?[...rows.keys()]:part.focusIds;if(!Array.isArray(focusIds)||focusIds.some(id=>!rows.has(id)))throw new RangeError('focusIds must name existing residues');
  const color=resolvedColors(part.data.residues,colorFunction(part.color,C.blue));prepared.push({id:part.id,data:frozenCopy(part.data),focusIds:focusIds.slice(),color});
 }
 let ctx=null;if(contextInput){object(contextInput,'context');sameSource(input[0].data,contextInput.data);const settings=validateContext(contextInput.data,contextInput.selection,contextInput),color=resolvedColors(contextInput.data.context.residues,colorFunction(contextInput.color,C.gold));ctx={...settings,data:frozenCopy(contextInput.data),color};}
 const q=D.dom.s('g',{'data-mv-kind':'detail','data-mv-source':prepared[0].data.pdb_id}),parts=Object.create(null),actors=[],data=prepared[0].data;
 const locator=ctx?MC.context(q,ctx.data,new Set(ctx.ids),ctx.color,{box:ctx.box,leaderX:ctx.leaderX}):null;
 for(const part of prepared){const model=MC.rnaFragment(q,part.data,{color:part.color,focusIds:part.focusIds});parts[part.id]=model;actors.push(...fragmentActors(model,part.data,part.id));}
 const layer=F.group(q);layer.dataset.mvSharedDepth='true';parent.append(q);
 function anchor(part,id,camera){if(!own(parts,part)||!parts[part].row(id))throw new RangeError('anchor must name an existing part and residue');return MC.project(data,parts[part].row(id).center,camera);}
 function paint(camera={},emphasis={}){
  object(emphasis,'detail emphasis');const perPart=emphasis.parts||{};object(perPart,'part emphasis');for(const id of Object.keys(perPart))if(!own(parts,id))throw new RangeError('Unknown emphasis part '+id);
  const contextOpacity=unit(emphasis.contextOpacity===undefined?1:emphasis.contextOpacity,'context opacity'),focus=unit(emphasis.focus===undefined?0:emphasis.focus,'focus'),detail=unit(emphasis.detail===undefined?1:emphasis.detail,'detail'),settings=new Map();
  for(const part of prepared){const local=perPart[part.id]||{};object(local,'part emphasis');settings.set(part.id,{focus:unit(local.focus===undefined?focus:local.focus,'focus'),detail:unit(local.detail===undefined?detail:local.detail,'detail'),opacity:unit(local.opacity===undefined?1:local.opacity,'part opacity')});}
  // All fragments use one explicit origin, even when their own framing origins differ.
  const cam={...camera,origin:camera.origin||data.origin};MC.project(data,data.origin,cam);
  const depths=actors.map(a=>{const ps=projectAll(data,a.coords,cam);return {a,z:ps.reduce((sum,p)=>sum+p.depth,0)/ps.length};});
  const outputs=Object.create(null);for(const part of prepared)outputs[part.id]=parts[part.id].paint(cam,settings.get(part.id));
  for(const {a,z} of depths){F.opacity(a.node,Number(a.node.style.opacity)*settings.get(a.part).opacity);a.node.dataset.mvDepth=z;}
  depths.sort((a,b)=>a.z-b.z).forEach(({a})=>layer.append(a.node));if(locator)F.opacity(locator,contextOpacity);q.dataset.camera=JSON.stringify(cam);
  return {parts:outputs,project:point=>MC.project(data,point,cam),anchor:(part,id)=>anchor(part,id,cam)};
 }
 return {g:q,data,parts:Object.freeze(parts),context:locator,paint,anchor};
}

function rig(ctx,{state,paint,steps=[],duration=1900,control:options}={}){
 if(!ctx||typeof ctx.step!=='function'||typeof ctx.onDispose!=='function')throw new TypeError('rig requires a scene context');object(state,'state');if(typeof paint!=='function')throw new TypeError('paint must be a function');Object.values(state).forEach(v=>finite(v,'state'));
 const fields=Object.keys(state);finite(duration,'duration');if(duration<0)throw new RangeError('duration must be nonnegative');if(!Array.isArray(steps))throw new TypeError('steps must be an array');
 const patchCheck=patch=>{object(patch,'step patch');for(const [k,v] of Object.entries(patch)){if(!fields.includes(k))throw new RangeError('step must name existing state fields');finite(v,'step '+k);}};
 const script=steps.map(step=>{object(step,'step');const to=own(step,'to')?step.to:step,time=own(step,'to')&&step.duration!==undefined?step.duration:duration;patchCheck(to);finite(time,'step duration');if(time<0)throw new RangeError('step duration must be nonnegative');return {to:{...to},duration:time};});
 let config=null;if(options){object(options,'control');const key=options.key===undefined?'angle':options.key;if(!own(state,key))throw new RangeError('control must name an existing state field');const min=finite(options.min,'control min'),max=finite(options.max,'control max'),step=options.step===undefined?1:finite(options.step,'control step');if(max<=min||step<=0)throw new RangeError('control range and step must increase');
  if(!options.root||typeof options.root.append!=='function'||typeof options.label!=='string'||!options.label.trim())throw new TypeError('control needs a root and readable label');
  const x=options.x===undefined?140:finite(options.x,'control x'),y=options.y===undefined?550:finite(options.y,'control y'),width=options.width===undefined?430:finite(options.width,'control width'),suffix=options.suffix===undefined?'':options.suffix;if(width<=0)throw new RangeError('control width must be positive');if(typeof suffix!=='string')throw new TypeError('control suffix must be a string');
  if([state[key],...script.filter(s=>own(s.to,key)).map(s=>s.to[key])].some(n=>n<min||n>max))throw new RangeError('control range must contain initial and guided values');config={...options,key,min,max,step,x,y,width,suffix};
 }
 let disposed=false,control=null;
 function render(){if(disposed)return;if(control){const value=String(state[config.key]),label=String(Math.round(state[config.key]*100)/100)+config.suffix;if(control.input.value!==value)control.input.value=value;if(control.output.textContent!==label)control.output.textContent=label;}paint(state);}
 const inner=F.driver(state,render);
 function checkRange(patch){if(config&&own(patch,config.key)&&(patch[config.key]<config.min||patch[config.key]>config.max))throw new RangeError('camera value exceeds control range');}
 function dispose(){if(disposed)return;disposed=true;inner.dispose();if(control)control.input.disabled=true;}
 const driver={set(patch){patchCheck(patch);checkRange(patch);return inner.set(patch);},to(patch,options){patchCheck(patch);checkRange(patch);return inner.to(patch,options);},cancel:inner.cancel,dispose};
 if(config)control=T.control(config.root,config.label,config.min,config.max,state[config.key],config.step,value=>{if(!disposed)driver.set({[config.key]:value});},config.x,config.y,config.width);
 ctx.onDispose(dispose);script.forEach(step=>ctx.step(()=>driver.to(step.to,{duration:step.duration})));render();
 return {driver,state,control,paint:render,dispose};
}
g.MV=Object.freeze({assembly,detail,fit,rig});
})(window);
