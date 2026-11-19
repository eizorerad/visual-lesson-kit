/* Reusable graph-alignment bricks. Scientific coordinates and visual poses
 * are separate. Numerical functions do not depend on the SVG runtime. */
(function(g){
'use strict';
function adjacency(a){
 if(!Array.isArray(a)||!a.length||a.some(row=>!Array.isArray(row)||row.length!==a.length))throw new TypeError('A square adjacency matrix is required');
 a.forEach((row,i)=>row.forEach((v,j)=>{if(![0,1].includes(v)||i===j&&v!==0||v!==a[j][i])throw new TypeError('Expected a simple undirected graph');}));return a;
}
function permutation(p,n){if(!Array.isArray(p)||p.length!==n||new Set(p).size!==n||p.some(v=>!Number.isInteger(v)||v<0||v>=n))throw new TypeError('Expected a bijection');return p;}
function conserved(a,b,p){adjacency(a);adjacency(b);if(a.length!==b.length)throw new TypeError('Graph sizes must match');permutation(p,a.length);let count=0;for(let i=0;i<a.length;i++)for(let k=i+1;k<a.length;k++)if(a[i][k]&&b[p[i]][p[k]])count++;return count;}
function energy(a,b,p,weights={}){const alpha=weights.alpha===undefined?1:weights.alpha,beta=weights.beta===undefined?2:weights.beta;if(![alpha,beta].every(Number.isFinite))throw new TypeError('Weights must be finite');return -2*alpha*conserved(a,b,p)-beta*a.length;}
function binaryEnergy(a,b,x,weights={}){
 adjacency(a);adjacency(b);const n=a.length,m=b.length,alpha=weights.alpha===undefined?1:weights.alpha,beta=weights.beta===undefined?2:weights.beta,gamma=weights.gamma===undefined?2:weights.gamma;
 if(![alpha,beta,gamma].every(Number.isFinite)||!Array.isArray(x)||x.length!==n||x.some(row=>!Array.isArray(row)||row.length!==m||row.some(v=>v!==0&&v!==1)))throw new TypeError('Expected a binary assignment matrix and finite weights');
 let e=0;for(let i=0;i<n;i++){const row=x[i].reduce((s,v)=>s+v,0);e+=beta*((row-1)**2-1);for(let k=0;k<n;k++)if(a[i][k])for(let j=0;j<m;j++)if(x[i][j])for(let l=0;l<m;l++)if(b[j][l])e-=alpha*x[k][l];}
 for(let j=0;j<m;j++){let col=0;for(let i=0;i<n;i++)col+=x[i][j];e+=gamma*col*(col-1);}return e;
}
function oneHot(p){permutation(p,p.length);return p.map(j=>p.map((_,k)=>+(j===k)));}
function entropy(counts){const total=counts.reduce((a,b)=>a+b,0);if(counts.some(v=>!Number.isFinite(v)||v<0))throw new TypeError('Counts must be finite and nonnegative');return total?Math.max(0,-counts.reduce((h,v)=>h+(v?v/total*Math.log2(v/total):0),0)):0;}
function neighbors(p){permutation(p,p.length);const out=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const q=p.slice();[q[i],q[j]]=[q[j],q[i]];out.push(q);}return out;}
function ring(n,cx,cy,rx=130,ry=115,rotation=-Math.PI/2){return Array.from({length:n},(_,i)=>[cx+rx*Math.cos(rotation+i*2*Math.PI/n),cy+ry*Math.sin(rotation+i*2*Math.PI/n)]);}
function words(parent,id,x,y,width,height,text,size=24,color){return L.textBox(parent,{id,x,y,width,height,text,size,color:color||C.white,padding:2,lineHeight:1.25});}
function network(parent,{id='network',adj,positions,labels,color,r=21}){
 adjacency(adj);const n=adj.length,root=F.group(parent);root.dataset.graphId=id;let pose=positions.map(p=>p.slice());
 const edgeList=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(adj[i][j]){const line=F.line(root,0,0,0,0,C.grey,2.6);line.dataset.edge=i+'-'+j;edgeList.push({i,j,line});}
 const nodes=Array.from({length:n},(_,i)=>{const node=F.group(root);node.dataset.nodeId=id+':'+i;const dot=F.dot(node,0,0,r,C.bg);dot.setAttribute('stroke',color||C.blue);dot.setAttribute('stroke-width',2.4);const label=words(node,id+'-label-'+i,-r,-r,2*r,2*r,String(labels?labels[i]:i),23,color||C.blue);return {node,dot,label};});
 function paint(){nodes.forEach(({node},i)=>F.at(node,...pose[i]));edgeList.forEach(({i,j,line})=>{const [ax,ay]=pose[i],[bx,by]=pose[j],d=Math.hypot(bx-ax,by-ay)||1;F.seg(line,ax+(bx-ax)*(r+3)/d,ay+(by-ay)*(r+3)/d,bx-(bx-ax)*(r+3)/d,by-(by-ay)*(r+3)/d);});}
 function setPositions(next){if(next.length!==n||next.some(p=>p.length!==2||!p.every(Number.isFinite)))throw new TypeError('Finite node positions required');pose=next.map(p=>p.slice());paint();}
 function highlight({vertices=[],edges=[],contrast=false,all=false}={}){
  const marked=new Set(vertices),keys=new Set(edges.map(([i,j])=>[Math.min(i,j),Math.max(i,j)].join('-')));
  nodes.forEach(({dot,label},i)=>{const c=marked.has(i)?C.gold:color||C.blue;dot.setAttribute('stroke',c);dot.setAttribute('stroke-width',marked.has(i)?3.5:2.4);label.el.setAttribute('fill',c);});
  edgeList.forEach(({i,j,line})=>{const on=all||keys.has(i+'-'+j);line.setAttribute('stroke',on?color||C.teal:contrast?C.red:C.grey);line.setAttribute('stroke-opacity',on?1:.32);line.setAttribute('stroke-width',on?3.4:2.2);});
 }
 paint();return {root,nodes,edgeList,highlight,setPositions,getPositions:()=>pose.map(p=>p.slice())};
}
function assignments(parent,{id='assignment',n=6,color}){
 const root=F.group(parent),paths=Array.from({length:n},(_,i)=>{const path=F.path(root,[],color||C.gold,1.4);path.setAttribute('stroke-dasharray','5 6');path.dataset.assignmentSource=i;return path;});
 return {root,set(left,right,p,opacity=.4){permutation(p,n);paths.forEach((path,i)=>{const [x,y]=left[i],[u,v]=right[p[i]];path.setAttribute('d',`M${x+26},${y} C${x+(u-x)*.34},${y} ${x+(u-x)*.66},${v} ${u-26},${v}`);path.setAttribute('data-assignment-target',p[i]);F.opacity(path,opacity);});}};
}
// Matching changes an assignment, never the positions of the input graphs.
function paired(parent,{id='pair',a,b,left,right,leftLabels,rightLabels,r=23}){
 adjacency(a);adjacency(b);if(a.length!==b.length)throw new TypeError('Graph sizes must match');
 const root=F.group(parent),links=assignments(root,{id:id+'-links',n:a.length});
 const source=network(root,{id:id+'-left',adj:a,positions:left,labels:leftLabels,r,color:C.blue});
 const target=network(root,{id:id+'-right',adj:b,positions:right,labels:rightLabels,r,color:C.teal});
 function set(p,{visible=a.length,emphasis=true,focus=[]}={}){
  permutation(p,a.length);const keptA=[],keptB=[];
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i][j]&&b[p[i]][p[j]]){keptA.push([i,j]);keptB.push([p[i],p[j]]);}
  links.set(left,right,p,.48);links.root.querySelectorAll('[data-assignment-source]').forEach((path,i)=>F.opacity(path,i<visible?.48:0));
  source.highlight({vertices:focus,edges:keptA,contrast:emphasis,all:!emphasis});target.highlight({vertices:focus.map(i=>p[i]),edges:keptB,contrast:emphasis,all:!emphasis});
  root.dataset.permutation=p.join(',');root.dataset.conserved=keptA.length;return keptA.length;
 }
 return {root,source,target,links,set};
}
function matrix(parent,{id='matrix',n=6,x=0,y=0,size=42,labels,color}){
 const root=F.group(parent),cells=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{const el=D.dom.s('rect',{x:x+j*size,y:y+i*size,width:size-5,height:size-5,rx:5,fill:C.bg,stroke:C.dim,'stroke-width':1.2,'data-assignment-cell':i+':'+j});root.append(el);return el;}));
 const marks=Array.from({length:n},(_,i)=>words(root,id+'-one-'+i,x,y, size-5,size-5,'1',23,color||C.gold));
 for(let i=0;i<n;i++){words(root,id+'-row-'+i,x-45,y+i*size,32,size-5,String(i),20,C.grey);words(root,id+'-column-'+i,x+i*size,y-42,size-5,38,String(labels?labels[i]:i),20,C.grey);}
 return {root,cells,set(p,focusRow=-1){permutation(p,n);cells.forEach((row,i)=>row.forEach((el,j)=>{const active=p[i]===j;el.setAttribute('fill',active?color||C.gold:C.bg);el.setAttribute('fill-opacity',active?.13:1);el.setAttribute('stroke',active?color||C.gold:i===focusRow?C.grey:C.dim);el.setAttribute('stroke-width',active?2:1.2);}));marks.forEach((mark,i)=>{mark.setBox({x:x+p[i]*size,y:y+i*size,width:size-5,height:size-5});F.opacity(mark.el,focusRow<0||focusRow===i?1:.24);});root.dataset.permutation=p.join(',');}};
}
const MOTIFS={P3:[[0,1],[1,2]],K3:[[0,1],[1,2],[0,2]],P4:[[0,1],[1,2],[2,3]],S3:[[0,1],[0,2],[0,3]],C4:[[0,1],[1,2],[2,3],[3,0]],tail_tri:[[0,1],[1,2],[0,2],[2,3]],chordal_C4:[[0,1],[1,2],[2,3],[3,0],[0,2]],K4:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]};
function motif(parent,{id,name,x,y,width=100,height=70,color}){
 if(!Object.hasOwn(MOTIFS,name))throw new TypeError('Unknown motif');const root=F.group(parent),n=Math.max(...MOTIFS[name].flat())+1;
 const positions=name==='P3'?[[x+8,y+height*.5],[x+width*.5,y+height*.5],[x+width-8,y+height*.5]]:name==='P4'?Array.from({length:4},(_,i)=>[x+8+i*(width-16)/3,y+height*.5+(i%2?10:-10)]):name==='S3'?[[x+width*.5,y+height*.5],[x+9,y+height-9],[x+width*.5,y+8],[x+width-9,y+height-9]]:ring(n,x+width/2,y+height/2,width*.36,height*.38);
 MOTIFS[name].forEach(([i,j])=>F.line(root,...positions[i],...positions[j],color||C.teal,2.6));positions.forEach(p=>F.dot(root,...p,5,color||C.teal));return root;
}
g.GA={adjacency,permutation,conserved,energy,binaryEnergy,oneHot,entropy,neighbors,ring,network,assignments,paired,matrix,motif,words};
})(window);
