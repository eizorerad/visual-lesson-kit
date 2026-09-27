/* CRISPRi design vocabulary: one explicit Poisson model and two schematic SVG actors. */
(function(global){
'use strict';
const s=global.D.dom.s;
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;}
function string(value,name){if(typeof value!=='string'||!value.trim())throw new TypeError(name+' must be a nonempty string');return value;}
function entries(value,name){
 if(!Array.isArray(value)||value.length<1||value.length>2)throw new TypeError(name+' must contain one or two entries');
 for(let i=0;i<value.length;i++)if(!Object.hasOwn(value,i))throw new TypeError(name+' must be dense');
 return value.map(v=>string(v,name));
}
function patch(current,value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('actor options must be an object');
 if(Object.keys(value).some(key=>!Object.hasOwn(current,key)))throw new TypeError('unknown actor option');
 return {...current,...value};
}
function stroke(node){node.setAttribute('vector-effect','non-scaling-stroke');return node;}
function append(parent,tag,attrs){const node=s(tag,attrs);parent.append(node);if(attrs.stroke)stroke(node);return node;}

function poissonOccupancy(moi){
 finite(moi,'moi');if(moi<0)throw new RangeError('moi must be nonnegative');
 if(moi===0)return Object.freeze({zero:1,one:0,multi:0,oneGivenPositive:null,multiGivenPositive:null});
 const zero=Math.exp(-moi),one=moi*zero,positive=-Math.expm1(-moi);
 let multi,multiGivenPositive;
 if(moi<.1){
  // Sum P(N>=2) from its leading term; avoid subtracting almost equal values.
  // Keep the conditional leading factor separate so tiny lambda^2 may underflow
  // without also losing a representable P(N>=2 | N>=1).
  let term=1,sum=1;
  for(let n=3;n<100;n++){term*=moi/n;const next=sum+term;if(next===sum)break;sum=next;}
  multi=(moi/2)*moi*zero*sum;
  multiGivenPositive=(moi/positive)*(moi/2)*zero*sum;
 }else{multi=positive-one;multiGivenPositive=multi/positive;}
 return Object.freeze({zero,one,multi,oneGivenPositive:one/positive,multiGivenPositive});
}

function cassette(parent,options={}){
 function validate(value){
  finite(value.x,'x');finite(value.y,'y');finite(value.width,'width');
  if(value.width<120)throw new RangeError('cassette width must be at least 120');
  const guides=entries(value.guides,'guides'),colors=entries(value.colors,'colors');
  if(guides.length!==colors.length)throw new RangeError('guides and colors must have matching lengths');
  return {...value,guides,colors};
 }
 let state=validate(patch({x:0,y:0,width:240,guides:['A','B'],colors:[C.blue,C.teal]},options));
 const g=F.group(parent);g.dataset.pdActor='cassette';
 const backbone=[-4,4].map((y,i)=>{const n=stroke(F.line(g,0,y,state.width,y,C.grey,1.6));n.dataset.dnaBackbone=i;return n;});
 const rungs=Array.from({length:13},()=>stroke(F.line(g,0,-4,0,4,C.grey,1)));
 const units=[0,1].map(i=>{
  const unit=F.group(g),color=state.colors[i]||C.teal;unit.dataset.guideUnit=i;
  const body=append(unit,'rect',{y:-13,height:26,rx:3,fill:'var(--color-bg)',stroke:color,'stroke-width':1.8});
  const label=S.text(0,1,state.guides[i]||'',{size:17,color,weight:600});label.dataset.guideLabel=i;unit.append(label);
  const stem=stroke(F.line(unit,0,-22,0,-30,color,1.7));
  const arrow=S.arrow(0,-30,1,-30,{color,width:1.7,head:8});arrow.dataset.transcriptionArrow=i;stroke(arrow.firstElementChild);unit.append(arrow);
  return {unit,body,label,stem,arrow};
 });
 const anchors={left:[0,0],right:[state.width,0],guide0:[0,0],guide1:[0,0]},bounds={x:0,y:-40,width:state.width,height:56};
 function set(value){
  const next=validate(patch(state,value));state=next;F.at(g,state.x,state.y);
  backbone.forEach((node,i)=>F.seg(node,0,i?4:-4,state.width,i?4:-4));
  rungs.forEach((node,i)=>F.seg(node,state.width*i/12,-4,state.width*i/12,4));
  units.forEach((unit,i)=>{
   const center=state.width*(!i&&state.guides.length===1?.5:i?.72:.28),width=state.width*.28,left=center-width/2,right=center+width/2,color=state.colors[i]||C.teal;
   unit.unit.setAttribute('display',i<state.guides.length?'inline':'none');
   unit.body.setAttribute('x',left);unit.body.setAttribute('width',width);unit.body.setAttribute('stroke',color);
   unit.label.setAttribute('x',center);unit.label.setAttribute('fill',color);unit.label.textContent=state.guides[i]||'';
   F.seg(unit.stem,left,-22,left,-30);unit.stem.setAttribute('stroke',color);
   S.setArrow(unit.arrow,left,-30,right,-30);unit.arrow.firstElementChild.setAttribute('stroke',color);unit.arrow.lastElementChild.setAttribute('fill',color);
   anchors['guide'+i][0]=center;
   if(global.L)L.contract(unit.label,{id:'crispri-guide-'+i,space:g,box:{x:left+3,y:-12,width:width-6,height:25}});
  });
  anchors.right[0]=state.width;bounds.width=state.width;g.dataset.guideCount=state.guides.length;return api;
 }
 const api={g,anchors,bounds,set};set({});return api;
}

function virion(parent,options={}){
 function validate(value){finite(value.x,'x');finite(value.y,'y');finite(value.scale,'scale');if(value.scale<=0)throw new RangeError('scale must be positive');string(value.color,'color');return value;}
 let state=validate(patch({x:0,y:0,scale:1,color:C.purple},options));
 const g=F.group(parent);g.dataset.pdActor='virion';
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,cos=Math.cos(angle),sin=Math.sin(angle);
  stroke(F.line(g,34*cos,34*sin,41*cos,41*sin,'currentColor',1.7));
  append(g,'circle',{cx:42*cos,cy:42*sin,r:2.5,fill:'currentColor'});
 }
 append(g,'circle',{cx:0,cy:0,r:34,fill:'currentColor','fill-opacity':.07,stroke:'currentColor','stroke-width':1.8,'data-envelope':''});
 append(g,'circle',{cx:0,cy:0,r:30,fill:'none',stroke:'currentColor','stroke-width':1,'stroke-opacity':.35});
 // Two independent single-stranded RNA genome copies; no base-pair rungs or DNA.
 const genomes=[
  'M-20,-7 C-27,-18 -9,-23 -7,-13 S8,0 12,-12 S25,-14 20,-3',
  'M-20,10 C-12,-2 -7,23 0,12 S8,1 14,12 S27,17 21,6'
 ].map((d,i)=>append(g,'path',{d,fill:'none',stroke:'currentColor','stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round','data-rna-genome':i}));
 const anchors={center:[0,0],left:[-34,0],right:[34,0],top:[0,-34],bottom:[0,34],rna0:[0,-12],rna1:[0,12]};
 const bounds={x:-46,y:-46,width:92,height:92};
 function set(value){const next=validate(patch(state,value));state=next;g.setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale})`);g.style.color=state.color;return api;}
 const api={g,anchors,bounds,genomes,set};set({});return api;
}

global.PD=Object.assign(global.PD||{},{poissonOccupancy,cassette,virion});
})(window);
