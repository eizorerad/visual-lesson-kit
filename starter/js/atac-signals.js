/* Persistent, seekable library → paired reads → locus → signal/QC actor.
   Geometry is an explanatory schematic. All counts come from AtacData. */
(function(global){
'use strict';
let serial=0;
function create(svg){
 const D=global.D,L=global.L,F=global.F,C=global.C,data=global.AtacData;
 if(!D||!L||!F||!C||!data)throw new Error('AtacSignals requires D, L, F, C, and AtacData');
 const S=D.dom.s,id='atac-signals-'+(++serial),g=S('g',{'data-atac-actor':'signals'});svg.append(g);
 const labels=[],nodes={},clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t;
 const phase=(v,a,b)=>{const q=clamp((v-a)/(b-a));return q*q*(3-2*q);};
 // Writes skip values the element already has: settled fragments then cost no mutations per frame.
 const opacity=(el,v)=>{const next=String(clamp(v));if(el.style.opacity!==next)el.style.opacity=next;if(el.style.pointerEvents!=='none')el.style.pointerEvents='none';};
 const put=(e,k,v)=>{const next=String(v);if(e.getAttribute(k)!==next)e.setAttribute(k,next);};
 function group(name){const el=S('g',{'data-atac-layer':name});g.append(el);nodes[name]=el;return el;}
 function line(parent,color=C.blue,width=2){const e=S('line',{stroke:color,'stroke-width':width,'stroke-linecap':'round'});parent.append(e);return e;}
 function seg(e,x1,y1,x2,y2,width){put(e,'x1',x1);put(e,'y1',y1);put(e,'x2',x2);put(e,'y2',y2);if(width!==undefined)put(e,'stroke-width',width);}
 function path(parent,color=C.blue,width=2,fill='none'){const e=S('path',{stroke:color,'stroke-width':width,fill,'stroke-linecap':'round','stroke-linejoin':'round'});parent.append(e);return e;}
 function text(parent,x,y,width,height,ru,en,size=21,color=C.white,align='center'){
  D.i18n.pack('en',{strings:{[ru]:en}});const box=L.textBox(parent,{id:id+'.text.'+labels.length,x,y,width,height,text:ru,size,color,padding:0,lineHeight:1.2,align});labels.push(box);return box;
 }
 const X=p=>220+.7*p,fragment=data.fragment(data.highlightId),hist=data.histogram(25),histMax=Math.ceil(Math.max(...hist.map(b=>b.count))/10)*10,histY=490,histX=p=>220+1.68*p;
 const endpointMax=Math.ceil(data.stats.maxEndpointBin/10)*10,coverageMax=Math.ceil(data.stats.maxMeanCoverage/20)*20;
 const back=group('peak-windows'),axis=group('reference'),aggregate=group('aggregate'),pile=group('fragments'),endpoints=group('endpoint-proxies'),histogram=group('length-histogram'),library=group('library'),copies=group('pcr-copies'),focus=group('highlight'),readGroup=group('reads'),labelGroup=group('labels');
 const peakRects=data.peaks.map(p=>{const r=S('rect',{x:X(p.start),y:250,width:(p.end-p.start)*.7,height:250,rx:2,fill:C.gold,'fill-opacity':.09,'data-peak-id':p.id});back.append(r);return r;});
 const peakUnder=data.peaks.map(p=>{const l=line(back,C.gold,3);seg(l,X(p.start),503,X(p.end),503);return l;});
 const axisLine=line(axis,C.grey,1.4);seg(axisLine,220,510,1060,510);
 for(let bp=0;bp<=1200;bp+=200){const tick=line(axis,C.grey,1);seg(tick,X(bp),510,X(bp),518);text(axis,X(bp)-40,522,80,25,String(bp),String(bp),18,C.grey);}
 const referenceLabel=text(axis,310,555,660,26,'Синтетический локус · координаты, п.н.','Synthetic locus · coordinates, bp',18,C.grey);
 const highlightedInterval=line(axis,C.gold,4);seg(highlightedInterval,X(490),510,X(578),510);
 const guides=[line(focus,C.grey,1),line(focus,C.grey,1)];guides.forEach(n=>n.setAttribute('stroke-dasharray','3 5'));
 const focusTop=path(focus,C.gold,2.6),focusBottom=path(focus,C.gold,2.6),bridges=Array.from({length:25},()=>line(focus,C.grey,1));
 const adapters=[line(library,C.gold,5),line(library,C.purple,5)],handles=[line(library,C.teal,3),line(library,C.purple,3)],indices=[line(library,C.gold,5),line(library,C.gold,5)];
 const copyNodes=Array.from({length:3},(_,i)=>{const q=S('g',{'data-copy-of':'F001','data-copy-index':i+1});copies.append(q);return {g:q,top:line(q,C.blue,1.7),bottom:line(q,C.blue,1.7),left:line(q,C.gold,4),right:line(q,C.purple,4)};});
 const readArrows=[F.arrow(readGroup,C.teal,7),F.arrow(readGroup,C.purple,7)];
 const fragmentNodes=data.fragments.map(f=>{const q=S('g',{'data-fragment-id':f.id,'data-start':f.start,'data-end':f.end,'data-in-peak':data.overlapsPeaks(f)});pile.append(q);return {g:q,span:line(q,f.id==='F001'?C.gold:C.blue,1.4),r1:line(q,C.teal,2.5),r2:line(q,C.purple,2.5),fragment:f};});
 const endpointSlots=Array(data.bins.records.length).fill(0),endpointNodes=[];
 data.fragments.forEach(f=>[f.start,f.end].forEach((position,side)=>{const bin=Math.min(data.bins.records.length-1,Math.floor(position/data.bins.width)),slot=endpointSlots[bin]++,el=line(endpoints,f.id==='F001'?C.gold:C.teal,1.35);el.setAttribute('data-fragment-id',f.id);el.setAttribute('data-boundary',position);endpointNodes.push({el,position,f,side,bin,slot});}));
 const endpointBars=data.bins.records.map(b=>{const el=S('rect',{'data-endpoint-count':b.endpointCount,x:X(b.start)+1,width:(b.end-b.start)*.7-2,fill:C.teal,'fill-opacity':.65});aggregate.append(el);return el;});
 const coverageFill=path(aggregate,'none',0,C.blue);coverageFill.setAttribute('fill-opacity','.13');
 const coverageLine=path(aggregate,C.blue,2);
 const endpointGrid=[0,.5,1].map(()=>line(aggregate,C.grey,1)),coverageGrid=[0,.5,1].map(()=>line(aggregate,C.grey,1));
 const endpointNumbers=[0,endpointMax/2,endpointMax].map(n=>text(labelGroup,155,0,53,25,String(n),String(n),17,C.grey,'right'));
 const coverageNumbers=[0,coverageMax/2,coverageMax].map(n=>text(labelGroup,155,0,53,25,String(n),String(n),17,C.grey,'right'));
 const histogramGrid=[0,.5,1].map(()=>line(histogram,C.grey,1));
 const histAxis=line(histogram,C.grey,1.4);seg(histAxis,220,histY,1060,histY);
 const histBars=hist.map(b=>{const el=S('rect',{x:histX(b.start)+2,y:histY,width:(b.end-b.start)*1.68-4,height:0,fill:C.blue,'fill-opacity':.44,'data-fragment-count':b.count});histogram.append(el);return el;});
 const histogramLabels=[];
 [0,100,200,300,400,500].forEach(bp=>{const l=line(histogram,C.grey,1);seg(l,histX(bp),histY,histX(bp),histY+8);histogramLabels.push(text(histogram,histX(bp)-35,510,70,24,String(bp),String(bp),18,C.grey));});
 text(histogram,330,554,620,27,'Длина вставки = конец − начало, п.н.','Insert length = end − start, bp',19,C.grey);
 const histogramCountLabels=[0,Math.ceil(histMax/2),histMax].map((n,i)=>text(histogram,155,477-(i/2)*205,53,26,String(n),String(n),17,C.grey,'right'));
 const libraryName=text(labelGroup,330,264,620,34,'F001 · 88 п.н. геномной ДНК','F001 · 88 bp of genomic DNA',25,C.gold);
 const libraryEnds=text(labelGroup,310,445,660,33,'Адаптерные концы одной молекулы','Adapter ends of one molecule',22,C.grey);
 const handlesLabel=text(labelGroup,270,445,740,48,'Участки для секвенирования + индексы образца','Sequencing handles + sample indices',22,C.white);
 const copiesLabel=text(labelGroup,305,505,670,42,'Копии F001 · тот же исходный фрагмент','Copies of F001 · same original fragment',22,C.grey);
 const copyMarks=[0,1,2].map(i=>text(copies,925+i*12,[266,311,406][i],145,28,'F001','F001',19,C.grey,'left'));
 const read1Label=text(labelGroup,250,273,355,34,'R1 · [490,520) · 30 п.н.','R1 · [490,520) · 30 bp',22,C.teal);
 const read2Label=text(labelGroup,675,425,360,34,'R2 · [548,578) · 30 п.н.','R2 · [548,578) · 30 bp',22,C.purple);
 const alignedLabel=text(labelGroup,390,275,610,53,'Два чтения → одна пара F001','Two reads → one F001 pair',24,C.white);
 const alignedCoords=text(labelGroup,390,342,610,34,'[490,520) →       ← [548,578)','[490,520) →       ← [548,578)',22,C.grey);
 const spanLabel=text(labelGroup,400,230,480,43,'F001 · [490,578) · 88 п.н.','F001 · [490,578) · 88 bp',25,C.gold);
 const gap=fragment.length-2*data.readLength;
 const spanGapLabel=text(labelGroup,510,412,235,60,gap+' п.н. между чтениями\nне прочитаны',gap+' bp between reads\nnot sequenced',18,C.grey);
 const uniqueLabel=text(labelGroup,280,226,720,42,'150 уникальных фрагментов · одна координатная ось','150 unique fragments · one coordinate axis',23,C.white);
 const endpointLabel=text(labelGroup,280,218,720,45,'Две границы на фрагмент → 300 отметок','Two boundaries per fragment → 300 marks',23,C.teal);
 const endpointUnit=text(labelGroup,220,218,820,40,'Границы фрагментов / бин 20 п.н.','Fragment boundaries / 20 bp bin',21,C.teal,'left');
 const coverageUnit=text(labelGroup,220,376,820,29,'Среднее покрытие фрагментами, ×','Mean fragment coverage, ×',21,C.blue,'left');
 const peakLabel=text(labelGroup,220,554,840,30,'Выделенные окна — учебные кандидаты в пики','Highlighted windows are didactic peak candidates',20,C.gold);
 const histLabel=text(labelGroup,280,217,720,43,'Длины тех же 150 уникальных фрагментов','Lengths of the same 150 unique fragments',24,C.white);
 const histUnit=text(labelGroup,220,255,570,30,'Число фрагментов / бин 25 п.н.','Fragments / 25 bp bin',20,C.blue,'left');
 const histCaution=text(labelGroup,680,250,390,35,'Форма распределения — учебный пример','Distribution shape is a teaching example',18,C.grey,'right');
 const fripLabel=text(labelGroup,280,217,720,43,'FRiP · каждый фрагмент считаем один раз','FRiP · count each fragment once',24,C.white);
 const dotLabel=text(labelGroup,280,273,720,37,'Одна точка = один уникальный фрагмент','One dot = one unique fragment',21,C.grey);
 const fripEquation=text(labelGroup,300,471,680,51,data.stats.inPeaks+' / '+data.stats.uniqueFragments+' = '+data.stats.frip.toFixed(2),data.stats.inPeaks+' / '+data.stats.uniqueFragments+' = '+data.stats.frip.toFixed(2),36,C.gold);
 const fripDetail=text(labelGroup,200,534,880,43,data.stats.inPeaks+' пересекают хотя бы одно окно · '+data.stats.outsidePeaks+' вне окон',data.stats.inPeaks+' overlap at least one window · '+data.stats.outsidePeaks+' outside',21,C.grey);
 const fripBracket=line(labelGroup,C.gold,1.8);seg(fripBracket,220,451,1060,451);
 const histSlots=new Map();hist.forEach((b,bi)=>b.ids.forEach((fid,slot)=>histSlots.set(fid,{bin:bi,slot,count:b.count})));
 const metricLabels=[endpointNumbers,coverageNumbers].flat();
 let lastKey=null,disposed=false,last=null;
 function setLabel(api,v){opacity(api.el,v);}
 function paint(s={}){
  if(disposed)return {anchors:{},stats:data.stats,stage:0};
  const stage=Number.isFinite(s.stage)?Math.max(0,Math.min(13,s.stage)):0,visibility=Number.isFinite(s.visibility)?clamp(s.visibility):1;
  const lengthReveal=Number.isFinite(s.lengthReveal)?clamp(s.lengthReveal):1;
  // An unchanged state (typically this actor hidden behind other scenes) repaints nothing.
  const key=stage+'|'+visibility+'|'+lengthReveal;if(key===lastKey&&last)return last;lastKey=key;
  const admitted=data.fragments.map((_,i)=>phase(lengthReveal,.65*i/data.fragments.length,.65*i/data.fragments.length+.35));
  const shownCounts=Array(hist.length).fill(0);
  data.fragments.forEach((f,i)=>shownCounts[histSlots.get(f.id).bin]+=admitted[i]);
  opacity(g,visibility);g.dataset.stage=String(stage);g.dataset.uniqueFragments=String(data.stats.uniqueFragments);
  const seq=phase(stage,2.55,3),map=phase(stage,3,4),zoom=phase(stage,4,5),many=phase(stage,5,6),tick=phase(stage,6.2,7),count=phase(stage,7,8),compare=phase(stage,8,9),peak=phase(stage,9.2,10),toHist=phase(stage,10,11),toFrip=phase(stage,11,12);
  const refVisible=phase(stage,3.15,3.85)*(1-toHist),molecular=(1-many)*(1-map+zoom),adapterOpacity=(1-phase(stage,2.9,3.9))*(1-many);
  const locusY=298+fragment.row*8.4;
  const left=mix(mix(400,X(490),map),400,zoom),right=mix(mix(880,X(578),map),880,zoom);
  const fx1=mix(left,X(490),many),fx2=mix(right,X(578),many),fy=mix(mix(365,454,map*(1-zoom)),locusY,many);
  const separation=9*(1-many),duplexWidth=mix(2.6,2,many);
  focusTop.setAttribute('d',`M ${fx1} ${fy-separation} L ${fx2} ${fy-separation}`);focusTop.setAttribute('stroke-width',duplexWidth);
  focusBottom.setAttribute('d',`M ${fx1} ${fy+separation} L ${fx2} ${fy+separation}`);focusBottom.setAttribute('stroke-width',duplexWidth);
  opacity(focusTop,(1-count)*Math.max(molecular,many));opacity(focusBottom,(1-count)*(1-many)*molecular);
  bridges.forEach((b,i)=>{const x=mix(fx1+6,fx2-6,i/(bridges.length-1));seg(b,x,fy-separation+2,x,fy+separation-2);opacity(b,(1-map+zoom)*(1-many)*.5);});
  guides.forEach((n,i)=>{seg(n,i?fx2:fx1,fy+19,i?X(578):X(490),502);opacity(n,zoom*(1-many)*.4);});
  const fullAdapters=phase(stage,0,1);
  seg(adapters[0],400-22,365,400,365);seg(adapters[1],880,365,880+22,365);
  seg(handles[0],mix(378,330,fullAdapters),365,378,365);seg(handles[1],902,365,mix(902,950,fullAdapters),365);
  seg(indices[0],mix(378,347,fullAdapters),365,mix(378,362,fullAdapters),365);seg(indices[1],mix(902,918,fullAdapters),365,mix(902,933,fullAdapters),365);
  opacity(library,adapterOpacity);handles.forEach(n=>opacity(n,fullAdapters));indices.forEach(n=>opacity(n,fullAdapters));
  const pcr=phase(stage,1,2)*(1-phase(stage,2.3,3));opacity(copies,pcr);
  copyNodes.forEach((c,i)=>{const y=mix(365,[280,325,420][i],pcr),x1=mix(400,405+i*12,pcr),x2=mix(880,885+i*12,pcr);seg(c.top,x1,y-5,x2,y-5);seg(c.bottom,x1,y+5,x2,y+5);seg(c.left,x1-22,y,x1,y);seg(c.right,x2,y,x2+22,y);opacity(c.g,.65);});
  const arc=Math.sin(Math.PI*map)*-68,readLeft=mix(400,X(490),map),readRight=mix(880,X(578),map),readWidth=mix(480*30/88,21,map);
  let r1={a:mix(readLeft,400,zoom),b:mix(readLeft+readWidth,400+480*30/88,zoom),y:mix(mix(333,424,map)+arc,333,zoom)};
  let r2={a:mix(readRight,880,zoom),b:mix(readRight-readWidth,880-480*30/88,zoom),y:mix(mix(397,465,map)+arc,397,zoom)};
  r1={a:mix(r1.a,X(490),many),b:mix(r1.b,X(520),many),y:mix(r1.y,locusY,many)};r2={a:mix(r2.a,X(578),many),b:mix(r2.b,X(548),many),y:mix(r2.y,locusY,many)};
  readArrows[0].set(r1.a,r1.y,r1.b,r1.y);readArrows[1].set(r2.a,r2.y,r2.b,r2.y);readArrows.forEach(a=>{opacity(a.g,seq*(1-phase(stage,5.6,6)));a.shaft.setAttribute('stroke-width',mix(7,3,map*(1-zoom)));});
  opacity(axis,refVisible);setLabel(referenceLabel,1-peak);opacity(highlightedInterval,(1-many)*refVisible);opacity(back,peak*(1-toHist));
  const base=mix(490,360,compare),height=mix(180,99,compare),endpointVisible=count*(1-toHist);
  endpointBars.forEach((bar,i)=>{const h=data.bins.endpoints[i]/endpointMax*height;bar.setAttribute('y',base-h);bar.setAttribute('height',h);opacity(bar,endpointVisible);});
  endpointGrid.forEach((n,i)=>{const y=base-(i/2)*height;seg(n,220,y,1060,y);opacity(n,endpointVisible*.18);endpointNumbers[i].setBox({x:155,y:y-13,width:53,height:26});setLabel(endpointNumbers[i],endpointVisible);});
  const cy=490,ch=85,cp=data.bins.records.map(b=>({x:X(b.start),right:X(b.end),y:cy-b.meanCoverage/coverageMax*ch}));
  const top='M '+cp.map((p,i)=>(i?'L ':'')+p.x+' '+p.y+' L '+p.right+' '+p.y).join(' ');
  coverageLine.setAttribute('d',top);coverageFill.setAttribute('d',top+` L 1060 ${cy} L 220 ${cy} Z`);opacity(coverageLine,compare*(1-toHist));opacity(coverageFill,compare*(1-toHist));
  coverageGrid.forEach((n,i)=>{const y=cy-(i/2)*ch;seg(n,220,y,1060,y);opacity(n,compare*(1-toHist)*.18);coverageNumbers[i].setBox({x:155,y:y-13,width:53,height:26});setLabel(coverageNumbers[i],compare*(1-toHist));});
  endpointNodes.forEach(e=>{const x=X(e.position),y=298+e.f.row*8.4,tx=X(data.bins.records[e.bin].start+10),ty=base-(e.slot+.5)/endpointMax*height,c=count;seg(e.el,mix(x,tx-5.6,c),mix(y-5,ty,c),mix(x,tx+5.6,c),mix(y+5,ty,c),mix(1.35,Math.max(1,height/endpointMax-.7),c));opacity(e.el,tick*(1-toHist)*mix(.85,.64,c));});
  fragmentNodes.forEach((a,index)=>{
   const f=a.fragment,y=298+f.row*8.4,entry=phase(stage,5.1+(index/data.fragments.length)*.28,5.7+(index/data.fragments.length)*.28),slot=histSlots.get(f.id),hx=histX(hist[slot.bin].start+12.5),hy=histY-(slot.slot+.5)/histMax*205;
   const dx=220+(index%30)*28.8,dy=329+Math.floor(index/30)*24;
   const fill=admitted[index],histStart=mix(histX(f.length),hx-14,fill),histEnd=mix(histX(f.length),hx+14,fill),histHeight=mix(histY-3,hy,fill);
   const x1=mix(mix(X(f.start),histStart,toHist),dx,toFrip),x2=mix(mix(X(f.end),histEnd,toHist),dx+.01,toFrip),yy=mix(mix(y,histHeight,toHist),dy,toFrip);
   seg(a.span,x1,yy,x2,yy,mix(mix(f.id==='F001'?2.5:1.5,2.6,toHist),7,toFrip));
   a.span.setAttribute('stroke',f.id==='F001'?C.gold:`color-mix(in srgb, ${C.blue} ${100*(1-toFrip)}%, ${data.overlapsPeaks(f)?C.teal:C.grey})`);
   opacity(a.span,entry*Math.max(1-count,toHist)*mix(1,fill,toHist*(1-toFrip)));
   seg(a.r1,X(f.start),y,X(f.start+30),y);seg(a.r2,X(f.end-30),y,X(f.end),y);opacity(a.r1,entry*(1-count)*(1-toHist)*.6);opacity(a.r2,entry*(1-count)*(1-toHist)*.6);
  });
  opacity(histogram,toHist*(1-toFrip));
  histBars.forEach((b,i)=>{const h=shownCounts[i]/histMax*205;b.setAttribute('y',histY-h);b.setAttribute('height',h);});
  histogramGrid.forEach((n,i)=>{const y=histY-(i/2)*205;seg(n,220,y,1060,y);opacity(n,.18);});
  setLabel(libraryName,(1-seq)*(1-phase(stage,1,1.35)));setLabel(libraryEnds,(1-fullAdapters)*(1-seq));setLabel(handlesLabel,fullAdapters*(1-phase(stage,1.2,1.8)));
  setLabel(copiesLabel,pcr);setLabel(read1Label,seq*(1-map+zoom)*(1-many));setLabel(read2Label,seq*(1-map+zoom)*(1-many));
  setLabel(alignedLabel,map*(1-zoom));setLabel(alignedCoords,map*(1-zoom));setLabel(spanLabel,zoom*(1-many));setLabel(spanGapLabel,zoom*(1-many));
  setLabel(uniqueLabel,many*(1-tick));setLabel(endpointLabel,tick*(1-count));setLabel(endpointUnit,endpointVisible);setLabel(coverageUnit,compare*(1-toHist));setLabel(peakLabel,peak*(1-toHist));
  setLabel(histLabel,toHist*(1-toFrip));setLabel(histUnit,toHist*(1-toFrip));setLabel(histCaution,toHist*(1-toFrip));
  setLabel(fripLabel,toFrip);setLabel(dotLabel,toFrip);setLabel(fripEquation,toFrip);setLabel(fripDetail,toFrip);opacity(fripBracket,toFrip*.65);
  last={anchors:{fragment:{start:{x:fx1,y:fy},end:{x:fx2,y:fy},id:'F001'},reference:{start:{x:220,y:510},end:{x:1060,y:510}},read1:{start:{x:r1.a,y:r1.y},end:{x:r1.b,y:r1.y}},read2:{start:{x:r2.a,y:r2.y},end:{x:r2.b,y:r2.y}}},stats:data.stats,stage};return last;
 }
 function dispose(){if(disposed)return;disposed=true;labels.forEach(b=>b.dispose());g.remove();}
 Object.assign(nodes,{fragmentNodes,endpointNodes,endpointBars,histBars,readArrows,labels,highlight:focus,axis,fripEquation});
 paint({visibility:0,stage:0});return {g,paint,dispose,nodes,get state(){return last;}};
}
global.AtacSignals={create};
})(window);
