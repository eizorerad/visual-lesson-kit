/* Histone chemistry and transcription-initiation actors. Load after molecular.js.
 * Original explanatory drawings; sources and scientific limits: docs/molecular-regulation.md.
 */
(function(global){
'use strict';
const B=global.B,C=global.C;
if(!B||!B._drawing)throw new Error('molecular-regulation.js requires molecular.js');
const {el,path,body,line,base,finish}=B._drawing;
const part=(p,n)=>el(p,'g',{'data-bio-part':n});
function unit(v,f,n){if(v===undefined)return f;if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(n+' must be finite');if(v<0||v>1)throw new RangeError(n+' must be in [0,1]');return v;}
function patch(s,p){if(p===undefined)p={};else if(p===null||typeof p!=='object'||Array.isArray(p))throw new TypeError('Molecular state patch must be an object');const n={...s};Object.keys(p).forEach(k=>{if(!Object.prototype.hasOwnProperty.call(s,k))throw new TypeError('Unknown molecular state: '+k);n[k]=unit(p[k],s[k],k);});Object.assign(s,n);}

B.histoneTail=function(parent,opts){
 opts=opts||{};const state={methylation:unit(opts.methylation,0,'methylation')},a=base(parent,opts,'histone-tail'),color=opts.color||C.purple;
 a.peptide=part(a.g,'h3-peptide');path(a.peptide,'M -160 0 C -130 -5 -109 5 -80 0 C -48 -5 -27 4 0 0 C 23 -4 48 5 80 0',color,1.8);
 a.residues=Array.from({length:13},(_,i)=>el(a.peptide,'circle',{cx:-160+i*20,cy:0,r:i===8?5:2.6,fill:i===8?C.gold:color,'fill-opacity':i===8?.9:.45,'data-residue-position':i+1}));
 a.lysine=part(a.g,'lysine-9-side-chain');
 // C-alpha at (0,0), then C-beta/gamma/delta/epsilon, then the terminal N-epsilon.
 path(a.lysine,'M 0 0 L 14 -21 L -1 -42 L 14 -63 L -1 -84 L 7.8 -96.3',color,1.7);
 a.carbons=[[14,-21],[-1,-42],[14,-63],[-1,-84]].map(([x,y])=>el(a.lysine,'circle',{cx:x,cy:y,r:1.7,fill:color,'data-side-chain-carbon':'true'}));
 a.nitrogen=part(a.g,'epsilon-nitrogen');el(a.nitrogen,'circle',{cx:14,cy:-105,r:15,fill:'var(--color-bg)',stroke:C.gold,'stroke-width':.8,'stroke-opacity':.5});
 a.methylGroups=part(a.g,'three-methyl-groups');
 const ends=[[-25,-135],[50,-135],[56,-88]];
 a.methyl=ends.map(([x,y],i)=>{const g=el(a.methylGroups,'g',{'data-methyl-index':i+1}),dx=x-14,dy=y+105,d=Math.hypot(dx,dy);line(g,14+dx/d*17,-105+dy/d*17,x-dx/d*13,y-dy/d*13,C.red,1,1.6);return g;});
 a.state=state;a.anchors={nTerminus:[-160,0],cDirection:[80,0],k9:[0,0],nitrogen:[14,-105],methyl1:ends[0],methyl2:ends[1],methyl3:ends[2],reader:[14,-154],label:[-40,38]};
 a.bounds={x:-163,y:-155,width:247,height:163};
 a.set=function(p){patch(state,p);a.methylGroups.setAttribute('opacity',state.methylation);return a;};a.set();return finish(a);
};

B.mediator=function(parent,opts){
 opts=opts||{};const a=base(parent,opts,'mediator'),color=opts.color||C.teal;
 a.tail=part(a.g,'mediator-tail');a.middle=part(a.g,'mediator-middle');a.head=part(a.g,'mediator-head');
 body(a.tail,'M -109 -34 C -123 -49 -107 -67 -93 -64 C -92 -80 -68 -81 -57 -66 C -40 -72 -27 -56 -34 -42 C -13 -32 -18 -12 -32 -5 C -44 4 -56 -8 -64 -15 C -76 -9 -83 -21 -91 -22 C -100 -17 -114 -22 -109 -34 Z',color,.07);
 body(a.middle,'M -39 -30 C -29 -43 -9 -40 -2 -25 C 17 -29 32 -12 28 3 C 44 12 42 29 26 33 C 18 48 -1 42 -9 28 C -25 32 -39 17 -34 4 C -51 -6 -52 -20 -39 -30 Z',color,.07);
 body(a.head,'M 22 7 C 41 -3 54 8 57 22 C 74 14 95 26 95 43 C 115 48 107 72 90 75 C 88 95 69 99 57 85 C 40 94 21 77 27 63 C 11 54 4 38 16 29 C 8 22 13 12 22 7 Z',color,.085);
 [[a.tail,'M -99 -45 C -80 -59 -64 -41 -56 -33 M -72 -63 C -60 -53 -45 -53 -41 -44'],[a.middle,'M -30 -22 C -16 -25 -13 -3 0 4 C 11 9 10 24 22 25'],[a.head,'M 30 34 C 47 17 58 46 71 35 M 40 65 C 57 55 68 81 87 68']].forEach(([g,d])=>path(g,d,color,1,.43));
 a.anchors={tail:[-75,-44],middle:[-6,2],head:[62,53],regulator:[-111,-48],polII:[29,70],label:[0,118]};a.bounds={x:-125,y:-84,width:240,height:188};return finish(a);
};

B.initiationComplex=function(parent,opts){
 opts=opts||{};const state={assembly:unit(opts.assembly,0,'assembly')},a=base(parent,opts,'initiation-complex');
 // Components are grouped roles, not an inventory of every chain in a human PIC.
 a.mediator=part(a.g,'mediator');const medMover=el(a.mediator,'g');B.mediator(medMover,{x:19,y:-126,scale:.82,color:C.teal});
 a.polII=part(a.g,'pol-ii');const polMover=el(a.polII,'g');B.polymerase(polMover,{x:40,y:0,scale:.8,color:C.gold});
 a.tbp=part(a.g,'tbp');const tbpMover=el(a.tbp,'g');body(tbpMover,'M -172 -9 C -179 -25 -164 -46 -145 -43 C -127 -45 -111 -27 -117 -10 C -126 -9 -129 -29 -146 -28 C -162 -27 -161 -8 -172 -9 Z',C.purple,.08);
 a.tfiib=part(a.g,'tfiib');const bMover=el(a.tfiib,'g');body(bMover,'M -106 -28 C -118 -42 -104 -57 -91 -51 C -80 -65 -62 -51 -66 -37 C -46 -31 -47 -14 -64 -9 C -74 1 -84 -9 -83 -20 C -94 -14 -111 -16 -106 -28 Z',C.blue,.075);
 a.tfiih=part(a.g,'tfiih');const hMover=el(a.tfiih,'g');body(hMover,'M 122 -3 C 111 -13 117 -31 132 -33 C 131 -51 154 -57 167 -41 C 184 -46 201 -29 190 -16 C 209 -2 197 17 181 14 C 166 30 147 18 145 8 C 132 15 120 10 122 -3 Z',C.red,.08);
 path(tbpMover,'M -170 -25 C -153 -44 -134 -32 -123 -21',C.purple,1,.4);path(bMover,'M -101 -36 C -92 -49 -80 -35 -73 -27',C.blue,1,.4);path(hMover,'M 131 -17 C 143 -33 157 -20 154 -9 M 166 -26 C 180 -30 186 -14 181 -4',C.red,1,.4);
 a.otherFactors=part(a.g,'other-general-factors');const otherMover=el(a.otherFactors,'g');
 body(otherMover,'M -29 26 C -43 17 -50 39 -40 48 C -34 62 -12 58 -8 44 C 4 30 -12 17 -29 26 Z',C.grey,.08);
 body(otherMover,'M 91 -62 C 79 -75 93 -89 103 -80 C 119 -85 134 -68 123 -56 C 116 -40 98 -44 91 -62 Z',C.grey,.08);
 a.contacts=part(a.g,'cooperative-contacts');['M -118 -14 L -108 -22','M -57 -13 L -28 -3','M 98 -2 L 116 -5','M 43 -52 L 48 -80'].forEach(d=>{const p=path(a.contacts,d,C.grey,1.15,.55);p.setAttribute('stroke-dasharray','3 4');});
 a.state=state;
 a.set=function(p){patch(state,p);const t=1-state.assembly;
  medMover.setAttribute('transform','translate('+(-20*t)+' '+(-24*t)+')');polMover.setAttribute('transform','translate(0 '+(25*t)+')');tbpMover.setAttribute('transform','translate('+(-30*t)+' '+(-18*t)+')');bMover.setAttribute('transform','translate('+(-18*t)+' '+(-27*t)+')');hMover.setAttribute('transform','translate('+(27*t)+' '+(-19*t)+')');otherMover.setAttribute('transform','translate(0 '+(18*t)+')');a.contacts.setAttribute('opacity',state.assembly);
  a.anchors={dnaIn:[-224,0],dnaOut:[225,0],promoter:[-147,0],polII:[40,25*t],tbp:[-147-30*t,-27-18*t],tfiib:[-88-18*t,-35-27*t],tfiih:[159+27*t,-16-19*t],mediator:[14-20*t,-126-24*t],rnaExit:[17.6,12+25*t],label:[0,91]};a.bounds={x:-215,y:-222,width:443,height:312};return a;};
 a.set();return finish(a);
};
})(window);
