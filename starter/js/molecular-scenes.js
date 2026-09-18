/* Ready scene layouts over the independent MV bricks. No source inference. */
(function(g){
'use strict';
const finite=(n,name)=>{if(!Number.isFinite(n))throw new TypeError(name+' must be finite');return n;};
function bilingual(v,name){
 if(!v||typeof v.ru!=='string'||!v.ru.trim()||typeof v.en!=='string'||!v.en.trim())throw new TypeError(name+' requires full ru and en strings');
 return v;
}
function tx(v){D.i18n.pack('en',{strings:{[v.ru]:v.en}});return v.ru;}
const escapeHTML=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function sourceNote(html,source){
 return '<p>'+html+'</p><p class="note-source"><a href="'+escapeHTML(source.url)+'" target="_blank" rel="noopener">'+escapeHTML(source.label)+'</a></p>';
}
function legendColor(c,entry){
 const trace=entry.chain===undefined?null:c.data.traces.find(t=>t.chain===entry.chain);
 if(entry.chain!==undefined&&!trace)throw new RangeError('unknown legend chain '+entry.chain);
 let color=entry.color===undefined?c.chains?.[entry.chain]?.color:entry.color;
 if(color===undefined)color=trace?(trace.atom==='P'?C.gold:C.blue):C.white;
 if(typeof color==='function'){
  if(!trace?.rows?.length)throw new TypeError('legend color callback requires a chain with source rows');
  color=color(trace.rows[0].id);
 }
 if(typeof color!=='string'||!color.trim())throw new TypeError('legend color must resolve to a CSS color string');
 return color;
}
function text(parent,id,box,value,size=23,color=C.white){
 return L.textBox(parent,{id,...box,text:tx(value),size,color,align:'left',padding:0,lineHeight:1.28});
}
const CHAPTER={ru:'Молекулярная структура',en:'Molecular structure'};
function prepare(c,type){
 if(!c||typeof c.id!=='string'||!c.id.trim())throw new TypeError('scene id is required');
 bilingual(c.title,'title');bilingual(c.chapter||CHAPTER,'chapter');
 if(!c.source||typeof c.source.url!=='string'||!/^https?:\/\//.test(c.source.url)||typeof c.source.label!=='string')throw new TypeError('source requires URL and label');
 if(!Array.isArray(c.states)||!c.states.length)throw new TypeError('states must be nonempty');
 c.states.forEach((s,i)=>{bilingual(s.caption,'caption '+i);bilingual(s.note,'note '+i);});
 if(!Array.isArray(c.qa)||!c.qa.length)throw new TypeError('provide at least one relevant QA item');
 c.qa.forEach(q=>{bilingual(q.q,'question');bilingual(q.a,'answer');});
 if(c.annotation)bilingual(c.annotation,'annotation');
 if(c.control?.label)bilingual(c.control.label,'control label');
 if(type==='overview'){
  if(!c.data?.traces?.length)throw new TypeError('overview requires trace data');
  if(!Array.isArray(c.legend)||!c.legend.length||c.legend.length>3)throw new RangeError('overview legend has one to three entries');
  c.legend.forEach(l=>{bilingual(l.label,'legend label');bilingual(l.description,'legend description');});
 }else{
  if(!Array.isArray(c.parts)||!c.parts.length||c.parts.length>2)throw new RangeError('detail preset has one or two parts; compose MV.detail for more');
  c.parts.forEach(p=>bilingual(p.label,'part label'));
  if(c.context){bilingual(c.context.label,'context label');bilingual(c.context.selectionLabel,'context selection label');}
 }
 return c;
}
function points(data){
 return data.traces?data.traces.flatMap(t=>t.rows.map(r=>r.xyz)):data.residues.flatMap(r=>Object.values(r.atoms));
}
// Rotation-invariant default framing: the source bounding sphere stays in the box.
// An explicit camera can use a closer teaching view, checked over its chosen range.
function sphereCamera(ps,box){
 const origin=MC.centroid(ps),radius=Math.max(...ps.map(p=>Math.hypot(...p.map((n,i)=>n-origin[i]))));
 if(!Number.isFinite(radius)||radius<=0)throw new RangeError('view needs spatially distinct source points');
 return {origin,cx:box.x+box.width/2,cy:box.y+box.height/2,scale:(Math.min(box.width,box.height)-24)/(2*radius),angle:0,pitch:0};
}
function cameraStates(c,initial,keys){
 let cam={...initial,...c.camera},alpha=Object.fromEntries(keys.map(k=>[k,c.chains?.[k]?.opacity===undefined?1:c.chains[k].opacity]));
 return c.states.map((step,phase)=>{
  cam={...cam,...step.camera};alpha={...alpha,...step.opacity};
  const out={phase,angle:cam.angle,pitch:cam.pitch,cx:cam.cx,cy:cam.cy,scale:cam.scale,ox:cam.origin[0],oy:cam.origin[1],oz:cam.origin[2]};
  Object.entries(out).forEach(([k,n])=>finite(n,k));if(out.scale<=0)throw new RangeError('camera scale must be positive');
  for(const k of Object.keys(step.opacity||{}))if(!keys.includes(k))throw new RangeError('unknown opacity identity '+k);
  keys.forEach((k,i)=>{const n=finite(alpha[k],'opacity');if(n<0||n>1)throw new RangeError('opacity must be in [0,1]');out['alpha'+i]=n;});
  return out;
 });
}
function readCamera(s){return {origin:[s.ox,s.oy,s.oz],cx:s.cx,cy:s.cy,scale:s.scale,angle:s.angle,pitch:s.pitch};}
function register(c,build){
 const chapterPair=c.chapter||CHAPTER,title=tx(c.title),chapter=tx(chapterPair);
 c.states.forEach(s=>tx(s.caption));
 D.i18n.pack('en',{
  patterns:[{match:new RegExp('^(\\d+(?:\\s*/\\s*\\d+)?\\s*·\\s*)'+escapeRegex(chapter)+'$'),replace:(_,prefix)=>prefix+chapterPair.en}],
  notes:{[c.id]:c.states.map(s=>sourceNote(s.note.en,c.source))},
  qa:{[c.id]:c.qa.map(q=>({q:q.q.en,a:q.a.en,url:q.url||c.source.url,source:c.source.label}))}
 });
 D.deck.register({id:c.id,title,chapter,
  notes:c.states.map(s=>sourceNote(s.note.ru,c.source)),
  qa:c.qa.map(q=>({q:q.q.ru,a:q.a.ru,url:q.url||c.source.url,source:c.source.label})),
  build(ctx){return build(ctx,title,chapter);}
 });
 return c.id;
}
function connect(ctx,v,c,view,states,keys,kind,controlDefaults){
 const state={...states[0]},captions=c.states.map(s=>s.caption.ru);
 let caption;
 const rig=MV.rig(ctx,{state,duration:c.duration===undefined?1900:c.duration,
  steps:states.slice(1).map((to,i)=>({to,duration:c.states[i+1].duration===undefined?(c.duration===undefined?1900:c.duration):c.states[i+1].duration})),
  control:c.control===false?undefined:{root:v.root,...controlDefaults,...c.control,label:tx(c.control?.label||{ru:'Ракурс',en:'View angle'}),key:'angle',suffix:'°'},
  paint(s){
   const opacity=Object.fromEntries(keys.map((k,i)=>[k,s['alpha'+i]]));
   if(kind==='overview')view.paint(readCamera(s),{opacity,highlight:c.highlight||{}});
   else view.paint(readCamera(s),{parts:Object.fromEntries(keys.map(k=>[k,{opacity:opacity[k]}]))});
   const nextCaption=captions[Math.min(captions.length-1,Math.floor(s.phase+1e-6))];
   // Remember the authored string, since i18n may have translated the live node.
   if(nextCaption!==caption){v.caption(nextCaption);caption=nextCaption;}
   v.root.dataset.state=JSON.stringify(s);
  }
 });
 v.root.dataset.molecularScene=kind;
 v.root.__molecular={view,rig};
 return v.root;
}
function overview(config){
 const c=prepare(config,'overview'),keys=c.data.traces.map(t=>t.chain);
 const legendColors=c.legend.map(l=>legendColor(c,l));
 const initial=sphereCamera(points(c.data),{x:135,y:220,width:615,height:310});
 const states=cameraStates(c,initial,keys);
 return register(c,(ctx,title,chapter)=>{
  const v=F.stage(ctx,title,chapter,c.source.label),view=MV.assembly(v.svg,c.data,{chains:c.chains||{}});
  F.line(v.svg,820,178,820,576,C.dim,1);
  const rows=[185,326,471];
  c.legend.forEach((l,i)=>{
   const y=rows[i],color=legendColors[i];
   text(v.svg,c.id+'.legend.'+i,{x:858,y,width:350,height:47},l.label,29,color);
   text(v.svg,c.id+'.role.'+i,{x:858,y:y+48,width:350,height:64},l.description,22);
  });
  if(c.annotation)text(v.svg,c.id+'.source',{x:80,y:156,width:720,height:34},c.annotation,18,C.grey);
  return connect(ctx,v,c,view,states,keys,'overview',{min:-35,max:55,x:150,y:554,width:560});
 });
}
function detail(config){
 const c=prepare(config,'detail'),keys=c.parts.map(p=>p.id),ps=c.parts.flatMap(p=>points(p.data));
 const states=cameraStates(c,sphereCamera(ps,{x:525,y:240,width:620,height:265}),keys);
 return register(c,(ctx,title,chapter)=>{
  const v=F.stage(ctx,title,chapter,c.source.label);
  const context=c.context?{data:c.context.data,selection:c.context.selection||new Set(c.context.data.residues.map(r=>r.id)),color:c.context.color||(()=>C.gold),box:{x:95,y:248,width:225,height:235},leaderX:362}:undefined;
  const view=MV.detail(v.svg,{parts:c.parts.map(p=>({...p,color:typeof p.color==='function'?p.color:()=>p.color||C.blue})),context});
  if(context){
   text(v.svg,c.id+'.context',{x:85,y:174,width:255,height:65},c.context.label,22,C.grey);
   text(v.svg,c.id+'.selection',{x:85,y:507,width:255,height:69},c.context.selectionLabel,22,C.gold);
  }
  c.parts.forEach((p,i)=>text(v.svg,c.id+'.part.'+i,{x:410+i*430,y:156,width:370,height:50},p.label,24,typeof p.color==='function'?p.color(p.data.residues[0].id):p.color||C.blue));
  if(c.annotation)text(v.svg,c.id+'.source',{x:430,y:511,width:690,height:37},c.annotation,18,C.grey);
  return connect(ctx,v,c,view,states,keys,'detail',{min:-25,max:55,x:455,y:559,width:650});
 });
}
g.MolecularScenes=Object.freeze({overview,detail});
})(window);
