/* A continuous, state-painted visual vocabulary. Coordinates are stage units. */
(function(g){
'use strict';
const s=D.dom.s,h=D.dom.h;
function opacity(el,a){el.style.opacity=String(Math.max(0,Math.min(1,a)));el.style.pointerEvents=a>.01?'':'none';if(el instanceof HTMLElement)el.inert=a<.99;return el;}
function label(parent,x,y,value,size=26,color=C.white,anchor='middle'){
 const el=T.text(x,y,value,size,color,anchor);parent.append(el);return el;
}
function line(parent,x1,y1,x2,y2,color=C.grey,width=2,dash=''){
 const el=s('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-dasharray':dash});parent.append(el);return el;
}
function seg(el,x1,y1,x2,y2,width){Object.entries({x1,y1,x2,y2,...(width===undefined?{}:{'stroke-width':width})}).forEach(([k,v])=>el.setAttribute(k,v));}
function dot(parent,x,y,r=6,color=C.gold){const el=s('circle',{cx:x,cy:y,r,fill:color});parent.append(el);return el;}
function pos(el,x,y){el.setAttribute('cx',x);el.setAttribute('cy',y);}
function at(el,x,y){el.setAttribute('transform',`translate(${x} ${y})`);}
function arrow(parent,color=C.gold,width=4){
 const q=s('g'),shaft=line(q,0,0,0,0,color,width),head=s('path',{fill:color});q.append(head);parent.append(q);
 return {g:q,shaft,head,set(x1,y1,x2,y2){seg(shaft,x1,y1,x2,y2);const a=Math.atan2(y2-y1,x2-x1),l=Math.min(14,Math.hypot(x2-x1,y2-y1)/2),w=l*.46;head.setAttribute('d',`M${x2},${y2} L${x2-l*Math.cos(a)+w*Math.sin(a)},${y2-l*Math.sin(a)-w*Math.cos(a)} L${x2-l*Math.cos(a)-w*Math.sin(a)},${y2-l*Math.sin(a)+w*Math.cos(a)} Z`);}};
}
function path(parent,points,color=C.gold,width=3){const el=s('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':width,'stroke-linejoin':'round','stroke-linecap':'round'});parent.append(el);return el;}
function stage(ctx,title=(g.LESSON||{}).title||'Интерактивный урок',kicker=(g.LESSON||{}).kicker||'',source=((g.LESSON||{}).source||{}).label||'Учебная схема · данные иллюстративные'){
 const root=h('section.scene.film-scene',{'aria-label':title});const svg=s('svg.film-viz',{viewBox:'0 0 1280 720',width:1280,height:720,role:'img','aria-label':title});root.append(svg);
 const chapterText=String(kicker).replace(/^\d+(?:\s*\/\s*\d+)?\s*[·]\s*/,''),count=D.deck.count?D.deck.count():null;
 const eyebrow=h('div.film-kicker',{hidden:true},Number.isInteger(ctx.index)&&count?(ctx.index+1)+' / '+count+' · '+chapterText:chapterText),heading=h('h1.film-title',{},title),cap=h('div.film-caption'),src=h('div.film-source',{hidden:true},source);root.append(eyebrow,heading,cap,src);
 if(g.L){
  g.L.contract(heading,{id:'stage.title',box:{x:60,y:44,width:1160,height:100},space:root,measure:'content'});
  g.L.contract(cap,{id:'stage.caption',box:{x:90,y:620,width:1100,height:70},space:root,measure:'content'});
  g.L.watch(root,ctx);
 }
 return {root,svg,heading,cap,src,caption(v){cap.innerHTML=v;},title(v){heading.innerHTML=v;},label:(...a)=>label(svg,...a)};
}
// A step can contain ordered phases without creating or replacing actors.
function phase(t,start=0,end=1){
 if(![t,start,end].every(Number.isFinite)||end<=start)throw new RangeError('phase requires finite progress and an increasing interval');
 const q=Math.max(0,Math.min(1,(t-start)/(end-start)));
 return q===0||q===1?q:q*q*(3-2*q);
}
const strokeSources=new WeakMap();
function revealStroke(el,t){
 if(!Number.isFinite(t)||!el||typeof el.setAttribute!=='function')throw new TypeError('revealStroke needs an SVG stroke and finite progress');
 const q=Math.max(0,Math.min(1,t));
 if(!strokeSources.has(el))strokeSources.set(el,['pathLength','stroke-dasharray','stroke-dashoffset'].map(k=>[k,el.getAttribute(k)]));
 if(q===1){strokeSources.get(el).forEach(([k,value])=>value===null?el.removeAttribute(k):el.setAttribute(k,value));}
 else{el.setAttribute('pathLength',1);el.setAttribute('stroke-dasharray','1 1');el.setAttribute('stroke-dashoffset',1-q);}
 opacity(el,q===0?0:1);return el;
}
function growArrow(a,x1,y1,x2,y2,t){
 if(![x1,y1,x2,y2,t].every(Number.isFinite))throw new TypeError('growArrow coordinates and progress must be finite');
 const q=Math.max(0,Math.min(1,t));a.set(x1,y1,x1+(x2-x1)*q,y1+(y2-y1)*q);opacity(a.g,q===0?0:1);return a;
}
function tween(state,patch,paint,duration=1700){const initial={};Object.keys(patch).forEach(k=>initial[k]=state[k]);return A.run(t=>{Object.keys(patch).forEach(k=>state[k]=initial[k]+(patch[k]-initial[k])*t);paint();},{duration});}
/* A local interaction supersedes only this controller's frames/completion.
   The shared scheduler may still drain an invalidated (now inert) tween. */
