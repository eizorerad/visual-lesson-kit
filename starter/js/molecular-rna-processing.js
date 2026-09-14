/* RNA targeting and processing actors. Load after molecular.js.
 * New explanatory geometry informed by PDB 5B43, 5XWP and 5MQF.
 * These drawings contain no sequences, atomic coordinates or kinetic model.
 */
(function(global){
 'use strict';
 const B=global.B,C=global.C;
 if(!B||!B._drawing)throw new Error('molecular-rna-processing.js requires molecular.js');
 const {el,path,body,line,base,finish}=B._drawing;
 const part=(p,n)=>el(p,'g',{'data-bio-part':n});
 function finite(v,f,n,min=0,max=1){
  if(v===undefined)return f;
  if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(n+' must be a finite number');
  if(v<min||v>max)throw new RangeError(n+' must be between '+min+' and '+max);
  return v;
 }
 function update(state,patch,rules){
  if(patch===undefined)return;
  if(patch===null||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('Molecular state patch must be an object');
  const next={...state};
  for(const k of Object.keys(patch)){
   if(!Object.prototype.hasOwnProperty.call(rules,k))throw new TypeError('Unknown molecular state: '+k);
   next[k]=rules[k](patch[k],state[k],k);
  }
  Object.assign(state,next);
 }
 const pts=p=>p.map((p,i)=>(i?'L':'M')+p[0].toFixed(3)+' '+p[1].toFixed(3)).join(' ');
 const mix=(a,b,t)=>a+(b-a)*t;

 // AsCas12a-inspired compact triangular bilobed arrangement. Target and guide
 // remain independent actors. Opening is an exploded view, not activation.
 B.cas12a=function(parent,opts){
  opts=opts||{};const state={opening:finite(opts.opening,0,'opening')};
  const a=base(parent,opts,'cas12a'),col=opts.color||C.blue;
  a.recognition=part(a.g,'recognition');
  body(a.recognition,'M -90 -8 C -99 -21 -79 -41 -65 -39 C -65 -58 -42 -75 -25 -59 C -6 -80 21 -57 22 -41 C 41 -53 67 -32 71 -14 C 54 -4 35 -7 18 -6 C 1 -14 -11 -1 -28 -6 C -52 -14 -69 5 -90 -8 Z',col,.075);
  ['M -75 -26 C -60 -42 -41 -30 -41 -18','M -44 -48 C -25 -58 -16 -42 -16 -28','M 0 -49 C 14 -51 26 -29 18 -20','M 34 -27 C 44 -39 61 -22 58 -16'].forEach(d=>path(a.recognition,d,col,1,.38));
  a.nuclease=part(a.g,'nuclease');
  body(a.nuclease,'M -89 12 C -67 6 -56 16 -40 10 C -17 5 -9 17 11 11 C 29 6 43 15 55 7 C 75 -7 102 15 91 32 C 106 52 81 71 65 61 C 51 86 27 69 25 56 C 7 72 -13 57 -16 47 C -37 63 -50 46 -48 34 C -70 45 -99 31 -89 12 Z',col,.075);
  a.ruvc=part(a.nuclease,'ruvc');
  body(a.ruvc,'M 21 31 C 25 19 45 19 50 29 C 67 23 77 42 63 51 C 55 65 35 55 32 46 C 21 48 14 39 21 31 Z',col,.04);
  ['M -68 23 C -49 17 -39 27 -38 35','M -25 26 C -9 14 9 35 0 41','M 33 34 C 43 25 57 37 54 43','M 67 20 C 78 13 89 29 82 34'].forEach(d=>path(a.nuclease,d,col,1,.38));
  a.state=state;
  a.set=function(patch){
   update(state,patch,{opening:finite});const d=18*state.opening;
   a.recognition.setAttribute('transform','translate(0 '+(-d)+')');a.nuclease.setAttribute('transform','translate(0 '+d+')');
   a.anchors={dnaIn:[-103,0],dnaOut:[105,0],guide:[-36,-8-d],recognition:[-21,-38-d],ruvc:[45,38+d],fusion:[64,53+d],label:[0,95+d]};
   a.bounds={x:-104,y:-82-d,width:217,height:169+2*d};return a;
  };
  a.set();return finish(a);
 };

 // LbuCas13a-inspired elongated architecture with two HEPN regions.
 // The central exposed channel accommodates guide–target RNA, not DNA.
 B.cas13=function(parent,opts){
  opts=opts||{};const state={opening:finite(opts.opening,0,'opening')};
  const a=base(parent,opts,'cas13'),col=opts.color||C.purple;
  a.recognition=part(a.g,'recognition');
  body(a.recognition,'M -119 -5 C -133 -14 -126 -31 -109 -33 C -121 -51 -103 -74 -82 -62 C -69 -81 -49 -62 -51 -47 C -33 -55 -17 -37 -27 -24 C -39 -10 -58 -17 -71 -10 C -87 -16 -105 4 -119 -5 Z',col,.075);
  ['M -111 -25 C -101 -39 -89 -27 -84 -18','M -95 -49 C -80 -61 -65 -47 -67 -35','M -57 -36 C -45 -42 -34 -30 -38 -24'].forEach(d=>path(a.recognition,d,col,1,.38));
  a.nuclease=part(a.g,'nuclease');a.hepn1=part(a.nuclease,'hepn-1');a.hepn2=part(a.nuclease,'hepn-2');
  body(a.hepn1,'M -19 -18 C -32 -37 -12 -60 5 -48 C 20 -69 42 -58 44 -39 C 59 -55 83 -37 77 -22 C 98 -26 124 -12 115 1 C 99 7 81 -3 65 -4 C 46 -9 26 1 11 -6 C -5 -5 -12 -10 -19 -18 Z',col,.075);
  body(a.hepn2,'M -111 14 C -91 3 -75 17 -56 11 C -38 3 -23 20 -5 13 C 16 5 27 17 44 11 C 65 6 78 13 93 7 C 111 2 129 22 115 35 C 126 50 106 66 93 58 C 85 76 63 64 59 53 C 44 68 27 61 22 48 C 5 61 -13 48 -14 37 C -39 51 -53 42 -60 33 C -84 45 -122 33 -111 14 Z',col,.075);
  ['M -5 -32 C 6 -50 26 -35 22 -23','M 37 -27 C 49 -42 67 -23 60 -17','M 83 -12 C 95 -20 108 -12 110 -7'].forEach(d=>path(a.hepn1,d,col,1,.38));
  ['M -91 22 C -72 13 -62 30 -55 30','M -31 24 C -12 17 -3 32 9 30','M 30 32 C 45 20 61 41 58 44','M 75 28 C 87 14 108 30 98 42'].forEach(d=>path(a.hepn2,d,col,1,.38));
  a.state=state;
  a.set=function(patch){
   update(state,patch,{opening:finite});const d=18*state.opening;
   a.recognition.setAttribute('transform','translate('+(-12*state.opening)+' '+(-d)+')');a.hepn1.setAttribute('transform','translate(0 '+(-d)+')');a.hepn2.setAttribute('transform','translate(0 '+d+')');
   a.anchors={rnaIn:[-140,3],rnaOut:[140,3],guide:[-81-12*state.opening,-12-d],recognition:[-79-12*state.opening,-42-d],hepn1:[41,-29-d],hepn2:[45,37+d],label:[0,93+d]};
   a.bounds={x:-139-12*state.opening,y:-83-d,width:278+12*state.opening,height:167+2*d};return a;
  };
  a.set();return finish(a);
 };

 // Single-intron schematic: two chemical endpoint states are separated at .5.
 // The SAME RNA intron path becomes a lariat; the SAME exon paths move together.
 B.preMrna=function(parent,opts){
  opts=opts||{};const widthRule=(v,f,n)=>finite(v,f,n,300,1400);
  const state={width:widthRule(opts.width,600,'width'),spliced:finite(opts.spliced,0,'spliced')};
  const a=base(parent,opts,'pre-mrna');
  a.exon1=part(a.g,'exon-1');a.exon2=part(a.g,'exon-2');a.intron=part(a.g,'intron');a.branchpoint=part(a.g,'branchpoint');a.exonJunction=part(a.g,'exon-junction');
  const box1=el(a.exon1,'rect',{x:0,y:-13,width:0,height:26,rx:8,fill:C.blue,'fill-opacity':.08,stroke:C.blue,'stroke-width':1.25});
  const box2=el(a.exon2,'rect',{x:0,y:-13,width:0,height:26,rx:8,fill:C.teal,'fill-opacity':.08,stroke:C.teal,'stroke-width':1.25});
  const strand1=path(a.exon1,'',C.blue,1.8),strand2=path(a.exon2,'',C.teal,1.8),intronPath=path(a.intron,'',opts.color||C.gold,1.8);
  const tick1=Array.from({length:10},()=>line(a.exon1,0,0,0,-6,C.blue,.38,.8)),tick2=Array.from({length:10},()=>line(a.exon2,0,0,0,-6,C.teal,.38,.8));
  el(a.branchpoint,'circle',{cx:0,cy:0,r:5,fill:'var(--color-bg)',stroke:C.gold,'stroke-width':1.25});
  el(a.branchpoint,'circle',{cx:0,cy:0,r:1.4,fill:C.gold});
  el(a.exonJunction,'circle',{cx:0,cy:0,r:9,fill:'none',stroke:C.purple,'stroke-width':1.4});
  a.state=state;
  a.set=function(patch){
   update(state,patch,{width:widthRule,spliced:finite});
   const w=state.width,p=state.spliced,branch=Math.min(1,p*2),ligated=Math.max(0,p*2-1),gap=.2*w,shift=gap*ligated;
   const l=-w/2+shift,lend=-gap+shift,r=gap-shift,rend=w/2-shift;
   [[box1,l],[box2,r]].forEach(([b,x])=>{b.setAttribute('x',x);b.setAttribute('width',.3*w);});
   strand1.setAttribute('d','M '+l+' 0 H '+lend);strand2.setAttribute('d','M '+r+' 0 H '+rend);
   [tick1,tick2].forEach((ticks,j)=>ticks.forEach((t,i)=>{const x=(j?r:l)+.3*w*(i+.5)/10;t.setAttribute('x1',x);t.setAttribute('x2',x);}));
   const points=[],rx=.075*w,cy=34+82*ligated,bx=.075*w,tailEnd=[mix(gap,.16*w,ligated),110*ligated];
   for(let i=0;i<=64;i++){
    const u=i/64,theta=2*Math.PI*Math.min(i,52)/52;
    let target=i<=52?[rx*Math.cos(theta),cy+30*Math.sin(theta)]:[mix(bx,tailEnd[0],(i-52)/12),mix(cy,tailEnd[1],(i-52)/12)];
    const start=[mix(-gap,gap,u),Math.sin(u*Math.PI*4)*6];
    points.push([mix(start[0],target[0],branch),mix(start[1],target[1],branch)]);
   }
   // Snap shared endpoint coordinates to avoid a numerical hairline gap.
   if(branch===1){points[0]=[bx,cy];points[52]=[bx,cy];}
   if(ligated===0)points[64]=[r,0];
   intronPath.setAttribute('d',pts(points));
   const bp=points[52];a.branchpoint.setAttribute('transform','translate('+bp[0]+' '+bp[1]+')');a.branchpoint.setAttribute('opacity',branch);
   a.exonJunction.setAttribute('opacity',ligated);
   a.anchors={fivePrime:[l,0],threePrime:[rend,0],exon1:[(l+lend)/2,0],exon2:[(r+rend)/2,0],exon1End:[lend,0],exon2Start:[r,0],intronStart:points[0],intronEnd:points[64],branchpoint:bp,intron:[0,cy],junction:[0,0],label:[0,174]};
   a.bounds={x:l-3,y:-16,width:rend-l+6,height:178};return a;
  };
  a.set();return finish(a);
 };

 // Catalytic-core teaching map, not a complete count of spliceosomal subunits.
 // RNA is deliberately drawn as thin continuous paths among separate proteins.
 B.spliceosome=function(parent,opts){
  opts=opts||{};const state={separation:finite(opts.separation,0,'separation')};
  const a=base(parent,opts,'spliceosome'),col=opts.color||C.blue;
  a.scaffold=part(a.g,'protein-scaffold');
  body(a.scaffold,'M -57 -13 C -88 -24 -87 -48 -67 -60 C -62 -81 -37 -83 -29 -64 C -2 -79 26 -49 10 -31 C 21 -15 2 3 -9 -3 C -20 9 -41 -1 -57 -13 Z',col,.075);
  body(a.scaffold,'M -72 16 C -56 4 -39 20 -22 11 C 3 6 7 21 26 13 C 49 2 67 24 56 42 C 71 63 46 81 28 68 C 9 84 -11 69 -10 53 C -35 68 -47 47 -44 35 C -68 42 -91 29 -72 16 Z',col,.075);
  body(a.scaffold,'M 45 -61 C 60 -82 84 -68 82 -49 C 110 -49 112 -25 94 -16 C 101 5 78 21 62 5 C 42 12 30 -8 41 -21 C 25 -36 32 -52 45 -61 Z',col,.075);
  ['M -69 -43 C -54 -57 -37 -42 -33 -30','M -36 -51 C -20 -63 -5 -48 -8 -34','M -55 27 C -36 19 -31 36 -24 40','M -4 29 C 9 19 27 40 22 48','M 58 -44 C 78 -53 87 -30 75 -22'].forEach(d=>path(a.scaffold,d,col,1,.35));
  a.accessory=part(a.g,'accessory-proteins');
  [[-98,-7],[-38,-107],[63,84]].forEach(([x,y],i)=>{
   const g=el(a.accessory,'g',{transform:'translate('+x+' '+y+')'});
   body(g,'M -20 -5 C -28 -23 -8 -35 2 -24 C 16 -34 33 -15 23 -4 C 33 10 13 25 3 14 C -13 25 -32 7 -20 -5 Z',i===1?C.grey:col,.065);
   path(g,'M -14 -10 C -1 -19 15 -3 12 6',col,1,.35);
  });
  a.u2=part(a.g,'u2-snrna');
  path(a.u2,'M -56 -97 L -56 -64 C -91 -58 -80 -34 -57 -42 L -38 -20 L -15 -20 C 0 -41 18 -26 7 -10 L -12 1',C.teal,1.8);
  path(a.u2,'M -48 -97 L -48 -66 M -36 -28 L -15 -28',C.teal,1.5,.8);
  for(let y=-91;y<-68;y+=6)line(a.u2,-56,y,-48,y,C.teal,.4,.8);
  a.u6=part(a.g,'u6-snrna');
  path(a.u6,'M -27 8 L -4 -12 L 17 -12 L 17 -38 C -1 -56 18 -76 34 -58 C 43 -49 35 -41 27 -38 L 27 -4 L 8 14 C 33 28 17 48 -2 35 L -14 24',C.gold,1.8);
  [-33,-27,-21].forEach(y=>line(a.u6,17,y,27,y,C.gold,.4,.8));
  a.u5=part(a.g,'u5-snrna');
  path(a.u5,'M -14 81 L -14 47 C -42 39 -35 12 -14 18 C -3 21 2 26 -4 37 L -4 79 C 17 86 11 103 -1 102 C -12 103 -23 92 -14 81 Z',C.purple,1.8);
  for(let y=50;y<=74;y+=6)line(a.u5,-14,y,-4,y,C.purple,.4,.8);
  a.activeSite=part(a.g,'catalytic-region');el(a.activeSite,'ellipse',{cx:-5,cy:7,rx:18,ry:15,fill:'none',stroke:C.gold,'stroke-width':1.1,'stroke-dasharray':'3 5',opacity:.65});
  a.state=state;
  a.set=function(patch){
   update(state,patch,{separation:finite});const s=state.separation;
   a.scaffold.setAttribute('transform','translate('+(65*s)+' 0)');a.accessory.setAttribute('transform','translate('+(105*s)+' 0)');
   a.u2.setAttribute('transform','translate('+(-46*s)+' '+(-18*s)+')');a.u6.setAttribute('transform','translate('+(-46*s)+' 0)');a.u5.setAttribute('transform','translate('+(-46*s)+' '+(16*s)+')');a.activeSite.setAttribute('opacity',1-s);
   a.anchors={substrateIn:[-124,7],substrateOut:[121,7],activeSite:[-5,7],u2:[-58-46*s,-77-18*s],u6:[23-46*s,-36],u5:[-9-46*s,61+16*s],protein:[57+65*s,-35],label:[0,155]};
   a.bounds={x:-133-46*s,y:-145-18*s,width:257+151*s,height:272+34*s};return a;
  };
  a.set();return finish(a);
 };
})(window);
