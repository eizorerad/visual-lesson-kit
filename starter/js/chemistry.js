/* Explicit chemical diagrams, not a molecular simulator. Coordinates are local stage units. */
(function(global){
'use strict';
const elements=new Set(('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og R').split(' '));
const stroke={'stroke-width':1.25,'vector-effect':'non-scaling-stroke','stroke-linecap':'round','stroke-linejoin':'round'};
function attrs(node,values){for(const [k,v] of Object.entries(values))node.setAttribute(k,String(v));return node;}
function node(parent,type,values={}){const el=D.dom.s(type,values);parent.append(el);return el;}
function fields(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('options must be an object');for(const k of Object.keys(value))if(!allowed.includes(k))throw new TypeError('Unknown chemistry option '+k);}
function finite(value,name='value'){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;}
function coordinate(value){finite(value,'coordinate');if(Math.abs(value)>1e6)throw new RangeError('diagram coordinates must be within ±1,000,000 stage units');return value;}
function integer(value,limit,name){finite(value,name);if(!Number.isInteger(value)||Math.abs(value)>limit)throw new RangeError(name+' outside supported annotation range');return value;}
function pair(value){if(!Array.isArray(value)||value.length!==2||!Object.hasOwn(value,0)||!Object.hasOwn(value,1))throw new TypeError('position needs two coordinates');return value.map(coordinate);}
function dense(value,name){if(!Array.isArray(value))throw new TypeError(name+' must be an array');for(let i=0;i<value.length;i++)if(!Object.hasOwn(value,i))throw new TypeError(name+' must be dense');return value;}
function identifier(value){if(typeof value!=='string'||!value.trim()||value.length>80)throw new TypeError('nonempty ID required (up to 80 characters)');return value;}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function parentOK(parent){if(!parent||parent.namespaceURI!=='http://www.w3.org/2000/svg'||typeof parent.append!=='function')throw new TypeError('SVG parent required');}
function shown(el,yes){el.setAttribute('display',yes?'inline':'none');}
function contracted(parent,text,x,y,width,height,size,color,attribute){
 const el=node(parent,'text',{x,y,'text-anchor':'middle','dominant-baseline':'central','font-size':size,'font-family':'var(--f-text)',fill:color,'data-i18n-ignore':'',[attribute]:''});el.textContent=text;
 L.contract(el,{space:parent,box:{x:x-width/2,y:y-height/2,width,height}});return el;
}
function placement(x,y,scale){coordinate(x);coordinate(y);finite(scale,'scale');if(scale<=0||scale>1e4)throw new RangeError('scale must be in (0,10000]');return {x,y,scale};}
function atomIdentity(a){
 fields(a,['id','element','x','y','charge','partial','lonePairs','hydrogens']);const id=identifier(a.id);
 if(!elements.has(a.element))throw new TypeError('element must be an element symbol or explicit R remainder');
 const hydrogens=integer(Object.hasOwn(a,'hydrogens')?a.hydrogens:0,4,'hydrogens');
 if(hydrogens<0||(hydrogens>0&&['H','R'].includes(a.element)))throw new RangeError('grouped hydrogens need a non-H, non-R element and count 0..4');
 return {id,element:a.element,charge:integer(a.charge??0,99,'formal charge'),hydrogens};
}
function composition(data){
 if(!data||typeof data!=='object')throw new TypeError('composition needs atom data');const counts={},ids=new Set();let charge=0,remainderCount=0;
 dense(data.atoms,'atoms').forEach(value=>{const a=atomIdentity(value);if(ids.has(a.id))throw new TypeError('Duplicate atom ID '+a.id);ids.add(a.id);
  if(a.element==='R')remainderCount++;else counts[a.element]=(counts[a.element]||0)+1;
  if(a.hydrogens)counts.H=(counts.H||0)+a.hydrogens;charge=finite(charge+a.charge,'total formal charge');
 });return freeze({elements:counts,charge,remainderCount});
}
function atomLabel(a){return a.element+(a.hydrogens?'H'+(a.hydrogens===1?'':'₀₁₂₃₄'[a.hydrogens]):'');}
function labelWidth(a){return 40+(a.element.length===2?8:0)+(a.hydrogens?24:0);}
function normalized(options){
 fields(options,['atoms','bonds','x','y','scale','showCharges','showPartials','showLonePairs']);const ids=new Set(),edges=new Set(),bondIds=new Set();
 const atoms=dense(options.atoms,'atoms').map(a=>{const identity=atomIdentity(a);if(ids.has(identity.id))throw new TypeError('Duplicate atom ID '+identity.id);ids.add(identity.id);
  const partial=finite(a.partial??0,'partial charge'),lonePairs=integer(a.lonePairs??0,4,'lonePairs');if(lonePairs<0)throw new RangeError('lonePairs must be nonnegative');
  return {...identity,x:coordinate(a.x),y:coordinate(a.y),partial,lonePairs};});
 if(!atoms.length)throw new TypeError('at least one atom required');
 const bonds=dense(options.bonds??[],'bonds').map(b=>{fields(b,['id','a','b','order']);if(!ids.has(b.a)||!ids.has(b.b)||b.a===b.b)throw new TypeError('Bond must join two existing distinct atoms');
  const id=identifier(b.id??`${b.a}-${b.b}`),edge=JSON.stringify([b.a,b.b].sort()),order=integer(b.order??1,3,'bond order');if(order<0||bondIds.has(id)||edges.has(edge))throw new TypeError('Duplicate bond or invalid order');bondIds.add(id);edges.add(edge);return {id,a:b.a,b:b.b,order};});
 const result={atoms,bonds,...placement(options.x??0,options.y??0,options.scale??1)};
 for(const k of ['showCharges','showPartials','showLonePairs']){result[k]=options[k]??(k==='showCharges');if(typeof result[k]!=='boolean')throw new TypeError(k+' must be boolean');}
 return freeze(result);
}
function molecule(parent,options){
 parentOK(parent);let state=normalized(options),focusIds=null;const g=D.dom.s('g',{'data-chemistry-molecule':''}),atoms=Object.create(null),atomNodes=Object.create(null),bondNodes=Object.create(null);
 const bondsLayer=node(g,'g',{'data-bonds':''}),atomsLayer=node(g,'g',{'data-atoms':''});
 state.bonds.forEach(b=>{const el=node(bondsLayer,'g',{'data-bond-id':b.id,'data-bond-a':b.a,'data-bond-b':b.b}),lines=Array.from({length:3},()=>node(el,'line',{...stroke,stroke:C.white}));bondNodes[b.id]={el,lines};});
 state.atoms.forEach(a=>{
  const el=atoms[a.id]=node(atomsLayer,'g',{'data-atom-id':a.id});const halo=node(el,'ellipse',{cx:0,cy:0,rx:labelWidth(a)/2+2,ry:22,fill:'none',stroke:C.gold,...stroke,opacity:0});
  const color=({O:C.red,N:C.blue,S:C.gold,P:C.purple,H:C.grey,R:C.grey})[a.element]||C.white;
  const label=contracted(el,atomLabel(a),0,0,labelWidth(a),34,24,color,'data-element');
  const charge=contracted(el,'',25,-21,40,25,16,C.white,'data-formal-charge');
  const partial=contracted(el,'',28,23,48,25,15,C.teal,'data-partial-charge');
  const pairs=Array.from({length:4},()=>{const p=node(el,'g',{'data-lone-pair':''});for(let i=0;i<2;i++)node(p,'circle',{r:1.6,fill:C.white});return p;});
  atomNodes[a.id]={halo,label,charge,partial,pairs,width:null};
 });
 function paint(){
  attrs(g,{transform:`translate(${state.x} ${state.y}) scale(${state.scale})`});const byId=Object.fromEntries(state.atoms.map(a=>[a.id,a]));
  state.bonds.forEach(b=>{const a=byId[b.a],z=byId[b.b],dx=z.x-a.x,dy=z.y-a.y,d=Math.hypot(dx,dy),ux=d?dx/d:1,uy=d?dy/d:0;
   // Explicit atom labels reserve a rectangle plus clearance in every direction.
   const trim=a=>Math.min(labelWidth(a)/2/(Math.abs(ux)||1e-12),17/(Math.abs(uy)||1e-12))+5,ta=Math.min(trim(a),d/2),tz=Math.min(trim(z),d/2);
   const holder=bondNodes[b.id];attrs(holder.el,{'data-bond-order':b.order,opacity:focusIds&&!focusIds.has(b.a)&&!focusIds.has(b.b)?.25:1});shown(holder.el,b.order>0&&d>trim(a)+trim(z));
   holder.lines.forEach((line,i)=>{const offset=(i-(b.order-1)/2)*5;attrs(line,{x1:a.x+ux*ta-uy*offset,y1:a.y+uy*ta+ux*offset,x2:z.x-ux*tz-uy*offset,y2:z.y-uy*tz+ux*offset});shown(line,i<b.order);});
  });
  state.atoms.forEach(a=>{const el=atoms[a.id],n=atomNodes[a.id];attrs(el,{transform:`translate(${a.x} ${a.y})`,opacity:focusIds&&!focusIds.has(a.id)?.28:1});n.halo.setAttribute('opacity',focusIds&&focusIds.has(a.id)?1:0);
   const width=labelWidth(a);n.label.textContent=atomLabel(a);n.label.dataset.element=a.element;n.label.dataset.hydrogens=String(a.hydrogens);
   if(n.width!==width){n.width=width;n.halo.setAttribute('rx',width/2+2);n.charge.setAttribute('x',width/2+5);n.partial.setAttribute('x',width/2+8);
    [[n.label,0,0,width,34],[n.charge,width/2+5,-21,40,25],[n.partial,width/2+8,23,48,25]].forEach(([text,x,y,w,h])=>L.contract(text,{space:el,box:{x:x-w/2,y:y-h/2,width:w,height:h}}));
   }
   n.charge.textContent=a.charge?(Math.abs(a.charge)===1?'':Math.abs(a.charge))+(a.charge>0?'+':'−'):'';
   n.partial.textContent=a.partial?'δ'+(a.partial>0?'+':'−'):'';n.partial.dataset.partialCharge=String(a.partial);n.charge.dataset.formalCharge=String(a.charge);
   shown(n.charge,state.showCharges&&a.charge!==0);shown(n.partial,state.showPartials&&a.partial!==0);
   const occupied=state.bonds.filter(b=>b.order>0&&(b.a===a.id||b.b===a.id)).map(b=>{const z=byId[b.a===a.id?b.b:b.a];return Math.atan2(z.y-a.y,z.x-a.x);});
   if(state.showCharges&&a.charge)occupied.push(-Math.PI/4);if(state.showPartials&&a.partial)occupied.push(Math.PI/4);
   n.pairs.forEach((p,i)=>{let angle=-Math.PI/2,best=-1;for(let j=0;j<16;j++){const q=-Math.PI/2+j*Math.PI/8,clear=occupied.length?Math.min(...occupied.map(v=>Math.acos(Math.cos(q-v)))):Math.PI;if(clear>best){best=clear;angle=q;}}occupied.push(angle);
    [...p.children].forEach((dot,k)=>attrs(dot,{cx:(width/2+9)*Math.cos(angle)+(k?3:-3)*Math.sin(angle),cy:29*Math.sin(angle)-(k?3:-3)*Math.cos(angle)}));shown(p,state.showLonePairs&&i<a.lonePairs);
   });
  });
 }
 const api={g,atoms,get x(){return state.x;},get y(){return state.y;},get scale(){return state.scale;},get state(){return state;},get bounds(){const left=state.atoms.map(a=>a.x-labelWidth(a)/2-32),right=state.atoms.map(a=>a.x+labelWidth(a)/2+32),ys=state.atoms.map(a=>a.y);return freeze({x:Math.min(...left),y:Math.min(...ys)-48,width:Math.max(...right)-Math.min(...left),height:Math.max(...ys)-Math.min(...ys)+96});},get anchors(){return freeze(Object.fromEntries(state.atoms.map(a=>[a.id,[a.x,a.y]])));},
  set(patch){
   fields(patch,['positions','charges','partials','lonePairs','hydrogens','bondOrders','showCharges','showPartials','showLonePairs']);
   const next={...state,atoms:state.atoms.map(a=>({...a})),bonds:state.bonds.map(b=>({...b}))};
   for(const [key,field] of Object.entries({positions:null,charges:'charge',partials:'partial',lonePairs:'lonePairs',hydrogens:'hydrogens',bondOrders:'order'}))if(Object.hasOwn(patch,key)){
    const updates=patch[key];if(!updates||typeof updates!=='object'||Array.isArray(updates))throw new TypeError(key+' must map IDs to values');
    for(const [id,value] of Object.entries(updates)){const item=(key==='bondOrders'?next.bonds:next.atoms).find(a=>a.id===id);if(!item)throw new TypeError('Unknown '+key+' ID '+id);if(key==='positions')[item.x,item.y]=pair(value);else item[field]=finite(value,key);}
   }
   for(const k of ['showCharges','showPartials','showLonePairs'])if(Object.hasOwn(patch,k)){if(typeof patch[k]!=='boolean')throw new TypeError(k+' must be boolean');next[k]=patch[k];}
   state=normalized(next);paint();return api;
  },
  focus(ids){if(ids!==null){dense(ids,'focus IDs');ids.forEach(id=>{if(!Object.hasOwn(atoms,id))throw new TypeError('Unknown focus atom '+id);});}focusIds=ids===null?null:new Set(ids);paint();return api;},
  place(x,y,scale=state.scale){const p=placement(x,y,scale);state=freeze({...state,...p});paint();return api;}
 };paint();parent.append(g);return api;
}
function formula(parent,options){
 parentOK(parent);fields(options,['text','x','y','width','height']);if(typeof options.text!=='string')throw new TypeError('formula text must be a string');const x=coordinate(options.x??0),y=coordinate(options.y??0),width=finite(options.width??250),height=finite(options.height??52);if(width<=0||height<=0)throw new RangeError('formula box must be positive');
 const g=D.dom.s('g',{'data-chemistry-formula':''}),text=L.textBox(g,{text:options.text,x,y,width,height,size:28,padding:0,color:C.white});
 const api={g,el:text.el,set(value){if(typeof value!=='string')throw new TypeError('formula text must be a string');text.setText(value);return api;}};parent.append(g);return api;
}
const kinds=['electron-pair','electron-single','reaction','equilibrium','resonance','force','dipole-chemical','dipole-physics'];
function endpoints(options){for(const key of ['x1','y1','x2','y2'])coordinate(options[key]);if(options.x1===options.x2&&options.y1===options.y2)throw new RangeError('arrow endpoints must differ');return options;}
function arrow(parent,options){
 parentOK(parent);function checked(value){fields(value,['x1','y1','x2','y2','kind','curve','color']);endpoints(value);if(!kinds.includes(value.kind))throw new TypeError('Unknown arrow kind');if(value.curve!==undefined)coordinate(value.curve);if(value.color!==undefined&&typeof value.color!=='string')throw new TypeError('color must be a string');return {...value};}
 let state=checked(options);const g=D.dom.s('g',{'data-chemistry-arrow':''}),shaft=node(g,'path',{'data-arrow-shaft':'',...stroke,fill:'none'}),head=node(g,'path',{'data-arrow-head':'',...stroke,fill:'none'}),cross=node(g,'path',{'data-arrow-cross':'',...stroke,fill:'none'});
 function paint(){
  const {x1,y1,x2,y2,kind}=state,dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,nx=-uy,ny=ux,curve=state.curve??(kind.startsWith('electron-')?35:0),cx=(x1+x2)/2+nx*curve,cy=(y1+y2)/2+ny*curve;
  const color=state.color??(['force','dipole-physics'].includes(kind)?C.gold:kind.startsWith('electron-')?C.teal:C.white),half=kind==='electron-single';
  function arrowhead(x,y,vx,vy,single=false){const norm=Math.hypot(vx,vy),a=vx/norm,b=vy/norm,h=Math.min(9,d/3),w=h*.5;return `M${x-a*h-b*w} ${y-b*h+a*w} L${x} ${y}`+(single?'':` L${x-a*h+b*w} ${y-b*h-a*w}`);}
  let paths=`M${x1} ${y1} ${curve?`Q${cx} ${cy} ${x2} ${y2}`:`L${x2} ${y2}`}`,heads=arrowhead(x2,y2,curve?x2-cx:dx,curve?y2-cy:dy,half);
  if(kind==='equilibrium'){
   const off=5;paths=`M${x1+nx*off} ${y1+ny*off} L${x2+nx*off} ${y2+ny*off} M${x2-nx*off} ${y2-ny*off} L${x1-nx*off} ${y1-ny*off}`;
   heads=arrowhead(x2+nx*off,y2+ny*off,dx,dy,true)+' '+arrowhead(x1-nx*off,y1-ny*off,-dx,-dy,true);
  }else if(kind==='resonance')heads+=' '+arrowhead(x1,y1,curve?x1-cx:-dx,curve?y1-cy:-dy);
  attrs(g,{'data-arrow-kind':kind});attrs(shaft,{d:paths,stroke:color});attrs(head,{d:heads+(kind==='force'?' Z':''),stroke:color,fill:kind==='force'?color:'none'});attrs(cross,{d:`M${x1+nx*6} ${y1+ny*6} L${x1-nx*6} ${y1-ny*6}`,stroke:color});shown(cross,kind==='dipole-chemical');
 }
 const api={g,set(patch){fields(patch,['x1','y1','x2','y2','kind','curve','color']);state=checked({...state,...patch});paint();return api;}};paint();parent.append(g);return api;
}
function contact(parent,options){
 parentOK(parent);function checked(v){fields(v,['x1','y1','x2','y2','color']);for(const k of ['x1','y1','x2','y2'])coordinate(v[k]);if(v.color!==undefined&&typeof v.color!=='string')throw new TypeError('color must be a string');return {...v};}
 let state=checked(options);const g=D.dom.s('g',{'data-chemistry-contact':''}),line=node(g,'line',{...stroke,'stroke-dasharray':'4 5'});
 function paint(){attrs(line,{x1:state.x1,y1:state.y1,x2:state.x2,y2:state.y2,stroke:state.color??C.teal});}
 const api={g,set(patch){fields(patch,['x1','y1','x2','y2','color']);state=checked({...state,...patch});paint();return api;}};paint();parent.append(g);return api;
}
function presets(name){
 const atoms=[],bonds=[],a=(id,element,x,y,charge=0,lonePairs=0)=>{atoms.push({id,element,x,y,charge,lonePairs});},b=(a,b,order=1)=>bonds.push({id:`${a}-${b}`,a,b,order});
 function hydrogen(id,parent,x,y){a(id,'H',x,y);b(parent,id);}
 if(name==='water'){a('O','O',0,0,0,2);hydrogen('H1','O',-60,50);hydrogen('H2','O',60,50);}
 else if(name==='methane'){a('C','C',0,0);[[0,-76],[76,0],[0,76],[-76,0]].forEach((p,i)=>hydrogen('H'+(i+1),'C',...p));}
 else if(name==='ammonia'||name==='ammonium'){const charged=name==='ammonium';a('N','N',0,0,charged?1:0,charged?0:1);[[-76,0],[0,76],[76,0],...(charged?[[0,-76]]:[])].forEach((p,i)=>hydrogen('H'+(i+1),'N',...p));}
 else if(name==='hydroxide'){a('O','O',0,0,-1,3);hydrogen('H','O',76,0);}
 else if(name==='acetate'){a('C1','C',-45,0);a('C2','C',45,0);a('O1','O',105,-65,0,2);a('O2','O',105,65,-1,3);b('C1','C2');b('C2','O1',2);b('C2','O2');[[-110,0],[-45,-76],[-45,76]].forEach((p,i)=>hydrogen('H'+(i+1),'C1',...p));}
 else if(name==='methylammonium'){a('C','C',-45,0);a('N','N',45,0,1);b('C','N');[[-120,0],[-45,-76],[-45,76],[120,0],[45,-76],[45,76]].forEach((p,i)=>hydrogen('H'+(i+1),i<3?'C':'N',...p));}
 else if(name==='trimethyllysine-fragment'){
  a('R','R',-250,0);a('CE','C',-145,0);a('N','N',-30,0,1);b('R','CE');b('CE','N');hydrogen('HE1','CE',-145,-70);hydrogen('HE2','CE',-145,70);
  [[70,0],[-30,-125],[-30,125]].forEach((p,i)=>{const id='C'+(i+1);a(id,'C',...p);b('N',id);const angle=Math.atan2(p[1],p[0]+30);[-Math.PI/2,0,Math.PI/2].forEach((offset,j)=>hydrogen('H'+(i+1)+(j+1),id,p[0]+66*Math.cos(angle+offset),p[1]+66*Math.sin(angle+offset)));});
 }else throw new RangeError('Unknown chemistry preset '+name);
 return {atoms,bonds};
}
global.CH={molecule,formula,arrow,contact,presets,composition};
})(window);