function driver(state,paint){
 if(!state||typeof state!=='object'||Array.isArray(state)||typeof paint!=='function')throw new TypeError('driver needs a numeric state object and paint function');
 const fields=Object.keys(state);
 if(fields.some(k=>!Number.isFinite(state[k])))throw new TypeError('driver state must be finite numbers');
 let version=0,disposed=false,pending=null;
 function patchKeys(patch){
  if(disposed)throw new Error('driver is disposed');
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('driver patch must be an object');
  const keys=Object.keys(patch);
  if(keys.some(k=>!fields.includes(k)||!Number.isFinite(patch[k])||!Number.isFinite(state[k])))throw new TypeError('driver patch must name existing finite numeric fields');
  return keys;
 }
 function cancel(){version++;if(pending){const previous=pending;pending=null;previous.resolve({completed:false});}}
 function set(patch){const keys=patchKeys(patch);cancel();keys.forEach(k=>state[k]=patch[k]);paint();}
 function to(patch,options={}){
  const keys=patchKeys(patch);
  if(!options||typeof options!=='object')throw new TypeError('driver options must be an object');
  const duration=options.duration===undefined?1700:options.duration,after=options.after,ease=options.ease;
  if(!Number.isFinite(duration)||duration<0)throw new TypeError('duration must be finite and nonnegative');
  if(after!==undefined&&typeof after!=='function')throw new TypeError('after must be a function');
  if(ease!==undefined&&typeof ease!=='function'&&!['linear','smooth','in','out','thereAndBack'].includes(ease))throw new TypeError('ease must name an easing curve or be a function');
  const initial={},target={};keys.forEach(k=>{initial[k]=state[k];target[k]=patch[k];});
  cancel();const id=version;
  return new Promise((resolve,reject)=>{
   pending={resolve};
   A.run(t=>{
    if(disposed||id!==version)return;
    try{keys.forEach(k=>state[k]=t===1?target[k]:(1-t)*initial[k]+t*target[k]);paint();}
    catch(error){if(id===version){version++;pending=null;}reject(error);}
   },{duration,...(ease===undefined?{}:{ease})}).then(()=>{
    if(disposed||id!==version)return;
    pending=null;
    try{if(after)after();resolve({completed:true});}catch(error){reject(error);}
   },error=>{if(id===version){pending=null;reject(error);}});
  });
 }
 function dispose(){if(!disposed){cancel();disposed=true;}}
 return {set,to,cancel,dispose};
}
function step(ctx,v,state,patch,paint,caption,duration=1700){ctx.step(()=>{if(caption!==undefined)v.caption(caption);return tween(state,patch,paint,duration);});}
function group(parent){const el=s('g');parent.append(el);return el;}
function image(parent,file,x,y,w,height,alt){const el=s('image',{href:D.assets.url(file),x,y,width:w,height,preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':alt});parent.append(el);return el;}
function cell(parent,x,y,r=30,color=C.gold,id=''){
 const q=s('g',{'data-cell-id':id});const membrane=s('path',{d:`M ${r},0 C ${r},${.61*r} ${.45*r},${1.04*r} 0,${r} C ${-.64*r},${.96*r} ${-1.02*r},${.46*r} ${-r},0 C ${-.98*r},${-.59*r} ${-.46*r},${-1.06*r} 0,${-r} C ${.58*r},${-.98*r} ${1.03*r},${-.52*r} ${r},0 Z`,fill:color,'fill-opacity':.055,stroke:color,'stroke-width':2});q.append(membrane);const nucleus=s('ellipse',{cx:-r*.12,cy:r*.1,rx:r*.27,ry:r*.22,fill:color,'fill-opacity':.14,stroke:color,'stroke-opacity':.5});q.append(nucleus);parent.append(q);at(q,x,y);return {g:q,membrane,nucleus};
}
function grid(parent,ox,oy,k,xmin=-1,xmax=3,ymin=-3,ymax=1){const q=group(parent);for(let x=xmin;x<=xmax;x++)line(q,ox+k*x,oy-k*ymin,ox+k*x,oy-k*ymax,x===0?'var(--color-muted)':'var(--color-bg)',x===0?1.7:1);for(let y=ymin;y<=ymax;y++)line(q,ox+k*xmin,oy-k*y,ox+k*xmax,oy-k*y,y===0?'var(--color-muted)':'var(--color-bg)',y===0?1.7:1);return q;}
function note(html,anchor='',url){return T.note(html,anchor,url);}
g.F={phase,revealStroke,growArrow,stage,label,line,seg,dot,pos,at,arrow,path,group,opacity,tween,step,driver,image,cell,grid,note,lerp:(a,b,t)=>a+(b-a)*t,clamp:t=>Math.max(0,Math.min(1,t))};
})(window);
