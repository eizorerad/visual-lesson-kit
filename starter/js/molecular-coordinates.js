/* Source-backed RNA coordinate views. No structure inference or folding simulation.
 * Load after dom.js, film.js and perspective.js. See guide/molecular-coordinates.md.
 * Adapted from the connected RNA folding lesson; source data are supplied separately.
 */
(function(g){
'use strict';
const finite=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))throw new TypeError(name+' must be finite');return x;};
const unit=(x,name)=>{finite(x,name);if(x<0||x>1)throw new RangeError(name+' must be in [0,1]');return x;};
function vector(p,name){if(!Array.isArray(p)||p.length!==3)throw new TypeError(name+' must contain three coordinates');for(let i=0;i<3;i++)finite(p[i],name);return p;}
function basis(rows){
 if(!Array.isArray(rows)||rows.length!==3)throw new TypeError('basis must have three rows');rows.forEach(r=>vector(r,'basis'));
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(Math.abs(rows[i].reduce((s,x,k)=>s+x*rows[j][k],0)-(i===j?1:0))>1e-6)throw new RangeError('basis must be orthonormal');
 const [a,b,c]=rows,det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
 if(Math.abs(det-1)>1e-6)throw new RangeError('basis must preserve handedness (determinant +1)');
 return rows;
}
function projector(data,cam={}){
 const origin=vector(cam.origin||data.origin,'origin'),axes=basis(data.basis),cx=finite(cam.cx===undefined?0:cam.cx,'cx'),cy=finite(cam.cy===undefined?0:cam.cy,'cy'),scale=finite(cam.scale===undefined?1:cam.scale,'scale'),angle=finite(cam.angle===undefined?0:cam.angle,'angle'),pitch=finite(cam.pitch===undefined?0:cam.pitch,'pitch');
 if(scale<=0)throw new RangeError('scale must be positive');
 const a=(angle%360)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return xyz=>{const d=xyz.map((v,i)=>v-origin[i]),p=axes.map(r=>r.reduce((n,v,i)=>n+v*d[i],0));return K.project3D([p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c],{cx,cy,scale,pitch});};
}
function point(data,xyz,cam){vector(xyz,'xyz');return projector(data,cam)(xyz);}
function average(xs){if(!Array.isArray(xs)||!xs.length)throw new RangeError('centroid requires points');xs.forEach(p=>vector(p,'point'));return [0,1,2].map(i=>xs.reduce((s,a)=>s+a[i],0)/xs.length);}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function glycosidic(r){
 if(r.glycosidic)return r.glycosidic;
 if(['A','G'].includes(r.component))return ["C1'",'N9'];
 if(['C','U','5MC'].includes(r.component))return ["C1'",'N1'];
 throw new TypeError('Supply an explicit glycosidic adjacency for '+r.component);
}
function identities(residues){
 if(!Array.isArray(residues)||!residues.length)throw new TypeError('residues must be nonempty');const ids=new Set();
 residues.forEach(r=>{if((typeof r.id!=='string'&&!Number.isFinite(r.id))||ids.has(r.id))throw new TypeError('residue IDs must be unique');ids.add(r.id);});return ids;
}
function links(bonds,ids,name){if(!Array.isArray(bonds))throw new TypeError(name+' must be explicit');bonds.forEach(p=>{if(!Array.isArray(p)||p.length!==2||p[0]===p[1]||p.some(id=>!ids.has(id)))throw new TypeError(name+' endpoint must be an existing residue');});}
function validateContext(data){
 const ids=identities(data.residues);basis(data.basis);vector(data.origin,'origin');data.residues.forEach(r=>vector(r.xyz,'context xyz'));links(data.bonds,ids,'context bonds');
}
function validateRNA(data){
 if(!data||typeof data.pdb_id!=='string'||typeof data.chain!=='string')throw new TypeError('Supply source pdb_id and chain');
 const ids=identities(data.residues);basis(data.basis);vector(data.origin,'origin');links(data.bonds,ids,'bonds');
 if(!Array.isArray(data.sugar_ring)||data.sugar_ring.length<3||!Array.isArray(data.backbone)||data.backbone.length<2)throw new TypeError('Supply sugar ring and backbone atom paths');
 data.residues.forEach(r=>{
  if(!r.atoms||!Array.isArray(r.rings)||!r.rings.length||!Array.isArray(r.exo))throw new TypeError('Supply atoms, rings and exo adjacencies');
  Object.entries(r.atoms).forEach(([n,p])=>vector(p,'atom '+r.id+':'+n));vector(r.center,'base center');
  const requireAtom=n=>{if(!Object.hasOwn(r.atoms,n))throw new TypeError('Missing atom '+r.id+':'+n);};
  r.rings.forEach(ns=>{if(!Array.isArray(ns)||ns.length<3)throw new TypeError('ring must contain atoms');ns.forEach(requireAtom);});
  [...data.sugar_ring,...data.backbone].forEach(requireAtom);
  [...r.exo,glycosidic(r)].forEach(pair=>{if(!Array.isArray(pair)||pair.length!==2)throw new TypeError('atom adjacency must have two ends');pair.forEach(requireAtom);});
 });
 const rows=new Map(data.residues.map(r=>[r.id,r]));data.bonds.forEach(([a,b])=>{if(!rows.get(a).atoms["O3'"]||!rows.get(b).atoms.P)throw new TypeError('Residue bond requires O3 prime and P');});return data;
}
function sourceContext(parent,data,selection,color=()=>C.blue,options={}){
 validateContext(data.context);const ctxIds=new Set(data.context.residues.map(r=>r.id));
 if(!selection||!selection.size||[...selection].some(id=>!ctxIds.has(id)))throw new RangeError('context selection must name existing residues');
 if(typeof color!=='function')throw new TypeError('color must be a function');
 const box={x:89.5,y:244,width:237,height:272,...options.box};
 Object.entries(box).forEach(([k,v])=>finite(v,'context box '+k));
 if(box.width<=0||box.height<=0)throw new RangeError('context box dimensions must be positive');
 const leaderX=options.leaderX===undefined?375:finite(options.leaderX,'leaderX');
 const q=F.group(parent),ctx=data.context,raw=ctx.residues.map(r=>point(ctx,r.xyz,{origin:ctx.origin,cx:0,cy:0,scale:1,angle:0})),bounds=[Math.min(...raw.map(p=>p.x)),Math.max(...raw.map(p=>p.x)),Math.min(...raw.map(p=>p.y)),Math.max(...raw.map(p=>p.y))],scale=Math.min(box.width/Math.max(1,bounds[1]-bounds[0]),box.height/Math.max(1,bounds[3]-bounds[2])),cx=box.x+box.width/2-(bounds[0]+bounds[1])/2*scale,cy=box.y+box.height/2-(bounds[2]+bounds[3])/2*scale,ps=new Map(ctx.residues.map((r,i)=>[r.id,{x:cx+raw[i].x*scale,y:cy+raw[i].y*scale}]));
 ctx.bonds.forEach(([a,b])=>{const x=ps.get(a),y=ps.get(b),selected=selection.has(a)&&selection.has(b),line=F.line(q,x.x,x.y,y.x,y.y,selected?color(a):C.grey,selected?2.8:1.4);F.opacity(line,selected?1:.38);line.dataset.tertiaryContextBond=a+'-'+b;});
 ctx.residues.forEach(r=>{const p=ps.get(r.id),sel=selection.has(r.id),n=F.dot(q,p.x,p.y,sel?2.6:1.25,sel?color(r.id):C.grey);F.opacity(n,sel?1:.32);n.dataset.tertiaryContextResidue=r.id;});
 const selected=[...selection].map(i=>ps.get(i)).filter(Boolean),x=Math.min(...selected.map(p=>p.x))-9,y=Math.min(...selected.map(p=>p.y))-9,w=Math.max(...selected.map(p=>p.x))-x+9,h=Math.max(...selected.map(p=>p.y))-y+9;
 const roi=D.dom.s('rect',{x,y,width:w,height:h,rx:7,stroke:C.gold,'stroke-width':1.5,fill:'none'});q.append(roi);roi.setAttribute('stroke-dasharray','4 4');
 F.line(q,Math.min(leaderX-35,x+w+4),y+h/2,leaderX,y+h/2,C.gold,1.3,'4 5');
 q.dataset.tertiaryContextSource=data.pdb_id;q.dataset.tertiaryContextCount=ctx.residues.length;return q;
}
// Actual covalent sugar/backbone geometry joins every displayed base to its nucleotide.
// Ring fills and the inset C4′ trace are display representations, not molecular surfaces.
function molecule(parent,input,{color=()=>C.blue,focusIds=input.residues.map(r=>r.id)}={}){
 validateRNA(input);if(typeof color!=='function')throw new TypeError('color must be a function');
 const validIds=new Set(input.residues.map(r=>r.id));
 if(!Array.isArray(focusIds)||focusIds.some(id=>!validIds.has(id)))throw new RangeError('focusIds must name existing residues');
 focusIds=focusIds.slice();const data=freeze(JSON.parse(JSON.stringify(input)));
 const q=F.group(parent),rows=new Map(data.residues.map(r=>[r.id,r])),actors=[];
 const add=(node,coords,ids,kind)=>{actors.push({node,coords,ids,kind});return node;};
 function bond(r,n,m,kind='bond',col=color(r.id),width=1.6){const node=F.line(q,0,0,0,0,col,width);node.dataset.tertiaryBond=r.id+':'+n+'-'+m;add(node,[r.atoms[n],r.atoms[m]],[r.id],kind);}
 data.residues.forEach(r=>{
  const col=color(r.id),seen=new Set();
  r.rings.forEach((names,j)=>{const n=D.dom.s('polygon',{fill:col,'fill-opacity':.2,stroke:col,'stroke-width':1.2});q.append(n);n.dataset.tertiaryRing=r.id+':'+j;add(n,names.map(n=>r.atoms[n]),[r.id],'ring');});
  const sugar=D.dom.s('polygon',{fill:col,'fill-opacity':.05,stroke:col,'stroke-width':1.25});q.append(sugar);sugar.dataset.tertiarySugar=r.id;add(sugar,data.sugar_ring.map(n=>r.atoms[n]),[r.id],'sugar');
  const glyco=glycosidic(r);bond(r,glyco[0],glyco[1],'glycosidic',col,2.05);
  data.backbone.slice(1).forEach((n,j)=>bond(r,data.backbone[j],n,'backbone',col,2.0));
  r.exo.forEach(([a,b])=>bond(r,a,b));
  const names=[...new Set([...r.rings.flat(),...data.sugar_ring,...data.backbone,...r.exo.flat()])];
  names.forEach(n=>{const dot=F.dot(q,0,0,1.65,col);dot.dataset.tertiaryAtom=r.id+':'+n;const title=D.dom.s('title');title.textContent=`${data.pdb_id} · ${data.chain}:${r.component}${r.id} · ${n}`;dot.append(title);add(dot,[r.atoms[n]],[r.id],'atom');});
 });
 data.bonds.forEach(([a,b])=>{const n=F.line(q,0,0,0,0,color(a),2.0);n.dataset.tertiaryCovalent=a+'-'+b;add(n,[rows.get(a).atoms["O3'"],rows.get(b).atoms.P],[a,b],'backbone');});
 q.dataset.tertiarySource=data.pdb_id;
 function paint(cam={},{focus=0,detail=1}={}){const project=projector(data,cam);unit(focus,'focus');unit(detail,'detail');const projected=actors.map(a=>({a,pts:a.coords.map(project)}));const order=[];projected.forEach(({a,pts})=>{const selected=a.ids.every(i=>focusIds.includes(i)),alpha=selected?1:1-F.phase(focus,0,.32),z=pts.reduce((s,p)=>s+p.depth,0)/pts.length;
  if(a.kind==='ring'||a.kind==='sugar')a.node.setAttribute('points',pts.map(p=>p.x+','+p.y).join(' '));else if(a.kind==='atom'){F.pos(a.node,pts[0].x,pts[0].y);a.node.setAttribute('r',selected?1.65+focus*1.25:1.4);}else F.seg(a.node,pts[0].x,pts[0].y,pts[1].x,pts[1].y);
  if(a.kind==='sugar')a.node.setAttribute('stroke-width',1.25+detail*.55);if(a.kind==='glycosidic')a.node.setAttribute('stroke-width',2.05+detail*.75);F.opacity(a.node,alpha*(a.kind==='atom'?.2+.8*detail:1));order.push({node:a.node,z,kind:a.kind});
 });order.sort((a,b)=>a.z-b.z||(a.kind==='ring'?-1:1)).forEach(a=>q.append(a.node));q.dataset.tertiaryAngle=(cam.angle||0).toFixed(4);q.dataset.tertiaryFocus=focus.toFixed(4);return {project:xyz=>project(vector(xyz,'xyz')),row:id=>rows.get(id)};}
 return{g:q,q,paint,row:id=>rows.get(id)};
}

g.MC=Object.freeze({project:point,centroid:average,rnaFragment:molecule,context:sourceContext,validateRNA});
})(window);
