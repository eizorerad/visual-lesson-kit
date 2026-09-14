/* Accessible enlarged snapshots of existing molecular actors. No biological state changes. */
(function(global){
'use strict';
let sequence=0,active=null;const interactiveCanvases=new WeakMap();
const B=global.B;
// Convert through screen space so nested SVG viewports and transformed parents
// share one coordinate system; cancel screen zoom back out of the result.
function relativeMatrix(node,parent){
 if(!node.getScreenCTM||!parent.getScreenCTM)return null;
 const n=node.getScreenCTM(),p=parent.getScreenCTM();if(!n||!p)return null;
 const det=p.a*p.d-p.b*p.c;if(!Number.isFinite(det)||det===0)return null;
 const m={a:(p.d*n.a-p.c*n.b)/det,b:(p.a*n.b-p.b*n.a)/det,c:(p.d*n.c-p.c*n.d)/det,d:(p.a*n.d-p.b*n.c)/det,e:(p.d*(n.e-p.e)-p.c*(n.f-p.f))/det,f:(p.a*(n.f-p.f)-p.b*(n.e-p.e))/det};
 return Object.values(m).every(Number.isFinite)?m:null;
}
function transformedBounds(b,m){
 const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}
function inspect(parent,actor,options={}){
 if(!actor||!actor.g||!actor.bounds)throw new TypeError('Molecular inspection requires an actor with bounds');
 for(const k of ['id','label','enLabel','title','enTitle'])if(typeof options[k]!=='string'||!options[k].trim())throw new TypeError('Inspection needs '+k);
 if(options.part&&!actor.g.querySelector('[data-bio-part="'+options.part+'"]'))throw new RangeError('Unknown inspection part');
 let bounds=options.detailBounds||actor.bounds;
 for(const k of ['x','y','width','height'])if(typeof bounds[k]!=='number'||!Number.isFinite(bounds[k]))throw new TypeError('Inspection bounds must be finite');
 if(bounds.width<=0||bounds.height<=0)throw new RangeError('Inspection bounds must have positive area');
 const id='molecular-detail-'+(++sequence),doc=parent.ownerDocument;
 const strings={[options.label]:options.enLabel,[options.title]:options.enTitle,'Закрыть крупный план':'Close detail','Крупный план того же объекта · зафиксированный кадр':'Enlarged view of the same object · captured frame'};
 if(options.description)strings[options.description]=options.enDescription||options.description;
 D.i18n.pack('en',{strings});
 let layer=null,disposed=false,stopLanguage=null;
 function placement(){return {a:actor.scale,b:0,c:0,d:actor.scale,e:actor.x,f:actor.y};}
 function box(){return options.box||transformedBounds(actor.bounds,relativeMatrix(actor.g,parent)||placement());}
 const trigger=T.svgButton(parent,{id:options.id,box:box(),label:options.label,onActivate:()=>open()});
 const canvases=[];for(let n=parent;n;n=n.parentElement)if(n.localName==='svg')canvases.push(n);const canvas=canvases[0];
 for(const svg of canvases){let record=interactiveCanvases.get(svg);if(!record){record={count:0,role:svg.getAttribute('role')};interactiveCanvases.set(svg,record);}record.count++;if(record.role==='img')svg.setAttribute('role','group');}
 trigger.g.dataset.molecularInspect=options.id;
 function close(restore=true){
  if(!layer)return;layer.remove();layer=null;if(stopLanguage)stopLanguage();stopLanguage=null;
  if(active===close)active=null;if(restore&&!disposed&&trigger.g.isConnected)trigger.g.focus();
 }
 function open(){
  if(disposed)throw new Error('Molecular inspection disposed');if(layer)return;
  if(active)active(false);if(options.onOpen)options.onOpen();
  bounds=options.detailBounds||actor.bounds;
  if(!['x','y','width','height'].every(k=>Number.isFinite(bounds[k]))||bounds.width<=0||bounds.height<=0)throw new RangeError('Current inspection bounds must have finite positive area');
  layer=doc.createElement('div');layer.className='evidence-layer molecular-detail';layer.dataset.molecularDetail=options.id;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby',id+'-title');layer.setAttribute('data-no-swipe','');
  const content=doc.createElement('div');content.className='evidence-content';
  const title=doc.createElement('h2');title.id=id+'-title';title.textContent=options.title;
  const subtitle=doc.createElement('p');subtitle.className='evidence-explanation';subtitle.textContent='Крупный план того же объекта · зафиксированный кадр';
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',options.title);svg.style.cssText='display:block;width:100%;height:min(64vh,580px);min-height:170px;margin:14px auto;font-family:var(--f-text)';
  const margin=Math.max(bounds.width,bounds.height)*.05,matrix=relativeMatrix(actor.g,canvas||parent)||placement();
  const view=transformedBounds({x:bounds.x-margin,y:bounds.y-margin,width:bounds.width+2*margin,height:bounds.height+2*margin},matrix);
  svg.setAttribute('viewBox',[view.x,view.y,view.width,view.height].join(' '));
  const clone=actor.g.cloneNode(true),originals=[...actor.g.querySelectorAll('*')],copies=[...clone.querySelectorAll('*')];
  clone.setAttribute('transform','matrix('+[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f].join(' ')+')');
  [clone,...copies].forEach(n=>{n.removeAttribute('id');n.removeAttribute('tabindex');n.removeAttribute('role');});
  [clone,...copies].forEach((n,j)=>{
    const source=[actor.g,...originals][j],width=parseFloat(source.style.strokeWidth||source.getAttribute('stroke-width'));if(!Number.isFinite(width))return;
    const current=relativeMatrix(source,canvas||parent);let scale=current?Math.sqrt(Math.abs(current.a*current.d-current.b*current.c)):actor.scale;
    if(!current)for(let p=source;p&&p!==actor.g;p=p.parentElement)for(const match of(p.getAttribute('transform')||'').matchAll(/scale\(\s*([\d.eE+-]+)/g))scale*=Math.abs(Number(match[1]));
    if((source.style.vectorEffect||source.getAttribute('vector-effect'))==='non-scaling-stroke')scale=1;
    n.setAttribute('stroke-width',width*scale);n.style.strokeWidth=width*scale+'px';n.setAttribute('vector-effect','non-scaling-stroke');n.style.vectorEffect='non-scaling-stroke';
  });
  if(options.part){const selected=clone.querySelector('[data-bio-part="'+options.part+'"]');for(const p of clone.querySelectorAll('[data-bio-part]'))if(p!==selected&&!p.contains(selected)&&!selected.contains(p)){const opacity=Number(p.style.opacity||p.getAttribute('opacity')||1)*.13;p.setAttribute('opacity',opacity);if(p.style.opacity)p.style.opacity=String(opacity);}}
  // Cloning the actor omits ancestor paint state. Keep that inherited visibility
  // on a separate wrapper so the actor's own opacity remains unchanged.
  const inherited=doc.createElementNS('http://www.w3.org/2000/svg','g');let opacity=1;
  for(let p=actor.g.parentElement;p;p=p.parentElement){
   const style=doc.defaultView.getComputedStyle(p),value=name=>style.getPropertyValue(name)||p.style.getPropertyValue(name)||p.getAttribute(name);
   opacity*=Number(value('opacity')??1);
   if(value('display')==='none')inherited.setAttribute('display','none');
   if(['hidden','collapse'].includes(value('visibility')))inherited.setAttribute('visibility',value('visibility'));
   if(p===canvas)break;
  }
  inherited.setAttribute('opacity',opacity);inherited.append(clone);svg.append(inherited);
  const description=doc.createElement('p');description.className='evidence-explanation';description.textContent=options.description||'';
  const button=doc.createElement('button');button.type='button';button.className='evidence-close';button.textContent='Закрыть крупный план';button.addEventListener('click',()=>close());
  content.append(title,subtitle,svg,description);layer.append(content,button);
  layer.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Tab'){event.preventDefault();button.focus();}});
  layer.addEventListener('keyup',event=>event.stopPropagation());layer.addEventListener('click',event=>event.stopPropagation());
  doc.body.append(layer);D.i18n.apply(layer);stopLanguage=D.i18n.onChange(()=>{if(layer)D.i18n.apply(layer);});active=close;button.focus();
 }
 function dispose(){if(disposed)return;disposed=true;close(false);trigger.dispose();for(const svg of canvases){const r=interactiveCanvases.get(svg);if(--r.count===0){if(r.role===null)svg.removeAttribute('role');else svg.setAttribute('role',r.role);interactiveCanvases.delete(svg);}}}
 return {trigger,open,close,dispose,setBox:()=>trigger.setBox(box())};
}
B.inspect=inspect;
})(window);
