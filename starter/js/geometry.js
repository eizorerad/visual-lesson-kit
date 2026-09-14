/* Small, explicit teaching geometry. Angles are radians; no inferred dimensions. */
(function(g){
'use strict';
const finite=(x,n='value')=>{if(typeof x!=='number'||!Number.isFinite(x))throw new TypeError(n+' must be finite');return x;};
function pair(x,n){if(!Array.isArray(x)||x.length!==2||!Object.hasOwn(x,0)||!Object.hasOwn(x,1))throw new TypeError(n+' needs two values');return x.map(v=>finite(v,n));}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function unit(x){finite(x,'progress');if(x<0||x>1)throw new RangeError('progress must be in [0,1]');return x;}
function fields(x,allowed){if(!x||typeof x!=='object'||Array.isArray(x))throw new TypeError('options must be an object');for(const k of Object.keys(x))if(!allowed.includes(k))throw new TypeError('Unknown option '+k);}
function circleComponents(angle){finite(angle,'angle');return freeze({angle,cos:Math.cos(angle),sin:Math.sin(angle)});}
function projectOnto2D(vector,direction){
 const v=pair(vector,'vector'),b=pair(direction,'direction'),norm=Math.hypot(...b);finite(norm,'direction norm');if(norm===0)throw new RangeError('direction must be nonzero');
 const axis=b.map(x=>x/norm),score=finite(v[0]*axis[0]+v[1]*axis[1],'score'),projected=axis.map(x=>score*x),residual=v.map((x,i)=>x-projected[i]);
 const squaredLength=finite(v[0]**2+v[1]**2,'squared length'),projectedSquared=finite(score**2),residualSquared=finite(residual[0]**2+residual[1]**2);
 return freeze({axis,score,projected,residual,squaredLength,projectedSquared,residualSquared});
}
function points2D(points){if(!Array.isArray(points)||points.length<2)throw new TypeError('at least two points required');for(let i=0;i<points.length;i++)if(!Object.hasOwn(points,i))throw new TypeError('dense points required');return points.map(p=>pair(p,'point'));}
function pca2D(points){
 const data=points2D(points),n=data.length,mean=[0,1].map(j=>finite(data.reduce((sum,p)=>sum+p[j]/n,0),'mean'));
 const centered=data.map(p=>p.map((x,j)=>finite(x-mean[j],'centered value'))),xx=finite(centered.reduce((a,p)=>a+p[0]**2/(n-1),0)),yy=finite(centered.reduce((a,p)=>a+p[1]**2/(n-1),0)),xy=finite(centered.reduce((a,p)=>a+p[0]*p[1]/(n-1),0));
 const total=finite(xx+yy,'variance'),gap=Math.hypot(xx-yy,2*xy);finite(gap,'eigenvalue gap');
 const angle=.5*Math.atan2(2*xy,xx-yy),axis=[Math.cos(angle),Math.sin(angle)],second=[-axis[1],axis[0]],eigenvalues=[Math.max(0,total/2+gap/2),Math.max(0,total/2-gap/2)];
 return freeze({n,mean,centered,covariance:[[xx,xy],[xy,yy]],axes:[axis,second],angle,eigenvalues,totalVariance:total,explainedFraction:total?eigenvalues[0]/total:null,axisUnique:gap>Number.EPSILON*32*Math.max(total,Number.MIN_VALUE),scores:centered.map(p=>[p[0]*axis[0]+p[1]*axis[1],p[0]*second[0]+p[1]*second[1]])});
}
function linearMap2D(matrix){
 if(!Array.isArray(matrix)||matrix.length!==2)throw new TypeError('matrix must be 2 by 2');const m=matrix.map(row=>pair(row,'matrix row'));
 const determinant=finite(m[0][0]*m[1][1]-m[0][1]*m[1][0],'determinant'),apply=p=>[finite(m[0][0]*p[0]+m[0][1]*p[1]),finite(m[1][0]*p[0]+m[1][1]*p[1])];
 return freeze({matrix:m,columns:[[m[0][0],m[1][0]],[m[0][1],m[1][1]]],square:[[0,0],[1,0],[1,1],[0,1]].map(apply),determinant,area:Math.abs(determinant),orientation:Math.sign(determinant)});
}
function root(parent,name){if(!parent||typeof parent.append!=='function')throw new TypeError('SVG parent required');return D.dom.s('g',{['data-'+name]:''});}
function positive(x,name){finite(x,name);if(x<=0)throw new RangeError(name+' must be positive');return x;}
function label(parent,id,x,y,text,color=C.grey){const el=F.label(parent,x,y,text,20,color);L.contract(el,{id,space:parent,box:{x:x-32,y:y-18,width:64,height:36}});return el;}
function unitCircleView(parent,o={}){
 fields(o,['cx','cy','radius','traceFrame','angle']);const cx=finite(o.cx??310),cy=finite(o.cy??360),r=positive(o.radius??140,'radius'),f=o.traceFrame??{x:650,y:210,width:500,height:300};
 fields(f,['x','y','width','height']);Object.entries(f).forEach(([k,v])=>finite(v,k));positive(f.width,'width');positive(f.height,'height');
 function valid(a){finite(a,'angle');if(a<0||a>2*Math.PI)throw new RangeError('trace angle must be in [0,2π]');return a;}
 let angle=valid(o.angle??0);[cx-r-12,cx+r+12,cy-r-12,cy+r+12,f.x+f.width,f.y+f.height].forEach(x=>finite(x,'screen coordinate'));
 const el=root(parent,'unit-circle'),mid=f.y+f.height/2,amp=f.height/2;
 el.append(D.dom.s('circle',{cx,cy,r,fill:'none',stroke:C.dim,'stroke-width':2}));
 F.line(el,cx-r-12,cy,cx+r+12,cy,C.grey,1);F.line(el,cx,cy-r-12,cx,cy+r+12,C.grey,1);
 F.line(el,f.x,mid,f.x+f.width,mid,C.grey,1);F.line(el,f.x,f.y,f.x,f.y+f.height,C.grey,1);
 label(el,'circle-zero',cx-15,cy+24,'0');label(el,'trace-zero',f.x,mid+25,'0');label(el,'trace-pi',f.x+f.width/2,mid+25,'π');label(el,'trace-2pi',f.x+f.width,mid+25,'2π');label(el,'trace-one',f.x-25,f.y,'1');label(el,'trace-minus-one',f.x-25,f.y+f.height,'−1');
 const radius=F.line(el,cx,cy,cx+r,cy,C.white,2.5),cosine=F.line(el,cx,cy,cx+r,cy,C.blue,4),sine=F.line(el,cx+r,cy,cx+r,cy,C.teal,4),connector=F.line(el,cx+r,cy,f.x,mid,C.grey,1,'5 5');
 const trace=D.dom.s('path',{fill:'none',stroke:C.teal,'stroke-width':3,d:''});el.append(trace);const point=F.dot(el,cx+r,cy,7,C.gold),tracePoint=F.dot(el,f.x,mid,6,C.teal);
 function paint(){const q=circleComponents(angle),x=cx+r*q.cos,y=cy-r*q.sin,tx=f.x+f.width*angle/(2*Math.PI),ty=mid-amp*q.sin;F.seg(radius,cx,cy,x,y);F.seg(cosine,cx,cy,x,cy);F.seg(sine,x,cy,x,y);F.seg(connector,x,y,tx,ty);F.pos(point,x,y);F.pos(tracePoint,tx,ty);
  const parts=[];for(let i=0;i<=120;i++){const a=angle*i/120;parts.push((i?'L':'M')+(f.x+f.width*a/(2*Math.PI))+','+(mid-amp*Math.sin(a)));}trace.setAttribute('d',parts.join(' '));el.dataset.angle=String(angle);
 }
 const api={g:el,point,trace,tracePoint,radius,cosine,sine,connector,setAngle(a){angle=valid(a);paint();return api;},snapshot(){return circleComponents(angle);}};paint();parent.append(el);return api;
}
function projectionView(parent,o={}){
 fields(o,['records','cx','cy','scale','extent','angle','progress']);if(!Array.isArray(o.records)||o.records.length<2)throw new TypeError('records required');const ids=new Set();
 const records=o.records.map(record=>{fields(record,['id','xy','color']);if(typeof record.id!=='string'||!record.id||ids.has(record.id))throw new TypeError('unique nonempty record IDs required');ids.add(record.id);return{id:record.id,xy:pair(record.xy,'xy'),color:record.color??C.blue};});
 const pca=pca2D(records.map(d=>d.xy)),cx=finite(o.cx??440),cy=finite(o.cy??360),scale=positive(o.scale??75,'scale'),extent=positive(o.extent??3,'extent');
 if(pca.centered.some(p=>Math.hypot(...p)>extent))throw new RangeError('centered data exceed fixed extent');[cx-scale*extent,cx+scale*extent,cy-scale*extent,cy+scale*extent].forEach(x=>finite(x,'screen extent'));
 let angle=finite(o.angle??0),progress=unit(o.progress??0),model;
 function calculate(a,p){finite(a,'angle');unit(p);const axis=[Math.cos(a),Math.sin(a)],projections=pca.centered.map(v=>projectOnto2D(v,axis)),variance=projections.reduce((sum,q)=>sum+q.score**2/(records.length-1),0);return{angle:a,progress:p,axis,mean:pca.mean,projections,variance,totalVariance:pca.totalVariance,explainedFraction:pca.totalVariance?variance/pca.totalVariance:null};}
 model=calculate(angle,progress);const el=root(parent,'projection-view'),screen=p=>[cx+p[0]*scale,cy-p[1]*scale];
 F.line(el,cx-extent*scale,cy,cx+extent*scale,cy,C.dim,1);F.line(el,cx,cy-extent*scale,cx,cy+extent*scale,C.dim,1);
 const axis=F.line(el,0,0,0,0,C.gold,2.5),residuals=[],points=[],origins=[];
 records.forEach((d,i)=>{const p=screen(pca.centered[i]);const origin=F.dot(el,...p,6,C.bg);origin.setAttribute('stroke',d.color);origin.setAttribute('stroke-width',1.5);origin.dataset.sourceId=d.id;origins.push(origin);residuals.push(F.line(el,...p,...p,C.grey,1.5,'4 4'));const dot=F.dot(el,...p,6,d.color);dot.dataset.observationId=d.id;dot.dataset.sourceXY=JSON.stringify(d.xy);points.push(dot);});
 function paint(){F.seg(axis,...screen(model.axis.map(x=>-extent*x)),...screen(model.axis.map(x=>extent*x)));points.forEach((node,i)=>{const start=pca.centered[i],end=model.projections[i].projected,pos=start.map((v,j)=>F.lerp(v,end[j],progress));F.pos(node,...screen(pos));F.seg(residuals[i],...screen(start),...screen(pos));});el.dataset.angle=String(angle);el.dataset.progress=String(progress);}
 const api={g:el,points,origins,residuals,axis,pca,records:freeze(records),setState(patch){fields(patch,['angle','progress']);const a=patch.angle??angle,p=patch.progress??progress,next=calculate(a,p);angle=a;progress=p;model=next;paint();return api;},snapshot(){return freeze(JSON.parse(JSON.stringify(model)));}};paint();parent.append(el);return api;
}
function linearMapView(parent,o={}){
 fields(o,['matrix','cx','cy','scale','extent','progress']);const cx=finite(o.cx??460),cy=finite(o.cy??420),scale=positive(o.scale??65,'scale'),extent=positive(o.extent??4,'extent');
 let target=linearMap2D(o.matrix??[[2,1],[0,1]]),progress=unit(o.progress??0),model;
 const grid=[];for(let i=-1;i<=1;i++){grid.push([[i,-1],[i,1]],[[-1,i],[1,i]]);}
 function checked(q){const m=q.matrix;for(const p of [[-1,-1],[-1,1],[1,-1],[1,1]])for(let j=0;j<2;j++)if(Math.abs(m[j][0]*p[0]+m[j][1]*p[1])>extent)throw new RangeError('matrix exceeds fixed viewport extent');return q;}
 checked(linearMap2D([[1,0],[0,1]]));checked(target);[cx-scale*extent,cx+scale*extent,cy-scale*extent,cy+scale*extent].forEach(x=>finite(x,'screen extent'));
 const el=root(parent,'linear-map'),screen=p=>[cx+scale*p[0],cy-scale*p[1]];
 const square=D.dom.s('polygon',{points:'',fill:C.blue,'fill-opacity':.15,stroke:C.blue,'stroke-width':2.5});el.append(square);
 const lines=grid.map(()=>F.line(el,0,0,0,0,C.dim,1)),basis=[F.line(el,0,0,0,0,C.blue,4),F.line(el,0,0,0,0,C.teal,4)],tips=[F.dot(el,0,0,6,C.blue),F.dot(el,0,0,6,C.teal)];
 F.dot(el,cx,cy,4,C.grey);
 function paint(){const matrix=target.matrix.map((row,i)=>row.map((v,j)=>F.lerp(i===j?1:0,v,progress)));model=linearMap2D(matrix);const map=p=>[matrix[0][0]*p[0]+matrix[0][1]*p[1],matrix[1][0]*p[0]+matrix[1][1]*p[1]];square.setAttribute('points',model.square.map(p=>screen(p).join(',')).join(' '));grid.forEach((edge,i)=>F.seg(lines[i],...screen(map(edge[0])),...screen(map(edge[1]))));model.columns.forEach((p,i)=>{F.seg(basis[i],cx,cy,...screen(p));F.pos(tips[i],...screen(p));});el.dataset.determinant=String(model.determinant);el.dataset.progress=String(progress);}
 const api={g:el,square,lines,basis,tips,setProgress(p){progress=unit(p);paint();return api;},setMatrix(m){const next=checked(linearMap2D(m));target=next;paint();return api;},snapshot(){return model;}};paint();parent.append(el);return api;
}
Object.assign(g.K,{circleComponents,projectOnto2D,pca2D,linearMap2D,unitCircleView,projectionView,linearMapView});
})(window);
