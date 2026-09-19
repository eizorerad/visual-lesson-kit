/* Original explanatory diagrams. No atomic coordinates or experimental curves. */
(function(g){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x||0)),mix=(a,b,t)=>a+(b-a)*t;
let serial=0;
function create(svg){
 const id=++serial,root=F.group(svg),chemical=F.group(root),extras=F.group(root),groups=[],labels=[];let n=0,disposed=false;
 const box=(p,x,y,w,h,ru,en,size=22,color=C.white,align='center')=>{D.i18n.pack('en',{strings:{[ru]:en||ru}});const label=L.textBox(p,{id:'atac-extra-'+id+'-'+(++n),x,y,width:w,height:h,text:ru,size,color,align,padding:0,lineHeight:1.18});labels.push(label);return label;};
 const path=(p,points,col=C.blue,width=2.5)=>F.path(p,points,col,width);
 const rect=(p,x,y,w,h,col,alpha=.15,rx=6)=>{const e=D.dom.s('rect',{x,y,width:w,height:h,rx,fill:col,'fill-opacity':alpha});p.append(e);return e;};
 const ellipse=(p,x,y,rx,ry,col,alpha=.15)=>{const e=D.dom.s('ellipse',{cx:x,cy:y,rx,ry,fill:col,'fill-opacity':alpha,stroke:col,'stroke-width':1.6});p.append(e);return e;};
 const curve=(p,x,y,w,h,fn,col=C.blue)=>path(p,Array.from({length:101},(_,i)=>[x+w*i/100,y-h*fn(i/100)]),col,2.6);
 const arrow=(p,a,b,color=C.grey)=>{const q=F.arrow(p,color,1.8);q.set(...a,...b);return q;};
 const group=()=>{const q=F.group(extras);groups.push(q);return q;};
 const bell=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2);
 // A 9-base-pair offset between two strand positions; no bases are deleted.
 box(chemical,540,195,474,40,'Одно локальное событие Tn5','One local Tn5 event',22,C.grey);
 const seq='ACGTCAGTGCATGACCTAGCTGAC',comp={A:'T',T:'A',G:'C',C:'G'},x0=353,dx=25,top=313,bottom=408;
 for(let i=0;i<seq.length;i++){
  const x=x0+dx*i;F.line(chemical,x,top+20,x,bottom-20,C.grey,1);
  box(chemical,x-12,top-16,24,32,seq[i],seq[i],22,C.blue);
  box(chemical,x-12,bottom-16,24,32,comp[seq[i]],comp[seq[i]],22,C.teal);
  if(i<seq.length-1){if(i!==8)F.line(chemical,x+9,top,x+dx-9,top,C.blue,2.2);if(i!==17)F.line(chemical,x+9,bottom,x+dx-9,bottom,C.teal,2.2);}
 }
 box(chemical,285,295,52,40,'5′','5′',24,C.blue);box(chemical,943,295,52,40,'3′','3′',24,C.blue);
 box(chemical,285,390,52,40,'3′','3′',24,C.teal);box(chemical,943,390,52,40,'5′','5′',24,C.teal);
 const cut1=x0+8.5*dx,cut2=x0+17.5*dx;
 for(const [x,y] of [[cut1,top],[cut2,bottom]]){F.dot(chemical,x,y,7,C.gold);F.line(chemical,x,y-20,x,y+20,C.gold,2);}
 F.line(chemical,cut1,269,cut2,269,C.gold,1.7);F.line(chemical,cut1,262,cut1,277,C.gold,1.7);F.line(chemical,cut2,262,cut2,277,C.gold,1.7);
 box(chemical,cut1-5,234,cut2-cut1+10,31,'9 п. н.','9 bp',21,C.gold);
 box(chemical,312,472,650,58,'Сдвиг позиций · обе цепи остаются на схеме','Offset positions · both strands remain in the diagram',22,C.grey);
 const tags=F.group(chemical);
 // The transferred adapter 3-prime end joins the genomic target's 5-prime
 // product: downstream/right on the top strand, upstream/left on the bottom.
 const upperTransfer=path(tags,[[cut1+7,top],[cut1-55,top-57],[cut1-131,top-57]],C.gold,5);
 const lowerTransfer=path(tags,[[cut2-7,bottom],[cut2+55,bottom+40],[cut2+115,bottom+40]],C.purple,5);
 upperTransfer.setAttribute('data-adapter-transfer','top');lowerTransfer.setAttribute('data-adapter-transfer','bottom');
 F.line(tags,cut1+7,top,x0+9*dx-9,top,C.blue,2.2);
 F.line(tags,x0+17*dx+9,bottom,cut2-7,bottom,C.teal,2.2);
 box(tags,280,204,238,40,'Адаптерная ДНК','Adapter DNA',20,C.gold);
 box(tags,1002,348,207,116,'Mg²⁺\nкофактор реакции','Mg²⁺\nreaction cofactor',22,C.grey);
 arrow(tags,[480,248],[cut1-104,top-57],C.gold);
 box(tags,276,545,728,53,'3′ адаптера соединяется с 5′-концом ДНК','The adapter 3′ end joins the target DNA 5′ end',21,C.grey);
 // TSS: conceptual aggregation, deliberately no numerical enrichment score.
 const tss=group();
 box(tss,125,205,400,48,'Много разных TSS','Many different TSSs',25,C.blue);
 for(let i=0;i<5;i++){
  const y=280+i*53;F.line(tss,165,y,460,y,C.grey,1);F.line(tss,313,y-23,313,y+4,C.gold,1.4);
  curve(tss,165,y,295,22,t=>.1+.85*bell(t,.50,.12)*(1-.1*(i%2))+.12*Math.sin(35*t+i)**2,C.blue);
 }
 arrow(tss,[545,376],[668,376],C.gold);
 box(tss,686,205,447,48,'Общий профиль относительно TSS','Aggregate profile relative to TSS',23,C.gold);
 F.line(tss,714,501,1120,501,C.grey,1.2);F.line(tss,917,282,917,512,C.grey,1,'4 5');
 curve(tss,714,500,406,170,t=>.09+.78*bell(t,.5,.12)+.13*bell(t,.28,.04)+.13*bell(t,.72,.04),C.gold);
 box(tss,675,521,154,36,'−2 кб','−2 kb',18,C.grey);box(tss,861,521,110,36,'TSS · 0','TSS · 0',19,C.gold);box(tss,1025,521,148,36,'+2 кб','+2 kb',18,C.grey);
 box(tss,235,571,810,32,'Отдельная схема агрегирования · численная метрика не рассчитана','Separate aggregation schematic · no numerical score calculated',18,C.grey);
 // QC: three complementary evidence families, not universal pass/fail cutoffs.
 const qc=group();
 const qcx=[300,640,980];
 box(qc,130,204,340,60,'Выравнивания','Alignments',26,C.blue);
 box(qc,470,204,340,60,'Сложность библиотеки','Library complexity',25,C.teal);
 box(qc,810,204,340,60,'Митохондриальная доля','Mitochondrial fraction',25,C.purple);
 for(let i=0;i<7;i++){const y=306+i*20;F.line(qc,223+i%3*14,y,362+i%3*14,y,C.blue,4);}
 for(let i=0;i<12;i++)F.line(qc,535+(i%3)*74,310+Math.floor(i/3)*35,586+(i%3)*74,310+Math.floor(i/3)*35,i%3?C.teal:C.grey,5);
 ellipse(qc,978,360,86,55,C.purple,.06);ellipse(qc,978,360,59,27,C.gold,.03);
 for(let i=0;i<7;i++){const x=925+i*17;path(qc,[[x,335],[x+6,345],[x-2,361],[x+6,379]],C.purple,2);}
 box(qc,150,466,300,72,'Уверенно ли размещены\nпрочтения?','Are the reads placed\nreliably?',22,C.grey);
 box(qc,490,466,300,72,'Сколько независимых\nмолекул представлено?','How many independent\nmolecules are represented?',22,C.grey);
 box(qc,830,466,300,72,'Какая часть сигнала\nприходит от mtDNA?','What fraction of signal\ncomes from mtDNA?',22,C.grey);
 box(qc,235,564,810,38,'Проверки дополняют длины вставок, FRiP и TSS-профиль','These checks complement insert lengths, FRiP and the TSS profile',20,C.grey);
 // Identical-looking schematic dips can have different causes.
 const footprint=group();
 box(footprint,127,206,475,66,'Возможная защита белком','Possible protein protection',26,C.purple);
 box(footprint,687,206,475,66,'Предпочтения Tn5 к последовательности','Tn5 sequence preferences',24,C.teal);
 for(let k=0;k<2;k++){
  const x=150+k*560,y=467;F.line(footprint,x,y,x+420,y,C.grey,1.1);
  curve(footprint,x,y,420,165,t=>.09+.74*bell(t,.5,.21)-.62*bell(t,.5,.065),k?C.teal:C.purple);
  F.line(footprint,x,505,x+420,505,C.blue,2.2);rect(footprint,x+173,493,74,24,C.gold,.28,2);
 }
 ellipse(footprint,360,478,40,23,C.purple,.12);
 box(footprint,277,538,166,38,'мотив','motif',20,C.gold);box(footprint,837,538,166,38,'мотив','motif',20,C.gold);
 box(footprint,608,350,64,90,'?','?',59,C.grey);
 box(footprint,335,575,610,30,'Два условных профиля · причины не устанавливаются по одному провалу','Two schematic profiles · a dip alone does not identify the cause',17,C.grey);
 // Independent biological replicates; shared display scale, no p-values.
 const reps=group();
 box(reps,133,203,457,58,'Состояние A · три образца','Condition A · three samples',25,C.blue);
 box(reps,693,203,457,58,'Состояние B · три образца','Condition B · three samples',25,C.teal);
 for(let k=0;k<2;k++)for(let i=0;i<3;i++){
  const x=166+k*550,y=329+i*89;F.line(reps,x,y,x+394,y,C.grey,1.1);
  curve(reps,x,y,394,53,t=>.09+(.5+k*.33)*bell(t,.44,.085)+(i*.04)*bell(t,.42,.05)+.13*bell(t,.72,.06),k?C.teal:C.blue);
  box(reps,x-40,y-35,34,32,String(i+1),String(i+1),19,C.grey);
 }
 box(reps,320,573,640,34,'Условные профили · общая шкала · без проверки значимости','Schematic profiles · shared scale · no significance test',19,C.grey);
 // Mixtures show that unchanged per-type profiles can produce distinct totals.
 const mixture=group();
 box(mixture,100,198,1080,47,'Два состава популяции · профили типов не меняются','Two population compositions · per-type profiles stay fixed',25,C.grey);
 const mixcurves=[];
 for(let k=0;k<2;k++){
  const ox=205+k*560;
  for(let i=0;i<8;i++){const col=i<(k?2:6)?C.blue:C.teal;ellipse(mixture,ox+(i%4)*63,286+Math.floor(i/4)*63,22,20,col,.13);F.dot(mixture,ox+(i%4)*63,286+Math.floor(i/4)*63,6,col);}
  box(mixture,ox-42,382,288,44,k?'2 синих + 6 зелёных':'6 синих + 2 зелёных',k?'2 blue + 6 green':'6 blue + 2 green',21,C.grey);
  const x=ox-30,y=549,w=265;F.line(mixture,x,y,x+w,y,C.grey,1.1);
  const fn=t=>.1+(k?.25:.75)*.88*bell(t,.36,.10)+(k?.75:.25)*.88*bell(t,.71,.11);
  mixcurves.push(curve(mixture,x,y,w,114,fn,C.gold));
 }
 arrow(mixture,[593,337],[683,337],C.gold);
 box(mixture,300,574,680,31,'Разный суммарный сигнал при неизменных профилях типов','Different aggregate signals with unchanged per-type profiles',19,C.grey);
 // Evidence ladder: do not equate an accessible feature with gene output.
 const interpretation=group();
 curve(interpretation,145,416,320,158,t=>.07+.88*bell(t,.5,.115),C.gold);F.line(interpretation,145,416,465,416,C.grey,1.3);
 rect(interpretation,262,424,90,18,C.gold,.32,2);
 box(interpretation,125,459,360,100,'Доступный участок\nкандидат для изучения','Accessible region\na candidate to investigate',25,C.gold);
 const evidence=[['Связывание фактора','Factor binding',C.purple],['Количество РНК','RNA abundance',C.blue],['Регуляторная функция','Regulatory function',C.teal]];
 for(let i=0;i<3;i++){
  const y=260+i*119;F.line(interpretation,510,379,728,y+28,C.grey,1.4,'5 6');F.dot(interpretation,761,y+28,7,evidence[i][2]);
  box(interpretation,794,y,370,60,evidence[i][0],evidence[i][1],26,evidence[i][2],'left');
 }
 box(interpretation,135,208,338,51,'ATAC-seq','ATAC-seq',31,C.gold);
 box(interpretation,754,563,420,40,'Нужны дополнительные измерения','Additional measurements are needed',21,C.grey);
 // Connected final route, with a miniature DNA object, read pair and its track.
 const summary=group();
 const cx=[185,408,640,872,1095];
 for(let i=0;i<4;i++)arrow(summary,[cx[i]+55,365],[cx[i+1]-55,365],C.grey);
 for(let i=0;i<41;i++){const x=135+i*2.5,y=365+22*Math.sin(i*.31),z=365-22*Math.sin(i*.31);if(i<40){const nx=x+2.5;F.line(summary,x,y,nx,365+22*Math.sin((i+1)*.31),C.blue,2);F.line(summary,x,z,nx,365-22*Math.sin((i+1)*.31),C.teal,2);}if(i%5===0)F.line(summary,x,y,x,z,C.grey,1);}
 F.line(summary,356,365,460,365,C.gold,6);F.line(summary,343,365,355,365,C.purple,8);F.line(summary,461,365,473,365,C.teal,8);
 arrow(summary,[587,347],[628,347],C.blue);arrow(summary,[693,383],[652,383],C.teal);F.line(summary,627,365,653,365,C.grey,1,'3 4');
 for(let i=0;i<5;i++)F.line(summary,823+i%2*15,332+i*16,896+i%3*11,332+i*16,C.blue,3);
 curve(summary,1043,397,104,65,t=>.05+.85*bell(t,.5,.15),C.gold);F.line(summary,1040,397,1150,397,C.grey,1.2);
 const names=[['Доступная\nДНК','Accessible\nDNA'],['Библиотека','Library'],['Парные\nчтения','Paired\nreads'],['Координаты','Coordinates'],['Обогащение','Enrichment']];
 names.forEach((a,i)=>box(summary,cx[i]-105,443,210,84,a[0],a[1],25,i===4?C.gold:C.white));
 box(summary,260,237,760,62,'Молекулы → записи → свидетельства','Molecules → records → evidence',32,C.gold);
 box(summary,245,567,790,34,'Сохраняем идентичность и смысл каждого измерения','Preserve identity and the meaning of each measurement',21,C.grey);
 function paint(s={}){
  if(disposed)throw new Error('AtacExtras actor is disposed');
  const chem=clamp(s.chem),visibility=clamp(s.visibility),stage=Math.max(0,Math.min(6,s.stage||0));
  F.opacity(chemical,chem);F.opacity(tags,clamp(s.chemTags));F.opacity(extras,visibility);
  groups.forEach((q,i)=>F.opacity(q,clamp(1-Math.abs(stage-i))));
  return {anchors:{cutA:[cut1,top],cutB:[cut2,bottom]},stage};
 }
 function dispose(){if(disposed)return;disposed=true;labels.forEach(label=>label.dispose());root.remove();}
 paint();return{g:root,paint,dispose,nodes:[...root.querySelectorAll('*')]};
}
g.AtacExtras=Object.freeze({create});
})(window);
