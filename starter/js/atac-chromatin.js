/* Persistent 3D chromatin: copied 1KX5 nucleosomes joined by authored linkers.
   Genomic positions and linker geometry are illustrative, not an atomic complex.
   The same indexed DNA vertices survive camera, representation and cut states. */
(function (global) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const LENGTH = 1200, CUT_A = 490, CUT_B = 578;
  const DEFAULTS = Object.freeze({visibility:1, focus:0, turn:0, flat:0, tn5:0, dock:0, tag:0, secondCut:0, release:0});
  let serial = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a,b,t) => a + (b-a)*t;
  const add = (a,b) => a.map((v,i) => v+b[i]);
  const sub = (a,b) => a.map((v,i) => v-b[i]);
  const mul = (a,t) => a.map(v => v*t);
  const dot = (a,b) => a.reduce((v,n,i) => v+n*b[i],0);
  const norm = a => { const n=Math.hypot(...a); return n>1e-10 ? mul(a,1/n) : [0,1,0]; };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const vMix = (a,b,t) => a.map((n,i) => mix(n,b[i],t));
  const smooth = t => {t=clamp(t);return t*t*(3-2*t);};
  const f = n => Number(n.toFixed(3));
  const xy = p => [p.x,p.y];
  const pathData = points => points.map((p,i) => (i?'L':'M')+f(p.x)+','+f(p.y)).join(' ');
  // Each copied protein cartoon and experimental DNA share the same rigid
  // source-to-local transform. Only the connecting linker DNA is authored.
  const CORES = [
    {bp:150,start:76,end:223, center:[-246,-23,-5], tilt:-14},
    {bp:350,start:276,end:423,center:[-124,30,10],tilt:18},
    {bp:810,start:736,end:883,center:[150,-23,-8],tilt:-17},
    {bp:1030,start:956,end:1103,center:[276,25,8],tilt:15}
  ].map(c => {
    const a=c.tilt*Math.PI/180;
    return Object.freeze({...c, axes:[[Math.cos(a),Math.sin(a),0],[-Math.sin(a),Math.cos(a),0],[0,0,1]]});
  });

  let SOURCE=null,PAIRS=null,LINKERS=null,MODEL=null;
  const WRAPS=new Map();
  function rawSourceToWorld(p,bp=350){
    const c=CORES.find(c=>c.bp===bp);if(!c)throw new Error('Unknown nucleosome genomic center '+bp);
    const frame=global.AtacHistoneCoreData.frame;
    const local=frame.rotation.map((row,i)=>frame.scale*dot(row,p)+frame.translation[i]);
    return local.reduce((v,n,i)=>add(v,mul(c.axes[i],n)),c.center);
  }
  function wrap(c,u,key='center') {
    const points=WRAPS.get(c.bp)[key],at=clamp(u)*(points.length-1),lo=Math.floor(at),hi=Math.min(points.length-1,lo+1);
    return vMix(points[lo],points[hi],at-lo);
  }
  function wrapDerivative(c,end,key='center'){
    const points=WRAPS.get(c.bp)[key],last=points.length-1,at=end?last-1:0;
    return mul(sub(points[at+1],points[at]),last/(c.end-c.start));
  }
  function wrapTangent(c,u){return norm(wrapDerivative(c,u>=.5));}
  function initializeGeometry(){
   if(MODEL)return;
   SOURCE=global.AtacStructures?.nucleosome;
   if(!SOURCE||SOURCE.pdb!=='1KX5')throw new Error('AtacChromatin requires experimental 1KX5 source coordinates');
   PAIRS=SOURCE.basePairs;
   if(PAIRS.length!==147)throw new Error('Expected 147 source-indexed nucleosomal base pairs');
   const chains=new Map(SOURCE.chains.map(c=>[c.id,c]));
   for(const c of CORES){
    const a=PAIRS.map(p=>rawSourceToWorld(chains.get(p.chainA).points[p.indexA],c.bp));
    const b=PAIRS.map(p=>rawSourceToWorld(chains.get(p.chainB).points[p.indexB],c.bp));
    WRAPS.set(c.bp,{a,b,center:a.map((p,i)=>mul(add(p,b[i]),.5))});
   }
   LINKERS = [
    {start:0,end:76,a:[-334,18,6],b:wrap(CORES[0],0),ta:[1,-.2,0],tb:wrapTangent(CORES[0],0)},
    ...CORES.slice(0,-1).map((c,i)=>({start:c.end,end:CORES[i+1].start,a:wrap(c,1),b:wrap(CORES[i+1],0),ta:wrapTangent(c,1),tb:wrapTangent(CORES[i+1],0)})),
    {start:1103,end:LENGTH,a:wrap(CORES[3],1),b:[334,-9,0],ta:wrapTangent(CORES[3],1),tb:[1,-.1,0]}
   ];
   // Parallel transport supplies only the illustrative linker duplex. Source
   // wrap points bypass this model and retain every deposited C4-prime knot.
   MODEL=[];
   let previousNormal=null,previousCenter=null,contour=0;
   for(let bp=0;bp<=LENGTH;bp++){
    const p=centerAt(bp),tangent=norm(sub(centerAt(bp+.25),centerAt(bp-.25)));
    let normal=previousNormal?sub(previousNormal,mul(tangent,dot(previousNormal,tangent))):cross([0,0,1],tangent);
    if(Math.hypot(...normal)<.05)normal=cross(tangent,[1,0,0]);
    normal=norm(normal);previousNormal=normal;
    const binormal=norm(cross(tangent,normal));
    if(previousCenter)contour+=Math.hypot(...sub(p,previousCenter));
    previousCenter=p;
    const phase=TAU*contour/32,radial=add(mul(normal,Math.cos(phase)*3.2),mul(binormal,Math.sin(phase)*3.2));
    MODEL.push({center:p,a:add(p,radial),b:sub(p,radial)});
   }
   // Local Hermite corrections join BOTH linker strands to the actual source
   // endpoints and endpoint tangents. Corrections vanish with zero slope after
   // eight illustrative bp; no source nucleosome vertex is moved or invented.
   for(const linker of LINKERS){
    linker.joins=[];
    for(const end of [0,1]){
     const c=CORES.find(c=>end?c.start===linker.end:c.end===linker.start);if(!c)continue;
     const bp=end?linker.end:linker.start,direction=end?-1:1;
     const width=Math.min(8,(linker.end-linker.start)/3),keys={};
     for(const key of ['center','a','b']){
      const desired=wrap(c,end?0:1,key),derivative=wrapDerivative(c,end?0:1,key);
      const current=MODEL[bp][key],next=MODEL[bp+direction][key];
      keys[key]={position:sub(desired,current),slope:sub(mul(derivative,direction),sub(next,current))};
     }
     linker.joins.push({bp,direction,width,keys});
    }
   }
  }
  function centerAt(bp) {
    const b=Math.max(0,Math.min(LENGTH,bp));
    const core=CORES.find(c=>b>=c.start&&b<=c.end);
    if(core)return wrap(core,(b-core.start)/(core.end-core.start));
    const k=LINKERS.find(l=>b>=l.start&&b<=l.end);
    const u=(b-k.start)/(k.end-k.start),q=1-u;
    const arm=Math.min(30,Math.hypot(...sub(k.b,k.a))*.24);
    const c1=add(k.a,mul(k.ta,arm)),c2=sub(k.b,mul(k.tb,arm));
    const p=k.a.map((v,i)=>q*q*q*v+3*q*q*u*c1[i]+3*q*u*u*c2[i]+u*u*u*k.b[i]);
    // A broad accessible linker is drawn as a gentle arch, with zero added
    // endpoint derivative. Neither docking nor tagging changes this geometry.
    if(k.start===423)p[1]+=32*16*u*u*q*q;
    return p;
  }

  function sourceAt(bp,key='center') {
    const b=Math.max(0,Math.min(LENGTH,bp)),lo=Math.floor(b),hi=Math.min(LENGTH,lo+1);
    const core=CORES.find(c=>b>=c.start&&b<=c.end);
    if(core)return wrap(core,(b-core.start)/(core.end-core.start),key);
    let p=vMix(MODEL[lo][key],MODEL[hi][key],b-lo);
    const linker=LINKERS.find(l=>b>=l.start&&b<=l.end);
    for(const join of linker?.joins||[]){
      const u=(b-join.bp)*join.direction/join.width;if(u<0||u>1)continue;
      const h00=2*u*u*u-3*u*u+1,h10=u*u*u-2*u*u+u,k=join.keys[key];
      p=add(p,add(mul(k.position,h00),mul(k.slope,join.width*h10)));
    }
    return p;
  }

  function create(svg) {
    if(!svg||typeof svg.appendChild!=='function')throw new TypeError('AtacChromatin.create needs an SVG parent');
    initializeGeometry();
    const C=global.C, id='atac-chromatin-'+(++serial), nodes=[];
    let disposed=false,lastOrder=[],lastSourceProject=null;
    const baseAlpha=new WeakMap();
    function el(tag,attributes,parent) {
      const n=document.createElementNS(NS,tag);
      Object.entries(attributes||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));
      if(parent)parent.appendChild(n);nodes.push(n);return n;
    }
    function attrs(n,a){Object.entries(a).forEach(([k,v])=>n.setAttribute(k,typeof v==='number'?String(f(v)):String(v)));}
    function opacity(n,a){baseAlpha.set(n,clamp(a));n.style.opacity=String(clamp(a));}
    const g=el('g',{'data-actor':'atac-chromatin','data-representation':'authored-3d-schematic'},svg);
    const title=el('title',{},g);title.textContent='';
    const defs=el('defs',{},g);
    const inspectionClip=el('clipPath',{id:id+'-inspection-clip'},defs);
    el('rect',{x:60,y:201,width:1160,height:353,rx:18},inspectionClip);
    const camera=el('g',{'data-chromatin-camera':''},g);
    // Empty compatibility anchor: the film starts with chromatin, not a nucleus icon.
    const nucleus=el('g',{'data-bio-part':'nucleus-context'},camera);
    const depthLayer=el('g',{'data-bio-part':'chromatin-depth-scene'},camera);
    const front=el('g',{'data-bio-part':'tagmentation-events'},camera);
    const items=[];
    const boundaries=Array.from(new Set([0,LENGTH,CUT_A,CUT_B,...Array.from({length:301},(_,i)=>i*4),...CORES.flatMap(c=>[c.start,c.end])])).sort((a,b)=>a-b);
    const strands=[];
    for(let i=0;i<boundaries.length-1;i++)for(const strand of ['a','b']) {
      const a=boundaries[i],b=boundaries[i+1];
      const n=el('path',{fill:'none',stroke:strand==='a'?C.blue:C.teal,'stroke-width':2.25,'stroke-linecap':'round','stroke-linejoin':'round','data-bio-part':'dna-strand-'+strand,'data-bp-start':a,'data-bp-end':b},depthLayer);
      const core=CORES.find(c=>a>=c.start&&b<=c.end);
      let sourceBps=null;
      if(core){
        const knots=PAIRS.map((_,index)=>mix(core.start,core.end,index/(PAIRS.length-1))).filter(bp=>bp>a+1e-8&&bp<b-1e-8);
        sourceBps=[a,...knots,b];
        const side=strand==='a'?'A':'B',vertexMap=[];
        sourceBps.forEach((bp,vertex)=>{const at=(bp-core.start)/(core.end-core.start)*(PAIRS.length-1),index=Math.round(at);if(Math.abs(at-index)<1e-7)vertexMap.push([vertex,PAIRS[index]['index'+side]]);});
        attrs(n,{'data-source-pdb':'1KX5','data-source-chain':PAIRS[0]['chain'+side],'data-source-genomic-center':core.bp,'data-source-vertex-map':JSON.stringify(vertexMap)});
      }
      const item={node:n,kind:'strand',strand,a,b,sourceBps,order:items.length,depth:0};strands.push(item);items.push(item);
    }
    const rungBps=Array.from(new Set([...Array.from({length:101},(_,i)=>i*12),...Array.from({length:21},(_,i)=>494+i*4)])).sort((a,b)=>a-b);
    const rungs=rungBps.map(bp=>{
      const node=el('path',{fill:'none',stroke:C.grey,'stroke-width':.8,'stroke-linecap':'round','data-bio-part':'dna-cross-section','data-bp':bp},depthLayer);
      const item={node,kind:'rung',bp,order:items.length,depth:0};items.push(item);return item;
    });
    const histones=CORES.map(core=>{
      const node=el('g',{'data-bio-part':'histone-core','data-genomic-center':core.bp,'data-source':'1KX5'},depthLayer);
      const cartoon=AtacHistoneCartoon.create(node,el);
      const item={node,core,cartoon,kind:'histone',order:items.length,depth:0};items.push(item);return item;
    });
    function adapter(parent,color,name) {
      const q=el('g',{'data-bio-part':name},parent);
      el('path',{d:'M0,-5 L5,-2.4 L26,-2.4',fill:'none',stroke:color,'stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'},q);
      el('path',{d:'M0,5 L5,2.4 L26,2.4',fill:'none',stroke:color,'stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'},q);
      el('path',{d:'M7,-2.4 L7,2.4 M15,-2.4 L15,2.4 M23,-2.4 L23,2.4',fill:'none',stroke:color,'stroke-width':1,'stroke-opacity':.75},q);
      return q;
    }
    function enzyme(name) {
      const q=el('g',{'data-bio-part':name,'data-source-pdb':'1MUH','data-representation':'source-coordinate-traces'},front);
      return {g:q,cartoon:AtacTn5Cartoon.create(q,el)};
    }
    const enzymeA=enzyme('tn5-event-a'),enzymeB=enzyme('tn5-event-b');
    const adapters={
      aOutside:adapter(front,C.purple,'event-a-upstream-adapter'),
      aFragment:adapter(front,C.gold,'event-a-fragment-adapter'),
      bFragment:adapter(front,C.purple,'event-b-fragment-adapter'),
      bOutside:adapter(front,C.gold,'event-b-downstream-adapter')
    };

    function paint(input={}) {
      if(disposed)throw new Error('This chromatin actor is disposed');
      const state={};
      Object.keys(DEFAULTS).forEach(k=>{
        const value=Number.isFinite(input[k])?input[k]:DEFAULTS[k];
        state[k]=k==='turn'?value%360:clamp(value);
      });
      const s=state, move=smooth((s.release-.22)/.78), proteinRemain=1-smooth(s.release/.25);
      const pitch=(18+s.turn)*Math.PI/180, yaw=.22*Math.sin(s.turn*Math.PI/180);
      const cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),scale=mix(.64,1,s.focus);
      function rotate(p) {
        const x=cy*p[0]+sy*p[2],z=-sy*p[0]+cy*p[2];
        return [x,cp*p[1]-sp*z,sp*p[1]+cp*z];
      }
      function project(p){const q=rotate(p);return {x:640+scale*q[0],y:385+scale*q[1],depth:q[2]};}
      lastSourceProject=(p,bp=350)=>project(rawSourceToWorld(p,bp));
      function point(bp,strand='center',selected=false) {
        const q=project(sourceAt(bp,strand));
        const dy=strand==='a'?-5:strand==='b'?5:0;
        q.x=mix(q.x,220+bp*.7,s.flat);q.y=mix(q.y,365+dy,s.flat);q.depth*=1-s.flat;
        if(selected) {
          q.x=mix(q.x,400+(bp-CUT_A)*480/(CUT_B-CUT_A),move);
          q.y=mix(q.y,365+dy,move);q.depth*=1-move;
        }
        return q;
      }
      const restOpacity=1-smooth(move/.82),gapA=2.8*s.tag*(1-move),gapB=2.8*s.secondCut*(1-move);
      const drawingPoints=[],dnaPoints=[],wrapPoints=[];
      function retain(p,collection=drawingPoints){collection.push(p);return p;}
      function interval(a,b) {
        let lo=a,hi=b;
        if(b<=CUT_A)hi=Math.min(hi,CUT_A-gapA);
        if(a>=CUT_A)lo=Math.max(lo,CUT_A+gapA);
        if(b<=CUT_B)hi=Math.min(hi,CUT_B-gapB);
        if(a>=CUT_B)lo=Math.max(lo,CUT_B+gapB);
        return [lo,hi];
      }
      opacity(g,s.visibility);opacity(nucleus,0);
      for(const item of strands) {
        const [lo,hi]=interval(item.a,item.b), selected=item.a>=CUT_A&&item.b<=CUT_B;
        const active=hi>lo+.001,alpha=(selected?1:restOpacity);
        if(!active){opacity(item.node,0);continue;}
        const samples=Math.max(2,Math.ceil((hi-lo)*1.5));
        const bpSamples=item.sourceBps||Array.from({length:samples+1},(_,i)=>mix(lo,hi,i/samples));
        const points=bpSamples.map(bp=>point(bp,item.strand,selected));
        if(item.a>=276&&item.b<=423)wrapPoints.push(...points);
        item.depth=points.reduce((total,p)=>total+p.depth,0)/points.length;
        const lighting=mix(.72,1,clamp((item.depth+60)/120));
        attrs(item.node,{d:pathData(points),'stroke-width':mix(1.75,2.4,s.focus)+.15*s.flat,stroke:selected?`color-mix(in srgb, ${C.gold} ${100*s.secondCut}%, ${item.strand==='a'?C.blue:C.teal})`:(item.strand==='a'?C.blue:C.teal)});
        opacity(item.node,alpha*mix(lighting,1,s.flat));
        if(alpha>.01)points.forEach(p=>{retain(p);retain(p,dnaPoints);});
      }
      for(const item of rungs) {
        const selected=item.bp>CUT_A&&item.bp<CUT_B;
        const cut=Math.abs(item.bp-CUT_A)<gapA+.1||Math.abs(item.bp-CUT_B)<gapB+.1;
        const a=point(item.bp,'a',selected),b=point(item.bp,'b',selected);
        attrs(item.node,{d:pathData([a,b]),'stroke-width':mix(.55,.85,s.focus)});
        item.depth=(a.depth+b.depth)*.5-.2;
        opacity(item.node,cut?0:(selected?1:restOpacity)*mix(.4,.65,s.flat));
      }
      const histoneGeometry=[];
      const coreOpacity=(1-s.flat)*(1-move);
      const coreViewKey=[s.focus,s.turn,s.flat].join(':');
      for(const item of histones) {
        const c=item.core,p=project(c.center),original={...p},axis=rotate(c.axes[0]);
        p.x=mix(p.x,220+c.bp*.7,s.flat);p.y=mix(p.y,365,s.flat);
        if(item.coreViewKey!==coreViewKey){
          item.coreBounds=item.cartoon.paint(local=>{
            const world=local.reduce((v,n,i)=>add(v,mul(c.axes[i],n)),c.center);
            const q=project(world);q.x+=p.x-original.x;q.y+=p.y-original.y;return q;
          },scale);
          item.coreViewKey=coreViewKey;
        }
        const b=item.coreBounds;
        const rx=Math.max(p.x-b.minX,b.maxX-p.x),ry=Math.max(p.y-b.minY,b.maxY-p.y),angle=Math.atan2(axis[1],axis[0])*180/Math.PI;
        item.depth=p.depth*(1-s.flat);opacity(item.node,coreOpacity);
        if(coreOpacity>.01){retain({x:b.minX,y:b.minY});retain({x:b.maxX,y:b.maxY});}
        histoneGeometry.push({bp:c.bp,interval:[c.start,c.end],center:xy(p),rx,ry,angle,bounds:{minX:b.minX,maxX:b.maxX,minY:b.minY,maxY:b.maxY},opacity:coreOpacity,source:'1KX5',chains:item.cartoon.chains,representation:item.cartoon.representation});
      }
      // Painter sorting includes cores and every short backbone segment. A rear
      // wrap is occluded by its opaque core; its front half remains in view.
      const order=items.slice().sort((a,b)=>a.depth-b.depth||a.order-b.order);
      if(order.some((item,i)=>item!==lastOrder[i])) {
        order.forEach(item=>depthLayer.appendChild(item.node));lastOrder=order;
      }
      const cutA=point(CUT_A),cutB=point(CUT_B);
      function tangentAngle(bp,selected=false) {
        const a=point(bp-1,'center',selected),b=point(bp+1,'center',selected);
        return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
      }
      const angleA=tangentAngle(CUT_A),angleB=tangentAngle(CUT_B);
      // Keep the illustrated dimer beside the accessible linker rather than
      // superimposed on the neighboring histone core; the cut coordinate stays fixed.
      const enzymePointA={x:cutA.x+42*(1-s.dock)+20*s.dock,y:cutA.y-105*(1-s.dock)};
      const enzymePointB={x:cutB.x+32*(1-s.secondCut),y:cutB.y+66*(1-s.secondCut)};
      const enzymeAlphaA=s.tn5*(1-s.flat*.75)*proteinRemain,enzymeAlphaB=s.secondCut*(1-s.flat*.75)*proteinRemain;
      // Both occurrences retain the same 1MUH object and orientation used by
      // the overview. Docking is an illustrative translation, not a target-DNA model.
      const enzymeShapeA=enzymeA.cartoon.place(enzymePointA.x,enzymePointA.y,1-s.tag);
      const enzymeShapeB=enzymeB.cartoon.place(enzymePointB.x,enzymePointB.y,1-s.secondCut);
      opacity(enzymeA.g,enzymeAlphaA);opacity(enzymeB.g,enzymeAlphaB);
      const leftFragment=point(CUT_A+gapA,'center',true),rightFragment=point(CUT_B-gapB,'center',true);
      const adapterPoints=[];
      function placeAdapter(node,p,angle,alpha) {
        attrs(node,{transform:`translate(${f(p.x)} ${f(p.y)}) rotate(${f(angle)})`});opacity(node,alpha);
        if(alpha>.01){retain(p);const end={x:p.x+26*Math.cos(angle*Math.PI/180),y:p.y+26*Math.sin(angle*Math.PI/180)};retain(end);adapterPoints.push(xy(end));}
      }
      placeAdapter(adapters.aOutside,point(CUT_A-gapA),angleA-55,s.tag*restOpacity);
      placeAdapter(adapters.aFragment,leftFragment,mix(angleA+125,180,move),s.tag);
      placeAdapter(adapters.bFragment,rightFragment,mix(angleB-55,0,move),s.secondCut);
      placeAdapter(adapters.bOutside,point(CUT_B+gapB),angleB+125,s.secondCut*restOpacity);
      for(const [shape,alpha] of [[enzymeShapeA,enzymeAlphaA],[enzymeShapeB,enzymeAlphaB]])if(alpha>.01){retain({x:shape.allBounds.minX,y:shape.allBounds.minY});retain({x:shape.allBounds.maxX,y:shape.allBounds.maxY});}
      function bounds(points) {
        if(!points.length)return {x:640,y:365,width:0,height:0};
        const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs)-3,y=Math.min(...ys)-3;
        return {x,y,width:Math.max(...xs)-x+3,height:Math.max(...ys)-y+3};
      }
      const fragmentCenter=point((CUT_A+CUT_B)/2,'center',true);
      const wx=wrapPoints.map(p=>p.x),wy=wrapPoints.map(p=>p.y);
      const wrapBounds={minX:Math.min(...wx),maxX:Math.max(...wx),minY:Math.min(...wy),maxY:Math.max(...wy)};
      const registration={bp:350,interval:[276,423],center:[(wrapBounds.minX+wrapBounds.maxX)/2,(wrapBounds.minY+wrapBounds.maxY)/2],diagonal:Math.hypot(wrapBounds.maxX-wrapBounds.minX,wrapBounds.maxY-wrapBounds.minY),bounds:wrapBounds};
      registration.source='1KX5';
      registration.landmarks=PAIRS.flatMap((pair,i)=>{
        const bp=mix(276,423,i/(PAIRS.length-1));
        return [{chain:pair.chainA,index:pair.indexA,bp,point:xy(point(bp,'a'))},{chain:pair.chainB,index:pair.indexB,bp,point:xy(point(bp,'b'))}];
      });
      const enzymes=[{...enzymeShapeA,event:'A',opacity:enzymeAlphaA},{...enzymeShapeB,event:'B',opacity:enzymeAlphaB}];
      const rect=(b,detail)=>({x:b.minX,y:b.minY,width:b.maxX-b.minX,height:b.maxY-b.minY,...detail});
      const labelObstacles={
        rects:enzymes.filter(e=>e.opacity>.01).map(e=>rect(e.allBounds,{id:'enzyme-'+e.event,kind:'enzyme',opacity:e.opacity})),
        points:[...dnaPoints.filter((_,i)=>i%3===0).map(p=>({x:p.x,y:p.y,radius:3,kind:'dna',opacity:1})),...histones.flatMap(h=>h.coreBounds.obstaclePoints.map(p=>({...p,kind:'histone',opacity:coreOpacity})))]
      };
      const anchors={
        nucleus:[640,207],histone:histoneGeometry[1].center.slice(),tails:histones[1].coreBounds.tailAnchor.slice(),dna:xy(point(648)),open:xy(point(534)),
        enzyme:enzymes[0].center.slice(),adapter:adapterPoints[1]||xy(leftFragment),
        cutA:xy(move>0?leftFragment:cutA),cutB:xy(move>0?rightFragment:cutB),fragment:xy(fragmentCenter)
      };
      return {
        anchors,registration,enzymeRegistration:enzymes[0],
        fragmentEndpoints:[xy(leftFragment),xy(rightFragment)],
        geometry:{
          bounds:bounds(drawingPoints),dnaBounds:bounds(dnaPoints),histones:histoneGeometry,enzymes,labelObstacles,
          selectedInterval:[CUT_A,CUT_B],selectedLength:CUT_B-CUT_A,
          cuts:[{bp:CUT_A,progress:s.tag,point:anchors.cutA},{bp:CUT_B,progress:s.secondCut,point:anchors.cutB}],
          state:{...s},representation:s.flat===1?'linear-schematic':'authored-3d-schematic',
          source:'1KX5 nucleosomes and 1MUH transposomes; authored linkers and genomic arrangement; no ATAC atomic-contact model',
          strandSegmentCount:strands.length,nodeCount:nodes.length,
          releaseMove:move,proteinOpacity:proteinRemain,
          centerline:Array.from({length:61},(_,i)=>{const bp=i*20;return {bp,point:xy(point(bp,'center',bp>=CUT_A&&bp<=CUT_B))};})
        }
      };
    }
    // A view transform preserves all authored vertices. The fixed outer clip
    // keeps the enlarged neighbors inside the figure, away from its captions.
    function setView(view=null){
      const scale=view?.scale??1,from=view?.from||[0,0],to=view?.to||[0,0],context=view?.context??1,focus=view?.focus||'nucleosome',interval=view?.interval||[CUT_A-35,CUT_A+35];
      attrs(camera,{transform:`matrix(${scale} 0 0 ${scale} ${to[0]-scale*from[0]} ${to[1]-scale*from[1]})`});
      if(view)g.setAttribute('clip-path','url(#'+id+'-inspection-clip)');else g.removeAttribute('clip-path');
      items.forEach(item=>{
        const selected=focus==='nucleosome'?(item.kind==='histone'?item.core.bp===350:item.kind==='rung'?(item.bp>=276&&item.bp<=423):(item.a>=276&&item.b<=423)):(item.kind==='histone'?false:item.kind==='rung'?(item.bp>=interval[0]&&item.bp<=interval[1]):(item.b>=interval[0]&&item.a<=interval[1]));
        item.node.style.opacity=String((baseAlpha.get(item.node)??1)*(selected?1:context));
      });
      nucleus.style.opacity=String((baseAlpha.get(nucleus)??0)*context);
      enzymeA.g.style.opacity=String((baseAlpha.get(enzymeA.g)??0)*(focus==='nucleosome'?context:1));
      enzymeB.g.style.opacity=String((baseAlpha.get(enzymeB.g)??0)*context);
    }
    function dispose(){if(!disposed){disposed=true;g.remove();}}
    paint();
    return {g,paint,setView,dispose,nodes,sourceProject:(p,bp=350)=>lastSourceProject(p,bp)};
  }
  global.AtacChromatin=Object.freeze({create,rawSourceToWorld,defaults:DEFAULTS,length:LENGTH,selectedInterval:Object.freeze([CUT_A,CUT_B])});
})(window);
