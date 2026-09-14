/* Exact attachment points and persistent guides for authored explanations. */
(function(g){
'use strict';
const s=D.dom.s;
function finite(value,name){
 if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');
 return value;
}
function positive(value,name){
 finite(value,name);if(value<=0)throw new RangeError(name+' must be positive');return value;
}
function pair(value,name){
 if(!Array.isArray(value)||value.length!==2||!Object.hasOwn(value,0)||!Object.hasOwn(value,1))throw new TypeError(name+' must contain two coordinates');
 return [finite(value[0],name+'[0]'),finite(value[1],name+'[1]')];
}
function boxAnchor(box,side,fraction=.5){
 if(!box||typeof box!=='object'||Array.isArray(box))throw new TypeError('box must be a rectangle');
 const x=finite(box.x,'box.x'),y=finite(box.y,'box.y');
 const width=positive(box.width,'box.width'),height=positive(box.height,'box.height');
 const right=finite(x+width,'box right edge'),bottom=finite(y+height,'box bottom edge');
 finite(fraction,'fraction');if(fraction<0||fraction>1)throw new RangeError('fraction must be in [0,1]');
 if(side==='left'||side==='right')return [side==='left'?x:right,finite(y+height*fraction,'anchor y')];
 if(side==='top'||side==='bottom')return [finite(x+width*fraction,'anchor x'),side==='top'?y:bottom];
 throw new TypeError('side must be left, right, top or bottom');
}
function checkedDash(value){
 if(!Array.isArray(value))throw new TypeError('dash must be an array');
 const copy=[];
 for(let i=0;i<value.length;i++){
  if(!Object.hasOwn(value,i))throw new TypeError('dash must be dense');
  const n=finite(value[i],'dash['+i+']');if(n<0)throw new RangeError('dash values must be nonnegative');copy.push(n);
 }
 if(copy.length&&!copy.some(n=>n>0))throw new RangeError('dash must contain a positive value, or be empty for a solid line');
 return copy;
}
function spanGeometry(from,to,tickSize){
 const a=pair(from,'from'),b=pair(to,'to');
 const dx=finite(b[0]-a[0],'span dx'),dy=finite(b[1]-a[1],'span dy');
 const length=finite(Math.hypot(dx,dy),'span length');
 // No direction exists at zero length. Collapse and hide the same tick nodes.
 const nx=length?-dy/length*(tickSize/2):0,ny=length?dx/length*(tickSize/2):0;
 const ticks=tickSize>0?[a,b].map(p=>[
  finite(p[0]-nx,'tick x1'),finite(p[1]-ny,'tick y1'),
  finite(p[0]+nx,'tick x2'),finite(p[1]+ny,'tick y2')
 ]):[];
 return {from:a,to:b,ticks,zero:length===0};
}
function guideSpan(parent,options){
 if(!parent||parent.namespaceURI!==D.dom.SVG_NS||typeof parent.append!=='function')throw new TypeError('SVG parent required');
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('guide options required');
 const allowed=['from','to','color','width','dash','tickSize'];
 for(const key of Object.keys(options))if(!allowed.includes(key))throw new TypeError('Unknown guide option '+key);
 const color=options.color===undefined?C.grey:options.color;
 if(typeof color!=='string'||!color.trim())throw new TypeError('color must be a nonempty SVG color string');
 const width=positive(options.width===undefined?1.5:options.width,'width');
 const dash=checkedDash(options.dash===undefined?[6,4]:options.dash);
 const tickSize=finite(options.tickSize===undefined?0:options.tickSize,'tickSize');
 if(tickSize<0)throw new RangeError('tickSize must be nonnegative');
 let geometry=spanGeometry(options.from,options.to,tickSize);
 // Validate the complete geometry before constructing or attaching any nodes.
 const group=s('g',{'data-guide-span':''});
 const stroke={stroke:color,'stroke-width':width,'stroke-linecap':'butt'};
 const line=s('line',{...stroke,'stroke-dasharray':dash.length?dash.join(' '):'none'});
 const ticks=geometry.ticks.map(()=>s('line',{...stroke,'stroke-dasharray':'none'}));
 group.append(line,...ticks);
 function segment(node,values){['x1','y1','x2','y2'].forEach((key,i)=>node.setAttribute(key,values[i]));}
 function paint(){
  segment(line,[...geometry.from,...geometry.to]);
  ticks.forEach((node,i)=>{
   segment(node,geometry.ticks[i]);
   if(geometry.zero)node.setAttribute('visibility','hidden');else node.removeAttribute('visibility');
  });
 }
 const api={g:group,line,ticks:ticks.slice(),
  setEndpoints(from,to){const next=spanGeometry(from,to,tickSize);geometry=next;paint();return api;},
  snapshot(){return {from:geometry.from.slice(),to:geometry.to.slice(),color,width,dash:dash.slice(),tickSize};}
 };
 paint();parent.append(group);return api;
}
Object.assign(g.K,{boxAnchor,guideSpan});
})(window);
