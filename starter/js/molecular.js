/* Structure-informed schematic molecular actors for Visual Lesson Kit.
 * Live semantic colors; persistent SVG nodes; no embedded labels or bitmaps.
 * Structure-informed silhouettes, not coordinate-derived molecular structures.
 * See docs/molecular.md for sources, units and simplifications.
 */
(function (global) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = global.C;
  const BG = 'var(--color-bg)';
  const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
  const number = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  function el(parent, name, attrs) {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) n.setAttribute(k, v); });
    if(attrs && attrs['stroke-width'] != null)n.dataset.bioWidth=String(attrs['stroke-width']);
    parent.appendChild(n); return n;
  }
  function group(parent, kind) {
    return el(parent, 'g', {'data-bio-actor':kind, 'stroke-linecap':'round', 'stroke-linejoin':'round'});
  }
  function path(parent, d, color, width, opacity) {
    return el(parent, 'path', {d, fill:'none', stroke:color, 'stroke-width':(width == null ? 1.7 : width)*.76, opacity:opacity == null ? 1 : opacity});
  }
  function body(parent, d, color, opacity) {
    const g = el(parent, 'g');
    el(g, 'path', {d, fill:BG});
    el(g, 'path', {d, fill:color, 'fill-opacity':opacity == null ? .075 : opacity*.8, stroke:color, 'stroke-width':1.25});
    return g;
  }
  function line(parent, x1,y1,x2,y2,color,opacity,width) {
    return el(parent,'line',{x1,y1,x2,y2,stroke:color,'stroke-width':(width == null ? 1.1 : width)*.76,opacity:opacity == null ? 1 : opacity});
  }
  function base(parent, opts, kind) {
    opts = opts || {};
    const x=opts.x == null ? 0 : opts.x,y=opts.y == null ? 0 : opts.y,scale=opts.scale == null ? 1 : opts.scale;
    validatePlacement(x,y,scale);
    const actor = {g:group(parent,kind), kind};
    place(actor,x,y,scale);
    return actor;
  }
  function validatePlacement(x,y,scale) {
    if(![x,y,scale].every(v=>typeof v==='number'&&Number.isFinite(v)))throw new TypeError('Molecular position and scale must be finite numbers');
    if(scale<=0)throw new RangeError('Molecular scale must be positive');
  }
  function place(actor,x,y,scale=1) {
    validatePlacement(x,y,scale);
    actor.g.setAttribute('transform','translate('+x+' '+y+') scale('+scale+')');
    actor.x=x; actor.y=y; actor.scale=scale;
    if(actor._ink)actor._ink.forEach(i=>{if(i.width!=null)i.n.setAttribute('stroke-width',i.currentWidth/(scale*i.localScale));});
    return actor;
  }
  // Store original ink once. Visual emphasis never changes molecular state or
  // parent opacity, so a motion driver can still reveal or hide the same actor.
  function finish(a) {
    a._ink=[...a.g.querySelectorAll('path,line,circle,ellipse,rect,polygon,polyline')].map(n=>{
      let localScale=1;
      for(let p=n;p&&p!==a.g;p=p.parentElement){
        for(const match of (p.getAttribute('transform')||'').matchAll(/scale\(\s*([\d.eE+-]+)/g))localScale*=Math.abs(Number(match[1]));
      }
      const width=n.hasAttribute('data-bio-width')?Number(n.dataset.bioWidth):null;
      return {n,localScale,width,currentWidth:width,stroke:n.getAttribute('stroke'),fill:n.getAttribute('fill'),fillOpacity:Number(n.getAttribute('fill-opacity')||1),strokeOpacity:Number(n.getAttribute('stroke-opacity')||1)};
    });
    return emphasis(a,{level:'normal'});
  }
  function emphasis(a,options={}) {
    const level=options.level||'normal',amount=options.amount==null?1:options.amount;
    if(!['normal','context','focus'].includes(level))throw new TypeError('Unknown molecular emphasis level');
    if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0||amount>1)throw new RangeError('Emphasis amount must be in [0,1]');
    let selected=null;
    if(options.part!=null){selected=[...a.g.querySelectorAll('[data-bio-part]')].find(n=>n.dataset.bioPart===options.part);if(!selected)throw new RangeError('Unknown molecular part: '+options.part);}
    const signature=JSON.stringify([level,options.part||null,options.color||null,amount]);
    if(a._emphasisSignature===signature)return a;
    a._emphasisSignature=signature;a.g.dataset.bioEmphasis=level;
    a._ink.forEach(i=>{
      const localLevel=selected&&i.n!==selected&&!selected.contains(i.n)?'context':level;
      const strength=localLevel==='context'?1-.55*amount:1;
      const focused=localLevel==='focus'?amount:0;
      i.currentWidth=i.width==null?null:i.width+((i.width<1.15?Math.max(i.width,1.05):Math.max(i.width,2.2))-i.width)*focused;
      if(i.width!=null)i.n.setAttribute('stroke-width',i.currentWidth/(a.scale*i.localScale));
      if(i.stroke&&i.stroke!=='none'){
        i.n.setAttribute('stroke',focused&&options.color?options.color:i.stroke);
        i.n.setAttribute('stroke-opacity',i.strokeOpacity*strength);
      }
      if(i.fill&&i.fill!=='none'&&i.fill!==BG){
        i.n.setAttribute('fill',focused&&options.color?options.color:i.fill);
        i.n.setAttribute('fill-opacity',Math.min(1,i.fillOpacity+.11*focused)*strength);
      }
    });return a;
  }
  function pointsPath(points) {
    return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
  }

  // Width is centered around x=0. openX is in this same local coordinate system.
  function dna(parent,opts) {
    opts=opts||{};
    const a=base(parent,opts,'dna');
    const state={width:Math.max(1,number(opts.width,420)), amplitude:Math.max(1,number(opts.amplitude,10)), period:Math.max(16,number(opts.period,54)),open:clamp(opts.open),openX:number(opts.openX,0),openWidth:Math.max(24,number(opts.openWidth,110)),phase:number(opts.phase,0)};
    const colA=opts.color||C.blue, colB=opts.color2||C.teal;
    const rungs=el(a.g,'g',{'data-bio-part':'base-pairs'});
    // Capacity is fixed at creation; changing width rescales the same rung objects.
    const count=Math.max(4,Math.ceil(state.width/9));
    const pairs=Array.from({length:count+1},()=>line(rungs,0,0,0,0,C.grey,.42,1.05));
    const strandA=path(a.g,'',colA,2.0), strandB=path(a.g,'',colB,2.0);
    function geometry(x) {
      const t=(x+state.width/2)/state.period*Math.PI*2+state.phase;
      const z=(x-state.openX)/(state.openWidth/2);
      const bubble=Math.abs(z)<1 ? Math.pow(Math.cos(z*Math.PI/2),2)*state.open : 0;
      const wave=Math.sin(t)*state.amplitude;
      return [wave*(1-bubble)-bubble*(state.amplitude+14),-wave*(1-bubble)+bubble*(state.amplitude+14),bubble];
    }
    a.set=function(patch) {
      patch=patch||{}; Object.keys(state).forEach(k=>{if(patch[k]!=null) state[k]=number(patch[k],state[k]);});
      state.open=clamp(state.open); state.width=Math.max(1,state.width); state.period=Math.max(16,state.period); state.openWidth=Math.max(24,state.openWidth); state.amplitude=Math.max(1,state.amplitude);
      const n=Math.max(48,Math.ceil(state.width/3)), p1=[],p2=[];
      for(let i=0;i<=n;i++){const x=-state.width/2+i*state.width/n,y=geometry(x);p1.push([x,y[0]]);p2.push([x,y[1]]);}
      strandA.setAttribute('d',pointsPath(p1)); strandB.setAttribute('d',pointsPath(p2));
      pairs.forEach((r,i)=>{const x=-state.width/2+i*state.width/count,y=geometry(x);r.setAttribute('x1',x);r.setAttribute('x2',x);r.setAttribute('y1',y[0]);r.setAttribute('y2',y[1]);r.setAttribute('opacity',(.42*(1-y[2])).toFixed(3));});
      if(a.anchors){
        a.anchors.left=[-state.width/2,0];a.anchors.right=[state.width/2,0];
        a.anchors.strandAStart=p1[0];a.anchors.strandAEnd=p1[p1.length-1];
        a.anchors.strandBStart=p2[0];a.anchors.strandBEnd=p2[p2.length-1];
      }
      a.bounds={x:-state.width/2-2,y:-state.amplitude-16,width:state.width+4,height:2*state.amplitude+32};
      return a;
    };
    a.strands=[strandA,strandB];a.rungs=rungs;a.state=state;a.anchors={left:[-state.width/2,0],right:[state.width/2,0]};
    a.set();return finish(a);
  }

  function cas9(parent,opts) {
    opts=opts||{};const a=base(parent,opts,'cas9'), color=opts.color||C.blue;
    const rec='M -78 -11 C -84 -24 -73 -38 -64 -39 C -62 -55 -43 -61 -32 -51 C -19 -64 -1 -55 5 -46 C 21 -56 36 -42 36 -31 C 48 -34 61 -26 61 -18 C 72 -20 80 -12 77 -4 C 65 0 52 -7 41 -8 C 23 -11 10 -18 -4 -12 C -20 -3 -30 -14 -43 -12 C -55 -11 -65 -3 -78 -11 Z';
    const nuc='M -78 11 C -65 5 -54 13 -40 11 C -24 6 -12 17 2 12 C 15 5 25 2 39 8 C 52 13 65 1 77 6 C 86 16 74 30 62 30 C 62 48 46 53 35 47 C 26 63 6 56 -2 46 C -15 56 -33 53 -39 44 C -55 47 -66 36 -66 27 C -78 26 -84 17 -78 11 Z';
    a.recognition=body(a.g,rec,color,.10);a.nuclease=body(a.g,nuc,color,.07);a.recognition.dataset.bioPart='recognition';a.nuclease.dataset.bioPart='nuclease';
    const contours=el(a.g,'g',{'data-bio-part':'domain-contours'});
    ['M -65 -31 C -51 -40 -39 -34 -31 -23 C -25 -17 -18 -19 -12 -24',
      'M -36 -45 C -23 -45 -24 -33 -17 -31 C -8 -27 0 -31 3 -39',
      'M 10 -37 C 15 -29 26 -27 31 -22',
      'M -61 25 C -49 18 -32 23 -32 35',
      'M -24 29 C -12 25 -8 34 -5 41',
      'M 12 27 C 26 18 42 26 43 39',
      'M 48 19 C 58 19 64 15 67 12'].forEach(d=>path(contours,d,color,1.05,.56));
    path(a.g,'M -68 -6 C -47 -17 -31 -2 -9 -8 C 10 -15 35 -3 66 -3',color,1.1,.7);
    path(a.g,'M -68 7 C -46 16 -30 1 -9 9 C 10 17 29 2 63 6',color,1.1,.7);
    a.anchors={dnaIn:[-82,0],dnaOut:[82,0],guide:[-24,2],fusion:[48,-32],label:[0,74]};
    a.bounds={x:-84,y:-62,width:170,height:124};return finish(a);
  }

  function polymerase(parent,opts) {
    opts=opts||{};const a=base(parent,opts,'polymerase'),color=opts.color||C.gold;
    const upper='M -79 -12 C -85 -26 -75 -38 -62 -38 C -65 -50 -50 -60 -38 -50 C -29 -63 -12 -57 -7 -47 C 4 -54 20 -53 26 -40 C 44 -49 62 -36 60 -22 C 76 -24 84 -13 79 -3 C 66 2 59 -7 47 -7 L 23 -14 C 13 -13 5 -6 -3 -7 C -12 -8 -17 -22 -29 -23 C -41 -23 -45 -7 -56 -7 C -64 -7 -72 -7 -79 -12 Z';
    const lower='M -80 10 C -72 3 -61 5 -53 11 C -43 19 -33 19 -22 10 C -10 1 2 7 9 11 C 26 17 41 10 54 9 C 67 8 81 4 85 16 C 91 31 77 38 63 35 C 66 49 50 59 37 52 C 27 64 10 53 5 43 C -8 48 -21 44 -27 40 C -41 48 -60 41 -59 30 C -71 34 -88 24 -80 10 Z';
    a.clamp=body(a.g,upper,color,.11);a.core=body(a.g,lower,color,.075);a.clamp.dataset.bioPart='clamp';a.core.dataset.bioPart='core';
    body(a.g,'M -63 27 C -78 24 -89 33 -85 44 C -80 52 -67 48 -62 42 C -56 43 -52 34 -63 27 Z',color,.08);
    ['M -60 -31 C -49 -41 -37 -36 -34 -29',
      'M -27 -46 C -16 -37 -4 -40 2 -29 C 6 -23 15 -26 17 -33',
      'M 27 -31 C 42 -33 47 -23 48 -16',
      'M -52 28 C -41 27 -35 34 -29 34',
      'M -19 26 C -9 16 5 21 11 34 C 18 44 27 43 30 46',
      'M 26 25 C 41 20 52 28 52 42',
      'M 60 23 C 68 27 76 22 78 17'].forEach(d=>path(a.g,d,color,1.1,.58));
    // The cleft and RNA exit remain empty so independent nucleic acid actors can pass through.
    path(a.g,'M -48 -8 C -32 -24 -19 -16 -13 -7',color,1.1,.8);
    path(a.g,'M -31 9 C -40 4 -44 5 -50 8',color,1.1,.8);
    a.anchors={dnaIn:[-87,0],dnaOut:[89,0],rnaExit:[-28,15],label:[0,76]};
    a.bounds={x:-90,y:-61,width:182,height:122};return finish(a);
  }

  function spacerGeometry(start,end,bound) {
    const points=[];
    for(let i=0;i<=64;i++){const u=i/64;points.push([start+(end-start)*u,18+3.4*Math.sin(u*Math.PI*8)*(1-clamp(bound))]);}
    return pointsPath(points);
  }
  function paintSpacer(a,start,end,bound) {
    a.spacerStrand.setAttribute('d',spacerGeometry(start,end,bound));
    a.spacerTicks.forEach((tick,i)=>{const u=(i+.5)/a.spacerTicks.length,x=start+(end-start)*u,y=18+3.4*Math.sin(u*Math.PI*8)*(1-clamp(bound));tick.setAttribute('x1',x);tick.setAttribute('x2',x+2);tick.setAttribute('y1',y-1);tick.setAttribute('y2',y-7);});
  }
  function simpleGuide(parent,opts) {
    const a=base(parent,opts,'guide-'+opts.family),scaffoldColor=opts.scaffoldColor||C.teal,spacerColor=opts.spacerColor||C.gold;
    a.family=opts.family;
    a.scaffold=el(a.g,'g',{'data-bio-part':'direct-repeat-handle'});
    const handle=opts.family==='cas12a'
      ? 'M -100 18 C -88 25 -81 11 -71 15 L -61 15 L -61 -13 C -63 -29 -47 -37 -37 -28 C -26 -18 -38 -7 -43 -8 L -43 15 C -40 27 -31 17 -20 18'
      : 'M -100 18 C -90 10 -82 23 -74 18 L -65 18 L -65 -15 C -70 -34 -48 -46 -35 -32 C -23 -20 -36 -8 -45 -10 L -45 16 C -45 26 -31 18 -20 18';
    path(a.scaffold,handle,scaffoldColor,2.05);
    [-5,2,9].forEach(y=>line(a.scaffold,opts.family==='cas12a'?-61:-65,y,opts.family==='cas12a'?-43:-45,y,scaffoldColor,.45,1));
    a.spacer=el(a.g,'g',{'data-bio-part':'spacer'});
    a.spacerStrand=path(a.spacer,'',spacerColor,2.3);
    a.spacerTicks=Array.from({length:12},()=>line(a.spacer,0,0,0,0,spacerColor,.65,1.1));
    // Family-specific crRNA has a direct repeat handle, no crRNA-tracrRNA fusion loop.
    a.join=el(a.g,'g',{'data-bio-part':'engineered-join',opacity:0});
    a.pairing=el(a.g,'g',{'data-bio-part':'dual-rna-pairing',opacity:0});
    const state={bound:clamp(opts.bound),joined:0};
    a.set=function(patch){patch=patch||{};if(patch.bound!=null)state.bound=clamp(patch.bound);paintSpacer(a,-20,100,state.bound);return a;};
    a.state=state;a.anchors={spacer:[40,18],spacerStart:[-20,18],spacerEnd:[100,18],scaffold:[-54,-12],attach:[-20,18]};a.bounds={x:-103,y:-47,width:207,height:84};a.set();return finish(a);
  }
  function guide(parent,opts) {
    opts=opts||{};if(opts.family!=null&&!['cas9','cas12a','cas13'].includes(opts.family))throw new RangeError('Unknown guide family');if(opts.family==='cas12a'||opts.family==='cas13')return simpleGuide(parent,opts);
    const a=base(parent,opts,'guide'), dual=!!opts.dual;
    const spacerColor=opts.spacerColor||C.gold,scaffoldColor=opts.scaffoldColor||C.teal;
    a.spacer=el(a.g,'g',{'data-bio-part':'spacer'});
    a.spacerStrand=path(a.spacer,'',spacerColor,2.3);
    // Short perpendicular ticks suggest an exposed sequence without inventing nucleotide identities.
    a.spacerTicks=Array.from({length:10},()=>line(a.spacer,0,0,0,0,spacerColor,.65,1.1));
    a.scaffold=el(a.g,'g',{'data-bio-part':'scaffold'});
    a.repeat=el(a.g,'g',{'data-bio-part':'crrna-repeat'});
    path(a.repeat,'M -19 18 L -8 18 L -8 -10 C -8 -19 -15 -20 -15 -30',spacerColor,2.05);
    const stem='M 8 -32 C 9 -23 1 -19 1 -10 L 1 18 C 3 29 19 29 23 18 L 23 4 C 23 -7 35 -8 36 3 L 36 25 C 36 34 49 35 51 25 L 51 -7 C 51 -16 43 -18 43 -28 C 43 -41 62 -43 65 -30 C 67 -20 59 -16 59 -7 L 59 23 C 59 37 76 36 79 24 L 79 5 C 79 -7 72 -8 72 -18 C 72 -29 91 -32 93 -19 C 95 -9 86 -5 87 5 L 87 25 C 87 34 96 33 100 29';
    path(a.scaffold,stem,scaffoldColor,2.05);
    [[-8,1,-6],[-8,1,1],[-8,1,8],[51,59,-5],[51,59,3],[51,59,11],[79,87,7],[79,87,15]].forEach(p=>line(a.scaffold,p[0],p[2],p[1],p[2],scaffoldColor,.45,1));
    a.join=el(a.g,'g',{'data-bio-part':'engineered-join'});
    // This highlighted return loop is a schematic sgRNA fusion, not a mapped linker sequence.
    path(a.join,'M -15 -30 C -16 -44 5 -48 8 -32',C.purple,2.8);
    a.pairing=el(a.g,'g',{'data-bio-part':'dual-rna-pairing'});
    for(let i=0;i<4;i++)line(a.pairing,-12,2+i*6,-4,2+i*6,scaffoldColor,.65,1.1);
    const state={joined:dual?0:1,bound:clamp(opts.bound)};
    a.set=function(patch){patch=patch||{};if(patch.joined!=null)state.joined=clamp(patch.joined);if(patch.bound!=null)state.bound=clamp(patch.bound);paintSpacer(a,-100,-19,state.bound);a.join.setAttribute('opacity',state.joined);a.pairing.setAttribute('opacity',dual?1-state.joined:0);return a;};
    a.state=state;a.dual=dual;a.anchors={spacer:[-60,18],spacerStart:[-100,18],spacerEnd:[-19,18],scaffold:[50,-9],join:[-4,-38],attach:[-22,18]};a.bounds={x:-102,y:-47,width:205,height:90};a.set();return finish(a);
  }

  function nucleosome(parent,opts) {
    opts=opts||{};const a=base(parent,opts,'nucleosome'),color=opts.color||C.purple;
    const back=el(a.g,'g',{'data-bio-part':'wrapped-dna-back'});
    const front=el(a.g,'g',{'data-bio-part':'wrapped-dna-front'});
    const core=el(a.g,'g',{'data-bio-part':'histone-octamer'});
    a.g.insertBefore(core,front);
    // Eight small lobes form the histone core, avoiding a featureless circular spool.
    const lobes=[[-24,-19,1],[-3,-23,1.02],[20,-18,.96],[29,0,.98],[19,19,1],[-4,23,.97],[-25,16,.97],[-31,-1,.9]];
    lobes.forEach(([x,y,s],i)=>{
      const d='M -16 -6 C -18 -14 -8 -20 -2 -14 C 7 -20 17 -11 13 -4 C 20 3 12 14 4 11 C -3 19 -15 10 -12 4 C -18 4 -21 -2 -16 -6 Z';
      const g=body(core,d,color,i%2?.09:.14);g.setAttribute('transform','translate('+x+' '+y+') scale('+s+')');
      path(g,'M -9 -5 C -3 -11 8 -4 6 4',color,.9,.4);
    });
    const tails=el(a.g,'g',{'data-bio-part':'histone-tails'});
    ['M -25 -28 C -32 -37 -29 -44 -41 -46 C -47 -47 -49 -52 -48 -56',
      'M 23 -23 C 38 -28 37 -42 47 -44 C 54 -44 50 -52 58 -54',
      'M -26 23 C -35 32 -38 31 -44 42 C -47 48 -55 41 -60 49',
      'M 19 26 C 29 32 24 42 34 45'].forEach(d=>path(tails,d,color,1.7,.83));
    // One 1.65-turn double-strand curve, split into front/back pieces for depth ordering.
    let previousFront=null,current=[[],[]];
    const sampleCount=124,start=-Math.PI*.36,end=start+Math.PI*3.3;
    function flush(){if(current[0].length>1){const dest=previousFront?front:back;path(dest,pointsPath(current[0]),C.blue,1.85,previousFront?1:.50);path(dest,pointsPath(current[1]),C.teal,1.85,previousFront?1:.50);}current=[[],[]];}
    for(let i=0;i<=sampleCount;i++){
      const t=start+(end-start)*i/sampleCount,depth=Math.sin(t)>=0;
      const x=Math.cos(t)*61,y=Math.sin(t)*25+(i/sampleCount-.5)*26;
      const p=[[x,y-2.8],[x,y+2.8]];
      if(previousFront!==null&&depth!==previousFront){current[0].push(p[0]);current[1].push(p[1]);flush();}
      previousFront=depth;current[0].push(p[0]);current[1].push(p[1]);
      if(i%4===0)line(depth?front:back,x,y-2.8,x,y+2.8,C.grey,depth?.58:.28,.9);
    }
    flush();
    // Two illustrative H3 tails carry the optional marks; the other histone tails stay unmarked.
    a.marks=el(a.g,'g',{'data-bio-part':'histone-methylation'});
    [[-43,-48],[51,-46]].forEach(([x,y])=>{
      const m=el(a.marks,'g');
      el(m,'circle',{cx:x,cy:y,r:4.2,fill:BG,stroke:C.red,'stroke-width':1.4});
      el(m,'circle',{cx:x,cy:y,r:1.35,fill:C.red});
    });
    const state={marked:clamp(opts.marked)};
    a.set=function(patch){patch=patch||{};if(patch.marked!=null)state.marked=clamp(patch.marked);a.marks.setAttribute('opacity',state.marked);return a;};
    const dnaStart=[Math.cos(start)*61,Math.sin(start)*25-13],dnaEnd=[Math.cos(end)*61,Math.sin(end)*25+13];
    a.core=core;a.tails=tails;a.state=state;
    a.anchors={left:[-65,0],right:[65,0],dnaStart,dnaEnd,
      strandAStart:[dnaStart[0],dnaStart[1]-2.8],strandAEnd:[dnaEnd[0],dnaEnd[1]-2.8],
      strandBStart:[dnaStart[0],dnaStart[1]+2.8],strandBEnd:[dnaEnd[0],dnaEnd[1]+2.8],mark:[-43,-48],label:[0,72]};
    a.bounds={x:-67,y:-58,width:137,height:116};a.set();return finish(a);
  }

  function protein(parent,opts) {
    opts=opts||{};const kind=opts.kind||'krab',a=base(parent,opts,kind),color=opts.color||C.teal;
    const silhouettes={
      generic:'M -38 -8 C -47 -26 -19 -37 -9 -24 C 9 -36 34 -23 28 -7 C 46 2 34 27 17 24 C 6 39 -17 31 -18 18 C -39 24 -51 4 -38 -8 Z',
      krab:'M -30 -10 C -32 -25 -17 -32 -6 -24 C 4 -34 23 -21 20 -11 C 33 -8 33 9 21 12 C 24 26 8 31 0 23 C -10 31 -28 21 -24 11 C -36 10 -38 -3 -30 -10 Z',
      kap1:'M -67 -9 C -71 -22 -56 -28 -45 -20 C -38 -28 -26 -25 -18 -19 L 25 -19 C 29 -31 46 -31 51 -20 C 64 -22 75 -8 67 3 C 77 16 64 29 51 24 C 44 34 29 28 25 19 L -18 18 C -27 27 -41 25 -46 19 C -58 29 -73 15 -65 5 C -72 2 -74 -3 -67 -9 Z',
      setdb1:'M -45 -13 C -52 -25 -38 -40 -26 -31 C -17 -43 -3 -37 1 -28 C 14 -35 28 -28 29 -17 C 47 -17 54 -1 44 10 C 48 23 33 33 23 28 C 16 43 0 36 -7 28 C -21 37 -34 27 -31 16 C -47 16 -54 -1 -45 -13 Z',
      hp1:'M -49 -9 C -55 -21 -38 -30 -29 -22 C -15 -25 -11 -13 -15 -6 C -5 1 4 -1 13 -6 C 10 -20 24 -29 35 -23 C 47 -24 54 -9 47 1 C 55 14 39 24 30 18 C 18 26 10 14 13 7 C 3 1 -6 3 -15 9 C -13 23 -29 29 -39 20 C -52 22 -58 4 -49 -9 Z',
      nurd:'M -61 -11 C -69 -26 -51 -39 -40 -31 C -31 -46 -9 -41 -7 -28 C 9 -37 26 -31 29 -20 C 44 -29 66 -12 57 2 C 74 14 61 35 44 30 C 37 46 16 42 9 31 C -4 44 -24 35 -28 24 C -44 31 -60 24 -58 11 C -71 10 -73 -4 -61 -11 Z'
    };
    if(!Object.hasOwn(silhouettes,kind))throw new RangeError('Unknown schematic protein kind: '+kind);
    const d=silhouettes[kind];
    a.body=body(a.g,d,color,.10);
    const details={
      generic:['M -25 -8 C -14 -19 0 -9 -1 1 C 1 13 13 15 21 7'],
      krab:['M -20 -9 C -11 -19 0 -11 3 -3 C 9 6 17 1 18 -6','M -16 8 C -9 13 0 13 6 6'],
      kap1:['M -19 -11 L 24 10','M -19 0 L 23 -10','M -19 10 L 24 0','M -55 -10 C -42 -17 -32 -6 -36 7','M 37 -13 C 52 -16 61 -2 53 10'],
      setdb1:['M -29 -17 C -17 -29 -4 -15 -10 -3','M 8 -17 C 22 -22 31 -9 25 1','M -24 13 C -11 5 -2 13 -1 24','M 9 10 C 20 6 30 13 28 20'],
      hp1:['M -41 -9 C -32 -17 -20 -8 -25 4','M 25 -9 C 33 -17 45 -9 39 3'],
      nurd:['M -45 -20 C -32 -31 -19 -18 -25 -8','M -6 -19 C 6 -26 20 -11 11 -2','M 34 -12 C 43 -16 54 -1 46 8','M -40 7 C -31 -3 -16 7 -21 16','M -3 14 C 8 6 20 18 15 26','M 31 14 C 38 9 45 14 43 22']
    };
    (details[kind]||details.krab).forEach(d=>path(a.g,d,color,1.1,.61));
    a.body.dataset.bioPart="body";a.anchors={attach:[0,0],label:[0,58]};a.bounds={x:-78,y:-48,width:156,height:100};return finish(a);
  }

  function transcript(parent,opts) {
    opts=opts||{};const a=base(parent,opts,'transcript'),color=opts.color||C.teal;
    a.strand=path(a.g,'M 0 0 C -10 8 -10 24 -22 24 C -38 23 -22 42 -37 44 C -51 44 -45 64 -59 62 C -69 60 -68 75 -80 78',color,2.25);
    [[-6,10],[-17,24],[-30,34],[-39,47],[-51,60],[-69,72]].forEach(([x,y],i)=>line(a.g,x,y,x-5,y-4,color,.67,1.05));
    a.strand.dataset.bioPart="strand";a.anchors={start:[0,0],end:[-80,78]};a.bounds={x:-86,y:-4,width:90,height:88};return finish(a);
  }
  global.B={dna,cas9,polymerase,nucleosome,guide,protein,transcript,place,emphasis};
  Object.defineProperty(global.B,'_drawing',{value:Object.freeze({el,group,path,body,line,base,finish})});
  if(global.K)global.K.molecular=global.B;
})(window);
