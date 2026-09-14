/* Optional whole-region SVG controls. Load after lesson.js and lib/i18n.js. */
(function(global){
'use strict';
const NS='http://www.w3.org/2000/svg';
if(!global.T)throw new Error('interaction-regions.js must load after lesson.js');

function nonempty(value,name){
 if(typeof value!=='string'||!value.trim())throw new TypeError('svgButton '+name+' must be a nonempty string');
 return value;
}
function boolean(value,name){
 if(typeof value!=='boolean')throw new TypeError('svgButton '+name+' must be a boolean');
 return value;
}
function pressedValue(value){return value===null?null:boolean(value,'pressed');}
function checkedBox(value,focusRing){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('svgButton box must contain x, y, width and height');
 const box={};
 for(const key of ['x','y','width','height']){
  const n=value[key];
  if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError('svgButton box.'+key+' must be finite');
  box[key]=n;
 }
 const right=box.x+box.width,bottom=box.y+box.height;
 if(box.width<=0||box.height<=0||!Number.isFinite(right)||!Number.isFinite(bottom)||right<=box.x||bottom<=box.y)throw new RangeError('svgButton box must have finite, positive area');
 if(focusRing&&![box.x-2,box.y-2,box.width+4,box.height+4,right+2,bottom+2].every(Number.isFinite))throw new RangeError('svgButton focus ring must have finite geometry');
 return box;
}
function svgButton(parent,options){
 if(!parent||parent.nodeType!==1||parent.namespaceURI!==NS||typeof parent.appendChild!=='function')throw new TypeError('svgButton parent must be an SVG element');
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('svgButton needs an options object');
 const id=nonempty(options.id,'id');
 let label=nonempty(options.label,'label');
 if(typeof options.onActivate!=='function')throw new TypeError('svgButton onActivate must be a function');
 const onActivate=options.onActivate,hasFocusRing=options.focusRing===undefined?true:boolean(options.focusRing,'focusRing');
 let pressed=options.pressed===undefined?null:pressedValue(options.pressed),disabled=options.disabled===undefined?false:boolean(options.disabled,'disabled');
 let box=checkedBox(options.box,hasFocusRing),disposed=false,activating=false;
 const doc=parent.ownerDocument,i18n=global.D&&global.D.i18n,held=new Set();
 function node(tag,attrs){const el=doc.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;}
 const g=node('g',{'data-vlk-button':id,role:'button','data-no-swipe':''});
 // `fill="none"` with the default visiblePainted value misses empty interiors.
 const hit=node('rect',{'data-vlk-hit':id,fill:'transparent',stroke:'none','pointer-events':'all','aria-hidden':'true'});
 const ring=hasFocusRing?node('rect',{'data-vlk-focus':id,fill:'none',stroke:'var(--color-focus)','stroke-width':2,'pointer-events':'none','aria-hidden':'true',visibility:'hidden'}):null;
 g.appendChild(hit);if(ring){g.appendChild(ring);g.style.outline='none';}
 function alive(){if(disposed)throw new Error('svgButton has been disposed');}
 function paintBox(){
  for(const [key,value] of Object.entries(box))hit.setAttribute(key,String(value));
  if(ring)for(const [key,value] of Object.entries({x:box.x-2,y:box.y-2,width:box.width+4,height:box.height+4}))ring.setAttribute(key,String(value));
 }
 function paintFocus(){if(ring)ring.setAttribute('visibility',!disabled&&doc.activeElement===g?'visible':'hidden');}
 function paintPressed(){if(pressed===null)g.removeAttribute('aria-pressed');else g.setAttribute('aria-pressed',String(pressed));}
 function paintDisabled(){g.setAttribute('aria-disabled',String(disabled));g.setAttribute('tabindex',disabled?'-1':'0');paintFocus();}
 function paintLabel(){
  // Write the canonical source first so the shared observer retains its source.
  // Do not ignore the group: authored visible text inside it must translate too.
  g.setAttribute('aria-label',label);if(i18n)i18n.apply(g);
 }
 function consume(event){event.preventDefault();event.stopPropagation();}
 function activationKey(event){return event.key==='Enter'?'Enter':event.key===' '||event.key==='Spacebar'?'Space':null;}
 function activate(event){
  if(disposed||disabled||activating)return;
  activating=true;try{onActivate(event);}finally{activating=false;}
 }
 function onClick(event){consume(event);if(!held.size)activate(event);}
 function onKeyDown(event){
  const key=activationKey(event);if(!key)return;consume(event);
  if(disabled||event.repeat||held.has(key))return;
  held.add(key);if(key==='Enter')activate(event);
 }
 function onKeyUp(event){
  const key=activationKey(event);if(!key)return;consume(event);
  const wasHeld=held.delete(key);if(key==='Space'&&wasHeld)activate(event);
 }
 function onFocus(){paintFocus();}
 function onBlur(){held.clear();paintFocus();}
 const listeners={click:onClick,keydown:onKeyDown,keyup:onKeyUp,focus:onFocus,blur:onBlur};
 paintBox();paintPressed();paintDisabled();paintLabel();
 for(const [type,listener] of Object.entries(listeners))g.addEventListener(type,listener);
 const stopLanguage=i18n?i18n.onChange(paintLabel):()=>{};
 parent.appendChild(g);
 const api={g,hit,
  setBox(value){alive();const next=checkedBox(value,hasFocusRing);box=next;paintBox();return api;},
  setPressed(value){alive();const next=pressedValue(value);pressed=next;paintPressed();return api;},
  setDisabled(value){alive();const next=boolean(value,'disabled');disabled=next;if(disabled)held.clear();paintDisabled();return api;},
  setLabel(value){alive();const next=nonempty(value,'label');label=next;paintLabel();return api;},
  dispose(){
   if(disposed)return;disposed=true;held.clear();stopLanguage();
   for(const [type,listener] of Object.entries(listeners))g.removeEventListener(type,listener);
   if(ring)ring.setAttribute('visibility','hidden');g.remove();
  }
 };
 return api;
}
global.T.svgButton=svgButton;
})(window);
