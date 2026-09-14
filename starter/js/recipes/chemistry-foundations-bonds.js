/* Revised teaching sequence: notation, shared pairs and fixed molecular geometry. */
(function(global){
'use strict';
const scenes=global.CHEMISTRY_FOUNDATIONS=[];
const phases=(ru,en)=>ru.map((label,i)=>({at:i/5,label,enLabel:en[i]}));
const stageAt=p=>[0,.2,.4,.6,.8].findLastIndex(at=>p+1e-8>=at);
const phase=(p,a,b)=>F.phase(p,a,b),lerp=(a,b,q)=>a+(b-a)*q;
function trace(H,node,q){H.trace(node,q);const n=node.g||node.el||node;n.dataset.motionRole='representation-trace';n.querySelectorAll?.('[data-arrow-shaft]').forEach(p=>p.dataset.motionRole='arrow-trace');}

function dots(g,H,x,y,color=C.gold){const pair=H.el(g,'g',{'data-bond-electrons':'2'});const a=H.circle(pair,x,y-6,3.3,color,.95),b=H.circle(pair,x,y+6,3.3,color,.95);return {g:pair,a,b,set(cx,cy,angle=0){pair.setAttribute('transform',`translate(${cx-x} ${cy-y}) rotate(${angle} ${x} ${y})`);}};}
function partialAt(actor,id,x,y){const atom=actor.atoms[id],label=atom.querySelector('[data-partial-charge]');label.setAttribute('x',x);label.setAttribute('y',y);L.contract(label,{space:atom,box:{x:x-29,y:y-15,width:58,height:30}});}
scenes.push({
 id:'formula',title:'Что означает линия связи?',enTitle:'What does a bond line mean?',question:'Как перейти от CH₄ к общим электронным парам?',enQuestion:'How do we get from CH₄ to shared electron pairs?',control:'Ход объяснения связи',enControl:'Bond explanation progress',duration:48000,
 narration:[{"at": 0, "ru": "CH₄: один углерод и четыре водорода. Найдём их в рисунке.", "en": "CH₄: one carbon and four hydrogens. Find them in the drawing."}, {"at": 0.085, "ru": "У каждого H есть связь с центральным C. Выберем одну.", "en": "Each H bonds to the central C. Select one bond."}, {"at": 0.18, "ru": "Увеличим именно эту связь, сохранив целую молекулу слева.", "en": "Magnify this same bond while keeping the whole molecule on the left."}, {"at": 0.29, "ru": "За одной чертой скрывается общая пара — два электрона.", "en": "One line stands for a shared pair: two electrons."}, {"at": 0.4, "ru": "Две точки — запись пары. Теперь покажем её распределение в пространстве.", "en": "Two dots denote the pair. Now show its spatial distribution."}, {"at": 0.51, "ru": "Общая электронная плотность находится между притягивающими её ядрами.", "en": "Shared electron density lies between the nuclei that attract it."}, {"at": 0.6, "ru": "В краткой записи эту область заменяем одной чертой.", "en": "In compact notation, replace this region with one line."}, {"at": 0.7, "ru": "Так линия C–H кодирует два общих электрона.", "en": "The C–H line therefore encodes two shared electrons."}, {"at": 0.8, "ru": "Вернём выбранную связь в целую молекулу.", "en": "Return the selected bond to the whole molecule."}, {"at": 0.91, "ru": "Четыре общие пары: у C октет, у каждого H дуэт.", "en": "Four shared pairs: an octet for C and a duet for each H."}],
 stages:phases(['Состав','Пара','Плотность','Линия','Октет'],['Formula','Pair','Density','Line','Octet']),
 source:'OpenStax · Lewis structures and covalent bonding',url:'https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures',
 answer:'Одна линия C–H обозначает одну общую электронную пару. Четыре связи метана содержат восемь валентных электронов.',enAnswer:'One C–H line denotes one shared electron pair. The four methane bonds contain eight valence electrons.',
 captions:["CH₄: один углерод и четыре водорода. Найдём их в рисунке.", "Увеличим именно эту связь, сохранив целую молекулу слева.", "Две точки — запись пары. Теперь покажем её распределение в пространстве.", "В краткой записи эту область заменяем одной чертой.", "Вернём выбранную связь в целую молекулу."],
 enCaptions:["CH₄: one carbon and four hydrogens. Find them in the drawing.", "Magnify this same bond while keeping the whole molecule on the left.", "Two dots denote the pair. Now show its spatial distribution.", "In compact notation, replace this region with one line.", "Return the selected bond to the whole molecule."],
 note:'CH₄ имеет 4 + 4×1 = 8 валентных электронов; в структуре Льюиса они образуют четыре общие пары. Пара учитывается у обоих связанных атомов при проверке октета/дуэта, но не добавляет новых электронов. Плоский крест показывает связность: метан тетраэдричен. Здесь не показана реакция сборки метана из свободных атомов. Увеличение справа повторяет только выбранную связь; остальные три связи C остаются в полном рисунке. Область плотности иллюстративна и не является расчётом орбитали. О притяжении ядер к электронам и энергетике связи: <a href="https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding">OpenStax 7.2</a>.',
 enNote:'CH₄ has 4 + 4×1 = 8 valence electrons, forming four shared pairs in its Lewis structure. A pair counts toward both bonded atoms’ octet/duet without creating extra electrons. The planar cross shows connectivity; methane is tetrahedral. This is not a methane-formation reaction from free atoms. The right inset repeats only the selected bond; the other three C bonds remain in the full diagram. The density region is illustrative, not an orbital calculation. See <a href="https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding">OpenStax 7.2</a> for nuclear–electron attraction and bond energetics.',
 draw(g,H){
  H.label(g,85,214,505,43,'CH₄  ·  1 C + 4 H','CH₄  ·  1 C + 4 H',31,C.white);
  const positions={C:[0,0],H1:[-130,0],H2:[130,0],H3:[0,-86],H4:[0,86]};
  const a=CH.molecule(g,{atoms:Object.entries(positions).map(([id,[x,y]])=>({id,element:id==='C'?'C':'H',x,y})),bonds:[1,2,3,4].map(i=>({id:'C-H'+i,a:'C',b:'H'+i})),x:335,y:356});a.g.dataset.chemRole='methane';
  const inspector=H.el(g,'ellipse',{cx:205,cy:356,rx:24,ry:21,fill:'none',stroke:C.gold,'stroke-width':1.25,'vector-effect':'non-scaling-stroke'});inspector.dataset.motionRole='atom-inspection';
  const pairLayer=H.el(g,'g',{'data-shared-pair-layer':''}),pairs=[1,2,3,4].map(i=>{const [x,y]=positions['H'+i],q=dots(pairLayer,H,335+x/2,356+y/2,C.gold);if(x===0)q.g.setAttribute('transform',`rotate(90 ${335+x/2} ${356+y/2})`);return q;});
  const relation=H.line(g,497,355,736,355,C.dim,'3 6');relation.dataset.motionRole='same-bond-connection';
  const inventory=H.label(g,745,291,435,140,'C: 4 валентных e⁻\n4 H: 4 × 1 e⁻\nВсего: 8 e⁻','C: 4 valence e⁻\n4 H: 4 × 1 e⁻\nTotal: 8 e⁻',27,C.grey);
  const title=H.label(g,740,214,445,64,'Та же C–H · крупный план','The same C–H · enlarged',24,C.grey);
  const inset=H.el(g,'g',{'data-same-bond-inset':'C-H2','data-motion-role':'selected-bond-zoom'});H.rect(inset,-91,-28,182,56,C.dim);
  const density=H.el(inset,'ellipse',{cx:0,cy:0,rx:8,ry:5,fill:C.blue,'fill-opacity':.13,stroke:'none','data-electron-density':'schematic','data-motion-role':'density-to-line'});
  H.label(inset,-85,-17,40,34,'C','C',24,C.white);H.label(inset,45,-17,40,34,'H','H',24,C.grey);
  const bond=H.line(inset,-40,0,40,0,C.gold);bond.dataset.bondNotation='line';bond.dataset.motionRole='line-notation';
  const pair=dots(inset,H,0,0);pair.g.dataset.pairNotation='Lewis';pair.a.dataset.motionRole='shared-electron';pair.b.dataset.motionRole='shared-electron';
  const count=H.label(g,746,430,452,62,'','',24,C.gold),summary=H.label(g,745,304,435,120,'4 пары × 2 e⁻ = 8 e⁻\nC: октет · H: дуэт','4 pairs × 2 e⁻ = 8 e⁻\nC: octet · H: duet',28,C.gold);
  const sourceLabel=H.label(g,98,453,475,40,'Выбрана одна связь C–H','One C–H bond is selected',21,C.grey);
  return {detail:{g,x:0,y:0,scale:1,bounds:{x:85,y:214,width:1115,height:281}},paint(p){const stage=stageAt(p),zoomIn=phase(p,.16,.31),zoomOut=phase(p,.80,.93),zoom=zoomIn*(1-zoomOut),x=lerp(400,952,zoom),y=lerp(356,354,zoom),scale=lerp(1,2.4,zoom);H.move(inset,x,y,scale);
   a.focus(stage===0?['H1','H2','H3','H4']:stage===4?['C']:['C','H2']);Object.values(a.atoms).forEach(n=>n.setAttribute('opacity','1'));
   const itinerary=[[205,356],[335,270],[465,356],[335,442],[400,356]],section=Math.min(3,Math.floor(p/.04)),q=phase(p,section*.04,(section+1)*.04),from=itinerary[section],to=itinerary[section+1];inspector.setAttribute('cx',lerp(from[0],to[0],q));inspector.setAttribute('cy',lerp(from[1],to[1],q));H.show(inspector,p<.16?1:0);
   const pairTransform=phase(p,.22,.37),densityGrowth=phase(p,.40,.55),lineGrowth=phase(p,.60,.76),reveal=[0,1,2,3].map(i=>phase(p,.84+i*.018,.90+i*.018));
   pair.a.setAttribute('cx',-32*(1-pairTransform));pair.a.setAttribute('cy',-6*pairTransform);pair.b.setAttribute('cx',32*(1-pairTransform));pair.b.setAttribute('cy',6*pairTransform);
   density.setAttribute('rx',lerp(8,52,densityGrowth)*(1-lineGrowth)+40*lineGrowth);density.setAttribute('ry',lerp(5,15,densityGrowth)*(1-lineGrowth)+lineGrowth);H.show(density,densityGrowth*(1-lineGrowth));
   const lineHalf=p<.4?40*(1-pairTransform):40*lineGrowth;bond.setAttribute('x1',-lineHalf);bond.setAttribute('x2',lineHalf);H.show(bond,p<.4?1-pairTransform:lineGrowth);H.show(pair.g,p<.2?0:phase(p,.20,.26)*(1-phase(p,.40,.53)));
   H.show(inventory,1-phase(p,.13,.18));H.show(inset,p>=.16&&zoomOut<1?1:0);H.show(title,p>=.18&&p<.93?1:0);H.show(summary,phase(p,.92,.99));H.show(count,p>=.2&&p<.84?1:0);
   const left=x-91*scale;relation.setAttribute('x2',Math.max(497,left));relation.setAttribute('y2',y);H.show(relation,left>500&&p<.93?1:0);
   pairs.forEach((pair,i)=>H.show(pair,reveal[i]));a.g.querySelectorAll('[data-bond-id]').forEach((b,i)=>b.setAttribute('opacity',stage===4?1-reveal[i]:b.dataset.bondId==='C-H2'&&p>=.16?.35:1));
   count.setText(H.tr(stage===1?'Одна общая пара · 2 e⁻':stage===2?'Общая плотность между ядрами':'Два электрона → одна черта',stage===1?'One shared pair · 2 e⁻':stage===2?'Shared density between the nuclei':'Two electrons → one line'));sourceLabel.setText(H.tr(stage===4?'Каждая из четырёх связей — общая пара':'Выбрана одна связь C–H',stage===4?'Each of the four bonds is a shared pair':'One C–H bond is selected'));
   g.dataset.foundationPhase=String(stage);return {carbon:1,hydrogen:4,atomCount:5,bondCount:4,valenceElectrons:8,sharedPairs:4,representation:'Lewis connectivity',stage,motion:{authored:true,selectedBond:'C-H2',lens:[x,y,scale],pairTransform,densityGrowth,lineGrowth,octetPairs:reveal}};
  }};
 }
});
scenes.push({
 id:'polarity',title:'Полярная связь и полярная молекула',enTitle:'A polar bond and a polar molecule',question:'Почему диполи воды складываются, а CO₂ — компенсируются?',enQuestion:'Why do water bond dipoles add, while CO₂ bond dipoles cancel?',control:'Ход объяснения полярности',enControl:'Polarity explanation progress',duration:48000,
 narration:[{"at": 0, "ru": "Посмотрим на общую электронную плотность связей O–H.", "en": "Look at the shared electron density in the O–H bonds."}, {"at": 0.1, "ru": "Она смещена к кислороду, который сильнее притягивает электроны.", "en": "It shifts toward oxygen, which attracts electrons more strongly."}, {"at": 0.2, "ru": "Отметим избыток электронной плотности у O знаком δ⁻.", "en": "Mark the excess electron density at O with δ⁻."}, {"at": 0.3, "ru": "У водородов остаётся частичный положительный заряд δ⁺.", "en": "The hydrogens carry partial positive charge, δ⁺."}, {"at": 0.4, "ru": "Проведём химические дипольные стрелки от H к O.", "en": "Draw chemical dipole arrows from H toward O."}, {"at": 0.5, "ru": "Крест отмечает положительный конец, головка — отрицательный.", "en": "The cross marks the positive end; the head marks the negative end."}, {"at": 0.6, "ru": "Перенесём копии стрелок голова к хвосту, сохраняя длины.", "en": "Translate copies head-to-tail while keeping their lengths."}, {"at": 0.745, "ru": "Конец не вернулся в начало: у воды остался суммарный диполь.", "en": "The end did not return to the start: water has a net dipole."}, {"at": 0.8, "ru": "Теперь сравним с прямой молекулой CO₂.", "en": "Now compare a linear CO₂ molecule."}, {"at": 0.91, "ru": "Её равные стрелки направлены в противоположные стороны. Сложим их.", "en": "Its equal arrows point in opposite directions. Add them."}, {"at": 0.985, "ru": "Здесь конец возвращается в начало, и сумма равна нулю.", "en": "Here the end returns to the start, so the sum is zero."}],
 stages:phases(['Плотность','Заряды δ','Диполи','Сложение','CO₂'],['Density','δ charges','Dipoles','Addition','CO₂']).map((s,i)=>i===3?{...s,seek:.795}:s),
 source:'OpenStax · Molecular structure and polarity',url:'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity',
 answer:'У воды угол около 104.5°, поэтому стрелки O–H не компенсируются. В линейной CO₂ две равные противоположные стрелки дают ноль.',enAnswer:'Water is bent at about 104.5°, so its O–H arrows do not cancel. Linear CO₂ has equal and opposite bond arrows that sum to zero.',
 captions:["Посмотрим на общую электронную плотность связей O–H.", "Отметим избыток электронной плотности у O знаком δ⁻.", "Проведём химические дипольные стрелки от H к O.", "Перенесём копии стрелок голова к хвосту, сохраняя длины.", "Теперь сравним с прямой молекулой CO₂."],
 enCaptions:["Look at the shared electron density in the O–H bonds.", "Mark the excess electron density at O with δ⁻.", "Draw chemical dipole arrows from H toward O.", "Translate copies head-to-tail while keeping their lengths.", "Now compare a linear CO₂ molecule."],
 note:'Вода нарисована с постоянным углом H–O–H 104.5°, CO₂ — с углом 180° и двойными связями C=O. Модели не превращаются друг в друга. Частичные заряды качественные; их численные значения здесь не измеряются. Длины двух O–H стрелок одинаковы, а копии и их сумма используют ту же экранную шкалу. Между H₂O и CO₂ абсолютные дипольные моменты не сравниваются. Химическая стрелка направлена к δ⁻; физический электрический дипольный момент p имеет противоположное направление (от минуса к плюсу), см. <a href="https://goldbook.iupac.org/terms/view/E01929">IUPAC</a>. Области электронной плотности условны; это не вычисленные орбитали.',
 enNote:'Water keeps a 104.5° H–O–H angle; CO₂ keeps its 180° geometry and double C=O bonds. They do not transform into one another. Partial-charge signs are qualitative, not measured values. Equal O–H vectors, translated copies and their resultant use the same pixel scale. Absolute dipole magnitudes are not compared between H₂O and CO₂. Chemical arrows point toward δ⁻; the physical electric dipole moment p points oppositely, from minus to plus, per <a href="https://goldbook.iupac.org/terms/view/E01929">IUPAC</a>. Density regions are schematic rather than computed orbitals.',
 draw(g,H){
  const angle=104.5,r=112,half=angle*Math.PI/360,hx=r*Math.sin(half),hy=r*Math.cos(half),ox=300,oy=334;
  H.label(g,85,214,340,43,'H₂O · 104.5°','H₂O · 104.5°',28,C.white);
  const clouds=[-1,1].map(sign=>H.el(g,'ellipse',{cx:0,cy:0,rx:39,ry:17,fill:C.blue,'fill-opacity':.16,stroke:'none','data-electron-density':'schematic','data-motion-role':'density-bias'}));
  const water=CH.molecule(g,{atoms:[{id:'O',element:'O',x:0,y:0,partial:-.8},{id:'H1',element:'H',x:-hx,y:hy,partial:.4},{id:'H2',element:'H',x:hx,y:hy,partial:.4}],bonds:[{id:'O-H1',a:'O',b:'H1'},{id:'O-H2',a:'O',b:'H2'}],x:ox,y:oy});water.g.dataset.chemRole='water';
  partialAt(water,'O',0,-39);partialAt(water,'H1',-17,30);partialAt(water,'H2',17,30);
  const starts=[[-hx*.78-15,hy*.78-20],[hx*.78+15,hy*.78-20]].map(([x,y])=>[ox+x,oy+y]);
  const vecs=[[hx*.55,-hy*.55],[-hx*.55,-hy*.55]],arrows=starts.map(([x,y],i)=>H.arrow(g,x,y,x+vecs[i][0],y+vecs[i][1],C.gold,'dipole-chemical'));
  arrows.forEach((a,i)=>{a.g.dataset.vectorRole='water-component';a.g.dataset.vector=JSON.stringify(vecs[i]);});
  const start=[524,427],mid=[start[0]+vecs[0][0],start[1]+vecs[0][1]],end=[mid[0]+vecs[1][0],mid[1]+vecs[1][1]];
  const copies=arrows.map((a,i)=>H.arrow(g,...starts[i],starts[i][0]+vecs[i][0],starts[i][1]+vecs[i][1],C.blue,'dipole-chemical'));
  copies.forEach((a,i)=>{a.g.dataset.vectorRole='water-copy';a.g.dataset.vector=JSON.stringify(vecs[i]);});
  const sum=H.arrow(g,...start,...end,C.gold,'dipole-chemical');sum.g.dataset.vectorRole='water-sum';sum.g.dataset.vector=JSON.stringify([0,2*vecs[0][1]]);
  const sumLabel=H.label(g,456,452,160,40,'Сумма ≠ 0','Sum ≠ 0',23,C.gold);
  const addLabel=H.label(g,440,278,180,60,'Складываем\nвекторы','Add the\nvectors',19,C.grey);
  const compare=H.el(g,'g',{'data-molecule-comparison':'CO2','data-motion-role':'comparison-focus'});
  H.line(compare,655,239,655,480,C.dim);H.label(compare,740,214,450,43,'CO₂ · O=C=O','CO₂ · O=C=O',28,C.white);
  H.label(compare,735,260,450,31,'C=O: две общие пары','C=O: two shared pairs',20,C.grey);
  const co2=CH.molecule(compare,{atoms:[{id:'C',element:'C',x:0,y:0,partial:1},{id:'O1',element:'O',x:-140,y:0,partial:-.5},{id:'O2',element:'O',x:140,y:0,partial:-.5}],bonds:[{id:'C-O1',a:'C',b:'O1',order:2},{id:'C-O2',a:'C',b:'O2',order:2}],x:925,y:353,showPartials:true});co2.g.dataset.chemRole='carbon-dioxide';['C','O1','O2'].forEach(id=>partialAt(co2,id,0,37));
  const length=Math.hypot(...vecs[0]);const cvecs=[[-length,0],[length,0]];
  const cArrows=cvecs.map(([dx,dy],i)=>{const x=925+(i?25:-25),a=H.arrow(compare,x,300,x+dx,300,C.gold,'dipole-chemical');a.g.dataset.vectorRole='co2-component';a.g.dataset.vector=JSON.stringify([dx,dy]);return a;});
  const cStart=[1170,426],cMid=[cStart[0]+cvecs[0][0],426],cCopies=cArrows.map((a,i)=>{const from=[925+(i?25:-25),300],v=cvecs[i],copy=H.arrow(compare,...from,from[0]+v[0],from[1],i?C.teal:C.blue,'dipole-chemical');copy.g.dataset.vectorRole='co2-copy';copy.g.dataset.vector=JSON.stringify(v);copy.g.querySelector('[data-arrow-shaft]').dataset.motionRole='co2-head-to-tail';return copy;});
  const zero=H.circle(compare,...cStart,6,C.gold,0);zero.dataset.vectorResult='zero';
  const cSumLabel=H.label(compare,760,450,410,43,'Конец вернулся в начало: сумма = 0','The end returns to the start: sum = 0',22,C.gold);
  const prompt=H.label(g,745,294,435,136,'Общая пара может быть\nраспределена неравномерно.','A shared pair can have\nan unequal distribution.',27,C.grey);
  return {paint(p){
   const stage=stageAt(p),bias=phase(p,.02,.16),chargeLabels=phase(p,.20,.35);water.set({showPartials:p>=.2});partialAt(water,'O',lerp(35,0,chargeLabels),lerp(-27,-39,chargeLabels));partialAt(water,'H1',lerp(-35,-17,chargeLabels),lerp(13,30,chargeLabels));partialAt(water,'H2',lerp(35,17,chargeLabels),lerp(13,30,chargeLabels));Object.values(water.atoms).forEach(n=>n.querySelector('[data-partial-charge]').dataset.motionRole='partial-charge-annotation');
   clouds.forEach((e,i)=>{const sign=i?1:-1,f=.50-.20*bias;e.setAttribute('transform',`translate(${ox+sign*hx*f} ${oy+hy*f}) rotate(${Math.atan2(hy,sign*hx)*180/Math.PI})`);H.show(e,1-phase(p,.36,.44));});
   arrows.forEach((a,i)=>{trace(H,a,phase(p,.40+i*.03,.51+i*.03));H.show(a,p>=.4?1:0);});
   const moved=phase(p,.60,.74);copies.forEach((a,i)=>{const dst=i?mid:start,x=lerp(starts[i][0],dst[0],moved),y=lerp(starts[i][1],dst[1],moved);a.set({x1:x,y1:y,x2:x+vecs[i][0],y2:y+vecs[i][1]});a.g.querySelector('[data-arrow-shaft]').dataset.motionRole='water-head-to-tail';H.show(a,p>=.6?1:0);});
   const result=phase(p,.74,.795);trace(H,sum,result);H.show(sum,p>=.74?1:0);H.show(sumLabel,result);H.show(addLabel,p>=.6?1:0);
   const comparison=phase(p,.80,.92);H.move(compare,100*(1-comparison),38*(1-comparison),.86+.14*comparison);H.show(compare,Math.min(1,comparison*3));H.show(prompt,1-phase(p,.73,.79));
   cArrows.forEach((a,i)=>trace(H,a,phase(p,.81+i*.025,.91+i*.025)));
   const cMove=phase(p,.91,.99),horizontal=Math.min(1,cMove*2),vertical=Math.max(0,cMove*2-1);cCopies.forEach((a,i)=>{const target=i?cMid:cStart,x=lerp(925+(i?25:-25),target[0],horizontal),y=lerp(300,target[1],vertical);a.set({x1:x,y1:y,x2:x+cvecs[i][0],y2:y});H.show(a,p>=.91?1:0);});H.show(zero,phase(p,.985,1));H.show(cSumLabel,phase(p,.955,.99));
   g.dataset.foundationPhase=String(stage);return {angle,waterAngle:angle,co2Angle:180,waterDipolePixels:Math.hypot(0,2*vecs[0][1]),co2DipolePixels:0,waterVectorSum:[0,2*vecs[0][1]],totalCharge:0,convention:'chemical: positive to negative',stage,motion:{authored:true,densityBias:bias,partialAnnotation:chargeLabels,waterCopies:moved,resultTrace:result,co2Focus:comparison,co2Copies:cMove}};
  }};
 }
});
})(window);
