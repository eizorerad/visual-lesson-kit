/* Proton transfer: arrows refer to fixed electron-pair sources, never nuclear paths. */
(function (global) {
'use strict';
const stages = [
  {at:0, label:'1 · Реагенты', enLabel:'1 · Reactants'},
  {at:.16, label:'2 · Две пары', enLabel:'2 · Two pairs'},
  {at:.32, label:'3 · Пара O → H', enLabel:'3 · O pair → H'},
  {at:.50, label:'4 · Пара N–H → N', enLabel:'4 · N–H pair → N'},
  {at:.68, label:'5 · Смена связей', enLabel:'5 · Bond changes'},
  {at:.84, label:'6 · Проверка', enLabel:'6 · Check'}
];
const captions = [
  'У N четыре связи и нет неподелённой пары. У O одна связь и три неподелённые пары.',
  'Две точки — два электрона. Выделены пара O и пара той N–H связи, которая будет разорвана.',
  'Хвост первой стрелки стоит на паре O. Её головка у H: эта пара образует новую O–H связь.',
  'H сохраняет только одну связь: пара прежней N–H связи одновременно остаётся у N.',
  'Проследим перенос целого H: старая N–H снята, а новая O–H появляется после прибытия.',
  'N получает неподелённую пару: +1 → 0. Пара O становится общей в связи: −1 → 0. Сумма зарядов — 0.'
];
const enCaptions = [
  'N has four bonds and no lone pair. O has one bond and three lone pairs.',
  'Two dots mean two electrons. The O lone pair and the N–H bond pair are highlighted.',
  'The first arrow starts at the O lone pair and ends at H: this pair makes the new O–H bond.',
  'H keeps just one bond: the old N–H bonding pair must simultaneously remain on N.',
  'Follow the whole H: N–H is removed before motion and O–H appears upon arrival.',
  'N gains a lone pair: +1 → 0. The O pair becomes shared in a bond: −1 → 0. Total charge remains 0.'
];
(global.CHEMISTRY_FOUNDATIONS = global.CHEMISTRY_FOUNDATIONS || []).push({
  id:'reaction',
  title:'Как читать перенос протона', enTitle:'Reading a proton transfer',
  question:'Что показывают две изогнутые стрелки?', enQuestion:'What do the two curved arrows show?',
  control:'Ход объяснения', enControl:'Explanation progress', duration:48000,
  narration:[
    {at:0,ru:'Начнём с четырёх связей N–H и одной связи O–H.',en:'Start with four N–H bonds and one O–H bond.'},
    {at:.09,ru:'У азота заряд +1. У кислорода три пары и заряд −1.',en:'Nitrogen carries +1. Oxygen has three lone pairs and charge −1.'},
    {at:.16,ru:'Выделим одну пару O и пару выбранной связи N–H.',en:'Highlight one O pair and the pair in the selected N–H bond.'},
    {at:.26,ru:'Хвост каждой стрелки должен начинаться именно у электронов.',en:'Each arrow tail must begin at the electrons themselves.'},
    {at:.32,ru:'Проследим первую пару: от O к тому H, который принимает основание.',en:'Follow the first pair, from O toward the H accepted by the base.'},
    {at:.45,ru:'Эта пара станет общей в новой связи O–H.',en:'This pair will be shared in the new O–H bond.'},
    {at:.50,ru:'Теперь проследим старую пару N–H: она возвращается на N.',en:'Now follow the old N–H pair as it returns to N.'},
    {at:.63,ru:'После разрыва N–H эта пара останется у азота. Затем проследим движение ядра H.',en:'After N–H breaks, this pair will stay on nitrogen. Then follow the H nucleus.'},
    {at:.70,ru:'Следите за ядром H. Старая связь уже снята; пара осталась у N.',en:'Follow the H nucleus. Its old bond is removed and its pair stays on N.'},
    {at:.82,ru:'H прибыл к O. Возникает новая связь, и кислород становится нейтральным.',en:'H has reached O. The new bond forms and oxygen becomes neutral.'},
    {at:.91,ru:'Остановимся: NH₃ и изогнутая H₂O. Атомы, электроны и общий заряд сохранены.',en:'Pause here: NH₃ and bent H₂O. Atoms, electrons and total charge are conserved.'}
  ],
  source:'OpenStax · Organic Chemistry §6.5',
  url:'https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms',
  answer:'Каждая изогнутая стрелка показывает перенос двух электронов. Пара O образует O–H, а пара прежней N–H связи становится неподелённой парой N.',
  enAnswer:'Each full curved arrow tracks two electrons. The O lone pair forms O–H, while the old N–H bonding pair becomes a lone pair on N.',
  note:'NH₄⁺ + OH⁻ → NH₃ + H₂O. Две стрелки описывают согласованное перераспределение пар; последовательность их появления — объяснение, а не два химических шага. Хвост первой стрелки совпадает с центром пары O, второй — с серединой N–H; её конец находится у будущей пары N, отдельно от знака +. Атомы неподвижны, пока показаны электронные стрелки. Затем ядро H непрерывно движется по условному пути: связь N–H уже снята, N получил пару и стал нейтрален, H временно отмечен H⁺. Поясняющая запись NH₃ + H⁺ + OH⁻ сохраняет атомы, 16 валентных электронов и общий заряд 0; она не утверждает существование долгоживущего свободного H⁺ в воде. При прибытии H появляется O–H и O становится нейтрален. Это не расчёт молекулярной динамики или переходного состояния. N: 4 связи/0 пар/+1 → 3 связи/1 пара/0; O: 1 связь/3 пары/−1 → 2 связи/2 пары/0. Формальный заряд = валентные электроны − неподелённые электроны − число одинарных связей. Сохраняются N₁ O₁ H₅ и Σq=0. NH₃ — схема связности; конечная вода имеет угол 104.5°. См. OpenStax Chemistry 2e §7.6: https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity. Растворитель, равновесие и скорость не вычисляются.',
  enNote:'NH₄⁺ + OH⁻ → NH₃ + H₂O. The two arrows describe coupled pair redistribution; sequential reveal is an explanation, not two chemical steps. The first tail is at the O pair centroid; the second starts at the N–H midpoint and ends at the future N lone-pair site, away from the + glyph. Atoms stay fixed while electron arrows appear. Then H moves continuously along a schematic path: N–H is already removed, N has gained its pair and is neutral, and H is temporarily labeled H⁺. This explanatory NH₃ + H⁺ + OH⁻ notation conserves atoms, 16 valence electrons and total charge zero; it does not assert a long-lived free H⁺ in water. Upon arrival, O–H forms and O becomes neutral. Motion is not molecular dynamics or a transition-state calculation. N: 4 bonds/0 pairs/+1 → 3 bonds/1 pair/0; O: 1 bond/3 pairs/−1 → 2 bonds/2 pairs/0. Formal charge equals valence electrons minus nonbonding electrons minus the number of single bonds. N₁ O₁ H₅ and charge zero are conserved. NH₃ shows connectivity; final water has a 104.5° angle. See OpenStax Chemistry 2e §7.6: https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity. Solvent, equilibrium and kinetics are not calculated.',
  detailText:'Те же атомы и пары. Золотые стрелки показывают электроны; ядро H затем движется по отдельному схематическому пути.',
  enDetailText:'The same atoms and pairs. Gold arrows track electrons; the H nucleus then moves along a separate schematic path.',
  stages, captions, enCaptions,
  draw(g,H) {
    const {label,formula,circle,path,show,arrow,group,tr} = H;
    const setAttrs = (node,attrs) => { Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v))); };
    const display = (node,yes) => node.setAttribute('display',yes?'inline':'none');
    const halfAngle = 104.5*Math.PI/360, length = 95;
    const waterH4 = [700-length*Math.sin(halfAngle),350+length*Math.cos(halfAngle)];
    const waterH5 = [700+length*Math.sin(halfAngle),350+length*Math.cos(halfAngle)];
    const reactantH4 = [405,350];
    const sourceO = [668,350], sourceNH = [337.5,350], destinationN = [299,323], destinationH = [427,350];
    const a = CH.molecule(g,{
      atoms:[
        {id:'N',element:'N',x:270,y:350,charge:1,lonePairs:0},
        {id:'H1',element:'H',x:160,y:350}, {id:'H2',element:'H',x:270,y:266},
        {id:'H3',element:'H',x:270,y:418}, {id:'H4',element:'H',x:405,y:350},
        {id:'O',element:'O',x:700,y:350,charge:-1,lonePairs:3},
        {id:'H5',element:'H',x:waterH5[0],y:waterH5[1]}
      ],
      bonds:[
        {id:'N-H1',a:'N',b:'H1'}, {id:'N-H2',a:'N',b:'H2'}, {id:'N-H3',a:'N',b:'H3'},
        {id:'transfer-old',a:'N',b:'H4'}, {id:'transfer-new',a:'O',b:'H4',order:0},
        {id:'O-H5',a:'O',b:'H5'}
      ], showLonePairs:true
    });
    a.g.dataset.transferMolecule = '';
    // Stable authored Lewis-pair sites make arrow tails scientifically inspectable.
    const oPairs = [...a.atoms.O.querySelectorAll('[data-lone-pair]')];
    const nPairs = [...a.atoms.N.querySelectorAll('[data-lone-pair]')];
    oPairs.forEach((node,i)=>{node.dataset.pairId='O-lp-'+i;});
    nPairs[0].dataset.pairId='N-lp-new';
    oPairs[0].dataset.reactivePair='true';
    function placePair(node,x,y,visible,color=C.white) {
      [...node.children].forEach((dot,i)=>setAttrs(dot,{cx:x,cy:y+(i?3.5:-3.5),r:2,fill:color}));
      setAttrs(node,{'data-pair-x':x,'data-pair-y':y,'data-electron-count':2});display(node,visible);
    }
    const nCharge = a.atoms.N.querySelector('[data-formal-charge]');
    const oCharge = a.atoms.O.querySelector('[data-formal-charge]');
    setAttrs(nCharge,{x:-31,y:-24});
    setAttrs(oCharge,{x:38,y:-30});
    L.contract(nCharge,{space:a.atoms.N,box:{x:-45,y:-37,width:28,height:26}});
    L.contract(oCharge,{space:a.atoms.O,box:{x:24,y:-43,width:28,height:26}});

    const pairFocus = circle(g,...sourceO,12,C.gold,0);
    const bondFocus = circle(g,...sourceNH,12,C.gold,0);
    const nSlot = circle(g,...destinationN,10,C.gold,0);
    setAttrs(nSlot,{'stroke-dasharray':'2 4','data-lone-pair-slot':'N'});
    const bondPair = group(g);bondPair.dataset.bondElectronPair='transfer-old';
    [-3.5,3.5].forEach(dy=>{const dot=circle(bondPair,sourceNH[0],sourceNH[1]+dy,2,C.gold,1);dot.setAttribute('stroke','none');});
    const hFocus = circle(g,405,350,22,C.gold,0);hFocus.dataset.transferredAtomFocus='H4';
    const first = arrow(g,...sourceO,...destinationH,C.gold,'electron-pair',105);
    const second = arrow(g,...sourceNH,...destinationN,C.gold,'electron-pair',45);
    first.g.dataset.electronArrow='O-pair-to-H';second.g.dataset.electronArrow='NH-pair-to-N';
    [first,second].forEach((item,i)=>{
      const tail=i?sourceNH:sourceO,head=i?destinationN:destinationH;
      setAttrs(item.g,{'data-tail-x':tail[0],'data-tail-y':tail[1],'data-head-x':head[0],'data-head-y':head[1],'data-electron-count':2});
      const shaft=item.g.querySelector('[data-arrow-shaft]');setAttrs(shaft,{pathLength:1,'stroke-dasharray':1,'stroke-width':2});
      item.g.querySelector('[data-arrow-head]').setAttribute('stroke-width',2);
    });
    const arrowOne = label(g,493,258,135,31,'1 · 2 e⁻','1 · 2 e⁻',20,C.gold);
    const arrowTwo = label(g,334,270,112,30,'2 · 2 e⁻','2 · 2 e⁻',20,C.gold);
    const angleLayer = group(g);angleLayer.dataset.waterAngle='104.5';
    const radius=36,dx=radius*Math.sin(halfAngle),dy=radius*Math.cos(halfAngle);
    path(angleLayer,`M${700-dx} ${350+dy} A${radius} ${radius} 0 0 0 ${700+dx} ${350+dy}`,C.grey,1);
    label(angleLayer,650,390,100,26,'104,5°','104.5°',19,C.grey);
    // A separate straight position guide has no electron-arrow head and is explicitly a diagram operation.
    const relocation = group(g);relocation.dataset.nuclearPositionGuide='H4';
    path(relocation,`M${reactantH4[0]} 429 L${waterH4[0]} 429`,C.grey,1.25).setAttribute('stroke-dasharray','3 6');
    circle(relocation,reactantH4[0],429,3,C.grey,.5);circle(relocation,waterH4[0],429,3,C.grey,.5);
    label(relocation,365,443,325,34,'H: новое положение на схеме','H: a new diagram position',18,C.grey);

    formula(g,94,208,748,'NH₄⁺ + OH⁻  →  NH₃ + H₂O',31);
    const heading = label(g,884,222,320,51,'','',26,C.gold);
    const explanation = label(g,884,280,320,111,'','',22,C.white);
    const ledger = label(g,876,398,338,94,'','',20,C.grey);
    const representation = label(g,98,459,722,34,'','',18,C.grey);
    const titles = ['Прочитать реагенты','Найти источники','Первая пара: O → H','Вторая пара: N–H → N','Проследить за H','Почему заряды исчезли?'];
    const enTitles = ['Read the reactants','Locate the sources','First pair: O → H','Second pair: N–H → N','Follow H','Why do charges vanish?'];
    const explanations = [
      'NH₄⁺ отдаёт протон.\nOH⁻ принимает протон\nс помощью пары O.',
      'Золотые точки выделяют\nдве разные пары.\nКаждая содержит 2 e⁻.',
      'Пара кислорода\nстановится общей\nв новой связи O–H.',
      'Прежняя пара N–H\nостаётся целиком у N.\nДве стрелки — один шаг.',
      'N–H → нет связи\nO–H → новая связь\nH остаётся тем же атомом.',
      'N получает целую пару.\nO делится своей парой.\nОба формальных заряда — 0.'
    ];
    const enExplanations = [
      'NH₄⁺ donates a proton.\nOH⁻ accepts it using\nan oxygen lone pair.',
      'Gold dots mark\ntwo different pairs.\nEach contains 2 e⁻.',
      'The oxygen pair\nbecomes shared in\nthe new O–H bond.',
      'The old N–H pair\nstays entirely on N.\nTwo arrows, one step.',
      'N–H → bond removed\nO–H → bond formed\nH keeps its identity.',
      'N gains an entire pair.\nO shares its own pair.\nBoth formal charges are 0.'
    ];
    const reactantLedger='N: 4 связи · 0 пар · +1\nO: 1 связь · 3 пары · −1';
    const productLedger='N: 3 связи · 1 пара · 0\nO: 2 связи · 2 пары · 0';
    const auditLedger='N: 5 − (2 + 3) = 0\nO: 6 − (4 + 2) = 0\nN₁ O₁ H₅ · Σq = 0';
    const scope='NH₃: три связи N–H и одна неподелённая пара.';
    const reactantScope='Стрелка с полной головкой = перенос пары, 2 e⁻.';
    titles.forEach((s,i)=>tr(s,enTitles[i]));explanations.forEach((s,i)=>tr(s,enExplanations[i]));
    tr(reactantLedger,'N: 4 bonds · 0 lone pairs · +1\nO: 1 bond · 3 lone pairs · −1');
    tr(productLedger,'N: 3 bonds · 1 lone pair · 0\nO: 2 bonds · 2 lone pairs · 0');
    tr(auditLedger,auditLedger);tr(scope,'NH₃: three N–H bonds and one lone pair.');
    tr(reactantScope,'A full curved arrowhead means one electron pair, 2 e⁻.');
    function reveal(item,amount) {
      show(item,amount>0?1:0);
      item.g.querySelector('[data-arrow-shaft]').setAttribute('stroke-dashoffset',1-amount);
      item.g.querySelector('[data-arrow-head]').setAttribute('opacity',amount>=.995?1:0);
    }
    return {
      actor:a, arrows:{first,second},
      detail:{g,x:0,y:0,scale:1,bounds:{x:98,y:208,width:1117,height:288}},
      paint(p) {
        for(const step of stages)if(p+1e-8>=step.at&&p-1e-8<=step.at){p=step.at;break;}
        const phase=Math.max(0,stages.findLastIndex(stage=>p>=stage.at));
        const departed=p>=.70,product=p>=.82,arrowsVisible=p>=.32&&p<.68;
        const travel=F.phase(p,.70,.82),t=travel*travel*(3-2*travel),control=[510,390];
        const position=reactantH4.map((v,i)=>(1-t)*(1-t)*v+2*(1-t)*t*control[i]+t*t*waterH4[i]);
        a.set({positions:{H4:position},
          bondOrders:{'transfer-old':departed?0:1,'transfer-new':product?1:0},
          charges:{N:departed?0:1,O:product?0:-1,H4:departed&&!product?1:0},lonePairs:{N:departed?1:0,O:product?2:3}});
        const atomById=Object.fromEntries(a.state.atoms.map(atom=>[atom.id,atom]));
        placePair(oPairs[0],-32,0,!product,p>=.16?C.gold:C.white);
        placePair(oPairs[1],product?-19:0,product?-23:-31,true);
        placePair(oPairs[2],product?19:31,product?-23:-6,true);
        placePair(oPairs[3],0,31,false);
        placePair(nPairs[0],29,-27,departed,C.gold);
        a.state.atoms.forEach(atom=>setAttrs(a.atoms[atom.id],{'data-x':atom.x,'data-y':atom.y,'data-lone-pair-count':atom.lonePairs,'data-charge':atom.charge}));
        const transitionOpacity=1;show(a.g,1);
        a.g.querySelectorAll('[data-bond-id="transfer-new"] line').forEach(line=>H.trace(line,product?F.phase(p,.82,.86):1));
        const highlight=p>=.16&&p<.68;
        show(pairFocus,highlight?1:0);show(bondFocus,highlight?1:0);show(bondPair,highlight?1:0);
        show(nSlot,p>=.50&&p<.68?1:0);
        setAttrs(hFocus,{cx:atomById.H4.x,cy:atomById.H4.y});show(hFocus,p>=.16?transitionOpacity:0);
        reveal(first,arrowsVisible?F.phase(p,.32,.43):0);
        reveal(second,arrowsVisible?F.phase(p,.50,.61):0);
        show(arrowOne,arrowsVisible?1:0);show(arrowTwo,p>=.50&&p<.68?1:0);
        show(angleLayer,product?transitionOpacity:0);show(relocation,p>=.68&&p<.84?1:0);
        heading.setText(titles[phase]);explanation.setText(departed&&!product?tr('Пара N–H остаётся у N.\nH⁺ движется к O.\nПрибытие → связь O–H.','The N–H pair stays on N.\nH⁺ moves toward O.\nO–H forms on arrival.'):explanations[phase]);
        ledger.setText(product?(phase===5?auditLedger:productLedger):departed?tr('N: 3 связи · 1 пара · 0\nH⁺: движущееся ядро\nOH⁻ пока сохраняет заряд','N: 3 bonds · 1 pair · 0\nH⁺: the moving nucleus\nOH⁻ retains its charge for now'):reactantLedger);
        representation.setText(product?scope:reactantScope);show(representation,p>=.68&&p<.84?0:1);
        const composition=CH.composition(a.state);
        const bondCount=id=>a.state.bonds.reduce((sum,b)=>sum+((b.a===id||b.b===id)?b.order:0),0);
        const hVector=waterH4.map((value,i)=>value-[700,350][i]);
        const otherVector=waterH5.map((value,i)=>value-[700,350][i]);
        const waterAngle=Math.acos((hVector[0]*otherVector[0]+hVector[1]*otherVector[1])/(Math.hypot(...hVector)*Math.hypot(...otherVector)))*180/Math.PI;
        g.dataset.chemicalState=product?'products':departed?'proton-in-transit':'reactants';
        return {phase,product,protonInTransit:departed&&!product,valenceElectrons:16,totalCharge:composition.charge,atoms:composition.elements,transferredAtom:'H4',
          nitrogenCharge:atomById.N.charge,oxygenCharge:atomById.O.charge,
          nitrogenBonds:bondCount('N'),oxygenBonds:bondCount('O'),hydrogenBonds:bondCount('H4'),
          nitrogenLonePairs:atomById.N.lonePairs,oxygenLonePairs:atomById.O.lonePairs,
          oldBondOrder:departed?0:1,newBondOrder:product?1:0,waterAngle:product?waterAngle:null,
          hPosition:[atomById.H4.x,atomById.H4.y],atomMovement:'continuous schematic proton transfer',
          electronArrowsVisible:arrowsVisible,arrowsFixed:true,
          arrowAnchors:{oxygenPair:sourceO,protonTarget:destinationH,oldBondPair:sourceNH,nitrogenPairTarget:destinationN},
          formalChargeAccounting:{N:5-(2*atomById.N.lonePairs+bondCount('N')),O:6-(2*atomById.O.lonePairs+bondCount('O'))},
          representation:'Lewis connectivity; bent water',transitionStateModeled:false};
      }
    };
  }
});
})(window);
