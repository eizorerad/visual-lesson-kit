/* Paired-end reading: one F001 insert, two sequential synthesis rounds.
   Author-created 3D schematic, not atomic coordinates or an instrument movie.
   Each read is synthesized 5′→3′ on a template traversed 3′→5′. */
(function(global){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp(x);return x*x*(3-2*x);},phase=(x,a,b)=>ease((x-a)/(b-a));
let serial=0;
function create(svg){
 const {D,L,F,C,AtacData:data}=global,S=D.dom.s,id='atac-read-'+(++serial),labels=[],nodes=[];
 const insert=data.fragment(data.highlightId),bp=insert.length,readLength=data.readLength,readFraction=readLength/bp;
 function el(tag,attrs,parent){const n=S(tag,attrs||{});if(parent)parent.append(n);nodes.push(n);return n;}
 function attrs(n,a){Object.entries(a).forEach(([k,v])=>n.setAttribute(k,typeof v==='number'?String(+v.toFixed(5)):String(v)));}
 const opacity=(n,a)=>{n.style.opacity=String(clamp(a));n.style.pointerEvents='none';};
 const g=el('g',{'data-atac-actor':'read-views','data-representation':'author-schematic','data-insert-id':insert.id},svg);
 const defs=el('defs',{},g),clip=el('clipPath',{id:id+'-clip'},defs);
 el('rect',{x:75,y:278,width:1130,height:230,rx:16},clip);
 const background=el('g',{},g),view=el('g',{'clip-path':'url(#'+id+'-clip)'},g),depth=el('g',{},view),foreground=el('g',{},view),words=el('g',{},g),locator=el('g',{'data-read-part':'whole-insert-locator'},g);
 function text(parent,x,y,w,h,ru,en,size=20,color=C.white,align='center'){
  D.i18n.pack('en',{strings:{[ru]:en}});const box=L.textBox(parent,{id:id+'.text.'+labels.length,x,y,width:w,height:h,text:ru,size,color,padding:0,lineHeight:1.16,align});labels.push(box);return box;
 }
 function line(parent,color,width,extra={}){return el('line',{stroke:color,'stroke-width':width,'stroke-linecap':'round',...extra},parent);}
 function seg(node,a,b){attrs(node,{x1:a[0],y1:a[1],x2:b[0],y2:b[1]});}
 const itemPool=[],dna=[[],[]],products=[[],[]],rungs=[],N=176;
 function tube(kind,index,strand,color,width){
  const q=el('g',{'data-read-part':kind,'data-read-id':kind==='synthesized-strand'?(strand?'R2':'R1'):'template','data-segment':index,'data-strand':strand},depth);
  const shadow=el('path',{fill:'none',stroke:'var(--color-bg)','stroke-width':width,'stroke-linecap':'round'},q),body=el('path',{fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round'},q);
  const item={q,shadow,body,index,strand,depth:0};itemPool.push(item);return item;
 }
 for(let s=0;s<2;s++)for(let i=0;i<N;i++)dna[s].push(tube('template-strand',i,s,C.blue,3.8));
 for(let r=0;r<2;r++)for(let i=0;i<60;i++)products[r].push(tube('synthesized-strand',i,r,r?C.purple:C.teal,5));
 for(let i=0;i<88;i++){const node=line(depth,C.grey,1.15),item={q:node,index:i,depth:0};rungs.push(item);itemPool.push(item);}
 const newRungs=[0,1].map(r=>Array.from({length:30},(_,i)=>{const node=line(depth,r?C.purple:C.teal,1.15),item={q:node,index:i,read:r,depth:0};itemPool.push(item);return item;}));
 const adapters=[line(foreground,C.gold,7),line(foreground,C.purple,7)];
 const primer=[line(foreground,C.grey,5),line(foreground,C.grey,5)];
 const tip=[0,1].map(r=>{const q=el('g',{'data-read-id':r?'R2':'R1','data-read-part':'growing-3-prime-tip'},foreground);return {q,halo:el('circle',{r:16,fill:r?C.purple:C.teal,'fill-opacity':.12},q),ring:el('circle',{r:10,fill:'var(--color-bg)',stroke:r?C.purple:C.teal,'stroke-width':1.5},q),center:el('circle',{r:4,fill:r?C.purple:C.teal},q)};});
 const readArrows=[F.arrow(foreground,C.teal,7),F.arrow(foreground,C.purple,7)];
 readArrows.forEach((a,r)=>{a.g.dataset.readId=r?'R2':'R1';a.g.dataset.readPart='summary-read';});
 const contextEdge=[line(background,C.blue,1),line(background,C.blue,1)];contextEdge.forEach(e=>e.setAttribute('stroke-dasharray','3 7'));
 const titles=[
 text(words,185,207,670,48,'Одна вставка · две противоположные цепи','One insert · two opposite strands',25,C.white),
 text(words,165,207,695,48,'Раунд 1 · растёт чтение R1','Round 1 · R1 is synthesized',25,C.teal),
 text(words,165,207,695,48,'Раунд 2 · другой конец той же вставки','Round 2 · the other end of the same insert',24,C.purple)
 ];
 const transition=text(words,245,529,790,44,'Между R1 и R2 матрица подготавливается заново','The template is prepared anew between R1 and R2',20,C.grey);
 const principle=text(words,200,533,880,37,'Новая цепь растёт 5′ → 3′ · матрица читается 3′ → 5′','New strand grows 5′ → 3′ · template is read 3′ → 5′',21,C.white);
 const orientation=text(words,195,529,890,43,'Стрелки обозначают направление каждой цепи','Arrows identify each strand’s direction',21,C.grey);
 const footnote=text(words,215,576,850,28,'Схема синтеза в кластере · F001, учебная вставка 88 п.н.','Synthesis in a cluster, schematic · F001, a toy 88 bp insert',17,C.grey);
 const directionLabels=[
 text(words,125,289,140,30,'5′','5′',23,C.blue),text(words,1005,289,140,30,'3′','3′',23,C.blue),
 text(words,125,454,140,30,'3′','3′',23,C.blue),text(words,1005,454,140,30,'5′','5′',23,C.blue)
 ];
 const templateLabel=text(words,200,472,750,34,'Матрица','Template',20,C.blue);
 const tipLabel=text(words,200,299,200,31,'3′ · рост','3′ · growth',20,C.teal);
 D.i18n.pack('en',{strings:{'3′ · рост R1':'3′ · R1 growth','3′ · рост R2':'3′ · R2 growth','Правый конец':'Right end','Левый конец':'Left end','Вся вставка':'Whole insert','Правый конец · R1 сохранён':'Right end · R1 retained'}});
 const startLabel=text(words,200,299,80,31,'5′','5′',22,C.teal);
 const read1Label=text(words,250,273,355,34,'R1 · [490,520) · 30 п.н.','R1 · [490,520) · 30 bp',22,C.teal);
 const read2Label=text(words,675,425,360,34,'R2 · [548,578) · 30 п.н.','R2 · [548,578) · 30 bp',22,C.purple);
 const gapLabel=text(words,500,483,280,58,'28 п.н. между чтениями\nне прочитаны','28 bp between reads\nnot sequenced',18,C.grey);
 const summaryTitle=text(words,300,213,680,42,'Оба чтения принадлежат F001','Both reads belong to F001',25,C.white);
 const locatorTitle=text(locator,903,208,263,30,'F001 · 88 п.н.','F001 · 88 bp',18,C.gold);
 const locateRails=[line(locator,C.blue,1.8),line(locator,C.blue,1.8)],locateReads=[line(locator,C.teal,4),line(locator,C.purple,4)];
 seg(locateRails[0],[930,253],[1150,253]);seg(locateRails[1],[930,261],[1150,261]);
 const locateWindow=el('rect',{x:922,y:244,width:236,height:25,rx:6,fill:'none',stroke:C.gold,'stroke-width':1.3,'data-read-part':'locator-window'},locator);
 const roundBadge=text(locator,910,277,260,27,'Вся вставка','Whole insert',16,C.grey);
 const dirArrows=[F.arrow(foreground,C.blue,3),F.arrow(foreground,C.blue,3)];
 const connector=line(background,C.gold,1);connector.setAttribute('stroke-dasharray','3 5');
 let lastKey=null,disposed=false,last=null,lastOrder=[];
 function setLabel(b,a){opacity(b.el,a);}
 function applyTube(item,a,b,alpha,width){const d=`M${a[0]},${a[1]}L${b[0]},${b[1]}`;attrs(item.body,{d,'stroke-width':width});attrs(item.shadow,{d,'stroke-width':width});item.depth=(a[2]+b[2])/2;opacity(item.q,alpha*(.77+.23*clamp((item.depth+45)/90)));}
 function paint(input={}){
  if(disposed)throw new Error('AtacReadViews actor is disposed');
  const stage=Math.max(0,Math.min(4,Number.isFinite(input.stage)?input.stage:0)),visibility=clamp(Number.isFinite(input.visibility)?input.visibility:1);
  // An unchanged state (typically this actor hidden behind other scenes) repaints nothing.
  const key=stage+'|'+visibility;if(key===lastKey&&last)return last;lastKey=key;
  opacity(g,visibility);g.dataset.stage=String(stage);
  if(visibility<.001){last={stage,visibility,insertId:insert.id,start:insert.start,end:insert.end,bp,readLength,unreadBp:bp-2*readLength,schematic:true,hidden:true};return last;}
  const separate=phase(stage,0,.27),switchRound=phase(stage,1.06,1.35),flat=phase(stage,2.04,3),map=phase(stage,3,4);
  const r1Progress=phase(stage,.26,.95),r2Progress=phase(stage,1.38,1.95),close=separate*(1-flat);
  const r1Presence=(1-phase(stage,1.03,1.2))*(1-flat),r2Presence=phase(stage,1.34,1.4)*(1-flat);
  const active=stage<1.2?0:1,progress=active?r2Progress:r1Progress;
  const focusBp=mix(16,72,switchRound),scale=mix(640/bp,12,close),centerBp=mix(bp/2,focusBp,close),cx=mix(640,mix(580,700,switchRound),close);
  const mappedLeft=mix(400,563,map),mappedRight=mix(880,624.6,map),mappedY=mix(365,454,map),arc=-Math.sin(Math.PI*map)*68;
  function point(u,strand){
   const theta=u*bp/10.5*Math.PI*2,sign=strand?1:-1;
   const helix=[cx+(u*bp-centerBp)*scale,384+sign*27*Math.cos(theta),sign*31*Math.sin(theta)];
   const chosen=1-switchRound,selection=strand?chosen:1-chosen;
   const ssY=mix(310,411,selection)+11*Math.sin(u*6.2+.4),ssZ=10*Math.sin(u*5.8)*selection+27*(1-selection);
   const q=[helix[0],mix(helix[1],ssY,separate),mix(helix[2],ssZ,separate)];
   const read=strand?0:1,f=read?(1-u)/readFraction:u/readFraction,p=read?r2Progress:r1Progress,presence=read?r2Presence:r1Presence;
   const coil=(f>=0&&f<=1?phase((p-f)*30,0,1):0)*presence;
   q[1]+=coil*(14*Math.cos(theta)-14);q[2]+=coil*16*Math.sin(theta);
   return [mix(q[0],mix(mappedLeft,mappedRight,u),flat),mix(q[1],mappedY+(strand?9:-9),flat),q[2]*(1-flat)];
  }
  function growingPoint(r,f){
   const u=r?1-f*readFraction:f*readFraction,p=point(u,r?0:1);
   const readProgress=r?r2Progress:r1Progress,presence=r?r2Presence:r1Presence,coil=phase((readProgress-f)*30,0,1)*presence,theta=u*bp/10.5*Math.PI*2,targetY=mappedY+(r?32:-32)+arc;
   return [p[0],mix(p[1]-mix(30,28*Math.cos(theta),coil),targetY,flat),mix(p[2]+mix(13,-32*Math.sin(theta),coil),0,flat)];
  }
  dna.forEach((chain,s)=>chain.forEach((it,i)=>{const a=point(i/N,s),b=point((i+1)/N,s),selection=s?1-switchRound:switchRound,alpha=mix(mix(1,.22,separate),1,selection*separate);applyTube(it,a,b,mix(alpha,1,flat),mix(3.8,2.6,flat));}));
  rungs.forEach((it,i)=>{const a=point((i+.5)/88,0),b=point((i+.5)/88,1);seg(it.q,a,b);it.depth=(a[2]+b[2])/2;opacity(it.q,mix(.55*(1-separate),.5,flat));});
  products.forEach((chain,r)=>chain.forEach((it,i)=>{const p=r?r2Progress:r1Progress,from=i/60,to=(i+1)/60,t=Math.min(to,p),a=growingPoint(r,from),b=growingPoint(r,t),presence=r?r2Presence:r1Presence;applyTube(it,a,b,(from<p?presence:0)*(1-phase(flat,.64,.91)),5);it.q.dataset.synthesized=String(from<p);it.q.dataset.sequenceDirection='5to3';}));
  newRungs.forEach((chain,r)=>chain.forEach((it,i)=>{const f=(i+.5)/30,u=r?1-f*readFraction:f*readFraction,a=growingPoint(r,f),b=point(u,r?0:1),p=r?r2Progress:r1Progress,presence=r?r2Presence:r1Presence;seg(it.q,a,b);it.depth=(a[2]+b[2])/2;opacity(it.q,f<=p?presence*.58:0);}));
  const order=itemPool.slice().sort((a,b)=>a.depth-b.depth);if(order.some((it,i)=>it!==lastOrder[i])){order.forEach(it=>depth.append(it.q));lastOrder=order;}
  const flatArrow=phase(flat,.2,.95),readAnchors=[];
  [0,1].forEach(r=>{
   const p=r?r2Progress:r1Progress,a=growingPoint(r,0),b=growingPoint(r,p),full=growingPoint(r,1),presence=r?r2Presence:r1Presence;
   const at=[mix(a[0],r?mappedRight:mappedLeft,flat),mix(a[1],mix(r?397:333,r?465:424,map)+arc,flat)];
   const end=[mix(full[0],r?mix(880-480*30/88,603.6,map):mix(400+480*30/88,584,map),flat),mix(full[1],mix(r?397:333,r?465:424,map)+arc,flat)];
   readArrows[r].set(at[0],at[1],end[0],end[1]);readArrows[r].shaft.setAttribute('stroke-width',mix(7,3,map));opacity(readArrows[r].g,flatArrow);
   attrs(tip[r].q,{transform:`translate(${b[0]},${b[1]})`,'data-x':b[0],'data-y':b[1],'data-progress':p});opacity(tip[r].q,presence*phase(p,0,.045));
   const primerA=[a[0]+(r?28:-28),a[1],a[2]];seg(primer[r],primerA,a);opacity(primer[r],presence);
   readAnchors.push({id:r?'R2':'R1',interval:r?[548,578]:[490,520],referenceStrand:r?'-':'+',sequenceDirection:'5to3',templateDirection:'3to5',progress:p,active:presence>.5&&flat<.05,growthTip:{x:b[0],y:b[1]},start5:{x:a[0],y:a[1]},end3:{x:full[0],y:full[1]},summary:{start:{x:at[0],y:at[1]},end:{x:end[0],y:end[1]}}});
  });
  adapters.forEach((node,r)=>{const p=point(r,0),q=point(r,1),mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],end=[mid[0]+(r?22:-22),mid[1]];seg(node,mid,end);opacity(node,1-close);});
  const overview=1-phase(stage,0,.3),r1Text=phase(stage,.15,.4)*(1-phase(stage,1,1.2)),r2Text=phase(stage,1.35,1.5)*(1-phase(stage,2.1,2.5)),summary=phase(stage,2.55,3),reset=phase(stage,1.01,1.12)*(1-phase(stage,1.29,1.39));
  [overview,r1Text,r2Text].forEach((a,i)=>setLabel(titles[i],a));
  setLabel(orientation,overview);setLabel(principle,Math.max(r1Text,r2Text)*(1-reset));setLabel(transition,reset);setLabel(footnote,1-map);
  setLabel(summaryTitle,summary*(1-map));setLabel(read1Label,summary*(1-map));setLabel(read2Label,summary*(1-map));setLabel(gapLabel,summary*(1-map));
  directionLabels.forEach((b,i)=>setLabel(b,overview));
  const endpoints=[point(0,0),point(1,0),point(0,1),point(1,1)];
  directionLabels.forEach((b,i)=>{const p=endpoints[i];b.setBox({x:p[0]-40,y:i<2?302:443,width:80,height:30});});
  dirArrows[0].set(510,314,770,314);dirArrows[1].set(770,466,510,466);dirArrows.forEach(a=>opacity(a.g,overview));
  setLabel(templateLabel,Math.max(r1Text,r2Text));templateLabel.setBox({x:280,y:462,width:720,height:34});
  const start=growingPoint(active,0),end=growingPoint(active,progress),textAlpha=Math.max(r1Text,r2Text)*phase(progress,0,.04);
  tipLabel.setText(active?'3′ · рост R2':'3′ · рост R1');tipLabel.el.setAttribute('fill',active?C.purple:C.teal);startLabel.el.setAttribute('fill',active?C.purple:C.teal);
  setLabel(tipLabel,textAlpha);tipLabel.setBox({x:Math.max(115,Math.min(965,end[0]-100)),y:end[1]-64,width:200,height:31});
  setLabel(startLabel,textAlpha);startLabel.setBox({x:start[0]+(active?28:-28)-40,y:446,width:80,height:31});
  opacity(locator,1-phase(stage,2.1,2.8));
  const lo=mix(0,mix(0,58/88,switchRound),close),hi=mix(1,mix(30/88,1,switchRound),close),window={x:930+220*lo-8,y:243,width:220*(hi-lo)+16,height:28};attrs(locateWindow,window);
  locateReads.forEach((n,r)=>{const p=r?r2Progress:r1Progress;seg(n,[r?1150:930,r?268:247],[r?1150-220*readFraction*p:930+220*readFraction*p,r?268:247]);opacity(n,phase(p,0,.035));});
  roundBadge.setText(close>.5?(active?'Правый конец · R1 сохранён':'Левый конец'):'Вся вставка');
  seg(connector,[window.x+window.width/2,272],[mix(760,500,switchRound),317]);opacity(connector,close*.22*(1-flat));
  contextEdge.forEach((e,r)=>{seg(e,[r?1189:91,310],[r?1189:91,459]);opacity(e,close*.18);});
  last={stage,visibility,insertId:insert.id,start:insert.start,end:insert.end,bp,readLength,unreadBp:bp-2*readLength,currentRound:flat>.7?'summary':(reset>.1?'turnaround':(stage<.26?'orientation':active+1)),sequencingRoundsSequential:true,schematic:true,source:'Illumina paired-end SBS documentation',reads:readAnchors,locator:{bounds:{x:903,y:208,width:263,height:95},window,visible:1-phase(stage,2.1,2.8)},anchors:{fragment:{start:{x:mappedLeft,y:mappedY},end:{x:mappedRight,y:mappedY},id:insert.id},read1:readAnchors[0].summary,read2:readAnchors[1].summary}};
  return last;
 }
 function dispose(){if(disposed)return;disposed=true;labels.forEach(b=>b.dispose());g.remove();}
 paint({visibility:0});return {g,paint,dispose,nodes,get state(){return last;}};
}
global.AtacReadViews=Object.freeze({create});
})(window);
