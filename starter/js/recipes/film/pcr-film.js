/* A complete short film on the cinema clock: one DNA duplex becomes 1024 copies.
 * Everything drawn here is an authored teaching schematic: strands are lines,
 * primers and new strands are thick segments, cycles are bars on a log scale.
 * No sequence, kinetics or reaction yields are computed. Replace the actors and
 * the cue catalog to make your own film; keep one complete pose per cue.
 * Remix without editing: window.PCR_FILM_CONFIG = {route:[...], overrides:{...}}. */
(function(g){
'use strict';
const ID='pcr-film',SOURCE='Mullis & Faloona, 1987 · Methods Enzymol.',URL='https://doi.org/10.1016/0076-6879(87)55023-6';
const tr=(ru,en)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
const clamp=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t;
// One complete numeric pose per cue: 0/1 fractions plus the cycle counter.
const baseline={melt:0,anneal:0,extend:0,copies:1,cycles:0,chart:0};
const catalog=[
 ['start',0,5,{},'Одна молекула ДНК','One DNA molecule',
  'Две цепи удерживаются вместе водородными связями между основаниями.','Two strands are held together by hydrogen bonds between their bases.',
  'Учебная схема: две цепи показаны линиями, пары оснований — перекладинами. Верхняя цепь направлена 5′→3′ слева направо, нижняя — навстречу. Реальная двойная спираль закручена; здесь она выпрямлена ради ясности.',
  'Teaching schematic: the strands are lines, base pairs are rungs. The upper strand runs 5′→3′ left to right, the lower one the opposite way. A real double helix is twisted; it is straightened here for clarity.'],
 ['melt',5,5,{melt:1},'Денатурация: цепи расходятся','Denaturation: the strands separate',
  'При 94–98 °C водородные связи рвутся, и каждая цепь остаётся одна.','At 94–98 °C the hydrogen bonds break and each strand is left on its own.',
  'Нагрев не разрывает ковалентный сахарофосфатный остов: каждая цепь целиком сохраняет свою последовательность и становится матрицей. Температуры даны для типичного протокола.',
  'Heat does not break the covalent sugar–phosphate backbone: each strand keeps its complete sequence and becomes a template. Temperatures are those of a typical protocol.'],
 ['anneal',5,5,{anneal:1},'Отжиг: праймеры находят свои места','Annealing: primers find their sites',
  'При 50–65 °C два коротких праймера связываются с комплементарными участками матриц.','At 50–65 °C two short primers bind their complementary sites on the templates.',
  'Праймеры выбраны заранее и задают границы копируемого участка: один связывается с нижней матрицей слева, другой — с верхней справа. Их 3′-концы смотрят навстречу друг другу.',
  'The primers are designed in advance and define the copied region: one binds the lower template on the left, the other binds the upper template on the right. Their 3′ ends face each other.'],
 ['extend',6,5,{extend:1},'Удлинение: полимераза достраивает цепи','Extension: the polymerase builds new strands',
  'При 72 °C ДНК-полимераза наращивает каждый праймер в направлении 5′→3′ вдоль матрицы.','At 72 °C the DNA polymerase extends each primer 5′→3′ along its template.',
  'Термостабильная полимераза (Taq, <a href="https://doi.org/10.1126/science.2448875" target="_blank" rel="noopener">Saiki et al., 1988</a>) переживает нагрев, поэтому циклы можно повторять без добавления фермента. Новая цепь растёт только от праймера и только 5′→3′.',
  'A thermostable polymerase (Taq, <a href="https://doi.org/10.1126/science.2448875" target="_blank" rel="noopener">Saiki et al., 1988</a>) survives the heating steps, so cycles repeat without adding enzyme. A new strand grows only from a primer and only 5′→3′.'],
 ['copies',4,5,{copies:2},'Один цикл: две молекулы вместо одной','One cycle: two molecules instead of one',
  'Каждая старая цепь получила новую партнёршу: из одной двухцепочечной молекулы стало две.','Each old strand has gained a new partner: one double-stranded molecule has become two.',
  'После первого цикла продукты ещё не одинаковой длины: новые цепи заканчиваются там, где остановилась полимераза. Фрагменты строго заданной длины между праймерами накапливаются со второго-третьего цикла.',
  'After the first cycle the products are not yet of equal length: new strands end wherever the polymerase stopped. Fragments of exactly the primer-to-primer length accumulate from the second and third cycle on.'],
 ['cycles',8,8,{cycles:10,copies:1024,chart:1},'Десять циклов: 1 → 1024','Ten cycles: 1 → 1024',
  'Каждый цикл удваивает число молекул: 2, 4, 8, … После десяти циклов их 2¹⁰ = 1024.','Every cycle doubles the number of molecules: 2, 4, 8, … After ten cycles there are 2¹⁰ = 1024.',
  'Столбцы показывают идеальное удвоение 2ⁿ на логарифмической шкале: каждый следующий столбец выше на одну ступень. В реальной реакции эффективность ниже 100 % и рост выходит на плато, когда праймеры и нуклеотиды расходуются.',
  'The bars show ideal doubling 2ⁿ on a logarithmic scale: each bar is one step taller than the previous one. A real reaction runs below 100 % efficiency and reaches a plateau when primers and nucleotides run out.'],
 ['finale',3,6,{},'Экспонента из трёх температур','An exponential from three temperatures',
  'Денатурация, отжиг, удлинение — и после 30 циклов одна молекула даёт около миллиарда копий.','Denature, anneal, extend — and after 30 cycles one molecule yields about a billion copies.',
  '2³⁰ ≈ 1,07 миллиарда при идеальном удвоении. Именно это превращает единичную молекулу в измеримое количество ДНК. Схема не показывает ни детекцию продукта, ни ошибки полимеразы.',
  '2³⁰ ≈ 1.07 billion under ideal doubling. This is what turns a single molecule into a measurable amount of DNA. The schematic shows neither product detection nor polymerase errors.']
].map(([key,motion,hold,patch,titleRu,titleEn,captionRu,captionEn,noteRu,noteEn])=>({key,motion,hold,patch,titleRu,titleEn,captionRu,captionEn,noteRu,noteEn,sourceLabel:SOURCE,sourceUrl:URL}));
// Complete poses: each cue carries the whole state, so any route order works.
let pose={...baseline};
const full=catalog.map(c=>{pose={...pose,...c.patch};const {patch,...rest}=c;return {...rest,target:{...pose}};});
const config=g.PCR_FILM_CONFIG===undefined?{}:g.PCR_FILM_CONFIG;
const cues=CinemaTimeline.compile({baseline,catalog:full,...config}),duration=CinemaTimeline.duration(cues),sample=t=>CinemaTimeline.sample(cues,baseline,t);
const questions=[
 ['Почему нужна термостабильная полимераза?','Why does the polymerase have to be thermostable?',
  'Каждый цикл начинается с нагрева до 94–98 °C, который разрушил бы обычный фермент. Taq-полимераза из Thermus aquaticus сохраняет активность, поэтому фермент добавляют один раз.',
  'Every cycle starts with heating to 94–98 °C, which would destroy an ordinary enzyme. Taq polymerase from Thermus aquaticus stays active, so the enzyme is added once.'],
 ['Действительно ли после 30 циклов получается миллиард копий?','Do 30 cycles really give a billion copies?',
  'Только при идеальном удвоении. Эффективность каждого цикла ниже 100 %, а в поздних циклах реакция выходит на плато из-за расхода праймеров и нуклеотидов и конкуренции продукта с праймерами.',
  'Only with ideal doubling. Each cycle runs below 100 % efficiency, and late cycles reach a plateau as primers and nucleotides are consumed and product competes with primers.'],
 ['Что задаёт длину продукта?','What sets the product length?',
  'Расстояние между сайтами двух праймеров. Со второго-третьего цикла преобладают фрагменты именно этой длины, потому что новые цепи начинаются от праймера и заканчиваются на конце матрицы, которая сама начиналась с праймера.',
  'The distance between the two primer sites. From the second and third cycle on, fragments of exactly this length dominate, because new strands start at a primer and end at the end of a template that itself started at a primer.']
];
const qa=lang=>questions.map(q=>({q:q[lang==='en'?1:0],a:q[lang==='en'?3:2],url:URL,source:SOURCE}));
D.i18n.pack('en',{notes:{[ID]:cues.map(c=>F.note(c.noteEn,c.sourceLabel,c.sourceUrl))},qa:{[ID]:qa('en')}});
D.deck.register({id:ID,title:tr('ПЦР: как одна молекула становится тысячей','PCR: how one molecule becomes a thousand'),chapter:tr('Непрерывный учебный фильм','Continuous teaching film'),
 notes:cues.map(c=>F.note(c.noteRu,c.sourceLabel,c.sourceUrl)),qa:qa('ru'),
 build(ctx){
  const v=F.stage(ctx,cues[0].titleRu,'ПЦР',tr('Учебная схема · Mullis & Faloona, 1987','Teaching schematic · Mullis & Faloona, 1987'));
  v.heading.setAttribute('data-i18n-ignore','');v.cap.setAttribute('data-i18n-ignore','');
  const svg=v.svg,state={time:0};
  // Geometry in stage units. The drawing area is x 60–1220, y 147–610.
  const X0=240,X1=1040,TOP=300,BOTTOM=380,SPREAD=90,RUNGS=20;
  const molecule=F.group(svg),top=F.group(molecule),bottom=F.group(molecule),rungs=Array.from({length:RUNGS},(_,i)=>F.line(molecule,X0+40+i*40,TOP,X0+40+i*40,BOTTOM,C.grey,2));
  // Each band moves as a whole, so its labels keep their layout contracts.
  const strandTop=F.line(top,X0,TOP,X1,TOP,C.blue,6),strandBottom=F.line(bottom,X0,BOTTOM,X1,BOTTOM,C.gold,6);
  const endLabel=(band,x,y,text,color,align)=>L.textBox(band,{id:ID+'-'+text+'-'+x,x:align==='right'?x-70:x,y:y-16,width:70,height:32,text,size:22,color,align,padding:0});
  endLabel(top,X0-14,TOP,"5′",C.blue,'right');endLabel(top,X1+14,TOP,"3′",C.blue,'left');
  endLabel(bottom,X0-14,BOTTOM,"3′",C.gold,'right');endLabel(bottom,X1+14,BOTTOM,"5′",C.gold,'left');
  // Primers anneal below the upper template and above the lower one; new strands
  // grow from them 5′→3′, so the upper copy grows leftwards, the lower rightwards.
  const primerReverse=F.line(top,X1-20,TOP+14,X1-140,TOP+14,C.purple,8),primerForward=F.line(bottom,X0+20,BOTTOM-14,X0+140,BOTTOM-14,C.purple,8);
  const newReverse=F.line(top,X1-140,TOP+14,X1-140,TOP+14,C.teal,6),newForward=F.line(bottom,X0+140,BOTTOM-14,X0+140,BOTTOM-14,C.teal,6);
  const polymeraseReverse=F.dot(top,X1-140,TOP+14,11,C.teal),polymeraseForward=F.dot(bottom,X0+140,BOTTOM-14,11,C.teal);
  const primerLabel=L.textBox(molecule,{id:ID+'-primers',x:60,y:520,width:1160,height:34,text:tr('Праймеры (фиолетовые) задают границы копируемого участка','Primers (purple) define the copied region'),size:22,color:C.purple,padding:0});
  const strandLabel=L.textBox(molecule,{id:ID+'-new',x:60,y:560,width:1160,height:34,text:tr('Новые цепи (бирюзовые) растут от праймера в направлении 5′→3′','New strands (teal) grow from the primer in the 5′→3′ direction'),size:22,color:C.teal,padding:0});
  const counter=L.textBox(svg,{id:ID+'-counter',x:860,y:160,width:360,height:40,text:'',size:24,color:C.white,align:'right',padding:0});
  // Cycle chart: bars on a log2 scale, one step per doubling.
  const chart=F.group(svg),bars=[],barLabels=[],axisLabels=[];
  const BX=300,PITCH=72,BW=44,BASE=560,STEP=26;
  for(let n=0;n<=10;n++){
   const x=BX+n*PITCH;
   bars.push(Object.assign(D.dom.s('rect',{x,y:BASE,width:BW,height:0,fill:n?C.blue:C.gold,rx:4}),{}));chart.append(bars[n]);
   barLabels.push(L.textBox(chart,{id:ID+'-bar-'+n,x:x-14,y:BASE-STEP*(n+1)-30,width:BW+28,height:26,text:String(2**n),size:16,color:C.white,padding:0}));
   axisLabels.push(L.textBox(chart,{id:ID+'-axis-'+n,x:x-14,y:BASE+8,width:BW+28,height:24,text:String(n),size:16,color:C.grey,padding:0}));
  }
  const axisTitle=L.textBox(chart,{id:ID+'-axis-title',x:1100,y:BASE+8,width:120,height:24,text:tr('цикл','cycle'),size:16,color:C.grey,align:'left',padding:0});
  const formula=L.textBox(chart,{id:ID+'-formula',x:860,y:210,width:360,height:40,text:tr('N = 2ⁿ при идеальном удвоении','N = 2ⁿ under ideal doubling'),size:22,color:C.blue,align:'right',padding:0});
  let lastCopy='';
  function paint(){
   const frame=sample(state.time),s=frame.values,cue=cues[frame.cue],lang=D.i18n.lang()==='en'?'En':'Ru';
   const key=frame.cue+':'+lang;if(key!==lastCopy){v.title(cue['title'+lang]);v.caption(cue['caption'+lang]);lastCopy=key;}
   const melt=clamp(s.melt),anneal=clamp(s.anneal),extend=clamp(s.extend),chart01=clamp(s.chart);
   F.at(top,0,-SPREAD*melt);F.at(bottom,0,SPREAD*melt);
   rungs.forEach(r=>F.opacity(r,1-melt));
   // Primers slide in from the free side and settle against their templates.
   F.seg(primerReverse,X1-20,TOP+14+40*(1-anneal),X1-140,TOP+14+40*(1-anneal));F.opacity(primerReverse,anneal);
   F.seg(primerForward,X0+20,BOTTOM-14-40*(1-anneal),X0+140,BOTTOM-14-40*(1-anneal));F.opacity(primerForward,anneal);
   const tipR=lerp(X1-140,X0+20,extend),tipF=lerp(X0+140,X1-20,extend);
   F.seg(newReverse,X1-140,TOP+14,tipR,TOP+14);F.opacity(newReverse,extend>0?1:0);
   F.seg(newForward,X0+140,BOTTOM-14,tipF,BOTTOM-14);F.opacity(newForward,extend>0?1:0);
   F.pos(polymeraseReverse,tipR,TOP+14);F.pos(polymeraseForward,tipF,BOTTOM-14);
   const working=clamp(4*extend*(1-extend));F.opacity(polymeraseReverse,working);F.opacity(polymeraseForward,working);
   F.opacity(primerLabel.el,anneal*(1-extend));F.opacity(strandLabel.el,extend>0&&extend<1?1:extend*(1-chart01));
   F.opacity(molecule,1-chart01);
   const shown=chart01>0?2**Math.min(10,Math.floor(s.cycles)):Math.round(s.copies);
   counter.setText((lang==='En'?'DNA molecules: ':'Молекул ДНК: ')+shown);
   F.opacity(counter.el,1);
   F.opacity(chart,chart01);
   bars.forEach((bar,n)=>{const grown=n===0?1:F.phase(s.cycles,n-1,n),h=STEP*(n+1)*grown;F.put(bar,'y',BASE-h);F.put(bar,'height',h);F.opacity(barLabels[n].el,grown>=1?1:0);});
   F.opacity(formula.el,F.phase(s.cycles,9,10)*chart01);
   v.root.dataset.cue=String(frame.cue);v.root.dataset.filmTime=state.time.toFixed(3);
   g.PCR_FILM.snapshot={time:state.time,key:cue.key,cue:frame.cue,values:{...s},shown};
  }
  const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);
  const controller=Cinema.mount(ctx,{root:v.root,state,driver,cues,duration,narrativeIndex:t=>sample(t).cue});
  ctx.onDispose(D.i18n.onChange(paint));
  cues.slice(1).forEach((c,i)=>ctx.step(()=>controller.go(i+1,true)));
  paint();return v.root;
 }});
g.PCR_FILM={cues,catalog:Object.freeze(full.map(c=>Object.freeze({...c,target:Object.freeze({...c.target})}))),baseline,duration,sample};
})(window);
