/* Generic geometry for authored lessons. No implicit data or article sources. */
(function(g){
'use strict';
const s=D.dom.s;
const DEFAULT_FRAME=Object.freeze({x:60,y:147,width:1160,height:463});
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be a finite number');return value;}
function rectangle(value,name='frame'){
 if(!value||typeof value!=='object')throw new TypeError(name+' must be a rectangle');
 const r={x:finite(value.x,name+'.x'),y:finite(value.y,name+'.y'),width:finite(value.width,name+'.width'),height:finite(value.height,name+'.height')};
 if(r.width<=0||r.height<=0)throw new RangeError(name+' dimensions must be positive');return r;
}
function viewport(parent,frame=DEFAULT_FRAME){
 const f=rectangle(frame),svg=s('svg',{...f,viewBox:[f.x,f.y,f.width,f.height].join(' '),style:{overflow:'hidden'}});
 parent.append(svg);return svg;
}
function linearScale(domain,range,options={}){
 if(!Array.isArray(domain)||domain.length!==2||!Array.isArray(range)||range.length!==2)throw new TypeError('Scale domain and range must each contain two endpoints');
 const d=domain.map((v,i)=>finite(v,'domain['+i+']')),r=range.map((v,i)=>finite(v,'range['+i+']'));
 if(d[0]===d[1]||r[0]===r[1])throw new RangeError('Scale endpoints must be distinct');
 const clip=options.clamp===true,unit=t=>clip?Math.max(0,Math.min(1,t)):t;
 const scale=value=>r[0]+unit((finite(value,'value')-d[0])/(d[1]-d[0]))*(r[1]-r[0]);
 scale.invert=value=>d[0]+unit((finite(value,'value')-r[0])/(r[1]-r[0]))*(d[1]-d[0]);
 scale.domain=Object.freeze(d);scale.range=Object.freeze(r);return scale;
}
function sourceWindow(parent,options){
 if(!options||typeof options!=='object')throw new TypeError('Source window options are required');
 const sw=finite(options.sourceWidth,'sourceWidth'),sh=finite(options.sourceHeight,'sourceHeight');
 if(sw<=0||sh<=0)throw new RangeError('Source dimensions must be positive');
 function checkedBox(box){const b=rectangle(box,'box');if(b.x<0||b.y<0||b.x+b.width>sw+1e-9||b.y+b.height>sh+1e-9)throw new RangeError('Source box must lie within source dimensions');return b;}
 let frame=rectangle(options),requested=checkedBox(options.box||{x:0,y:0,width:sw,height:sh});
 const group=s('g'),svg=s('svg',{style:{overflow:'hidden'}}),image=s('image',{href:D.assets.url(options.file),x:0,y:0,width:sw,height:sh,preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':options.alt||'Источник'});
 svg.append(image);group.append(svg);parent.append(group);
 const api={g:group,svg,image,box:null,requestedBox:null,frame:null,fittedFrame:null,setBox(box){requested=checkedBox(box);paint();return api;},setFrame(next){frame=rectangle(next);paint();return api;}};
 function paint(){
  // Keep chosen source bounds exact. Fit the viewport inside its available frame.
  const ratio=requested.width/requested.height,width=Math.min(frame.width,frame.height*ratio),height=width/ratio;
  const fitted={x:frame.x+(frame.width-width)/2,y:frame.y+(frame.height-height)/2,width,height};
  Object.entries(fitted).forEach(([key,value])=>svg.setAttribute(key,value));
  svg.setAttribute('viewBox',[requested.x,requested.y,requested.width,requested.height].join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  api.box=Object.freeze({...requested});api.requestedBox=api.box;api.frame=Object.freeze({...frame});api.fittedFrame=Object.freeze(fitted);
 }
 paint();return api;
}
g.K={viewport,linearScale,sourceWindow,DEFAULT_FRAME};
})(window);
