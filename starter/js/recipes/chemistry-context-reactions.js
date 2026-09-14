/* Narrated atom accounting and proton exchange; objects persist while the explanation moves. */
(function(global){
'use strict';
const add=spec=>(global.CHEMISTRY_APPLICATIONS=global.CHEMISTRY_APPLICATIONS||[]).push(spec);
const phase=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a))),ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
function phaseProgress(p){for(const at of [0,.2,.4,.6,.8])if(p+1e-8>=at&&p-1e-8<=at)return at;return p;}
const point=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function bezier(a,c,b,t){return a.map((v,i)=>(1-t)*(1-t)*v+2*(1-t)*t*c[i]+t*t*b[i]);}
function move(H,node,x,y,scale=1){if(H.move)H.move(node,x,y,scale);else (node.g||node.el||node).setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);}
function trace(H,item,t){if(H.trace){H.trace(item,t);return;}const root=item.g||item.el||item,shaft=root.matches('path,line')?root:root.querySelector('[data-arrow-shaft]');if(shaft){shaft.setAttribute('pathLength','1');shaft.setAttribute('stroke-dasharray','1');shaft.setAttribute('stroke-dashoffset',String(1-t));}const head=root.querySelector('[data-arrow-head]');if(head)H.show(head,t>=.999?1:0);}
function text(H,label,ru,en){H.tr(ru,en);label.setText(ru);}
function pair(H,g,id){const p=H.group(g);p.dataset.sharedElectronPair=id;[-3,3].forEach(x=>H.el(p,'circle',{cx:x,cy:0,r:1.9,fill:C.gold}));return p;}
function census(actor){const atoms={},valences={},states=[];let charge=0,electrons=0;
 for(const b of actor.state.bonds)electrons+=2*b.order;
 for(const a of actor.state.atoms){atoms[a.element]=(atoms[a.element]||0)+1;charge+=a.charge;electrons+=2*a.lonePairs;const bonds=actor.state.bonds.reduce((n,b)=>n+((b.a===a.id||b.b===a.id)?b.order:0),0);valences[a.id]=bonds;states.push({id:a.id,element:a.element,bonds,lonePairs:a.lonePairs,charge:a.charge});}
 return {atoms,atomCount:actor.state.atoms.length,totalCharge:charge,valenceElectrons:electrons,valences,states};
}
function stages(ru,en,seeks){return ru.map((label,i)=>({at:i/5,label,enLabel:en[i],seek:seeks[i]}));}
const narration=(rows)=>rows.map(([at,ru,en])=>({at,ru,en}));
add({id:'stoichiometry',title:'Проследим каждый атом',enTitle:'Follow every atom',question:'Как из одного N₂ и трёх H₂ получить две группы NH₃?',enQuestion:'How do one N₂ and three H₂ supply two NH₃ groups?',control:'Ход объяснения',enControl:'Explanation progress',duration:50000,
 stages:stages(['Считаем молекулы','Считаем пары','Переставляем атомы','Собираем NH₃','Умножаем пакет'],['Count molecules','Count pairs','Rearrange atoms','Build NH₃','Scale the packet'],[.16,.28,.53,.76,1]),
 narration:narration([
  [0,'Начнём с одной N₂. Внутри неё два атома азота.','Start with one N₂ molecule. It contains two nitrogen atoms.'],
  [.07,'Теперь проследим три отдельные H₂: в каждой по два H.','Now follow three separate H₂ molecules, each containing two H atoms.'],
  [.18,'Всего у нас два N и шесть H. Ни один атом не должен потеряться.','We have two N and six H atoms. None may be lost.'],
  [.26,'Заменим линии связей шестью значками электронных пар. Ещё по одной паре остаётся у каждого N.','Turn the bond lines into six electron-pair symbols. Each N retains one additional pair.'],
  [.34,'Переставим те же метки атомов: каждому N найдём три H.','Rearrange the same atom markers: find three H atoms for each N.'],
  [.43,'К каждому N направим три H. Следите за теми же метками.','Guide three H atoms toward each N. Follow the same markers.'],
  [.55,'Шесть общих пар сохранены в нижнем ряду. Теперь найдём каждой место между N и H.','The six shared pairs are retained in the lower row. Now find each one a place between N and H.'],
  [.74,'Развернём каждую пару в линию N–H. Получились две NH₃.','Extend each pair into an N–H line. We have built two NH₃ groups.'],
  [.81,'Проверим результат: два N, шесть H и шестнадцать валентных электронов.','Check the result: two N, six H, and sixteen valence electrons.'],
  [.84,'Теперь повторим целый счётный пакет. Все коэффициенты растут вместе.','Now repeat the whole counting packet. All coefficients grow together.'],
  [.95,'Даже для четырёх пакетов отношение остаётся один к трём к двум.','Even with four packets, the ratio remains one to three to two.']
 ]),
 captions:['Считаем молекулы и атомы.','Шесть общих пар и две пары N.','Переставляем метки атомов и пар.','Собираем две NH₃ и проверяем состав.','Повторяем весь сбалансированный пакет.'],
 enCaptions:['Count the molecules and atoms.','Six shared pairs and two N lone pairs.','Rearrange the atom and pair markers.','Build two NH₃ groups and check their composition.','Repeat the entire balanced packet.'],
 source:'OpenStax · Chemistry 2e §4.1',url:'https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations',
 answer:'Одно N₂ и три H₂ дают атомный состав двух NH₃: 2 N и 6 H. Коэффициенты 1:3:2 сохраняют атомы.',enAnswer:'One N₂ and three H₂ supply the atom counts of two NH₃: 2 N and 6 H. The 1:3:2 coefficients conserve atoms.',
 note:'N₂ + 3H₂ → 2NH₃ — суммарный баланс, не элементарный механизм синтеза аммиака. Движение означает перестройку счётной схемы, а не столкновение четырёх молекул, траекторию атомов или изолированные химические промежуточные частицы. В интервале перестройки линии заменены шестью токенами общих электронных пар; две пары N сохраняются. Эти восемь пар означают 16 валентных электронов. Увеличенный пакет содержит восемь постоянных идентификаторов атомов. До перестройки показаны N≡N и три H–H; после неё — шесть N–H. В обоих химических состояниях каждый N имеет одну неподелённую пару и нулевой формальный заряд. Круглые рамки во время перестройки обозначают метки учёта, а не свободные атомы с заявленными формальными зарядами. NH₃ показан схемой связности. Четыре малых пакета справа обозначают масштабирование количества вещества, а не дополнительные частицы увеличенной схемы. Механизм, скорость, энергия, равновесие и выход не вычисляются.',
 enNote:'N₂ + 3H₂ → 2NH₃ is the overall balance, not an elementary ammonia-synthesis mechanism. Motion rearranges an accounting diagram; it is not a simultaneous four-molecule collision, atomic trajectory, or set of isolated chemical intermediates. During rearrangement, bond lines are replaced by six shared-pair tokens; the two N lone pairs persist. These eight pairs represent 16 valence electrons. Eight atom identifiers persist in the enlarged packet. Reactants have N≡N and three H–H bonds; products have six N–H bonds. Each N has one lone pair and zero formal charge in both chemical states. Circular frames during rearrangement denote accounting markers, not free atoms with asserted formal charges. NH₃ shows connectivity. The four small packets at right scale the amount of substance rather than adding atoms to the enlarged diagram. Mechanism, rate, energy, equilibrium and yield are not calculated.',
 draw(g,H){
  const before={N1:[170,347],N2:[267,347],H1:[475,286],H2:[575,286],H3:[475,347],H4:[575,347],H5:[475,408],H6:[575,408]},after={N1:[225,350],N2:[625,350],H1:[130,350],H2:[225,274],H3:[225,426],H4:[530,350],H5:[625,274],H6:[625,426]};
  const nh=[['N1','H1'],['N1','H2'],['N1','H3'],['N2','H4'],['N2','H5'],['N2','H6']];
  const actor=CH.molecule(g,{atoms:Object.entries(before).map(([id,[x,y]])=>({id,element:id[0],x,y,lonePairs:id[0]==='N'?1:0})),bonds:[{id:'N-triple',a:'N1',b:'N2',order:3},...[[1,2],[3,4],[5,6]].map(([a,b],i)=>({id:'H-pair-'+i,a:'H'+a,b:'H'+b})),...nh.map(([a,b],i)=>({id:'NH-'+i,a,b,order:0}))],showLonePairs:true});actor.g.dataset.stoichiometricPacket='enlarged';
  H.formula(g,90,209,728,'N₂ + 3 H₂ → 2 NH₃',32);
  const scan=H.el(g,'ellipse',{cx:525,cy:286,rx:78,ry:24,fill:'none',stroke:C.gold,'stroke-width':1.25});scan.dataset.moleculeCounter='hydrogen';
  const markers=Object.fromEntries(Object.keys(before).map(id=>{const c=H.circle(g,...before[id],22,C.blue,0);c.dataset.accountingAtom=id;return [id,c];}));
  const origins=[[218.5,342],[218.5,347],[218.5,352],[525,286],[525,347],[525,408]];
  const pairTokens=origins.map((xy,i)=>{const node=pair(H,g,'shared-'+i);move(H,node,...xy);return node;});
  const routes={N1:[[198,310],.34,.38],N2:[[450,220],.49,.575],H1:[[250,260],.38,.46],H2:[[400,270],.43,.51],H3:[[330,440],.45,.53],H4:[[550,345],.42,.48],H5:[[440,250],.56,.63],H6:[[595,440],.56,.62]};
  const trails=Object.entries(before).map(([id,a])=>{const b=after[id],[control,start,end]=routes[id],path=H.path(g,`M${a} Q${control} ${b}`,C.dim);path.dataset.atomAccountingRoute=id;return {id,a,b,control,start,end,path};});
  const heading=H.label(g,877,218,333,56,'Один счётный пакет','One counting packet',25,C.gold),counts=H.label(g,875,291,338,103,'','',25,C.white),ledger=H.label(g,872,398,340,95,'','',22,C.grey);
  const scope=H.label(g,90,461,725,34,'','',21,C.grey);
  const packetLayer=H.group(g);packetLayer.dataset.populationAccounting='stoichiometry';const packets=[];
  for(let i=0;i<4;i++){const node=H.group(packetLayer);node.dataset.packetIndex=String(i);H.rect(node,0,0,73,37,C.grey);for(let j=0;j<2;j++)H.circle(node,13+j*16,12,3,C.blue,.8);for(let j=0;j<6;j++)H.circle(node,10+j*10,26,2,C.grey,.8);packets.push(node);}
  const scaleLabel=H.label(packetLayer,875,432,338,64,'','',22,C.gold);
  return {actor,paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),accounting=p>=.30&&p<.74,product=p>=.74;
   const positions={};trails.forEach(r=>{const {start,end}=r,t=ease(phase(p,start,end));positions[r.id]=bezier(r.a,r.control,r.b,t);trace(H,r.path,phase(p,start,end));H.show(r.path,0);markers[r.id].setAttribute('cx',positions[r.id][0]);markers[r.id].setAttribute('cy',positions[r.id][1]);H.show(markers[r.id],accounting?.7:0);});
   actor.set({positions,bondOrders:Object.fromEntries(actor.state.bonds.map(b=>[b.id,accounting?0:product?(b.id.startsWith('NH-')?1:0):b.id==='N-triple'?3:b.id.startsWith('H-pair-')?1:0]))});
   // A moving lone-pair marker stays with each nitrogen during the bookkeeping layout.
   ['N1','N2'].forEach((id,i)=>{const lp=actor.atoms[id].querySelector('[data-lone-pair]'),angle=i?0:Math.PI*(1-ease(phase(p,.34,.60)));[...lp.children].forEach((d,j)=>{d.setAttribute('cx',29*Math.cos(angle)+(j?3:-3)*Math.sin(angle));d.setAttribute('cy',-29*Math.sin(angle)+(j?3:-3)*Math.cos(angle));});});
   const extension=phase(p,.74,.80);pairTokens.forEach((node,i)=>{const parking=[125+120*i,454],dest=point(after[nh[i][0]],after[nh[i][1]],.5),controls=[[145,400],[310,390],[330,435],[550,450],[700,390],[720,435]],park=ease(phase(p,.30,.34)),rise=ease(phase(p,.63+i*.004,.72+i*.003)),location=rise>0?bezier(parking,controls[i],dest,rise):bezier(origins[i],[origins[i][0],454],parking,park);move(H,node,...location);H.show(node,accounting?1:product?1-extension:0);});
   if(product)for(const b of actor.g.querySelectorAll('[data-bond-id^="NH-"] line'))trace(H,b,extension);
   else for(const b of actor.g.querySelectorAll('[data-bond-id^="NH-"] line'))trace(H,b,1);
   scan.setAttribute('cy',mix(286,408,phase(p,.07,.16)));H.show(scan,p>=.07&&p<.18?Math.sin(Math.PI*phase(p,.07,.18)):.0);
   const copies=1+[.86,.90,.94].filter(at=>p>=at).length;
   text(H,counts,p<.18?'1 N₂ + 3 H₂\n4 молекулы':p<.8?'2 N + 6 H\n8 атомов':`${copies} N₂ + ${3*copies} H₂\n→ ${2*copies} NH₃`,p<.18?'1 N₂ + 3 H₂\n4 molecules':p<.8?'2 N + 6 H\n8 atoms':`${copies} N₂ + ${3*copies} H₂\n→ ${2*copies} NH₃`);
   text(H,ledger,p<.8?'6 общих пар\n2 пары N\n16 валентных e⁻':'','6 shared pairs\n2 N lone pairs\n16 valence e⁻');H.show(ledger,1-phase(p,.79,.82));
   text(H,scope,accounting?'Учёт атомов и пар':product?'Две NH₃ · те же атомы и электроны':'Один пакет · два N и шесть H',accounting?'Atom and pair accounting':product?'Two NH₃ · the same atoms and electrons':'One packet · two N and six H');
   packets.forEach((node,i)=>{const t=ease(phase(p,.82+i*.04,.86+i*.04));move(H,node,885+82*i*t,385,Math.max(.01,t));H.show(node,t);});text(H,scaleLabel,`${2*copies} N · ${6*copies} H\nОтношение 1 : 3 : 2`,`${2*copies} N · ${6*copies} H\nRatio 1 : 3 : 2`);H.show(scaleLabel,phase(p,.83,.87));
   const c=census(actor);return {...c,stage,product,representation:accounting?'atom-and-electron bookkeeping':product?'product Lewis diagram':'reactant Lewis diagram',valenceElectrons:accounting?c.valenceElectrons+12:c.valenceElectrons,accountingPairCount:accounting?6:0,sharedPairCount:6,atomPositions:positions,atomTrajectoriesAreSchematic:true,packetCount:copies,nitrogenAtoms:2,hydrogenAtoms:6,scaledReactants:{N2:copies,H2:3*copies},scaledProducts:{NH3:2*copies},scaledAtoms:{N:2*copies,H:6*copies},progressIsTime:false,elementaryMechanism:false};
  }};
 }
});

