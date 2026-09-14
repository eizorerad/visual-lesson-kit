/* Energy coupling and arrow semantics. Authored explanations, not trajectories. */
(function(global){'use strict';
const list=global.CHEMISTRY_APPLICATIONS=global.CHEMISTRY_APPLICATIONS||[];
const stages=(ru,en)=>ru.map((label,i)=>({at:i/ru.length,label,enLabel:en[i]}));
const phase=(p,a,b)=>F.phase(p,a,b);
function set(node,attrs){for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));}
list.push({id:'atp',title:'От протона к синтезу ATP',enTitle:'From protons to ATP synthesis',question:'Как изменение заряда приводит к смене состояния фермента?',enQuestion:'How does a charge change couple to an enzyme state change?',control:'Ход объяснения',enControl:'Explanation progress',duration:52000,
 stages:stages(['Градиент','Заряд c','Ротор','Синтез','Выход ATP'],['Gradient','Charge on c','Rotor','Synthesis','ATP release']),
 source:'PDB-101 · ATP synthase; Watt et al. · 2XND',url:'https://pdb101.rcsb.org/motm/72',
 answer:'Протонирование и депротонирование c-субъединиц сопряжены с вращением. Ось γ меняет состояния β-участков F₁: связывание ADP и Pᵢ, образование и выход ATP.',enAnswer:'Protonation and deprotonation of c subunits couple to rotation. The γ axle changes F₁ β-site states: binding ADP and Pᵢ, ATP formation and release.',
 note:'Митохондриальная ориентация: F₁ обращён в матрикс, куда при синтезе направлен поток H⁺ из межмембранного пространства. Движущая сила включает ΔpH и Δψ, а не только число протонов. Общий вид сбоку отделён от вида кольца сверху. Восемь c-субъединиц относятся к бычьему F₁–c₈-комплексу <a href="https://www.rcsb.org/structure/2XND">2XND</a>; мембрана, a-субъединица и периферический статор добавлены как контекст, не как координаты этой записи. R–COO⁻/R–COOH — один локальный карбоксильный участок c-субъединицы (Glu в бычьем комплексе). Две линии доступа схематизируют раздельные полукaналы a-субъединицы; это не протонный туннель сквозь центральную ось. Показан условный оборот γ за три шага по 120°; один H⁺ не приравнен к одному такому шагу. Для полного оборота c₈-системы: 8 H⁺ через F₀ и 3 ATP через три β-участка; это не универсальная стехиометрия и не полный транспортный расход митохондрии. Фосфатные кружки — группы, не атомы P; Pα, Pβ и Pγ сохраняют идентичность. Образование ATP — упрощённая биохимическая запись ADP + Pᵢ → ATP + H₂O; Mg²⁺ и pH-зависимые заряды опущены. Точные химические подшаги не моделируются. Обратная работа зависит от энергетики и регуляции.',
 enNote:'Mitochondrial orientation: F₁ faces the matrix, the destination of synthesis-direction H⁺ flux from the intermembrane space. The driving force includes ΔpH and Δψ, not just proton counts. The side view and rotor top view are distinct. Eight c subunits refer to bovine F₁–c₈ <a href="https://www.rcsb.org/structure/2XND">2XND</a>; membrane, subunit a and peripheral stator supply context, not coordinates from that entry. R–COO⁻/R–COOH depicts one local c-subunit carboxyl group (Glu in the bovine complex). Separate access lines schematize the two a-subunit half-channels, not a proton tunnel through the central axle. One authored γ turn is shown as three 120° steps; one H⁺ is not equated to one such step. A full c₈ turn translocates 8 H⁺ through F₀ and produces 3 ATP across three β sites, not a universal ratio or the full mitochondrial transport cost. Phosphate circles are groups, not P atoms; α, β and γ retain identity. ATP formation uses the simplified biochemical notation ADP + Pᵢ → ATP + H₂O; Mg²⁺ and pH-dependent charges are omitted. Chemical substeps are not modeled. Reverse operation depends on energetics and regulation.',
 narration:[
 {at:0,ru:'Начнём с мембраны. Разность pH и потенциала задаёт поток H⁺ в матрикс.',en:'Start at the membrane. Differences in pH and voltage drive H⁺ flux into the matrix.'},
 {at:.10,ru:'Приблизим один участок c-кольца: здесь химическое связывание меняет заряд.',en:'Zoom into one c-ring site: chemical binding changes charge here.'},
 {at:.23,ru:'H⁺ подходит к COO⁻. При связывании возникает O–H, а локальная группа становится нейтральной.',en:'H⁺ approaches COO⁻. Binding creates O–H and neutralizes the local group.'},
 {at:.32,ru:'Заряд участка влияет на его взаимодействие с окружением. Это сопряжено с вращением кольца и оси γ.',en:'The site’s charge changes its interaction with its surroundings. This couples to ring and γ-axle rotation.'},
 {at:.48,ru:'У другого полукaнала H⁺ может выйти в матрикс. COO⁻ восстанавливается; статор удерживает корпус.',en:'At the other half-channel H⁺ can exit into the matrix. COO⁻ returns; the stator holds the housing.'},
 {at:.57,ru:'Проследим ось γ вниз. Она связывает вращение кольца с изменением формы F₁.',en:'Follow γ downwards. The axle couples ring rotation to changes in F₁ shape.'},
 {at:.66,ru:'Приблизим один β-участок. Он удерживает ADP и отдельную фосфатную группу Pᵢ.',en:'Zoom into one β site. It holds ADP and the separate phosphate group Pᵢ.'},
 {at:.73,ru:'Участок сжимается и удерживает ADP с Pᵢ. После присоединения Pᵢ станет третьей фосфатной группой ATP.',en:'The site tightens and holds ADP with Pᵢ. After joining, Pᵢ will be ATP’s third phosphate group.'},
 {at:.81,ru:'ATP ещё удерживается. Следующий поворот γ меняет форму участка и открывает выход.',en:'ATP is still held. Further γ rotation changes the site’s shape and opens an exit.'},
 {at:.90,ru:'Через открывшийся участок выходит целая ATP: аденозин и все три фосфатные группы вместе.',en:'Intact ATP exits the open site: adenosine and all three phosphate groups together.'},
 {at:.98,ru:'Поток H⁺ дал энергию движению и смене формы. Атомы ATP пришли из ADP и Pᵢ.',en:'H⁺ flux supplied energy for motion and shape changes. ATP’s atoms came from ADP and Pᵢ.'}
 ],
 captions:[
  'F₁ находится со стороны матрикса. Поток H⁺ через F₀ обеспечивается разностью pH и электрического потенциала.',
  'Карбоксильная группа c-субъединицы связывает H⁺: COO⁻ превращается в COOH, и локальный заряд исчезает.',
  'Чередование протонирования и депротонирования сопряжено с вращением c-кольца и оси γ. Статор остаётся на месте.',
  'ADP и Pᵢ удерживаются в каталитическом участке. Смена его формы помогает образовать связанную ATP.',
  'Следующая смена формы открывает участок и освобождает ATP. Протоны служат источником энергии; они не превращаются в ATP.'
 ],enCaptions:[
  'F₁ faces the matrix. H⁺ flux through F₀ is driven by differences in pH and electrical potential.',
  'A c-subunit carboxyl group binds H⁺: COO⁻ becomes COOH and its local charge is neutralized.',
  'Alternating protonation and deprotonation couple to c-ring and γ-axle rotation. The stator stays fixed.',
  'ADP and Pᵢ are held in a catalytic site. Its changing conformation helps form bound ATP.',
  'The next conformation opens the site and releases ATP. Protons supply energy; they do not turn into ATP.'
 ],
 draw(g,H){
  const side=H.group(g);side.dataset.atpView='side';
  H.label(side,82,215,580,34,'Межмембранное пространство','Intermembrane space',22,C.grey);
  H.label(side,82,251,158,32,'ΔpH, Δψ','ΔpH, Δψ',21,C.gold);
  [298,345].forEach(y=>{H.line(side,93,y,283,y,C.grey);H.line(side,421,y,511,y,C.grey);});
  H.label(side,94,348,170,32,'Мембрана','Membrane',20,C.grey);
  const motor=H.rect(side,329,290,88,63,C.blue);motor.dataset.atpMotor='c-ring-side';
  [345,367,389,411].forEach(x=>H.line(side,x,300,x,343,C.blue));
  const stator=H.path(side,'M419 311 L468 311 L468 427 L431 427',C.grey,2);stator.dataset.atpStator='';
  H.label(side,467,368,125,31,'Статор','Stator',20,C.grey);
  H.rect(side,283,287,39,68,C.purple);H.label(side,284,300,37,38,'a','a',23,C.purple);
  const inlet=H.path(side,'M265 264 L292 264 L292 310 L329 310',C.teal,1.8);inlet.dataset.protonHalfChannel='in';
  const outlet=H.path(side,'M329 337 L309 337 L309 382 L280 382',C.teal,1.8);outlet.dataset.protonHalfChannel='out';
  H.arrow(side,265,267,265,291,C.teal,'reaction');H.arrow(side,280,359,280,383,C.teal,'reaction');
  H.label(side,212,251,49,33,'H⁺','H⁺',22,C.teal);H.label(side,224,373,49,32,'H⁺','H⁺',22,C.teal);
  const axle=H.line(side,373,354,373,426,C.gold);set(axle,{'stroke-width':3,'data-atp-axle':''});
  H.label(side,383,354,55,36,'γ','γ',25,C.gold);
  const f1=H.el(side,'ellipse',{cx:373,cy:430,rx:69,ry:38,fill:C.teal,'fill-opacity':.10,stroke:C.teal,'stroke-width':1.3,'vector-effect':'non-scaling-stroke'});
  H.label(side,321,411,103,38,'F₁ · β','F₁ · β',27,C.teal);H.label(side,107,444,195,33,'Матрикс','Matrix',23,C.grey);
  H.label(side,302,470,260,25,'Вид сбоку · схема','Side view · schematic',18,C.grey);
  const top=H.group(g);top.dataset.atpView='top';H.label(top,487,232,210,48,'c₈ · вид сверху','c₈ · top view',20,C.grey);
  const rotor=H.group(top);rotor.dataset.atpRotor='';H.circle(rotor,0,0,44,C.blue,0);
  for(let i=0;i<8;i++){const t=i*Math.PI/4;const n=H.circle(rotor,44*Math.cos(t),44*Math.sin(t),7,i?C.blue:C.gold,.7);n.dataset.cSubunit=String(i);}
  H.path(rotor,'M0 -28 L14 20 L-11 10 Z',C.gold,2);H.circle(top,592,324,3,C.grey,1);
  const angleLabel=H.label(top,501,386,185,34,'','',22,C.gold);
  const flux=Array.from({length:5},(_,i)=>{const n=H.circle(side,0,0,3,C.teal,1);n.dataset.atpFlux=String(i);return n;});
  const transfer=H.path(side,'M373 357 L373 405',C.gold,5);transfer.dataset.mechanicalLink='';
  const acidLink=H.path(g,'M411 308 Q615 270 781 330',C.gold,1);
  const betaLink=H.path(g,'M432 429 Q602 446 739 375',C.teal,1);
  const intro=H.group(g);H.label(intro,743,230,451,81,'Градиент H⁺ → вращение\n→ химическая работа','H⁺ gradient → rotation\n→ chemical work',27,C.white);
  H.label(intro,751,336,435,111,'ADP + Pᵢ → ATP + H₂O\nF₁: три каталитических β-участка','ADP + Pᵢ → ATP + H₂O\nF₁: three catalytic β sites',24,C.grey);
  const chemistry=H.group(g);H.label(chemistry,741,216,460,50,'Карбоксильная группа участка c','A c-site carboxyl group',23,C.grey);
  const acid=CH.molecule(chemistry,{x:929,y:353,atoms:[{id:'R',element:'R',x:-112,y:0},{id:'C',element:'C',x:-34,y:0},{id:'O1',element:'O',x:-34,y:-73,lonePairs:2},{id:'O2',element:'O',x:47,y:0,charge:-1,lonePairs:3},{id:'H',element:'H',x:241,y:0,charge:1}],bonds:[{id:'R-C',a:'R',b:'C'},{id:'C=O',a:'C',b:'O1',order:2},{id:'C-O',a:'C',b:'O2'},{id:'O-H',a:'O2',b:'H',order:0}],showLonePairs:false});acid.g.dataset.atpCarboxyl='';
  const acidTexts=[...acid.g.querySelectorAll('text')];
  const acidRead=H.label(chemistry,747,414,450,68,'','',23,C.gold);
  const catalysis=H.group(g);H.label(catalysis,742,218,459,50,'Один β-участок F₁ · крупный план','One F₁ β site · enlarged',23,C.grey);
  const pocket=H.path(catalysis,'',C.teal,2);pocket.dataset.atpPocket='';const gate=H.path(catalysis,'M741 362 Q741 397 780 397 L1165 397 Q1204 397 1204 362',C.teal,2);
  const packet=H.group(catalysis);packet.dataset.atpPhosphates='';
  H.rect(packet,755,330,84,41,C.grey);H.label(packet,755,330,84,41,'Ado','Ado',24,C.grey);
  H.line(packet,839,350,876,350,C.grey);H.line(packet,914,350,969,350,C.grey);
  const labels=[];for(const [x,t]of[[895,'α'],[988,'β'],[1143,'Pᵢ']]){const unit=H.group(packet);H.circle(unit,0,0,20,C.gold,.08);const l=H.label(unit,-25,-19,50,38,t,t,22,C.gold);labels.push({unit,l,x});}
  const newBond=H.line(packet,1008,350,1061,350,C.gold);newBond.dataset.atpNewLink='phosphoanhydride';
  const stateLabel=H.label(catalysis,755,261,435,44,'','',24,C.teal);
  H.label(catalysis,751,462,444,32,'Кружки — фосфатные группы','Circles denote phosphate groups',20,C.grey);
  const water=H.label(catalysis,1120,398,79,34,'H₂O','H₂O',20,C.grey);
  return {paint(p){
   const step=Math.min(4,Math.floor((p+1e-8)*5));
   const angle=120*(phase(p,.32,.48)+phase(p,.66,.79)+phase(p,.83,.98));
   rotor.setAttribute('transform',`translate(592 324) rotate(${angle})`);angleLabel.setText('γ: '+Math.round(angle)+'°');
   H.show(top,.25+.75*phase(p,.10,.20));H.show(intro,1-phase(p,.10,.16));
   H.trace(inlet,phase(p,.01,.09));H.trace(outlet,phase(p,.48,.55));
   flux.forEach((n,i)=>{const q=(p*5+i/5)%1;
    // Flux symbols, not tracked protons or a claim of one proton per rotor step.
    const incoming=q<.5,t=incoming?q*2:(q-.5)*2;
    const points=incoming?[[265,264],[292,264],[292,310],[329,310]]:[[329,337],[309,337],[309,382],[280,382]];
    const lengths=points.slice(1).map((v,j)=>Math.hypot(v[0]-points[j][0],v[1]-points[j][1]));let d=t*lengths.reduce((a,b)=>a+b,0),j=0;while(j<lengths.length-1&&d>lengths[j])d-=lengths[j++];const u=d/lengths[j];
    set(n,{cx:points[j][0]+(points[j+1][0]-points[j][0])*u,cy:points[j][1]+(points[j+1][1]-points[j][1])*u});
    H.show(n,p<.015?0:incoming?1:phase(p,.48,.55));});
   const zoomIn=phase(p,.12,.23),zoomOut=phase(p,.53,.59),zoom=zoomIn*(1-zoomOut),small=.085;
   H.move(chemistry,(411-929)*(1-zoom),(307-353)*(1-zoom),1);
   // Keep the same molecular object through the change of scale.
   acid.place(929,353,small+(1-small)*zoom);
   H.show(chemistry,p<.1?0:1);
   // Titles and readout stay in their final positions while the molecular inset travels.
   const chemLabels=[...chemistry.children].filter(n=>n!==acid.g);chemLabels.forEach(n=>H.show(n,zoom>.995?1:0));
   H.trace(acidLink,zoom);H.show(acidLink,(1-zoomOut)*zoomIn);
   const approach=phase(p,.23,.30),depart=phase(p,.48,.53),protonated=p>=.30&&p<.48;
   const hx=p<.48?241-105*approach:136+105*depart;
   acid.set({positions:{H:[hx,0]},charges:{O2:protonated?0:-1,H:protonated?0:1},bondOrders:{'O-H':protonated?1:0},lonePairs:{O2:protonated?2:3}});
   acidTexts.forEach(n=>H.show(n,phase(zoom,.24,.42)));
   acidRead.setText(H.tr(protonated?'COOH · локальный заряд 0':'COO⁻ + H⁺ · локальная сумма 0',protonated?'COOH · local charge 0':'COO⁻ + H⁺ · local sum 0'));
   H.trace(transfer,phase(p,.56,.62));H.show(transfer,1-phase(p,.66,.71));
   const flight=phase(p,.59,.635),betaZoom=phase(p,.635,.68),betaScale=.11+.89*betaZoom;
   // Move the compact actor below the top-view labels first, then enlarge wholly in the right-hand space.
   const betaX=373+(972-373)*flight,betaY=430-75*betaZoom;
   H.move(catalysis,betaX-972*betaScale,betaY-355*betaScale,betaScale);
   [...catalysis.children].filter(n=>n!==packet&&n!==pocket&&n!==gate).forEach(n=>H.show(n,betaZoom>.995?1:0));
   H.show(catalysis,p<.59?0:1);H.trace(betaLink,betaZoom);H.show(betaLink,betaZoom);
   const joined=p>=.79,released=p>=.98,lift=phase(p,.90,.98)*82;
   H.move(packet,0,lift);
   labels.forEach((o,i)=>{const x=i===2?1143-62*phase(p,.70,.79):o.x;H.move(o.unit,x,350);o.l.setText(i===2?(joined?'γ':'Pᵢ'):i===0?'α':'β');});
   H.show(newBond,joined?1:0);H.show(water,joined&&betaZoom>.995?1:0);
   const tightening=phase(p,.70,.79),opening=phase(p,.83,.92),roof=307+12*tightening-9*opening,left=741-12*opening,right=1204;
   set(pocket,{d:`M${left} 375 L${left} 346 Q${left} ${roof} 780 ${roof} L1165 ${roof} Q${right} ${roof} ${right} 346 L${right} 375`});
   set(gate,{d:`M${741-12*opening} 362 Q741 ${397+18*opening} 780 ${397+18*opening} L${1165-180*opening} ${397+18*opening}`});
   H.show(gate,1-opening);
   stateLabel.setText(H.tr(released?'O · ATP освобождена':p>=.83?'T → O · открытие и выход ATP':joined?'T · ATP связана':'L → T · ADP + Pᵢ удерживаются',released?'O · ATP released':p>=.83?'T → O · opening and ATP release':joined?'T · ATP bound':'L → T · ADP + Pᵢ held'));
   f1.setAttribute('fill-opacity',.1+.12*betaZoom);
   g.dataset.atpChemicalState=joined?'ATP':'ADP+Pi';return {angle,phase:step,cSubunits:8,catalyticSites:3,organism:'Bos taurus',schematic:true,physicalTime:false,sideView:'matrix below',protonFlux:'IMS to matrix',statorFixed:true,carboxylProtonated:protonated,localPairCharge:CH.composition(acid.state).charge,phosphateGroups:3,adpPhosphates:joined?0:2,freePhosphate:joined?0:1,atpPhosphates:joined?3:0,atpReleased:released,oneProtonPer120Degrees:false,carboxylZoom:zoom,betaZoom,opening};
  }};
 }
});

