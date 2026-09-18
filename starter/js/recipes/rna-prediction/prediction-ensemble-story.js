/* Real ViennaRNA ensemble -> contributions to one indexed pair -> its RNA arc.
 * Requires window.RNA_EXPERIMENT (thermo-example.json), RNA, PM, F, L and C.
 * Data indices are 1-based. PM indices are explicitly converted to 0-based.
 * Moving beads explain addition of probabilities, not folding kinetics.
 */
(function(g){
'use strict';
const R=g.RNA, X=g.RNA_EXPERIMENT;
if(!X||X.sequence!=='GGACGAAACGUCC'||X.ensemble?.structure_count!==99)throw Error('story-ensemble requires the verified 99-structure RNA_EXPERIMENT');
const all=X.ensemble.all_structures, chosen=['mfe','long_loop','frayed'].map(id=>X.candidates.find(c=>c.id===id));
if(chosen.some(c=>!c))throw Error('story-ensemble missing real candidates');
const selectedPair=[5,9], hasPair=c=>c.pairs.some(p=>p[0]===5&&p[1]===9), mainPairs=X.mfe.pairs;
const other=all.filter(c=>!chosen.some(d=>d.structure===c.structure));
const otherMass=other.reduce((sum,c)=>sum+c.probability,0);
const otherSelected=other.filter(hasPair).reduce((sum,c)=>sum+c.probability,0);
const selectedP=X.ensemble.pair_probabilities.find(p=>p.i===5&&p.j===9).probability;
const parts=[chosen[0].probability,chosen[2].probability,otherSelected];
if(Math.abs(parts.reduce((a,b)=>a+b,0)-selectedP)>1e-10)throw Error('story-ensemble pair contributions do not sum');
const pct=(v,d=2)=>(100*v).toFixed(d)+'%', pair0=p=>p.map(i=>i-1);
const text=(p,x,y,w,h,ru,en=ru,size=24,color=C.white)=>R.box(p,x,y,w,h,ru,en,size,color).el;
const state=(ru,en,nru,nen)=>[ru,en,nru||ru,nen||en];
const source=['ViennaRNA 2.7.2 · McCaskill equilibrium ensemble','https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/pf_fold.html'];

R.register({
 id:'story-ensemble',
 title:['Ансамбль: от целых структур к вероятности пары','The ensemble: from whole structures to one pair'],
 status:['Расчёт ViennaRNA 2.7.2 · Turner 2004 · 37 °C · 1.021 M','ViennaRNA 2.7.2 calculation · Turner 2004 · 37 °C · 1.021 M'],
 source,
 states:[
  state('Минимум найден. Но равновесие допускает и другие структуры.','The minimum is found. Equilibrium also permits other structures.',
   'Сохраняем ту же последовательность GGACGAAACGUCC и её рассчитанный минимум (((((...))))): −4.90 ккал/моль. В модели допустимы 99 различных вторичных структур без псевдоузлов. Рисунок показывает схему пар, а не атомные координаты.',
   'We retain GGACGAAACGUCC and its computed minimum (((((...))))): −4.90 kcal/mol. The model permits 99 distinct secondary structures without pseudoknots. The drawing shows pair topology, not atomic coordinates.'),
  state('Та же цепь: разные пары дают разные свободные энергии.','The same chain: different pair sets give different free energies.',
   'Показаны реальные результаты для трёх наиболее вероятных структур: MFE −4.90, более крупная шпилечная петля −3.70 и разомкнутая внешняя пара −2.60 ккал/моль. Остальные 96 структур объединены явно; три маленьких контура справа — их реальные примеры, а не полный список. Копии обозначают альтернативные состояния одной последовательности.',
   'Three highest-probability structures are actual results: MFE −4.90, larger hairpin −3.70 and open outer pair −2.60 kcal/mol. The remaining 96 structures are explicitly grouped; the three small outlines at right are real examples, not the complete list. Copies denote alternative states of one sequence.'),
  state('Энергия → вес Больцмана → доля структуры в полном ансамбле.','Energy → Boltzmann weight → a structure’s share of the full ensemble.',
   'Для всех 99 структур рассчитаны веса exp(−ΔG/RT), затем каждый вес разделён на полную сумму Z = 3322.9232948. RT = 0.6163207755 ккал/моль. Вероятности первых трёх структур: 85.368345%, 12.181730%, 2.044498%; остальные 96 вместе дают 0.405426%. Группа «остальные» включена в знаменатель. Это равновесные вероятности при заданных параметрах.',
   'Weights exp(−ΔG/RT) were calculated for all 99 structures and divided by their full sum Z = 3322.9232948. RT = 0.6163207755 kcal/mol. The first three probabilities are 85.368345%, 12.181730%, and 2.044498%; the other 96 total 0.405426%. The grouped structures remain in the denominator. These are equilibrium probabilities under the stated parameters.'),
  state('Ищем одну и ту же пару G5–C9 во всех структурах.','Find the same G5–C9 pair in every structure.',
   'Пара (5,9) присутствует в MFE и в структуре с разомкнутой внешней парой, но отсутствует в кандидате с более крупной петлёй. Среди остальных 96 структур только содержащие (5,9) добавляют вклад: вместе 0.048756%. Складываются вероятности целых структур, удовлетворяющих одному условию.',
   'Pair (5,9) occurs in the MFE and open-outer-pair structures but is absent from the larger-hairpin candidate. Among the other 96 structures, only those containing (5,9) contribute: together 0.048756%. We add the probabilities of whole structures that satisfy the same condition.'),
  state('Складываем эти доли: p₅,₉ = 87.46%. Возвращаем число к паре.','Add those shares: p₅,₉ = 87.46%. Attach the number to its pair.',
   '85.368345% + 2.044498% + 0.048756% = 87.461600%. Движущиеся маркеры объясняют перенос численного вклада, а не поток молекул или кинетику сворачивания. Число относится к паре 5–9 на исходной 13-нуклеотидной цепи. Вероятность всей MFE-структуры остаётся 85.368345%.',
   '85.368345% + 2.044498% + 0.048756% = 87.461600%. Moving markers explain transfer of numerical contributions, not molecular flow or folding kinetics. The number belongs to pair 5–9 on the original 13-nucleotide chain. The probability of the entire MFE structure remains 85.368345%.'),
  state('Повторяем для каждой пары: карта показывает, где модель уверена.','Repeat for every pair: the map shows the model’s certainty.',
   'Все ненулевые вероятности пар получены из полного ансамбля из 99 структур. Числа подписаны у пяти доминирующих пар; тонкие серые пунктирные дуги показывают другие допустимые пары, каждая с очень малой вероятностью. Это карта маргинальных вероятностей, а не одна структура со всеми дугами одновременно. Вероятности условны относительно модели, не являются экспериментальной точностью и не задают 3D-координаты.',
   'All nonzero pair probabilities come from the full 99-structure ensemble. Values label the five dominant pairs; thin gray dashed arcs show the other admissible pairs, each with very small probability. This is a map of marginal probabilities, not one structure containing every arc simultaneously. Probabilities are conditional on the model, are not experimental accuracy, and do not specify 3D coordinates.')
 ],
 qa:[
  {q:['Почему 87.46% больше 85.37%?','Why is 87.46% greater than 85.37%?'],a:['Пара 5–9 встречается и в других структурах. Её вероятность — сумма вероятностей всех структур с этой парой; 85.37% относится только к целой MFE-структуре.','Pair 5–9 also occurs in other structures. Its probability sums every structure containing it; 85.37% refers only to the complete MFE structure.']},
  {q:['87.46% — вероятность экспериментально правильного предсказания?','Is 87.46% the probability that the prediction is experimentally correct?'],a:['Нет. Это равновесная вероятность пары при конкретных последовательности, параметрах и правилах модели. Биологическую точность проверяют независимыми данными.','No. It is an equilibrium pair probability conditional on this sequence, parameters and model rules. Biological accuracy requires independent evidence.']},
  {q:['Почему не сложить только три картинки?','Why not sum only the three drawings?'],a:['Они не исчерпывают ансамбль. В расчёт Z и всех вероятностей включены все 99 структур; остальные 96 сгруппированы только на рисунке.','They do not exhaust the ensemble. Z and all probabilities include every one of the 99 structures; the other 96 are grouped only in the drawing.']},
  {q:['Эта анимация предсказывает пространственное движение РНК?','Does this animation predict RNA’s spatial motion?'],a:['Нет. ViennaRNA вычислил вторичную структуру и её термодинамические свойства. Движение рисунков объясняет представления и суммы, не атомную траекторию.','No. ViennaRNA computed secondary structure and thermodynamic properties. Drawing motion explains representations and sums, not an atomic trajectory.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg), s={spread:0,weights:0,focus:0,flow:0,all:0};
  const centers=[210,495,785,1080], colors=[C.blue,C.grey,C.teal,C.gold];
  const labels=[['MFE','MFE'],['Петля больше','Larger loop'],['Внешняя пара открыта','Outer pair open']];
  const candidateViews=chosen.map((c,k)=>{
   const group=F.group(q), m=PM.create(group,{sequence:X.sequence,pairs:c.pairs.map(pair0),radius:13});
   ctx.onDispose(m.dispose);
   const head=F.group(group), energy=F.group(group), probability=F.group(group), membership=F.group(group);
   text(head,-135,-20,270,40,...labels[k],k===2?21:25,colors[k]);
   text(energy,-132,-18,264,36,'ΔG = '+c.energy_kcal_mol.toFixed(2),'ΔG = '+c.energy_kcal_mol.toFixed(2),25,colors[k]);
   text(probability,-130,-26,260,52,pct(c.probability),pct(c.probability),34,hasPair(c)?C.teal:C.grey);
   text(membership,-130,-16,260,32,hasPair(c)?'5–9 есть':'5–9 нет',hasPair(c)?'5–9 present':'5–9 absent',21,hasPair(c)?C.gold:C.grey);
   return {group,m,head,energy,probability,membership,c};
  });
  const group=F.group(q), otherHead=F.group(group), otherEnergy=F.group(group), otherProbability=F.group(group), otherMembership=F.group(group);
  text(otherHead,-125,-23,250,46,'Ещё 96 структур','96 other structures',24,C.grey);
  text(otherEnergy,-125,-17,250,34,'Включая неспаренную','Includes the unpaired chain',19,C.grey);
  text(otherProbability,-125,-22,250,44,pct(otherMass,3),pct(otherMass,3),31,C.grey);
  text(otherMembership,-125,-17,250,34,'Вклад 5–9: '+pct(otherSelected,4),'5–9 share: '+pct(otherSelected,4),19,C.gold);
  // Three actual, supported hairpins represent examples within the grouped 96.
  const representatives=['.(((.....))).','(((.......)))','..(((...)))..'].map((structure,k)=>{
   const c=other.find(item=>item.structure===structure);
   if(!c)throw Error('Missing real grouped-ensemble example');
   const m=PM.create(group,{sequence:X.sequence,pairs:c.pairs.map(pair0),radius:10});ctx.onDispose(m.dispose);return {m,k};
  });
  const weightRule=F.group(q);
  text(weightRule,206,566,868,35,'p(S) = exp[−ΔG(S)/RT] / Z     ·     Z: все 99 структур','p(S) = exp[−ΔG(S)/RT] / Z     ·     Z: all 99 structures',24,C.white);
  const receiverGroup=F.group(q), alternativeGroup=F.group(receiverGroup);
  const receiver=PM.create(receiverGroup,{sequence:X.sequence,pairs:mainPairs.map(pair0),radius:14});ctx.onDispose(receiver.dispose);
  const alternatives=X.ensemble.pair_probabilities.filter(p=>!p.in_mfe).map(p=>{
   const path=R.path(alternativeGroup,'M0,0',C.grey,1.1);path.setAttribute('stroke-dasharray','2 6');path.dataset.pair=p.i+','+p.j;path.dataset.probability=String(p.probability);return {path,p};
  });
  const pairLabels=mainPairs.map(pair=>{
   const entry=X.ensemble.pair_probabilities.find(p=>p.i===pair[0]&&p.j===pair[1]);
   const group=F.group(receiverGroup);R.rect(group,-102,-15,204,30,'none','var(--color-bg)',6);
   text(group,-101,-15,202,30,pair.join('–')+'  '+pct(entry.probability),pair.join('–')+'  '+pct(entry.probability),21,pair[0]===5?C.gold:C.teal);
   return {group,entry};
  });
  const pairRule=F.group(q), sumRule=F.group(q), certainty=F.group(q), same=F.group(q);
  text(same,70,165,1140,38,'Та же РНК · номера оснований сохранены','Same RNA · residue identities retained',25,C.white);
  text(pairRule,165,218,950,53,'p₅,₉ = Σ p(S)  для структур с парой (5,9)','p₅,₉ = Σ p(S)  over structures containing (5,9)',31,C.gold);
  text(sumRule,95,284,1090,49,'85.3683% + 2.0445% + 0.0488% = 87.4616%','85.3683% + 2.0445% + 0.0488% = 87.4616%',32,C.white);
  text(certainty,108,216,1064,41,'Целая MFE: 85.37%   ·   пара 5–9: 87.46%','Whole MFE: 85.37%   ·   pair 5–9: 87.46%',30,C.gold);
  text(certainty,104,267,1072,35,'Серый пунктир: другие допустимые пары · не одна структура','Gray dashes: other admissible pairs · not one structure',22,C.grey);
  const flowLayer=F.group(q), dots=parts.map((part,k)=>{
   const group=F.group(flowLayer), bead=F.dot(group,0,0,8,[C.blue,C.teal,C.gold][k]);
   const halo=F.dot(group,0,0,13,'none');halo.setAttribute('stroke',[C.blue,C.teal,C.gold][k]);halo.setAttribute('stroke-width',1.5);
   group.dataset.contribution=String(part);return {group,part,k};
  });
  const percentValue=F.group(q), percentLabel=R.box(percentValue,-120,-26,240,52,'0.00%','0.00%',34,C.gold);
  function paint(){
   const collapse=F.phase(s.flow,0,.33), sources=1-F.phase(s.flow,.33,.55);
   candidateViews.forEach((view,k)=>{
    const x=F.lerp(640,centers[k],s.spread), y=F.lerp(F.lerp(365,345,s.spread),268,collapse), scale=F.lerp(F.lerp(.86,.72,s.spread),.43,collapse);
    F.at(view.group,x,y);F.opacity(view.group,(k===0?1:F.phase(s.spread,.85,1))*sources);
    const focusIndex=view.c.pairs.findIndex(p=>p[0]===5&&p[1]===9);
    view.m.paint({cx:0,cy:0,scale,fold:1,depth:0,pairProgress:1,focusPair:s.focus>.2&&focusIndex>=0?focusIndex:-1,highlightResidues:s.focus>.2?[4,8]:[],highlightColor:hasPair(view.c)?C.gold:C.grey,indexOpacity:1});
    F.at(view.head,0,F.lerp(F.lerp(-193,-163,s.spread),-89,collapse));F.at(view.energy,0,F.lerp(F.lerp(170,140,s.spread),70,collapse));F.at(view.probability,0,F.lerp(183,113,collapse));F.at(view.membership,0,F.lerp(219,155,collapse));
    F.opacity(view.energy,(1-.4*s.weights)*(1-F.phase(s.flow,0,.08)));F.opacity(view.probability,s.weights);F.opacity(view.membership,F.phase(s.focus,.30,.55));
   });
   F.at(group,centers[3],F.lerp(345,268,collapse));F.opacity(group,s.spread*sources);
   representatives.forEach(({m,k})=>m.paint({cx:(k-1)*62,cy:(k%2)*26-4,scale:F.lerp(.40,.28,collapse),fold:1,depth:0,pairProgress:.6,labelOpacity:0,indexOpacity:0}));
   F.at(otherHead,0,F.lerp(-163,-89,collapse));F.at(otherEnergy,0,F.lerp(140,70,collapse));F.at(otherProbability,0,F.lerp(183,113,collapse));F.at(otherMembership,0,F.lerp(219,155,collapse));
   F.opacity(otherProbability,s.weights);F.opacity(otherMembership,F.phase(s.focus,.30,.55));F.opacity(otherEnergy,(1-.4*s.weights)*(1-F.phase(s.flow,0,.08)));
   F.opacity(weightRule,s.weights*(1-F.phase(s.focus,0,.20))*sources);
   const receive=F.phase(s.flow,.27,.52);F.opacity(receiverGroup,receive);
   receiver.paint({cx:640,cy:548,scale:1.30,fold:0,depth:0,pairProgress:mainPairs.map((p,k)=>k===4?receive:s.all),focusPair:s.all>.1?-1:4,support:mainPairs.map(p=>X.ensemble.pair_probabilities.find(row=>row.i===p[0]&&row.j===p[1]).probability),indexOpacity:1});
   alternatives.forEach(({path,p})=>{
    const a=receiver.point(p.i-1),b=receiver.point(p.j-1),h=Math.abs(b.x-a.x)*.30;
    path.setAttribute('d',`M${a.x},${a.y} C${F.lerp(a.x,b.x,1/3)},${a.y-h} ${F.lerp(a.x,b.x,2/3)},${b.y-h} ${b.x},${b.y}`);F.opacity(path,.20*s.all);
   });
   pairLabels.forEach(({group},k)=>{const p=receiver.pairPoint(k);F.at(group,p.x,p.y);F.opacity(group,k===4?F.phase(s.flow,.85,1):s.all);});
   F.opacity(same,F.phase(s.flow,.53,.72));F.opacity(pairRule,F.phase(s.flow,.55,.72)*(1-F.phase(s.all,0,.20)));F.opacity(sumRule,F.phase(s.flow,.81,1)*(1-F.phase(s.all,0,.20)));F.opacity(certainty,F.phase(s.all,.35,.60));
   let total=0;
   dots.forEach(({group,k,part})=>{
    const t=F.phase(s.flow,.34+k*.06,.70+k*.075),startX=[centers[0],centers[2],centers[3]][k],end=receiver.pairPoint(4);
    // The two named contributions leave the actual selected pair's midpoint;
    // the grouped contribution leaves its explicitly summed 5–9 share label.
    const donor=k===0?candidateViews[0]:candidateViews[2],pairIndex=k===0?4:3;
    const startY=k<2?268+donor.m.pairPoint(pairIndex).y:447;
    F.at(group,F.lerp(startX,end.x,t),F.lerp(startY,end.y,t)-44*Math.sin(Math.PI*t));F.opacity(group,F.phase(t,0,.08)*(1-F.phase(t,.83,1))*(1-s.all));total+=part*F.phase(t,.65,1);
   });
   F.at(percentValue,640,376);percentLabel.setText(pct(total));F.opacity(percentValue,F.phase(s.flow,.65,.72)*(1-F.phase(s.flow,.84,.91))*(1-s.all));
   v.root.dataset.rnaSequence=X.sequence;v.root.dataset.predictionRun='ViennaRNA '+X.provenance.version;v.root.dataset.ensembleCount='99';v.root.dataset.selectedPair='5,9';v.root.dataset.selectedPairProbability=String(selectedP);v.root.dataset.selectedPairContributions=JSON.stringify(parts);v.root.dataset.allPairProbabilities=JSON.stringify(X.ensemble.pair_probabilities);v.root.dataset.representation='computed secondary-structure probabilities; schematic layout';
  }
  return {state:s,paint,patches:[{spread:1},{weights:1},{focus:1},{flow:1},{all:1}],durations:[2200,1900,1900,4200,2400]};
 }
});
})(window);
