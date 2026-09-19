/* Explicit local-coordinate text boxes. Geometry is measured after mounting;
   wrapping never shrinks, clips, truncates, or rebuilds the surrounding scene. */
(function(global){
'use strict';
const SVG='http://www.w3.org/2000/svg',contracts=new Map(),texts=new Set(),watchers=new WeakMap();
let serial=0,fontEpoch=0;
// A loaded face can replace a fallback without changing computed CSS names.
const fontSet=global.document&&document.fonts;
if(fontSet){
 if(fontSet.addEventListener){fontSet.addEventListener('loadingdone',()=>{fontEpoch++;});fontSet.addEventListener('loadingerror',()=>{fontEpoch++;});}
 if(fontSet.ready)fontSet.ready.then(()=>{fontEpoch++;});
}
const belongs=(root,node)=>root===node||!!(root&&root.contains(node));
const finiteBounds=b=>b&&['x','y','width','height'].every(k=>Number.isFinite(b[k]))&&b.width>=0&&b.height>=0&&Number.isFinite(b.x+b.width)&&Number.isFinite(b.y+b.height);
function dense(array,test){for(let i=0;i<array.length;i++)if(!Object.prototype.hasOwnProperty.call(array,i)||!test(array[i]))return false;return true;}
function box(value){
 if(!finiteBounds(value)||value.width<=0||value.height<=0)throw new RangeError('Layout box needs finite coordinates/endpoints and positive width/height');
 return {x:value.x,y:value.y,width:value.width,height:value.height};
}
function padding(value=0){
 let a=Array.isArray(value)?value.slice():[value];
 if(![1,2,3,4].includes(a.length)||!dense(a,v=>Number.isFinite(v)&&v>=0))throw new RangeError('Padding needs one to four nonnegative finite stage units');
 if(a.length===1)a=[a[0],a[0],a[0],a[0]];
 else if(a.length===2)a=[a[0],a[1],a[0],a[1]];
 else if(a.length===3)a=[a[0],a[1],a[2],a[1]];
 return a;
}
function inset(value,pad=0){
 const b=box(value),[top,right,bottom,left]=padding(pad),width=b.width-left-right,height=b.height-top-bottom;
 if(width<=0||height<=0)throw new RangeError('Padding must leave positive content width and height');
 return box({x:b.x+left,y:b.y+top,width,height});
}
function tracks(value,count,options={},vertical=false){
 if(!Number.isInteger(count)||count<1)throw new RangeError('Track count must be a positive integer');
 const b=inset(value,options.padding===undefined?0:options.padding),gap=options.gap===undefined?0:options.gap;
 if(!Number.isFinite(gap)||gap<0)throw new RangeError('Gap must be finite and nonnegative');
 const weights=options.weights===undefined?Array(count).fill(1):options.weights;
 if(!Array.isArray(weights)||weights.length!==count||!dense(weights,n=>Number.isFinite(n)&&n>0))throw new RangeError('Track weights must be dense, positive and match count');
 const maximum=weights.reduce((a,v)=>Math.max(a,v),0),scaled=weights.map(v=>v/maximum);
 const length=(vertical?b.height:b.width)-gap*(count-1),total=scaled.reduce((a,v)=>a+v,0);
 if(!Number.isFinite(length)||length<=0||!Number.isFinite(total)||total<=0)throw new RangeError('Gaps or weights leave no finite track space');
 let cursor=vertical?b.y:b.x;
 return scaled.map((weight,i)=>{const size=length*(weight/total),result=box(vertical?{x:b.x,y:cursor,width:b.width,height:size}:{x:cursor,y:b.y,width:size,height:b.height});if(i<count-1)cursor+=size+gap;return result;});
}
function contract(node,options){
 if(!node||!options)throw new TypeError('contract needs a node and options');
 const read=typeof options.box==='function'?options.box:()=>options.box;
 const pad=options.padding===undefined?0:options.padding;inset(read(),pad);
 if(options.measure!==undefined&&!['element','content'].includes(options.measure))throw new RangeError('Unknown measurement mode');
 const entry={node,read,padding:padding(pad),space:options.space||node.parentNode,measure:options.measure||'element',id:options.id||node.dataset.layoutId||'layout-'+(++serial)};
 contracts.set(node,entry);node.dataset.layoutId=entry.id;node.dataset.layoutBox=JSON.stringify(read());node.dataset.layoutPadding=JSON.stringify(entry.padding);
 return ()=>{if(contracts.get(node)===entry)contracts.delete(node);};
}
function matrix(m){return m&&['a','b','c','d','e','f'].every(k=>Number.isFinite(m[k]))?m:null;}
function point(m,x,y){return {x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f};}
function inverse(m){const det=m.a*m.d-m.b*m.c;if(!Number.isFinite(det)||Math.abs(det)<1e-12)return null;return matrix({a:m.d/det,b:-m.b/det,c:-m.c/det,d:m.a/det,e:(m.c*m.f-m.d*m.e)/det,f:(m.b*m.e-m.a*m.f)/det});}
function geometry(node,space,measure){
 if(!node.isConnected||!space||!space.isConnected)return null;
 if(node.dataset.layoutStatus==='unmeasured')return null;
 if(node.namespaceURI===SVG){
  if(typeof node.getBBox!=='function'||typeof node.getScreenCTM!=='function'||typeof space.getScreenCTM!=='function')return null;
  let b,m,parent;try{b=node.getBBox();m=matrix(node.getScreenCTM());parent=matrix(space.getScreenCTM());}catch(_){return null;}
  if(!finiteBounds(b)||!m||!parent||node.textContent.trim()&&b.width===0&&b.height===0)return null;
  const inv=inverse(parent);if(!inv)return null;
  const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>{const p=point(m,x,y);return point(inv,p.x,p.y);});
  if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const x=Math.min(...pts.map(p=>p.x)),y=Math.min(...pts.map(p=>p.y)),result={x,y,width:Math.max(...pts.map(p=>p.x))-x,height:Math.max(...pts.map(p=>p.y))-y};return finiteBounds(result)?result:null;
 }
 let a;
 if(measure==='content'){
  const range=document.createRange();range.selectNodeContents(node);if(typeof range.getBoundingClientRect!=='function')return null;a=range.getBoundingClientRect();
 }else a=node.getBoundingClientRect();
 const r=space.getBoundingClientRect(),width=space.offsetWidth,height=space.offsetHeight;
 if(![a,r].every(v=>v&&['left','top','width','height'].every(k=>Number.isFinite(v[k])))||a.width<0||a.height<0||r.width<=0||r.height<=0||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const sx=width/r.width,sy=height/r.height,result={x:(a.left-r.left)*sx,y:(a.top-r.top)*sy,width:a.width*sx,height:a.height*sy};return finiteBounds(result)?result:null;
}
function visible(node){
 let opacity=1;
 for(let n=node;n&&n.nodeType===1;n=n.parentElement){const css=global.getComputedStyle(n);if(n.hidden||css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse')return false;const a=parseFloat(css.opacity);if(Number.isFinite(a))opacity*=a;}
 return opacity>.01;
}
function audit(root,options={}){
 const tolerance=options.tolerance===undefined?1:options.tolerance;
 if(!Number.isFinite(tolerance)||tolerance<0)throw new RangeError('Audit tolerance is nonnegative contract units');
 const report={contracted:0,checked:0,skipped:0,unmeasured:0,uncontractedText:[],issues:[],results:[]};
 if(root&&root.querySelectorAll)root.querySelectorAll('text').forEach(node=>{if(node.namespaceURI===SVG&&!contracts.has(node)&&node.textContent.trim()&&(options.visibleOnly===false||visible(node)))report.uncontractedText.push({text:node.textContent,id:node.id||null});});
 contracts.forEach(entry=>{
  const {node,space,id}=entry;if(!belongs(root,node))return;report.contracted++;
  if(options.visibleOnly!==false&&!visible(node)){report.skipped++;return;}
  const intended=inset(entry.read(),entry.padding),actual=geometry(node,space,entry.measure),result={id,text:node.getAttribute('aria-label')||node.textContent,box:intended,actual,units:'contract-local'};
  if(!actual){result.kind='unmeasured';report.unmeasured++;report.issues.push(result);report.results.push(result);return;}
  const excess={left:Math.max(0,intended.x-actual.x),top:Math.max(0,intended.y-actual.y),right:Math.max(0,actual.x+actual.width-intended.x-intended.width),bottom:Math.max(0,actual.y+actual.height-intended.y-intended.height)};
  if(!Object.values(excess).every(Number.isFinite)){result.kind='unmeasured';result.reason='Non-finite containment arithmetic';report.unmeasured++;report.issues.push(result);report.results.push(result);return;}
  report.checked++;
  result.excess=excess;result.kind=Object.values(excess).some(n=>n>tolerance)?'overflow':'fits';if(result.kind==='overflow')report.issues.push(result);report.results.push(result);
 });return report;
}
function textBox(parent,options){
 if(!parent||parent.namespaceURI!==SVG||!options)throw new TypeError('textBox needs an SVG parent and options');
 let bounds=box(options),source=String(options.text===undefined?'':options.text),disposed=false,raf=0,layoutSignature=null,layoutMeasurement=null;
 const pad=padding(options.padding===undefined?12:options.padding),size=options.size===undefined?25:options.size,lineHeight=options.lineHeight===undefined?1.4:options.lineHeight,lineGap=options.lineGap===undefined?size*.08:options.lineGap;
 if(!Number.isFinite(size)||size<=0||!Number.isFinite(lineHeight)||lineHeight<1)throw new RangeError('Text size must be positive and lineHeight at least 1');
 if(!Number.isFinite(lineGap)||lineGap<0)throw new RangeError('lineGap must be finite and nonnegative');
 const align=options.align||'center',valign=options.valign||'middle';if(!['left','center','right'].includes(align)||!['top','middle','bottom'].includes(valign))throw new RangeError('Unknown text alignment');
 inset(bounds,pad);
 const el=document.createElementNS(SVG,'text');el.setAttribute('font-size',size);el.setAttribute('fill',options.color||'var(--color-text)');el.setAttribute('font-family','var(--f-text)');el.setAttribute('text-anchor',{left:'start',center:'middle',right:'end'}[align]);el.setAttribute('dominant-baseline','alphabetic');el.setAttribute('data-i18n-ignore','');
 if(options.weight!==undefined)el.setAttribute('font-weight',options.weight);
 if(options.className)el.setAttribute('class',options.className);
 parent.append(el);const unregister=contract(el,{box:()=>bounds,padding:pad,space:parent,id:options.id});
 function schedule(){if(!disposed&&!raf)raf=global.requestAnimationFrame(()=>{raf=0;if(!disposed)layout();});}
 function layout(){
  if(disposed)return false;
  const content=global.D&&D.i18n?D.i18n.text(source):source,inner=inset(bounds,pad),x=align==='left'?inner.x:align==='right'?inner.x+inner.width:inner.x+inner.width/2;
  // Keep settled tspans intact. Repeatedly replacing identical SVG text can
  // invalidate Chromium's glyph paint cache during otherwise unrelated motion.
  // Include all font metrics and face-loading epochs; never cache bad measures.
  const style=el.isConnected?global.getComputedStyle(el):null;
  const fontKeys=['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','fontVariant','fontVariantLigatures','fontVariantNumeric','fontFeatureSettings','fontVariationSettings','fontKerning','fontOpticalSizing','fontSizeAdjust','letterSpacing','wordSpacing','textTransform','textRendering','direction','writingMode','textOrientation','dominantBaseline','alignmentBaseline'];
  const signature=style?JSON.stringify([source,content,bounds,pad,size,lineHeight,lineGap,align,valign,fontEpoch,fontSet&&fontSet.status,...fontKeys.map(k=>style[k])]):null;
  if(signature!==null&&signature===layoutSignature){
   let current;try{current=el.getBBox();}catch(_){}
   if(current&&finiteBounds(current)&&layoutMeasurement&&['x','y','width','height'].every(k=>Math.abs(current[k]-layoutMeasurement[k])<1e-6))return true;
  }
  layoutSignature=null;layoutMeasurement=null;
  el.dataset.layoutSource=source;el.dataset.layoutBox=JSON.stringify(bounds);el.setAttribute('aria-label',content);el.setAttribute('x',x);el.setAttribute('y',inner.y);el.textContent=content;
  if(!el.isConnected||typeof el.getComputedTextLength!=='function'||typeof el.getBBox!=='function'){el.dataset.layoutStatus='unmeasured';return false;}
  function width(text){el.textContent=text;try{return el.getComputedTextLength();}catch(_){return NaN;}}
  const lines=[];let valid=true;
  content.split(/\r?\n/).forEach(paragraph=>{
   const words=paragraph.trim().split(/\s+/);let line='';
   words.forEach(word=>{const candidate=line?line+' '+word:word,n=width(candidate);if(!Number.isFinite(n)||n<0||(candidate.trim()&&n===0)){valid=false;return;}if(line&&n>inner.width){lines.push(line);line=word;}else line=candidate;});lines.push(line);
  });
  if(!valid){el.textContent=content;el.dataset.layoutStatus='unmeasured';return false;}
  // SVG font rectangles can exceed 1.2 em (and differ across fallback glyphs).
  // Measure a common ascent/descent envelope before choosing the line stride.
  let metricTop=Infinity,metricBottom=-Infinity;
  lines.forEach(line=>{if(!line)return;el.textContent=line;let b;try{b=el.getBBox();}catch(_){valid=false;return;}if(!finiteBounds(b)||b.width===0||b.height===0){valid=false;return;}metricTop=Math.min(metricTop,b.y);metricBottom=Math.max(metricBottom,b.y+b.height);});
  if(!valid){el.textContent=content;el.dataset.layoutStatus='unmeasured';return false;}
  const stride=Math.max(size*lineHeight,(Number.isFinite(metricTop)?metricBottom-metricTop:0)+lineGap);if(!Number.isFinite(stride)){el.textContent=content;el.dataset.layoutStatus='unmeasured';return false;}el.dataset.layoutLineStride=String(stride);
  el.textContent='';
  const nodes=lines.map((line,i)=>{const n=document.createElementNS(SVG,'tspan');n.setAttribute('x',x);n.setAttribute('y',inner.y+i*stride);n.textContent=line;el.append(n);return n;});
  let measured;try{measured=el.getBBox();}catch(_){el.dataset.layoutStatus='unmeasured';return false;}
  if(!finiteBounds(measured)||(content.trim()&&(measured.width===0||measured.height===0))){el.dataset.layoutStatus='unmeasured';return false;}
  const top=valign==='top'?inner.y:valign==='bottom'?inner.y+inner.height-measured.height:inner.y+(inner.height-measured.height)/2,dy=top-measured.y;
  nodes.forEach(n=>n.setAttribute('y',+n.getAttribute('y')+dy));el.dataset.layoutStatus=measured.width>inner.width+.01||measured.height>inner.height+.01?'overflow':'fits';
  let settled;try{settled=el.getBBox();}catch(_){}
  if(!finiteBounds(settled)||(content.trim()&&(settled.width===0||settled.height===0))){el.dataset.layoutStatus='unmeasured';return false;}
  if(el.isConnected&&signature!==null){layoutSignature=signature;layoutMeasurement={x:settled.x,y:settled.y,width:settled.width,height:settled.height};}
  return true;
 }
 function refresh(){if(raf){global.cancelAnimationFrame(raf);raf=0;}layout();if(!el.isConnected)schedule();}
 const api={el,layout,setText(value){const next=String(value);if(next!==source){source=next;refresh();}return api;},setBox(value){const next=box(value);inset(next,pad);if(Object.keys(next).some(k=>next[k]!==bounds[k])){bounds=next;refresh();}return api;},dispose(){if(disposed)return;disposed=true;if(raf)global.cancelAnimationFrame(raf);unregister();texts.delete(api);}};
 texts.add(api);layout();schedule();return api;
}
function relayout(root){texts.forEach(api=>{if(belongs(root,api.el))api.layout();});}
// reflow additionally audits every contract; watchers only need the re-layout.
function reflow(root){relayout(root);return audit(root);}
async function ready(root){
 await Promise.resolve();
 reflow(root);
 // Reading the current promise after style changes includes newly requested fonts.
 if(document.fonts&&document.fonts.ready)await document.fonts.ready;
 await new Promise(resolve=>global.requestAnimationFrame(resolve));
 return reflow(root);
}
function watch(root,ctx){
 if(watchers.has(root))return watchers.get(root);
 let disposed=false,raf=0;
 const schedule=()=>{if(!disposed&&!raf)raf=global.requestAnimationFrame(()=>{raf=0;if(!disposed)relayout(root);});};
 const unlang=global.D&&D.i18n?D.i18n.onChange(()=>{if(!disposed)relayout(root);}):()=>{};
 const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-font','class','style']});
 const fonts=document.fonts;if(fonts&&fonts.addEventListener)fonts.addEventListener('loadingdone',schedule);if(fonts&&fonts.ready)fonts.ready.then(schedule);
 global.addEventListener('resize',schedule);
 function dispose(){
  if(disposed)return;disposed=true;if(raf)global.cancelAnimationFrame(raf);observer.disconnect();unlang();global.removeEventListener('resize',schedule);if(fonts&&fonts.removeEventListener)fonts.removeEventListener('loadingdone',schedule);
  texts.forEach(api=>{if(belongs(root,api.el))api.dispose();});contracts.forEach((entry,node)=>{if(belongs(root,node))contracts.delete(node);});watchers.delete(root);
 }
 const api={schedule,dispose};watchers.set(root,api);if(ctx&&typeof ctx.onDispose==='function')ctx.onDispose(dispose);schedule();return api;
}
global.L={inset,rows:(b,n,o)=>tracks(b,n,o,true),columns:(b,n,o)=>tracks(b,n,o,false),textBox,contract,audit,relayout,reflow,ready,watch};
})(window);