const PKA=9.26;
function reservoirPH(p){return PKA+2*(1-phase(p,.78,.92));}
add({id:'protonation',title:'От переноса H⁺ к доле форм',enTitle:'From H⁺ transfer to species fractions',question:'Как один перенос протона связан с «50% NH₄⁺»?',enQuestion:'How does one proton transfer relate to “50% NH₄⁺”?',control:'Ход объяснения',enControl:'Explanation progress',duration:50000,
 value:p=>{p=phaseProgress(p);return p<.70?Math.round(p*100)+'%':'pH = '+reservoirPH(p).toFixed(2);},
 stages:stages(['Исходные пары','Электронные стрелки','Перенос H⁺','Расширяем ансамбль','Ровно половина'],['Starting pairs','Electron arrows','Transfer H⁺','Expand the ensemble','Exactly one half'],[.16,.32,.52,.76,.96]),
 narration:narration([
  [0,'У NH₄⁺ четыре связи N–H. Рядом — вода с двумя неподелёнными парами.','NH₄⁺ has four N–H bonds. Nearby water has two lone pairs.'],
  [.09,'Выделим пару воды и одну связь N–H. Это два источника электронов.','Highlight one water pair and one N–H bond. These are the two electron sources.'],
  [.18,'Первая полная стрелка начинается у пары O и направляется к H.','The first full arrow begins at the O pair and points toward H.'],
  [.27,'Вторая стрелка возвращает пару связи N–H на азот.','The second arrow returns the N–H bond pair to nitrogen.'],
  [.37,'Пара остаётся на N. Ядро H переходит к воде. Проследите за ним.','The pair stays on N. The H nucleus moves toward water. Follow it.'],
  [.49,'Теперь N нейтрален, а O несёт +1. Получились NH₃ и H₃O⁺.','N is now neutral and O carries +1. The products are NH₃ and H₃O⁺.'],
  [.60,'Уменьшим NH₃ до одного значка и расширим взгляд до ансамбля.','Shrink NH₃ to one symbol and expand our view to an ensemble.'],
  [.71,'Каждый новый значок обозначает отдельную частицу. При высоком pH преобладает NH₃.','Each new symbol denotes a separate particle. At high pH, NH₃ predominates.'],
  [.79,'Снижаем pH. Доля NH₄⁺ растёт вместе с точкой на кривой.','Lower pH. The NH₄⁺ fraction rises together with the point on the curve.'],
  [.92,'Остановимся при pH = pKa. Видны десять NH₄⁺ и десять NH₃.','Pause at pH = pKa. We see ten NH₄⁺ and ten NH₃.'],
  [.97,'Половина частиц — в каждой форме. У отдельной частицы нет половины протона.','Half the particles occupy each form. No individual particle has half a proton.']
 ]),
 captions:['Находим электронные пары.','Следим за двумя электронными стрелками.','Пара остаётся у N, а H переходит к воде.','Один пример раскрывается в ансамбль частиц.','Снижаем pH и останавливаемся при равных долях.'],
 enCaptions:['Locate the electron pairs.','Follow the two electron arrows.','The pair stays on N while H moves to water.','One example expands into an ensemble of particles.','Lower pH and stop at equal fractions.'],
 source:'OpenStax · Organic Chemistry §§24.3–24.5',url:'https://openstax.org/books/organic-chemistry/pages/24-3-basicity-of-amines',
 answer:'NH₄⁺ ⇌ NH₃ + H⁺. При pH=pKa=9.26 доли равны: 10 из 20 частиц находятся в каждой форме.',enAnswer:'NH₄⁺ ⇌ NH₃ + H⁺. At pH=pKa=9.26 the fractions are equal: ten of twenty particles occupy each form.',
 note:'Пара NH₄⁺/NH₃, pKa=9.26 по OpenStax 24.1; значение фиксировано для учебной модели. NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺. Стрелки обозначают распределение электронных пар, а последующее движение H — отдельную схематическую анимацию ядра, не молекулярную динамику. Во время этого пояснения промежуточная запись NH₃ + H⁺ + H₂O сохраняет атомы, 16 валентных электронов и заряд +1; она не утверждает существование свободного долгоживущего H⁺ в воде. N–H снимается до движения, O–H появляется после прибытия, пары и заряды меняются согласованно. Вода имеет угол 104.5°, остальные позы — схемы связности. Уменьшение рисунка и появление 19 дополнительных значков — переход от одного примера к популяции, не размножение молекулы. В ансамбле 20 N, водный резервуар обменивается H⁺; противоионы опущены. Идеальная формула f=1/(1+10^(pH−pKa)); pH уменьшается от 11.26 до 9.26, затем фиксирован в последней паузе. Число значков округлено; точная доля показана отдельно. Форма NH₃, переданная из большого рисунка в первый значок, остаётся NH₃ при всех показанных долях. Формула с H⁺ сокращённо опускает растворитель. Время рассказа не равно времени установления равновесия.',
 enNote:'The NH₄⁺/NH₃ pair uses pKa=9.26 from OpenStax Table 24.1, fixed for this teaching model. NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺. Arrows describe electron-pair allocation; subsequent H motion separately illustrates the nucleus and is not molecular dynamics. The explanatory in-transit notation NH₃ + H⁺ + H₂O conserves atoms, 16 valence electrons and charge +1; it does not assert a long-lived free H⁺ species in water. N–H is removed before motion; O–H appears upon arrival, with coordinated pair/charge changes. Water has a 104.5° angle; the other poses show connectivity. Shrinking the diagram and adding 19 symbols switches from one example to a population, not molecular replication. The ensemble retains 20 N atoms and exchanges H⁺ with a water reservoir; counterions are omitted. The ideal fraction is f=1/(1+10^(pH−pKa)); pH falls from 11.26 to 9.26 and is held during the final pause. Symbol counts are rounded while the exact fraction is shown separately. The NH₃ handed from the enlarged drawing into the first symbol stays NH₃ across the displayed compositions. The H⁺ equation abbreviates solvent water. Narration time is not equilibration time.',
 draw(g,H){
  const micro=H.group(g);micro.dataset.microscopicProtonation='';const microFormula=H.formula(micro,95,209,1090,'NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺',31);
  const dx=90*Math.sin(104.5*Math.PI/360),dy=90*Math.cos(104.5*Math.PI/360);
  const actor=CH.molecule(micro,{atoms:[{id:'N',element:'N',x:260,y:350,charge:1},{id:'H1',element:'H',x:165,y:350},{id:'H2',element:'H',x:260,y:274},{id:'H3',element:'H',x:260,y:426},{id:'H4',element:'H',x:355,y:350},{id:'O',element:'O',x:650,y:350,lonePairs:2},{id:'H5',element:'H',x:650-dx,y:350+dy},{id:'H6',element:'H',x:650+dx,y:350+dy}],bonds:[{id:'N-H1',a:'N',b:'H1'},{id:'N-H2',a:'N',b:'H2'},{id:'N-H3',a:'N',b:'H3'},{id:'transfer-N-H',a:'N',b:'H4'},{id:'transfer-O-H',a:'O',b:'H4',order:0},{id:'O-H5',a:'O',b:'H5'},{id:'O-H6',a:'O',b:'H6'}],showLonePairs:true});actor.g.dataset.protonationExchange='';
  const hCharge=actor.atoms.H4.querySelector('[data-formal-charge]');hCharge.setAttribute('y','21');L.contract(hCharge,{space:actor.atoms.H4,box:{x:5,y:8.5,width:40,height:25}});
  const oPairs=[...actor.atoms.O.querySelectorAll('[data-lone-pair]')].filter(n=>n.getAttribute('display')!=='none'),centroid=n=>[0,1].map(i=>[...n.children].reduce((s,d)=>s+(+d.getAttribute(i?'cy':'cx')),0)/2),reactive=oPairs.sort((a,b)=>centroid(a)[0]-centroid(b)[0])[0],sourceO=centroid(reactive).map((v,i)=>v+[650,350][i]);reactive.dataset.reactivePair='water';
  const sourceN=[307.5,350],destinationN=[289,350],sourceSpot=H.circle(micro,...sourceO,10,C.gold,0),bondSpot=H.circle(micro,...sourceN,10,C.gold,0);
  const electronLayer=H.group(micro),attack=H.arrow(electronLayer,...sourceO,377,350,C.teal,'electron-pair',70),release=H.arrow(electronLayer,...sourceN,...destinationN,C.gold,'electron-pair',-72);attack.g.dataset.protonationArrow='water-pair-to-H';release.g.dataset.protonationArrow='NH-pair-to-N';
  const bondPair=pair(H,micro,'NH-source');move(H,bondPair,...sourceN);const hMarker=H.circle(micro,355,350,22,C.gold,0);hMarker.dataset.transferredAtomFocus='H4';
  const heading=H.label(micro,876,267,336,64,'','',25,C.gold),ledger=H.label(micro,872,341,340,145,'','',22,C.white);
  const ensemble=H.group(g);ensemble.dataset.protonationEnsemble='20';const ensembleFormula=H.formula(ensemble,89,209,1105,'NH₄⁺ ⇌ NH₃ + H⁺ · pKa = 9.26',29),populationLabel=H.label(ensemble,84,251,606,33,'20 частиц · две формы','20 particles · two distinct forms',21,C.grey);
  const symbols=[];for(let i=0;i<20;i++){const holder=H.group(ensemble);holder.dataset.ensembleParticle=String(i);const box=H.rect(holder,-49.5,-14.5,99,29,C.teal),label=H.label(holder,-49.5,-14.5,99,29,'NH₃','NH₃',20,C.white);symbols.push({holder,box,label,target:[154.5+(i%5)*111,302.5+Math.floor(i/5)*36]});}
  symbols[0].holder.dataset.fromMicroscopicAtom='N';
  const count=H.label(ensemble,85,431,625,34,'','',23,C.gold),reservoir=H.label(ensemble,80,465,637,29,'Водный резервуар обменивается H⁺','A water reservoir exchanges H⁺',19,C.grey);
  const graph=H.group(ensemble),plot=H.plot(graph,{x:820,y:300,w:345,h:115,xmin:PKA-2,xmax:PKA+2,ymin:0,ymax:1,xt:[PKA-2,PKA,PKA+2],yt:[0,.5,1],title:'Доля NH₄⁺',enTitle:'NH₄⁺ fraction',xlabel:'pH'}),curve=plot.curve(x=>PH.protonated(x,PKA),C.blue),cursor=plot.point(C.gold);curve.el.dataset.protonationCurve='';cursor.el.dataset.protonationMarker='';
  const half=H.group(graph);H.line(half,plot.x(PKA),plot.y(0),plot.x(PKA),plot.y(1),C.dim,'3 5');H.line(half,plot.x(PKA-2),plot.y(.5),plot.x(PKA+2),plot.y(.5),C.dim,'3 5');H.circle(half,plot.x(PKA),plot.y(.5),11,C.gold,0);half.dataset.halfProtonation='';
  const handoff=H.circle(g,260,350,32,C.gold,0);handoff.dataset.speciesHandoff='N-to-ensemble-0';
  return {actor,paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),departed=p>=.36,arrived=p>=.48,flight=ease(phase(p,.36,.48)),position=bezier([355,350],[495,342],[650,280],flight),zoom=ease(phase(p,.59,.69)),scale=mix(1,.28,zoom),center=point([260,350],[154.5,302.5],zoom),fading=phase(p,.67,.71);
   actor.set({positions:{H4:position},bondOrders:{'transfer-N-H':departed?0:1,'transfer-O-H':arrived?1:0},charges:{N:departed?0:1,O:arrived?1:0,H4:departed&&!arrived?1:0},lonePairs:{N:departed?1:0,O:arrived?1:2}});actor.place(center[0]-260*scale,center[1]-350*scale,scale);
   const solventFade=1-phase(p,.55,.61);for(const id of ['O','H4','H5','H6'])H.show(actor.atoms[id],solventFade);for(const b of actor.g.querySelectorAll('[data-bond-id^="O-"],[data-bond-id="transfer-O-H"]'))H.show(b,solventFade);H.show(actor.g,1-fading);
   const arrowFade=1-phase(p,.335,.36),attackT=phase(p,.16,.255),releaseT=phase(p,.245,.33);trace(H,attack,attackT);trace(H,release,releaseT);H.show(electronLayer,arrowFade);H.show(sourceSpot,phase(p,.08,.115)*arrowFade);H.show(bondSpot,phase(p,.115,.15)*arrowFade);H.show(bondPair,phase(p,.115,.15)*arrowFade);
   hMarker.setAttribute('cx',position[0]);hMarker.setAttribute('cy',position[1]);H.show(hMarker,phase(p,.33,.35)*(1-phase(p,.50,.54)));
   text(H,heading,arrived?'NH₃ + H₃O⁺':departed?'H⁺ движется к воде':p<.24?'Пара O → H':'Пара N–H → N',arrived?'NH₃ + H₃O⁺':departed?'H⁺ moves toward water':p<.24?'O pair → H':'N–H pair → N');
   text(H,ledger,arrived?'N: 3 связи · 1 пара · 0\nO: 3 связи · 1 пара · +1':departed?'N: 3 связи · 1 пара · 0\nH⁺: целое ядро\nO пока остаётся водой':'N: 4 связи · 0 пар · +1\nO: 2 связи · 2 пары · 0',arrived?'N: 3 bonds · 1 pair · 0\nO: 3 bonds · 1 pair · +1':departed?'N: 3 bonds · 1 pair · 0\nH⁺: a whole nucleus\nO remains water for now':'N: 4 bonds · 0 pairs · +1\nO: 2 bonds · 2 pairs · 0');
   H.show(heading,1-phase(p,.57,.62));H.show(ledger,1-phase(p,.57,.62));H.show(microFormula,1-phase(p,.58,.65));H.show(ensembleFormula,phase(p,.65,.71));H.show(populationLabel,phase(p,.69,.74));
   const pH=reservoirPH(p),fraction=PH.protonated(pH,PKA),n=Math.round(20*fraction);symbols.forEach(({holder,box,label,target},i)=>{const t=ease(phase(p,i===0?.665:.68+i*.0025,i===0?.71:.73+i*.0025)),pos=point([154.5,302.5],target,t),acid=i>=20-n;move(H,holder,...pos);H.show(holder,t);holder.dataset.chemicalSpecies=acid?'NH4+':'NH3';holder.dataset.formalCharge=acid?'1':'0';holder.dataset.boundHydrogens=acid?'4':'3';box.setAttribute('stroke',acid?C.blue:C.teal);box.setAttribute('fill',acid?C.blue:C.teal);label.setText(acid?'NH₄⁺':'NH₃');});
   const graphIn=phase(p,.68,.77);H.show(graph,graphIn);trace(H,curve.el,graphIn);cursor.set(pH,fraction);H.show(half,phase(p,.90,.92));H.show(count,phase(p,.74,.78));H.show(reservoir,phase(p,.74,.78));text(H,count,`pH ${pH.toFixed(2)} · NH₄⁺ ${n}/20 · NH₃ ${20-n}/20`,`pH ${pH.toFixed(2)} · NH₄⁺ ${n}/20 · NH₃ ${20-n}/20`);
   handoff.setAttribute('cx',center[0]);handoff.setAttribute('cy',center[1]);handoff.setAttribute('r',mix(32,18,zoom));H.show(handoff,phase(p,.55,.59)*(1-phase(p,.72,.77)));
   return {stage,representation:p<.59?'individual proton exchange':p<.78?'example-to-ensemble expansion':'equilibrium ensemble',microscopicState:arrived?'NH3 + H3O+':departed?'NH3 + H+ + H2O':'NH4+ + H2O',microscopic:census(actor),protonPosition:position,protonInTransit:departed&&!arrived,arrowProgress:{waterPair:attackT,bondPair:releaseT},electronArrowSources:{waterPair:sourceO,bondPair:sourceN},nitrogenPairDestination:destinationN,handoffProgress:zoom,ensembleExpansion:phase(p,.68,.78),pH:p>=.70?pH:null,pKa:PKA,protonatedFraction:p>=.70?fraction:null,shownProtonated:p>=.70?n:null,shownDeprotonated:p>=.70?20-n:null,ensembleSize:20,ensembleNitrogenAtoms:20,ensembleBoundHydrogens:60+n,ensembleFormalCharge:n,roundedEnsemble:true,reservoirExchangesProtons:true,halfFractionHeld:p>=.92,progressIsPhysicalTime:false};
  }};
 }
});
})(window);
