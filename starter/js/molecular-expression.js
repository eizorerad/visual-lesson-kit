/* Expression and gene-regulation actors. Load after molecular.js.
 * Original explanatory drawings; no atom coordinates, predicted folds or kinetics.
 * References and explicit simplifications: docs/molecular-expression-references.md.
 */
(function (global) {
  'use strict';
  const B = global.B, C = global.C;
  if (!B || !B._drawing) throw new Error('molecular-expression.js requires molecular.js');
  const {el, path, body, line, base, finish} = B._drawing;
  function part(parent, name) { return el(parent, 'g', {'data-bio-part':name}); }
  function value(v, fallback, name, min, max) {
    if (v === undefined) return fallback;
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(name+' must be a finite number');
    if (v < min || v > max) throw new RangeError(name+' must be between '+min+' and '+max);
    return v;
  }
  function unit(v, fallback, name) { return value(v, fallback, name, 0, 1); }
  function patchState(state, patch, rules) {
    patch = patch || {};
    const next = {...state};
    Object.keys(patch).forEach(k => {
      if (!Object.prototype.hasOwnProperty.call(rules,k)) throw new TypeError('Unknown molecular state: '+k);
      next[k] = rules[k](patch[k], state[k], k);
    });
    Object.assign(state, next);
  }
  function pts(points) { return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(3)+' '+p[1].toFixed(3)).join(' '); }

  // Side-view convention: the larger subunit is above the mRNA channel.
  // Separation is an exploded-view amount, never a predicted assembly trajectory.
  B.ribosome = function (parent, opts) {
    opts=opts||{};
    const state={separation:unit(opts.separation,0,'separation')};
    const a=base(parent,opts,'ribosome'), largeColor=opts.color||C.blue, smallColor=opts.color2||C.teal;
    a.largeSubunit=part(a.g,'large-subunit');
    a.smallSubunit=part(a.g,'small-subunit');
    body(a.largeSubunit,'M -95 -7 C -104 -22 -91 -39 -79 -39 C -80 -53 -63 -66 -48 -59 C -40 -79 -20 -79 -9 -64 C 9 -78 29 -65 29 -51 C 47 -63 69 -49 68 -34 C 88 -37 104 -17 95 -3 C 78 8 58 -2 43 2 C 25 8 13 -7 -3 -4 C -20 2 -34 -8 -48 -2 C -65 4 -84 3 -95 -7 Z',largeColor,.075);
    ['M -77 -29 C -60 -43 -49 -29 -38 -25','M -42 -53 C -27 -66 -12 -48 -16 -34','M -7 -23 C 10 -40 31 -29 33 -16','M 36 -43 C 51 -45 63 -33 58 -22','M 62 -9 C 76 -20 88 -11 89 -8'].forEach(d=>path(a.largeSubunit,d,largeColor,1,.38));
    // A short exit groove, intentionally left free of an embedded peptide actor.
    path(a.largeSubunit,'M -42 -57 C -49 -42 -33 -32 -33 -20',largeColor,1.1,.52);
    body(a.smallSubunit,'M -86 19 C -79 9 -61 13 -46 16 C -31 7 -13 17 -1 14 C 19 7 38 16 52 13 C 68 7 91 18 88 32 C 97 45 80 59 66 54 C 56 72 34 67 29 57 C 12 71 -6 57 -12 52 C -25 63 -46 58 -47 48 C -63 57 -85 44 -80 34 C -90 32 -93 25 -86 19 Z',smallColor,.075);
    ['M -68 28 C -55 19 -43 32 -42 39','M -25 28 C -8 20 7 34 4 45','M 24 32 C 37 20 51 30 49 46','M 61 29 C 72 23 83 31 77 40'].forEach(d=>path(a.smallSubunit,d,smallColor,1,.38));
    a.state=state;
    a.set=function(patch) {
      patchState(state,patch,{separation:unit});
      const up=-45*state.separation,down=35*state.separation;
      a.largeSubunit.setAttribute('transform','translate(0 '+up+')');
      a.smallSubunit.setAttribute('transform','translate(0 '+down+')');
      a.anchors={mrnaIn:[-104,10+down],mrnaOut:[104,10+down],decoding:[0,10+down],peptideExit:[-42,-57+up],large:[0,-38+up],small:[0,39+down],label:[0,87+down]};
      a.bounds={x:-106,y:-81+up,width:212,height:156+down-up};
      return a;
    };
    a.set(); return finish(a);
  };

  // A secondary-structure cloverleaf, deliberately not an L-shaped tertiary model.
  B.trna = function (parent, opts) {
    opts=opts||{};const state={charged:unit(opts.charged,0,'charged')};
    const a=base(parent,opts,'trna'),color=opts.color||C.teal;
    a.acceptorStem=part(a.g,'acceptor-stem');
    path(a.acceptorStem,'M -12 -56 L -12 -22',color,1.55);
    path(a.acceptorStem,'M 12 -22 L 12 -69',color,1.55);
    for(let y=-49;y<=-27;y+=5.5)line(a.acceptorStem,-12,y,12,y,color,.35,.8);
    a.dArm=part(a.g,'d-arm');
    path(a.dArm,'M -12 -22 L -31 -22 C -42 -45 -71 -34 -68 -14 C -66 2 -44 7 -33 -7 L -12 -7',color,1.55);
    [-27,-21,-15].forEach(x=>line(a.dArm,x,-22,x,-7,color,.35,.8));
    a.anticodonArm=part(a.g,'anticodon-arm');
    path(a.anticodonArm,'M -12 -7 L -12 41 C -33 51 -26 74 -7 77 C 12 82 32 62 12 43 L 12 8',color,1.55);
    for(let y=15;y<=37;y+=5.5)line(a.anticodonArm,-12,y,12,y,color,.35,.8);
    a.anticodon=part(a.g,'anticodon');
    [[-10,76],[-1,78],[8,76]].forEach(([x,y])=>line(a.anticodon,x,y,x,y+7,opts.anticodonColor||C.gold,.95,1.5));
    a.variableLoop=part(a.g,'variable-loop');
    path(a.variableLoop,'M 12 8 C 29 27 43 16 28 2 L 12 -7',color,1.55);
    a.tArm=part(a.g,'t-arm');
    path(a.tArm,'M 12 -7 L 34 -7 C 49 11 72 -3 69 -21 C 65 -41 43 -39 33 -22 L 12 -22',color,1.55);
    [18,24,30].forEach(x=>line(a.tArm,x,-22,x,-7,color,.35,.8));
    a.aminoAcid=part(a.g,'amino-acid');
    line(a.aminoAcid,12,-69,12,-77,C.gold,.8,1.15);
    body(a.aminoAcid,'M 12 -92 C 22 -92 23 -79 15 -77 C 7 -74 1 -83 6 -89 C 8 -92 10 -92 12 -92 Z',C.gold,.18);
    a.state=state;a.anchors={fivePrime:[-12,-56],threePrime:[12,-69],aminoAcid:[12,-85],anticodon:[-1,82],dArm:[-51,-16],tArm:[51,-17],label:[0,102]};
    a.bounds={x:-73,y:-95,width:147,height:182};
    a.set=function(patch){patchState(state,patch,{charged:unit});a.aminoAcid.setAttribute('opacity',state.charged);return a;};
    a.set();return finish(a);
  };

  // Conventional capped, polyadenylated eukaryotic mRNA map; widths are graphic units.
  // The optional cap and tail are schematic marks, with no nucleotide-count meaning.
  B.mrna = function(parent,opts) {
    opts=opts||{};
    const widthRule=(v,f,n)=>value(v,f,n,240,1600);
    const state={width:widthRule(opts.width,420,'width'),cap:unit(opts.cap,1,'cap'),polyA:unit(opts.polyA,1,'polyA')};
    const a=base(parent,opts,'mrna'),color=opts.color||C.teal;
    a.utr5=part(a.g,'five-prime-utr');a.cds=part(a.g,'coding-sequence');a.utr3=part(a.g,'three-prime-utr');a.polyA=part(a.g,'poly-a-tail');a.cap=part(a.g,'five-prime-cap');
    const regions=[a.utr5,a.cds,a.utr3,a.polyA],colors=[C.grey,color,C.grey,C.gold];
    const strands=regions.map((g,i)=>path(g,'',colors[i],1.6,i===0||i===2?.72:1));
    const ticks=Array.from({length:12},()=>line(a.cds,0,0,0,0,color,.48,.85));
    const tailTicks=Array.from({length:10},()=>line(a.polyA,0,0,0,0,C.gold,.62,.9));
    body(a.cap,'M -6 -6 L 3 -9 L 10 -3 L 8 6 L -1 9 L -8 2 Z',C.purple,.14);
    line(a.cap,10,0,16,0,C.purple,.8,1.1);
    a.state=state;
    a.set=function(patch) {
      patchState(state,patch,{width:widthRule,cap:unit,polyA:unit});
      const w=state.width,left=-w/2,edges=[0,.17,.65,.80,1];
      // Continuous backbone at region boundaries; waves are illustrative conformation.
      const y=u=>Math.sin(u*Math.PI*10)*4;
      strands.forEach((strand,i)=>{const p=[];for(let j=0;j<=36;j++){const u=edges[i]+(edges[i+1]-edges[i])*j/36;p.push([left+w*u,y(u)]);}strand.setAttribute('d',pts(p));});
      ticks.forEach((t,i)=>{const u=.17+.48*(i+.5)/ticks.length,x=left+w*u; t.setAttribute('x1',x);t.setAttribute('x2',x);t.setAttribute('y1',y(u));t.setAttribute('y2',y(u)-6);});
      tailTicks.forEach((t,i)=>{const u=.80+.20*(i+.5)/tailTicks.length,x=left+w*u;t.setAttribute('x1',x);t.setAttribute('x2',x+2);t.setAttribute('y1',y(u));t.setAttribute('y2',y(u)-5);});
      a.cap.setAttribute('transform','translate('+(left-16)+' 0)');a.cap.setAttribute('opacity',state.cap);a.polyA.setAttribute('opacity',state.polyA);
      a.anchors={fivePrime:[left,0],cap:[left-16,0],utr5:[left+.085*w,0],startCodon:[left+.17*w,y(.17)],cds:[left+.41*w,0],stopCodon:[left+.65*w,y(.65)],utr3:[left+.725*w,0],polyA:[left+.90*w,0],threePrime:[left+w,0],label:[0,30]};
      a.bounds={x:left-27,y:-13,width:w+30,height:28};return a;
    };
    a.set();return finish(a);
  };

  // Generic modular TF symbol; neither a specific protein structure nor an activator claim.
  B.transcriptionFactor=function(parent,opts) {
    opts=opts||{};const state={bound:unit(opts.bound,0,'bound')};
    const a=base(parent,opts,'transcription-factor'),color=opts.color||C.purple;
    a.interactionDomain=part(a.g,'interaction-domain');
    body(a.interactionDomain,'M -18 -25 C -32 -30 -34 -47 -21 -54 C -20 -69 -1 -75 10 -63 C 25 -66 38 -50 29 -39 C 35 -24 17 -14 7 -24 C -1 -15 -12 -19 -18 -25 Z',color,.075);
    path(a.interactionDomain,'M -17 -45 C -5 -56 12 -39 18 -47',color,1,.38);
    a.linker=part(a.g,'linker');
    path(a.linker,'M 0 -23 C -11 -14 12 -10 3 0',color,1.25,.65);
    a.dnaBindingDomain=part(a.g,'dna-binding-domain');
    body(a.dnaBindingDomain,'M -35 7 C -37 -8 -22 -17 -9 -9 C 0 -19 17 -11 17 -1 C 32 -8 43 9 32 22 C 24 31 15 24 10 16 C 1 10 -11 13 -16 22 C -28 31 -41 19 -35 7 Z',color,.075);
    path(a.dnaBindingDomain,'M -25 6 C -13 -3 -3 3 4 8 M 11 3 C 21 -3 27 4 28 9',color,1,.38);
    a.contact=part(a.g,'dna-contact-cue');
    [-16,0,16].forEach(x=>line(a.contact,x,23,x,32,C.gold,.85,1.1));
    a.state=state;a.anchors={dna:[0,32],interaction:[0,-48],linker:[0,-14],label:[0,54]};a.bounds={x:-43,y:-76,width:87,height:113};
    a.set=function(patch){patchState(state,patch,{bound:unit});a.contact.setAttribute('opacity',state.bound);return a;};
    a.set();return finish(a);
  };

  // Annotation map: the enhancer location is illustrative and NOT evidence of a target gene.
  B.regulatoryLocus=function(parent,opts) {
    opts=opts||{};const widthRule=(v,f,n)=>value(v,f,n,300,1800);
    const state={width:widthRule(opts.width,650,'width'),contact:unit(opts.contact,0,'contact')};
    const a=base(parent,opts,'regulatory-locus');
    a.dna=part(a.g,'dna-lane');const upper=path(a.dna,'',C.blue,1.3,.75),lower=path(a.dna,'',C.teal,1.3,.75);
    const rungs=Array.from({length:45},()=>line(a.dna,0,-3,0,3,C.grey,.25,.75));
    a.enhancer=part(a.g,'enhancer');a.promoter=part(a.g,'promoter');a.gene=part(a.g,'gene-body');a.tss=part(a.g,'transcription-start-site');a.contact=part(a.g,'illustrative-contact');
    const enhancerPath=path(a.enhancer,'',C.purple,1.25),promoterPath=path(a.promoter,'',C.gold,1.25),genePath=path(a.gene,'',C.teal,1.25);
    [enhancerPath,promoterPath,genePath].forEach((n,i)=>{n.setAttribute('fill',[C.purple,C.gold,C.teal][i]);n.setAttribute('fill-opacity','.055');});
    const tssPath=path(a.tss,'',C.gold,1.45),contactPath=path(a.contact,'',C.purple,1.6,.85);contactPath.setAttribute('stroke-dasharray','4 6');
    a.state=state;
    a.set=function(patch) {
      patchState(state,patch,{width:widthRule,contact:unit});
      const w=state.width,left=-w/2,x=u=>left+w*u,box=(u,v)=>'M '+x(u)+' -15 H '+x(v)+' V 15 H '+x(u)+' Z';
      upper.setAttribute('d','M '+left+' -3 H '+(left+w));lower.setAttribute('d','M '+left+' 3 H '+(left+w));
      rungs.forEach((r,i)=>{r.setAttribute('x1',x(i/(rungs.length-1)));r.setAttribute('x2',x(i/(rungs.length-1)));});
      enhancerPath.setAttribute('d',box(.07,.20));promoterPath.setAttribute('d',box(.38,.49));genePath.setAttribute('d',box(.51,.94));
      const tx=x(.51);tssPath.setAttribute('d','M '+tx+' -20 V -40 H '+(tx+30)+' M '+(tx+23)+' -46 L '+(tx+30)+' -40 L '+(tx+23)+' -34');
      const ex=x(.135),px=x(.435),h=86;contactPath.setAttribute('d','M '+ex+' -18 C '+ex+' '+(-h)+' '+px+' '+(-h)+' '+px+' -18');a.contact.setAttribute('opacity',state.contact);
      a.anchors={left:[left,0],right:[left+w,0],enhancer:[ex,0],promoter:[px,0],tss:[tx,0],gene:[x(.725),0],geneEnd:[x(.94),0],contact:[(ex+px)/2,-69],label:[0,41]};
      a.bounds={x:left-3,y:-89,width:w+6,height:111};return a;
    };
    a.set();return finish(a);
  };
})(window);