list.push({id:'arrows',title:'Читаем стрелку по её смыслу',enTitle:'Read an arrow by its meaning',question:'Движутся электроны, меняются вещества или складываются векторы?',enQuestion:'Are electrons moving, species reacting, or vectors being described?',control:'Ход объяснения',enControl:'Explanation progress',duration:60000,
 stages:stages(['Электроны','Реакции','Резонанс и сила','Диполи'],['Electrons','Reactions','Resonance and force','Dipoles']),
 source:'OpenStax · Curved arrows; IUPAC · electric dipole moment',url:'https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms',
 answer:'Изогнутая стрелка начинается у электронов. Реакционная стрелка соединяет реагенты и продукты, резонансная — записи одной структуры. У векторной стрелки нужно определить величину и направление.',enAnswer:'A curved arrow starts at electrons. A reaction arrow connects reactants and products; a resonance arrow connects descriptions of one structure. For a vector arrow, define its quantity and direction.',
 note:'Восемь нотаций: электронная пара, один электрон, реакция, равновесие, резонанс, сила, химический диполь, физический диполь. Разрыв H–H показан как учебная запись распределения электронов: гетеролиз даёт H⁺/H⁻, гомолиз — два H·; это не прогноз самопроизвольности. Резонансные карбоксилатные формы отличаются положением π-пары и формального заряда, не расположением ядер, и не чередуются во времени. Притяжение двух противоположных зарядов показано силами одинаковой величины в противоположных направлениях; остальные силы не рассматриваются. Химическая стрелка с крестом идёт к δ⁻, физический p — от − к +, см. <a href="https://goldbook.iupac.org/terms/view/E01929">IUPAC</a>. Дипольные панели используют одну и ту же ориентацию H–Cl. Чертёж качественный: длины стрелок разных физических и химических величин не сравниваются.',
 enNote:'Eight notations: electron pair, single electron, reaction, equilibrium, resonance, force, chemical dipole and physical dipole. H–H cleavage is an electron-allocation example: heterolysis gives H⁺/H⁻, homolysis gives two H·; spontaneity is not predicted. Carboxylate resonance contributors differ in π-pair/formal-charge placement, not nuclear positions, and do not alternate in time. Opposite point charges have equal and opposite attractive forces; other forces are excluded. A crossed chemical dipole arrow points to δ⁻; physical p points from − to +, per <a href="https://goldbook.iupac.org/terms/view/E01929">IUPAC</a>. Both dipole panels use the same H–Cl orientation. Drawing is qualitative; arrow lengths of different quantities are not compared.',
 narration:[
 {at:0,ru:'У стрелки сначала найдём хвост: здесь он стоит у двух электронов связи H–H.',en:'First find the tail: here it starts at the two electrons of an H–H bond.'},
 {at:.07,ru:'Полная головка забирает оба электрона к одному H. После переноса получатся H⁺ и H⁻.',en:'A full head assigns both electrons to one H. After transfer, the products will be H⁺ and H⁻.'},
 {at:.14,ru:'Однозубые головки делят пару: каждому H достаётся один электрон. После разделения пары получатся два радикала.',en:'Single barbs split the pair: each H receives one electron, which will give two radicals.'},
 {at:.23,ru:'Теперь сменим вопрос: какие вещества были и какие получились? Это уже реакционная стрелка.',en:'Now change the question: which substances went in and which came out? That is a reaction arrow.'},
 {at:.30,ru:'Считаем состав: два N и шесть H переходят из левой записи в правую. Стрелка не показывает механизм.',en:'Count the composition: two N and six H pass from the left expression to the right. The arrow does not show a mechanism.'},
 {at:.38,ru:'При равновесии превращения продолжаются в обе стороны. Равны скорости, а не обязательно количества веществ.',en:'At equilibrium, conversion continues both ways. Rates are equal; amounts need not be.'},
 {at:.48,ru:'Перейдём к резонансу. Сравним две записи одной структуры, без превращения одной в другую.',en:'Move to resonance. Compare two descriptions of one structure, not interconverting species.'},
 {at:.55,ru:'Ядра в обеих записях совпадают. Реальное распределение электронной плотности охватывает оба C–O.',en:'The nuclei match in both descriptions. The actual electron distribution extends over both C–O bonds.'},
 {at:.63,ru:'А эта стрелка начинается у частицы: это сила. При сближении зарядов обе силы растут одинаково.',en:'This arrow is attached to a particle: it is a force. As the charges approach, both forces grow equally.'},
 {at:.74,ru:'Наконец, полярная связь. Электронная плотность смещена к Cl, поэтому её концы имеют частичные заряды.',en:'Finally, a polar bond. Electron density shifts toward Cl, leaving partial charges at its ends.'},
 {at:.82,ru:'В химической нотации ставим крест у δ⁺ и ведём стрелку к δ⁻.',en:'In chemical notation, put the cross at δ⁺ and point the arrow toward δ⁻.'},
 {at:.90,ru:'Физический диполь p направлен наоборот: от минуса к плюсу. Молекула та же; изменилось определение стрелки.',en:'The physical dipole p points the other way, from minus to plus. The molecule is the same; the arrow’s definition differs.'}
 ],
 captions:['Полная головка переносит пару; однозубая — один электрон. Хвост ставим у исходной пары или связи.','Реакционная стрелка связывает вещества. В равновесии прямое и обратное превращения продолжаются с равными скоростями.','Резонанс — разные записи одной структуры. Сила — вектор, приложенный к конкретному телу или частице.','Для той же H–Cl химическая стрелка направлена к δ⁻, а физический диполь p — от минуса к плюсу.'],
 enCaptions:['A full head transfers a pair; one barb transfers one electron. The tail starts at the source pair or bond.','A reaction arrow connects species. At equilibrium, forward and reverse conversion continue at equal rates.','Resonance means different descriptions of one structure. A force is a vector acting on a specific body or particle.','For the same H–Cl, the chemical arrow points to δ⁻, while the physical dipole p points from minus to plus.'],
 draw(g,H){
  const viewport=H.group(g),clipId='arrow-story-viewport';
  const defs=H.el(viewport,'defs',{}),clip=H.el(defs,'clipPath',{id:clipId});H.el(clip,'rect',{x:80,y:213,width:1120,height:285});
  const world=H.group(viewport);world.setAttribute('clip-path',`url(#${clipId})`);
  const panels=Array.from({length:4},(_,i)=>{const n=H.group(world);n.dataset.arrowStation=String(i);return n;}),allArrows=[];
  function arr(parent,x1,y1,x2,y2,kind,curve=0){const a=H.arrow(parent,x1,y1,x2,y2,C.gold,kind,curve);allArrows.push(a);return a;}
  function title(parent,x,t,en){H.label(parent,x,220,521,47,t,en,25,C.white);}
  function foot(parent,x,t,en){H.label(parent,x,440,521,53,t,en,22,C.grey);}
  H.line(g,640,221,640,489,C.dim);
  title(panels[0],88,'Пара · полная головка','Pair · full arrowhead');title(panels[0],671,'Один e⁻ · однозубая головка','One e⁻ · single barb');
  const pairArrows=[],electronTokens=[],cleavageBonds=[],ionSigns=[];for(const [x,single]of[[175,false],[758,true]]){H.label(panels[0],x,334,55,44,'H','H',31,C.grey);H.label(panels[0],x+275,334,55,44,'H','H',31,C.grey);cleavageBonds.push(H.line(panels[0],x+57,356,x+273,356,C.grey));const mid=x+165;
   [-4,4].forEach((d,j)=>{const n=H.circle(panels[0],mid,356+d,2.5,C.gold,1);n.dataset.flowElectron=(single?'single':'pair')+j;electronTokens.push({n,x:mid,y:356+d,toX:single&&j===1?x+41:x+287,toY:326+d,from:single?.15:.075,to:single?.22:.135});});
   if(!single){ionSigns.push(H.label(panels[0],x+30,306,30,29,'+','+',22,C.gold));ionSigns.push(H.label(panels[0],x+306,306,30,29,'−','−',22,C.gold));}pairArrows.push(arr(panels[0],mid,356,x+287,326,single?'electron-single':'electron-pair',-57));if(single)pairArrows.push(arr(panels[0],mid,356,x+41,326,'electron-single',57));}
  foot(panels[0],88,'H–H → H⁺ + H⁻ · гетеролиз','H–H → H⁺ + H⁻ · heterolysis');foot(panels[0],671,'H–H → H· + ·H · гомолиз','H–H → H· + ·H · homolysis');
  title(panels[1],88,'Реакция · исходное и конечное','Reaction · initial and final');title(panels[1],671,'Равновесие · оба направления','Equilibrium · both directions');
  const counted=[];for(let i=0;i<8;i++){const n=H.circle(panels[1],180+i*16,408,4,i<2?C.blue:C.grey,1);n.dataset.stoichiometricCount=i<2?'N':'H';counted.push(n);}H.label(panels[1],93,327,235,58,'N₂ + 3 H₂','N₂ + 3 H₂',29,C.white);arr(panels[1],343,356,428,356,'reaction');H.label(panels[1],440,327,153,58,'2 NH₃','2 NH₃',29,C.white);
  H.label(panels[1],672,310,194,92,'HA + H₂O','HA + H₂O',25,C.white);arr(panels[1],889,356,968,356,'equilibrium');H.label(panels[1],980,310,220,92,'A⁻ + H₃O⁺','A⁻ + H₃O⁺',25,C.white);
  const exchange=[H.circle(panels[1],890,361,3,C.teal,1),H.circle(panels[1],968,351,3,C.teal,1)];
  foot(panels[1],88,'Стрелка не задаёт путь электронов','The arrow does not specify electron flow');foot(panels[1],671,'Равные скорости ≠ равные концентрации','Equal rates ≠ equal concentrations');
  title(panels[2],88,'Резонанс · те же ядра','Resonance · the same nuclei');title(panels[2],671,'Сила F · действие на частицу','Force F · acting on a particle');
  const forms=[];for(const [x,swap]of[[224,false],[470,true]]){const a=CH.molecule(panels[2],{x,y:354,atoms:[{id:'R',element:'R',x:0,y:-64},{id:'C',element:'C',x:0,y:0},{id:'O1',element:'O',x:-65,y:34,charge:swap?-1:0},{id:'O2',element:'O',x:65,y:34,charge:swap?0:-1}],bonds:[{id:'R-C',a:'R',b:'C'},{id:'C-O1',a:'C',b:'O1',order:swap?1:2},{id:'C-O2',a:'C',b:'O2',order:swap?2:1}]});a.g.dataset.resonanceContributor=swap?'2':'1';
   // Place the left oxygen's charge outside the inclined C–O bond.
   const charge=a.atoms.O1.querySelector('[data-formal-charge]');charge.setAttribute('x',-25);
   L.contract(charge,{space:a.atoms.O1,box:{x:-45,y:-33.5,width:40,height:25}});forms.push(a);}
  arr(panels[2],320,346,374,346,'resonance');foot(panels[2],88,'Не две молекулы и не переключение во времени','Not two molecules alternating in time');
  const forceBodies=[];[802,1090].forEach((x,i)=>{const body=H.group(panels[2]);body.dataset.forceBody=String(i);forceBodies.push(body);H.circle(body,x,355,27,i?C.blue:C.red,.08);H.label(body,x-25,333,50,44,i?'−':'+',i?'−':'+',32,i?C.blue:C.red);});
  const forces=[arr(panels[2],829,355,907,355,'force'),arr(panels[2],1063,355,985,355,'force')];foot(panels[2],671,'Притяжение: силы равны и противоположны','Attraction: equal and opposite forces');
  title(panels[3],88,'Химическая дипольная стрелка','Chemical dipole arrow');title(panels[3],671,'Физический дипольный момент p','Physical electric dipole p');
  const clouds=[];for(const [x,physical]of[[165,false],[748,true]]){H.label(panels[3],x,333,60,47,'H','H',32,C.grey);H.label(panels[3],x+302,333,68,47,'Cl','Cl',32,C.teal);H.line(panels[3],x+63,356,x+294,356,C.grey);const cloud=H.el(panels[3],'ellipse',{cx:x+180,cy:356,rx:65,ry:23,fill:C.teal,'fill-opacity':.12,stroke:'none','data-dipole-density':''});clouds.push({cloud,x});H.label(panels[3],x,383,61,30,'δ⁺','δ⁺',23,C.gold);H.label(panels[3],x+305,383,65,30,'δ⁻','δ⁻',23,C.gold);arr(panels[3],physical?x+304:x+56,305,physical?x+56:x+304,305,physical?'dipole-physics':'dipole-chemical');}
  foot(panels[3],88,'Крест у δ⁺ · головка к δ⁻','Cross at δ⁺ · head toward δ⁻');foot(panels[3],671,'p: от отрицательного конца к положительному','p: from the negative end to the positive end');
  // The camera links comparison examples on one board; each stop contains a physical or notational action.
  return {paint(p){
   const selected=Math.min(3,Math.floor((p+1e-8)*4));
   const camera=phase(p,.23,.27)+phase(p,.48,.52)+phase(p,.73,.77);
   panels.forEach((panel,i)=>H.move(panel,(i-camera)*1280,0));
   const bondLost=[p>=.135,p>=.22];cleavageBonds.forEach((n,i)=>H.show(n,bondLost[i]?0:1));ionSigns.forEach(n=>H.show(n,p>=.135?1:0));
   electronTokens.forEach(o=>{const t=phase(p,o.from,o.to),bend=-47*Math.sin(Math.PI*t);set(o.n,{cx:o.x+(o.toX-o.x)*t,cy:o.y+(o.toY-o.y)*t+bend});});
   pairArrows.forEach((a,i)=>H.trace(a,phase(p,i===0?.025:.14,i===0?.075:.18)));
   const reaction=allArrows.find(a=>a.g.dataset.arrowKind==='reaction');H.trace(reaction,phase(p,.275,.305));
   counted.forEach((n,i)=>{const t=phase(p,.305+i*.006,.355+i*.006);set(n,{cx:180+i*16+(300-i*7)*t,cy:408-12*Math.sin(Math.PI*t)});});
   const equilibrium=allArrows.find(a=>a.g.dataset.arrowKind==='equilibrium');H.trace(equilibrium,phase(p,.365,.39));
   exchange.forEach((n,i)=>{const t=Math.max(0,(p-.39)*22)%1;set(n,{cx:i?968-79*t:889+79*t});H.show(n,p>=.39?1:0);});
   const resonance=allArrows.find(a=>a.g.dataset.arrowKind==='resonance');H.trace(resonance,phase(p,.525,.55));
   // Contributor geometry and formal bond orders never flip in time. Trace both C–O branches together.
   forms.forEach(f=>{for(const id of ['C-O1','C-O2']){const bond=f.g.querySelector(`[data-bond-id="${id}"]`);bond.querySelectorAll('line').forEach(n=>{n.setAttribute('stroke',p>=.55&&p<.63?C.gold:C.grey);n.setAttribute('stroke-width',p>=.55&&p<.63?'2':'1.25');});}});
   const approach=phase(p,.63,.715),shift=22*approach,r=288-2*shift,force=40*(288/r)**2;
   forceBodies.forEach((n,i)=>H.move(n,i?-shift:shift,0));
   forces[0].set({x1:829+shift,x2:829+shift+force});forces[1].set({x1:1063-shift,x2:1063-shift-force});
   forces.forEach(a=>H.trace(a,phase(p,.615,.64)));
   clouds.forEach(o=>set(o.cloud,{cx:o.x+180+56*phase(p,.775,.82)}));
   for(const [kind,start,end,a,b] of [['dipole-chemical',221,469,.82,.885],['dipole-physics',1052,804,.90,.965]]){
    const arrow=allArrows.find(n=>n.g.dataset.arrowKind===kind),q=phase(p,a,b);
    arrow.set({x2:start+(end-start)*Math.max(.001,q)});H.show(arrow,q>0?1:0);
   }
   return {selected,camera,arrowCount:8,phaseCount:4,kinds:['electron-pair','electron-single','reaction','equilibrium','resonance','force','dipole-chemical','dipole-physics'],resonanceCharge:forms.map(a=>CH.composition(a.state).charge),electronNucleiFixed:true,dipoleDirectionsOpposite:true,forceSeparation:r,forceLength:force,heterolysisComplete:bondLost[0],homolysisComplete:bondLost[1]};
  }};
 }
});
})(window);
