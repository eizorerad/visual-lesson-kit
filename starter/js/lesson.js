/* Shared visual vocabulary. Color keys retain the stable lesson API. */
(function(g){
'use strict';
const h=D.dom.h,s=D.dom.s;
const palette=Object.assign({},g.C||{},{blue:'var(--color-primary)',teal:'var(--color-secondary)',gold:'var(--color-focus)',red:'var(--color-contrast)',purple:'var(--color-auxiliary)',grey:'var(--color-muted)',white:'var(--color-text)',dim:'var(--color-dim)',bg:'var(--color-bg)'});
// A guessed role such as C.cyan is undefined and silently falls back to a helper's
// default colour. Warn once instead, naming the real roles; nothing is blocked.
const warned=new Set(),probes=new Set(['then','toJSON','valueOf','toString','constructor','inspect','asymmetricMatch','nodeType','length','tagName','toLocaleString','hasOwnProperty','isPrototypeOf','propertyIsEnumerable']);
const C=g.C=new Proxy(palette,{get(target,key){
 if(typeof key==='string'&&!(key in target)&&/^[a-z][a-zA-Z0-9]*$/.test(key)&&!probes.has(key)&&!warned.has(key)){warned.add(key);if(g.console)g.console.warn('C.'+key+' is not a palette role; use one of: '+Object.keys(target).join(', '));}
 return target[key];
}});
const config=g.LESSON||{},source=config.source||{},paper=source.url||'';
D.assets={url(name){
 if(typeof name!=='string'||!name.trim())throw new TypeError('Asset name must be a nonempty string');
 if(/^(?:https?:|data:|blob:)/i.test(name))return name;
 if(name.startsWith('/')||name.split('/').includes('..'))throw new RangeError('Asset path must stay inside assets/');
 const key=name.replace(/^assets\//,'');
 return Object.prototype.hasOwnProperty.call(g.LESSON_ASSETS||{},key)?g.LESSON_ASSETS[key]:'assets/'+key;
}};
function sourceHref(url,anchor){
 if(!url)return '';
 return anchor?String(url).split('#')[0]+'#'+anchor:String(url);
}
function escapeAttr(value){return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function text(x,y,str,size=25,color=C.white,anchor='middle'){return S.text(x,y,str,{size,color,anchor});}
function box(root,x,y,w,html,cls=''){const el=h('div.lesson-text'+(cls?'.'+cls:''),{style:{left:x+'px',top:y+'px',width:w+'px'},html});root.append(el);return el;}
function base(ctx,title,caption,source='Учебная схема'){
 const root=h('section.scene.lesson-scene',{'aria-label':title});
 const svg=s('svg.lesson-viz',{viewBox:'0 0 1280 720',width:1280,height:720,role:'img','aria-label':title});
 svg.append(s('title',{},title));root.append(svg);
 root.append(h('header.s-head',{},h('h1.s-title',{},title)));
 const cap=box(root,90,627,1100,caption,'lesson-caption');
 const src=box(root,64,687,1060,source,'lesson-source');
 src.hidden=true;
 const api={root,svg,cap,src,ctx,caption:v=>{cap.innerHTML=v;},add:(...els)=>{svg.append(...els);return els[0];},label:(...args)=>{const e=text(...args);svg.append(e);return e;},box:(...args)=>box(root,...args)};
 return api;
}
function group(svg,els=[]){const q=s('g',{},els);svg.append(q);return q;}
function cell(x,y,r,color,label){const q=s('g.cell',{transform:`translate(${x},${y})`});q.append(S.circle(0,0,r,{fill:color,opacity:.10}),S.circle(0,0,r,{fill:'none',stroke:color,width:2}),S.circle(-r*.14,r*.1,r*.24,{fill:color,opacity:.5}));if(label)q.append(text(0,r+35,label,24,color));return q;}
function bars(svg,x,y,vals,colors,scale=65,width=25,gap=55){const q=group(svg);const arr=vals.map((v,i)=>{const el=S.rect(x+i*gap,y-Math.max(v,0)*scale,width,Math.abs(v)*scale,{fill:Array.isArray(colors)?colors[i]:colors});q.append(el);return el;});q.append(S.line(x-14,y,x+(vals.length-1)*gap+width+14,y,{stroke:C.dim,width:1.3}));return {g:q,arr,set(values){values.forEach((v,i)=>{arr[i].setAttribute('y',y-Math.max(v,0)*scale);arr[i].setAttribute('height',Math.abs(v)*scale);});}};}
function control(root,label,min,max,value,step,onChange,x=140,y=550,w=430){
 const id='slider-'+String(Math.random()).slice(2);const output=h('output',{},String(value));
 const input=h('input',{id,type:'range',min,max,value,step,'aria-label':label});
 const el=h('label.lesson-slider',{htmlFor:id,style:{left:x+'px',top:y+'px',width:w+'px'}},[h('span',{},label),output,input]);root.append(el);
 input.addEventListener('input',()=>{output.textContent=input.value;onChange(+input.value);});
 return {el,input,output,set(v){input.value=v;output.textContent=String(v);onChange(+v);}};
}
function buttons(root,labels,fn,x=720,y=520){const el=h('div.lesson-buttons',{style:{left:x+'px',top:y+'px'}},labels.map((label,i)=>h('button',{type:'button',onClick:()=>fn(i)},label)));root.append(el);return el;}
function reveal(ctx,els,fn){A.hide(els);ctx.step(()=>{if(fn)fn();return A.fadeIn(els,{duration:550});});}
function evidence(root,{title,image,html='',anchor='',url=paper,sourceLabel=source.label||'Открыть источник',buttonLabel='Источник'}){
 const button=h('button.evidence-button',{type:'button'},buttonLabel);root.append(button);
 button.addEventListener('click',()=>{
  const layer=h('div.evidence-layer',{role:'dialog','aria-modal':'true','aria-label':title,tabIndex:-1});
  const close=h('button.evidence-close',{type:'button'},'Закрыть ×');
  const content=h('div.evidence-content',{},[h('h2',{},title),image?h('img',{src:D.assets.url(image),alt:title}):null,h('div.evidence-explanation',{html}),url?h('a',{href:sourceHref(url,anchor),target:'_blank',rel:'noopener'},sourceLabel):null]);
  layer.append(close,content);document.body.append(layer);const focused=document.activeElement;
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cleanup();}else if(e.key==='Tab'){const nodes=[...layer.querySelectorAll('button,a')];if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}else if(!e.ctrlKey&&!e.metaKey){e.stopPropagation();}};
  function cleanup(){document.removeEventListener('keydown',onKey,true);layer.remove();focused?.focus();}
  close.addEventListener('click',cleanup);layer.addEventListener('click',e=>{if(e.target===layer)cleanup();});document.addEventListener('keydown',onKey,true);close.focus();
 });return button;
}
function note(text,anchor='',url){
 const href=sourceHref(url===undefined?(anchor?paper:''):url,anchor);
 return '<p>'+text+'</p>'+(href?'<p class="note-source"><a href="'+escapeAttr(href)+'" target="_blank" rel="noopener">'+escapeAttr(source.label||'Источник')+(anchor?' · '+escapeAttr(anchor):'')+'</a></p>':'');
}
g.T={base,text,box,group,cell,bars,control,buttons,reveal,evidence,note,C,paper};
})(window);
