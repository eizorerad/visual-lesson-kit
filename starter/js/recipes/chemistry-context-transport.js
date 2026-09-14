/* Transport, light and kinetic applications. Authored explanation progress is not physical time. */
(function(global){
'use strict';
const specs=global.CHEMISTRY_APPLICATIONS=global.CHEMISTRY_APPLICATIONS||[];
const phase=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
// Match the shell's caption tolerance without offsetting progress between phases.
function phaseProgress(p){for(const at of [0,.2,.4,.6,.8])if(p+1e-8>=at&&p-1e-8<=at)return at;return p;}
const mix=(a,b,t)=>a+(b-a)*t;
const stages=(ru,en,seeks=[])=>ru.map((label,i)=>({at:i/5,label,enLabel:en[i],...(seeks[i]===undefined?{}:{seek:seeks[i]})}));
function seg(n,x1,y1,x2,y2){F.seg(n,x1,y1,x2,y2);}
function write(H,box,ru,en){box.setText(H.tr(ru,en));}
function traceTo(node,plot,fn,a,b){node.setAttribute('d',Array.from({length:121},(_,i)=>{const x=mix(a,b,i/120);return(i?'L':'M')+plot.x(x)+','+plot.y(fn(x));}).join(' '));}
function move(node,x,y){node.setAttribute('transform',`translate(${x} ${y})`);}
const cue=(at,ru,en)=>({at,ru,en});
const reflect=(v,a,b)=>{const w=b-a,q=((v-a)%(2*w)+2*w)%(2*w);return a+(q<=w?q:2*w-q);};

specs.push({
 id:'diffusion',title:'Засветка и возврат свечения',enTitle:'Bleaching and fluorescence recovery',
 question:'Что сохраняется, когда свечение возвращается в центр?',enQuestion:'What is conserved as fluorescence returns to the center?',
 control:'Ход опыта FRAP',enControl:'FRAP explanation progress',duration:52000,
 stages:stages(['До засветки','Засветка','Перемешивание','Восстановление','Предел'],['Before bleach','Bleach','Redistribution','Recovery','Limit'],[0,.27,.5,.7,1]),
 source:'Caltech · Diffusion master equation and FRAP',url:'https://www.rpgroup.caltech.edu/mbl_pboc/code/diffusion_master_equation.html',
 answer:'Засветка переводит флуорофоры в тёмное состояние, сохраняя белок. Затем обе популяции диффундируют: локальный сигнал растёт, а общее число светящихся молекул не растёт.',
 enAnswer:'Bleaching changes fluorophores to a dark state while retaining protein. Both populations then diffuse: local fluorescence rises without an increase in the total fluorescent population.',
 captions:[
  'До засветки все 20 равных ячеек имеют светящуюся долю 1. Столбцы показывают концентрации.',
  'В шести центральных ячейках светящаяся доля становится тёмной. Общий белок не исчезает.',
  'Светящаяся и тёмная популяции перераспределяются одним законом диффузии. Тёмные флуорофоры не «включаются» обратно.',
  'В центре становится больше светящихся молекул и меньше тёмных. Суммы по всей области остаются 14 и 6.',
  'В замкнутой области сигнал стремится к 14/20 = 0.7. Полное восстановление до 1 здесь невозможно.'
 ],
 enCaptions:[
  'Before bleaching, all 20 equal cells have fluorescent fraction 1. Bars represent concentrations.',
  'In six central cells, the fluorescent population becomes dark. The total protein is retained.',
  'Fluorescent and dark populations redistribute by the same diffusion law. Dark fluorophores do not switch back on.',
  'The center gains fluorescent molecules and loses dark ones. Their whole-domain totals remain 14 and 6.',
  'In this closed domain, fluorescence tends to 14/20 = 0.7. Full recovery to 1 is impossible here.'
 ],
 note:'Авторская 1D модель: 20 одинаковых ячеек, отражающие края, α=DΔt/Δx²=0.35. Светящаяся F и тёмная D популяции вычисляются отдельно через PH.diffuseStep; F+D=1 в каждой ячейке. До засветки ΣF=20, ΣD=0. Однократная необратимая засветка шести ячеек меняет эти суммы на 14 и 6, не меняя белок. После неё обе суммы сохраняются. Цвет обозначает состояние флуорофора; высота — ожидаемую концентрацию, а не конкретную молекулу. Равномерный предел F=0.7 отличается от исходного сигнала 1 из-за замкнутости области. Шаг интегрирования не переведён в секунды: D, Δx и Δt отдельно не заданы. Связывание, синтез, распад белка и обратимое мигание исключены. Луч последовательно гасит шесть центральных долей; после его завершения диффузионное поле интерполируется между соседними расчётными шагами. Двадцать движущихся точек сохраняют свою светящуюся или тёмную идентичность и иллюстрируют обмен, но не являются выборкой этого поля и не используются для высоты столбцов. Их авторские пути отражаются на границах; это не измеренные траектории.',
 enNote:'An authored 1D model uses 20 equal cells, reflecting ends and α=DΔt/Δx²=0.35. Fluorescent F and dark D populations are propagated separately with PH.diffuseStep; F+D=1 in every cell. Before bleaching, ΣF=20 and ΣD=0. A single irreversible bleach of six cells changes these totals to 14 and 6 without removing protein. Both totals are conserved thereafter. Color denotes fluorophore state; height denotes expected concentration, not one identified molecule. The uniform limit F=0.7 differs from the initial signal 1 because the domain is closed. Integration steps are not seconds: D, Δx and Δt are not separately specified. Binding, protein synthesis/degradation and reversible blinking are excluded. A scan extinguishes six central units in succession; afterward the diffusion field interpolates adjacent calculated steps. Twenty moving dots preserve fluorescent or dark identity and illustrate exchange; they are not a sample of this field and do not set bar heights. Their authored paths reflect at boundaries and are not measured trajectories.',
 narration:[
  cue(0,'Следим за белком с флуоресцентной меткой. Светятся все двадцать долей.','Follow fluorescently labeled protein. All twenty population units initially glow.'),
  cue(.08,'Выберем центр: здесь будем измерять сигнал, пока молекулы перемещаются.','Choose the center: we will measure its signal as molecules move.'),
  cue(.16,'Проводим световым импульсом по центру. Метки гаснут, белок остаётся.','Sweep the center with a light pulse. Labels go dark; protein remains.'),
  cue(.27,'Шесть долей стали тёмными. Во всей области осталось четырнадцать светящихся.','Six units are dark. Fourteen fluorescent units remain in the whole domain.'),
  cue(.32,'Теперь разрешим перераспределение: светящиеся входят в центр, тёмные выходят.','Now allow redistribution: fluorescent material enters the center and dark material leaves.'),
  cue(.42,'Точки показывают смысл движения. Столбцы отдельно вычисляют концентрации.','The dots illustrate the movement. The bars separately calculate concentrations.'),
  cue(.53,'Центральный сигнал растёт, и та же величина поднимает точку на графике.','The central signal rises, and that same value lifts the point on the graph.'),
  cue(.64,'Тёмные метки не загораются снова: меняется состав наблюдаемой области.','Dark labels never relight: the observed region changes its composition.'),
  cue(.75,'Суммы F и D сохраняются, хотя локальные столбцы продолжают меняться.','Totals F and D stay fixed while the local bars continue changing.'),
  cue(.86,'Область замкнута. Общего запаса свечения хватает только на уровень 14/20.','The domain is closed. Its fluorescent supply permits only a level of 14/20.'),
  cue(.95,'Сигнал приближается к 0.7. Восстановление здесь означает обмен, а не ремонт меток.','The signal approaches 0.7. Recovery here means exchange, not label repair.')
 ],
 draw(g,H){
  const fluorescent=[Array.from({length:20},(_,i)=>i>=7&&i<13?0:1)],dark=[fluorescent[0].map(v=>1-v)];
  for(let n=0;n<600;n++){fluorescent.push(PH.diffuseStep(fluorescent[n],.35));dark.push(PH.diffuseStep(dark[n],.35));}
  const mean=a=>a.slice(7,13).reduce((s,v)=>s+v,0)/6,field=(data,n)=>data[Math.floor(n)].map((v,i)=>mix(v,data[Math.min(600,Math.ceil(n))][i],n%1));
  H.label(g,85,212,575,33,'Засветка меняет метку, не белок','Bleaching changes the label, not protein',24,C.white);
  H.label(g,83,246,579,29,'Точки: схема движения · столбцы: поле F/D','Dots: illustrative motion · bars: F/D field',19,C.grey);
  const boundary=H.rect(g,96,280,533,137,C.grey);boundary.setAttribute('fill','none');
  const roi=H.rect(g,278,277,156,145,C.gold);roi.setAttribute('fill','none');roi.dataset.bleachRegion='cells-7-12';
  const laser=H.rect(g,278,278,12,142,C.gold);laser.setAttribute('fill-opacity','.2');laser.dataset.bleachBeam='scan';
  const bars=Array.from({length:20},(_,i)=>{const x=100+26*i,f=H.rect(g,x,360,21,54,C.teal),d=H.rect(g,x,360,21,0,C.grey);[f,d].forEach(n=>n.setAttribute('rx','1'));f.setAttribute('fill-opacity','.6');d.setAttribute('fill-opacity','.2');f.dataset.population='fluorescent';d.dataset.population='dark';return{f,d};});
  const tracers=Array.from({length:20},(_,i)=>{const node=H.circle(g,110+26*i,304+18*(i%2),5,C.teal,.9);node.dataset.frapTracer=String(i);let seed=41+i*131,x=110+26*i,y=304+18*(i%2);const positions=[[x,y]],rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
   const shift=i>=7&&i<=9?-83:i>=10&&i<=12?83:i>=4&&i<=6?90:i>=13&&i<=15?-90:14*(i%2?1:-1);positions.push([reflect(x+shift,100,624),y+(i%2?8:-8)]);x=positions[1][0];y=positions[1][1];for(let j=2;j<=80;j++){x=reflect(x+(rand()-.5)*126,100,624);y=reflect(y+(rand()-.5)*42,291,344);positions.push([x,y]);}return{node,positions};});
  H.label(g,248,425,226,29,'Измеряем этот центр','Measure this center',20,C.gold);
  const totals=H.label(g,83,467,575,29,'','',21,C.white);
  const plot=H.plot(g,{x:797,y:274,w:360,h:120,xmin:0,xmax:600,ymin:0,ymax:1,xt:[0,300,600],yt:[0,.5,1],title:'F в центре после засветки',enTitle:'Central F after bleaching',xlabel:'Шаг интегрирования',enXlabel:'Integration step'});
  const curve=H.path(g,'',C.teal,2),point=plot.point(C.gold);curve.dataset.frapRecoveryCurve='';point.el.dataset.frapRecoveryMarker='';
  const limit=H.line(g,plot.x(0),plot.y(.7),plot.x(600),plot.y(.7),C.grey,'3 5');
  const link=H.arrow(g,652,336,701,336,C.gold,'force');
  const centerRead=H.label(g,728,467,480,29,'','',22,C.gold);
  return {paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),bleachCount=Array.from({length:6},(_,i)=>p+1e-12>=.17+.02*i?1:0).reduce((a,b)=>a+b,0);
   const n=p<.32?0:p<.58?30*phase(p,.32,.58):p<.82?mix(30,180,phase(p,.58,.82)):mix(180,600,phase(p,.82,1));
   const f=p<.32?Array.from({length:20},(_,i)=>i>=7&&i<7+bleachCount?0:1):field(fluorescent,n),d=p<.32?f.map(v=>1-v):field(dark,n);
   bars.forEach((b,i)=>{b.f.setAttribute('height',54*f[i]);b.f.setAttribute('y',414-54*f[i]);b.d.setAttribute('height',54*d[i]);b.d.setAttribute('y',360);});
   laser.setAttribute('x',278+156*phase(p,.16,.28)-6);H.show(laser,p>=.16&&p<=.28?Math.sin(Math.PI*phase(p,.16,.28)):0);
   const clock=p<.32?0:p<.46?phase(p,.32,.46):1+79*phase(p,.46,1);
   tracers.forEach((t,i)=>{const a=t.positions[Math.floor(clock)],b=t.positions[Math.min(80,Math.ceil(clock))],q=clock%1,off=p<.14?3*Math.sin(p*60+i):0;t.node.setAttribute('cx',mix(a[0],b[0],q)+off);t.node.setAttribute('cy',mix(a[1],b[1],q));const darkened=i>=7&&i<7+bleachCount;t.node.dataset.fluorophore=darkened?'dark':'fluorescent';t.node.setAttribute('fill',darkened?C.grey:C.teal);t.node.setAttribute('stroke',darkened?C.grey:C.teal);t.node.setAttribute('fill-opacity',darkened?'.22':'.9');});
   traceTo(curve,plot,x=>mean(field(fluorescent,x)),0,n);point.set(n,mean(f));H.show(curve,p>=.27?1:0);H.show(point.el,p>=.27?1:0);H.show(limit,phase(p,.82,.94));H.show(link,phase(p,.28,.34));
   const Fsum=f.reduce((a,b)=>a+b,0),Dsum=d.reduce((a,b)=>a+b,0);totals.setText('ΣF = '+H.fmt(Fsum,0)+'   ΣD = '+H.fmt(Dsum,0)+'   Σ(F+D) = 20');write(H,centerRead,'Центр: F = '+H.fmt(mean(f),3),'Center: F = '+H.fmt(mean(f),3));
   return{stage,step:n,bleached:bleachCount>0,bleachedCells:bleachCount,alpha:.35,proteinTotal:20,fluorescenceTotal:Fsum,darkTotal:Dsum,centralFluorescence:mean(f),values:[...f],darkValues:[...d],boundary:'reflecting',representation:'population concentration',uniformLimit:.7,tracerMotion:'illustrative; not a field sample',tracerClock:clock};
  }};
 }
});

specs.push({
 id:'membrane',title:'Градиент K⁺ и равновесное напряжение',enTitle:'A K⁺ gradient and its equilibrium voltage',
 question:'Когда электрическая сила уравновешивает градиент K⁺?',enQuestion:'When does electrical force balance the K⁺ gradient?',
 control:'Ход объяснения Нернста',enControl:'Nernst explanation progress',duration:52000,
 stages:stages(['Концентрации','При V = 0','Напряжение','Равновесие','Другой знак'],['Concentrations','At V = 0','Voltage','Equilibrium','Reverse sign'],[0,.25,.52,.7,1]),
 source:'Hille & Catterall · Nernst potential',url:'https://www.ncbi.nlm.nih.gov/books/NBK28117/',
 answer:'Для K⁺ Eₖ=(RT/F)ln(cout/cin), где Eₖ=Vin−Vout. При V=Eₖ суммарный пассивный поток K⁺ равен нулю, хотя отдельные ионы могут пересекать мембрану в обе стороны.',
 enAnswer:'For K⁺, Eₖ=(RT/F)ln(cout/cin), with Eₖ=Vin−Vout. At V=Eₖ, net passive K⁺ flux is zero, although individual ions may still cross in both directions.',
 captions:[
  'Внутри слева: 10 mM K⁺; снаружи справа: 1 mM. Мембрана проницаема для K⁺.',
  'При V = 0 электрическая сила отсутствует. Градиент концентрации создаёт суммарный пассивный поток K⁺ наружу.',
  'Задаём всё более отрицательное Vin−Vout. Электрическая сила на положительный K⁺ направлена внутрь.',
  'Приближаемся к V = Eₖ и удерживаем равновесие: встречные потоки становятся равны.',
  'Повышаем наружную концентрацию до 100 mM и следуем Eₖ: концентрационная тенденция и электрическая сила меняют знаки.'
 ],
 enCaptions:[
  'Inside is on the left: 10 mM K⁺; outside on the right: 1 mM. The membrane is permeable to K⁺.',
  'At V = 0 there is no electrical force. The concentration gradient produces net passive outward K⁺ flux.',
  'We impose an increasingly negative Vin−Vout. Electrical force on positive K⁺ points inward.',
  'Approach V = Eₖ and hold equilibrium: opposing fluxes become equal.',
  'Raise outside concentration to 100 mM while following Eₖ: the concentration tendency and electrical force reverse signs.'
 ],
 note:'Идеальная модель одного проницаемого иона: K⁺, z=+1, T=298.15 K, cin=10 mM. Сначала cout=1 mM, затем отдельное сравнение cout=100 mM. Концентрации поддерживаются резервуарами; противоионы опущены. V=Vin−Vout задаётся автором, а Eₖ вычисляется PH.nernst. Это не расчёт зарядки мембраны во времени. Синяя стрелка показывает направление тенденции по концентрации, золотая — электрической силы на K⁺; они не изображают электронные пары, перемещение одного иона или измеренную величину потока. Их длины условны. При V=Eₖ равны противоположные односторонние потоки, а не отсутствуют переходы отдельных ионов. Уравнение использует концентрации вместо активностей. Реальное напряжение клетки с другими ионами и насосами не предсказывается. Движущиеся K⁺ — повторяемые значки прохождения, а не сохраняемый набор индивидуальных ионов. Частоты проходов условно показывают неравенство и затем равенство встречных потоков; они не являются количественным законом проводимости. Резервуары компенсируют обмен. Наружная концентрация в финале плавно повышается от 1 до 100 mM, а заданный V следует Eₖ.',
 enNote:'An ideal model has one permeant ion: K⁺, z=+1, T=298.15 K and cin=10 mM. Initially cout=1 mM; a separate comparison uses cout=100 mM. Reservoirs hold concentrations fixed; counterions are omitted. V=Vin−Vout is authored, while PH.nernst calculates Eₖ. Membrane charging over time is not simulated. The blue arrow denotes the concentration tendency; gold denotes electrical force on K⁺. Neither is an electron-pair arrow, an individual ion trajectory or a measured flux magnitude; lengths are schematic. At V=Eₖ, opposing one-way fluxes balance rather than individual ion crossings stopping. Concentrations approximate activities. Actual cell voltage with other ions and pumps is not predicted. Moving K⁺ glyphs repeat crossings rather than tracking a conserved set of individual ions. Authored passage frequencies illustrate unequal, then equal opposing fluxes; they are not a quantitative conductance law. Reservoirs compensate the exchange. The final outside concentration rises continuously from 1 to 100 mM while imposed V follows Eₖ.',
 narration:[
  cue(0,'Слева внутри 10 mM K⁺, справа снаружи 1 mM. Растворы поддерживают резервуары.','Inside on the left has 10 mM K⁺; outside on the right has 1 mM. Reservoirs maintain them.'),
  cue(.09,'Откроем путь через мембрану. Переходы возможны в обе стороны.','Open a route through the membrane. Crossings are possible in both directions.'),
  cue(.19,'При нулевом напряжении из более концентрированного раствора выходит больше K⁺.','At zero voltage, more K⁺ leaves the more concentrated solution.'),
  cue(.30,'Поэтому два встречных потока пока не равны: суммарное движение направлено наружу.','The opposing fluxes are unequal, so their net movement is outward.'),
  cue(.38,'Теперь задаём отрицательное напряжение внутри. Это отдельное управляемое условие.','Now impose a negative inside voltage. This is a separate controlled condition.'),
  cue(.49,'Положительный K⁺ испытывает силу внутрь. Она противодействует концентрационной тенденции.','Positive K⁺ feels an inward force. It opposes the concentration tendency.'),
  cue(.60,'По мере усиления этой причины разница встречных потоков уменьшается.','As this opposing influence grows, the difference between the fluxes decreases.'),
  cue(.65,'V достиг Eₖ. Ионы ещё проходят, но встречные потоки теперь равны.','V has reached Eₖ. Ions still pass, but the opposing fluxes are now equal.'),
  cue(.76,'Нулевой суммарный поток не означает неподвижные ионы.','Zero net flux does not mean stationary ions.'),
  cue(.81,'Повысим наружную концентрацию и будем задавать соответствующее равновесное напряжение.','Raise the outside concentration while imposing its corresponding equilibrium voltage.'),
  cue(.88,'Когда снаружи становится больше K⁺, концентрационная тенденция меняет направление.','When outside K⁺ becomes higher, the concentration tendency reverses.'),
  cue(.96,'Теперь внутри положительный потенциал: электрическая сила направлена наружу.','Now the inside potential is positive: electrical force points outward.')
 ],
 draw(g,H){
  H.label(g,86,212,570,36,'K⁺: концентрация и электричество','K⁺: concentration and electricity',25,C.white);
  const cinText=H.label(g,94,250,227,34,'Внутри · 10 mM','Inside · 10 mM',22,C.blue),outside=H.label(g,402,250,236,34,'','',22,C.teal);
  H.rect(g,100,289,235,106,C.blue);H.rect(g,405,289,235,106,C.teal);
  for(const x of [365,378])for(const [a,b] of [[282,315],[338,350],[373,399]])H.line(g,x,a,x,b,C.grey);
  H.line(g,350,315,392,315,C.grey);H.line(g,350,338,392,338,C.grey);H.line(g,350,350,392,350,C.grey);H.line(g,350,373,392,373,C.grey);
  const ions=[];for(const [dir,y] of [[1,326],[-1,362]])for(let i=0;i<4;i++){const node=H.group(g);node.dataset.ionCrossing=dir>0?'outward':'inward';H.circle(node,0,0,12,dir>0?C.blue:C.gold,.12);H.label(node,-17,-16,34,32,'K⁺','K⁺',17,dir>0?C.blue:C.gold);ions.push({node,dir,y,i});}
  H.label(g,86,403,248,29,'По концентрации','Concentration tendency',19,C.blue);H.label(g,86,437,248,29,'Электрическая сила K⁺','Electrical force on K⁺',19,C.gold);
  const concentration=H.arrow(g,345,418,470,418,C.blue,'force'),electric=H.arrow(g,470,451,345,451,C.gold,'force');concentration.g.dataset.nernstArrow='concentration-tendency';electric.g.dataset.nernstArrow='electrical-force';
  const imposed=H.label(g,473,397,186,64,'V задан\nV = Vᵢₙ − Vₒᵤₜ','V is imposed\nV = Vᵢₙ − Vₒᵤₜ',19,C.grey),net=H.label(g,85,469,575,27,'','',21,C.gold);
  const plot=H.plot(g,{x:797,y:274,w:360,h:120,xmin:-1,xmax:1,ymin:-65,ymax:65,xt:[-1,0,1],yt:[-60,0,60],title:'Eₖ (—), заданный V (●) · mV',enTitle:'Eₖ (—), imposed V (●) · mV',xlabel:'log₁₀(cout/cin)'});
  const curve=plot.curve(log=>1000*PH.nernst(10*10**log,10),C.teal),point=plot.point(C.gold),target=plot.point(C.grey);point.el.dataset.nernstVoltageMarker='actual';
  const equilibrium=H.label(g,722,467,490,29,'','',21,C.gold);
  return {paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),cin=10,cout=10**mix(0,2,phase(p,.8,.95)),ek=PH.nernst(cout,cin),fraction=phase(p,.38,.64),volts=ek*fraction;
   const cdir=Math.abs(cout-cin)<1e-10?0:cout<cin?1:-1,edir=Math.abs(volts)<1e-12?0:Math.sign(volts),netdir=Math.abs(volts-ek)<1e-12?0:Math.sign(volts-ek);
   const outwardRate=1+3*(1-fraction),inwardRate=1,early=Math.max(0,Math.min(p-.15,.23)),ramp=Math.max(0,Math.min(p-.38,.26)),late=Math.max(0,p-.64),clockOut=2.2*(4*early+4*ramp-1.5*ramp*ramp/.26+late),clockIn=2.2*Math.max(0,p-.15);
   ions.forEach(t=>{const clock=t.dir>0?clockOut:clockIn,q=(clock+t.i/4)%1,x=t.dir>0?mix(132,608,q):mix(608,132,q);move(t.node,x,t.y);H.show(t.node,phase(p,.08,.15));});
   outside.setText(H.tr('Снаружи · '+H.fmt(cout,1)+' mM','Outside · '+H.fmt(cout,1)+' mM'));
   concentration.set({x1:cdir>=0?345:470,y1:418,x2:cdir>=0?470:345,y2:418});const length=125*fraction*phase(Math.abs(Math.log10(cout/cin)),0,.2);if(length>1e-6)electric.set({x1:edir>=0?345:470,y1:451,x2:edir>=0?345+length:470-length,y2:451});H.show(concentration,phase(p,.12,.22)*phase(Math.abs(Math.log10(cout/cin)),0,.2));H.show(electric,Math.abs(volts)>1e-12?1:0);
   write(H,net,netdir===0?'Оба направления: равные потоки':'Пока наружу проходит больше K⁺',netdir===0?'Both directions: equal fluxes':'More K⁺ passes outward for now');
   point.set(Math.log10(cout/cin),1000*volts);target.set(Math.log10(cout/cin),1000*ek);H.show(target.el,1-fraction);curve.el.setAttribute('opacity',String(mix(.3,1,phase(p,.18,.64))));equilibrium.setText('V = '+H.fmt(1000*volts,1)+' mV    Eₖ = '+H.fmt(1000*ek,1)+' mV');
   return{stage,inside:cin,outside:cout,concentrationUnit:'mM',ratio:cout/cin,z:1,T:298.15,volts:ek,actualVolts:volts,equilibriumVolts:ek,atEquilibrium:netdir===0,concentrationDirection:cdir,electricalDirection:edir,netFluxDirection:netdir,voltageConvention:'inside-minus-outside',directionsOnly:true,membraneChargingSimulated:false,outwardDisplayRate:outwardRate,inwardDisplayRate:inwardRate,crossingClockOut:clockOut,crossingClockIn:clockIn};
  }};
 }
});

specs.push({
 id:'photons',title:'Длина волны и энергия фотона',enTitle:'Wavelength and photon energy',
 question:'Что меняется при уменьшении длины световой волны?',enQuestion:'What changes when the wavelength of light decreases?',
 control:'Ход объяснения света',enControl:'Light explanation progress',duration:48000,
 stages:stages(['Поле','Длина волны','Короткая волна','Энергия','Сравнение'],['Field','Wavelength','Shorter wave','Energy','Comparison'],[0,.3,.5,.7,1]),
 source:'OpenStax · Photon energies',url:'https://openstax.org/books/college-physics-2e/pages/29-3-photon-energies-and-the-electromagnetic-spectrum',
 answer:'В вакууме Eф=hν=hc/λ. При меньшей λ энергия одного фотона больше. Волнистая линия показывает электрическое поле в пространстве, а не траекторию фотона.',
 enAnswer:'In vacuum, Eph=hν=hc/λ. A shorter λ means more energy per photon. The wave depicts electric field versus position, not a photon trajectory.',
 captions:[
  'Снимок электрического поля вдоль x. Волнистая линия — поле, а не извилистый путь частицы.',
  'λ — расстояние между соседними максимумами поля в один момент времени. Здесь λ = 700 nm в вакууме.',
  'Уменьшаем λ с 700 до 400 nm. На том же участке помещается больше периодов; ν = c/λ растёт.',
  'Энергия одного фотона Eф = hc/λ. Амплитуда нарисованного поля не задаёт эту энергию.',
  'При 400 nm один фотон несёт в 1.75 раза больше энергии, чем при 700 nm. Число фотонов — отдельная величина.'
 ],
 enCaptions:[
  'A snapshot of electric field along x. The wavy line is a field, not a curved particle path.',
  'λ is the distance between adjacent field maxima at one instant. Here λ = 700 nm in vacuum.',
  'Shorten λ from 700 to 400 nm. More periods fit in the same interval; ν = c/λ increases.',
  'One photon has energy Eph = hc/λ. The drawn field amplitude does not set that energy.',
  'A 400 nm photon carries 1.75 times the energy of a 700 nm photon. Photon number is a separate quantity.'
 ],
 note:'PH.photon применяет E=hc/λ к вакуумным длинам волн 400–700 nm, возвращая J и eV. По горизонтали задан единый масштаб: 0.33 единицы SVG/nm. Вертикальная амплитуда условна, одинакова во всех кадрах; это схематичный пространственный срез классического поля, не форма отдельного фотона или его траектория. Энергия относится к одному фотону. Интенсивность и число фотонов не вычисляются. Уровни атома, вероятность поглощения, переход и время жизни не моделируются. Точки графика вычислены из тех же значений λ, что и периоды поля. Фаза поля продвигается по авторскому замедленному времени; это не отображение скорости света в масштабе секунд. Для измерения одного пространственного периода рисунок временно останавливается.',
 enNote:'PH.photon applies E=hc/λ to vacuum wavelengths of 400–700 nm, returning J and eV. A single horizontal scale is used: 0.33 SVG units/nm. Vertical amplitude is arbitrary and constant; the diagram is a spatial slice of a classical field, not an individual photon shape or trajectory. Energy is per photon. Intensity and photon number are not calculated. Atomic levels, absorption probability, transitions and lifetimes are not modeled. Graph points use the same wavelengths as the field periods. Field phase advances on an authored slowed clock, not a seconds-scale rendering of the speed of light. The field temporarily pauses to measure one spatial period.',
 narration:[
  cue(0,'Волнистая линия показывает электрическое поле в разных точках пространства.','The wavy line shows the electric field at different positions.'),
  cue(.09,'Рисунок поля распространяется вправо. Это не извилистая траектория фотона.','The field pattern propagates rightward. It is not a photon following a wavy path.'),
  cue(.20,'На мгновение остановим рисунок и отметим максимум поля.','Freeze the pattern briefly and mark a field maximum.'),
  cue(.27,'От этого максимума отмерим расстояние до следующего: один период в пространстве.','Measure from this maximum to the next: one spatial period.'),
  cue(.37,'Это длина волны λ: сейчас 700 nm. Масштаб по x останется тем же.','That distance is wavelength λ: currently 700 nm. The x scale will stay fixed.'),
  cue(.42,'Сожмём длину волны. На прежнем участке теперь помещается больше периодов.','Compress the wavelength. More periods now fit in the same interval.'),
  cue(.51,'Одновременно точка поднимается по E = hc/λ: меньшая λ даёт большую энергию фотона.','At the same time, the point rises along E = hc/λ: smaller λ gives greater photon energy.'),
  cue(.62,'При 400 nm энергия одного фотона около 3.100 eV. Амплитуда рисунка не выросла.','At 400 nm one photon carries about 3.100 eV. The drawn amplitude has not increased.'),
  cue(.73,'Высота волны и энергия одного фотона — разные величины. Здесь менялась только λ.','Wave height and energy per photon are different quantities. Here only λ changed.'),
  cue(.85,'Сравним с исходной точкой 700 nm: энергия выросла в 1.75 раза.','Compare with the initial 700 nm point: photon energy increased by a factor of 1.75.'),
  cue(.94,'Число фотонов и интенсивность требуют отдельного описания; эта модель их не задаёт.','Photon number and intensity need a separate description; this model does not set them.')
 ],
 draw(g,H){
  H.label(g,85,212,572,38,'Поле распространяется вдоль x','The field propagates along x',25,C.white);
  H.label(g,85,252,572,31,'Это поле, не путь частицы','This is a field, not a particle path',23,C.grey);
  H.line(g,111,339,647,339,C.grey);H.label(g,592,368,61,28,'x','x',21,C.grey);
  const wave=H.path(g,'',C.purple,1.8);wave.dataset.waveMeaning='electric-field-versus-position';
  const crest=H.circle(g,157,309,5,C.gold,.8),measure=H.group(g),bracket=H.line(measure,157,400,388,400,C.gold),end1=H.line(measure,157,395,157,405,C.gold),end2=H.line(measure,388,395,388,405,C.gold);bracket.dataset.photonWavelengthBracket='';
  const measured=H.path(measure,'',C.gold,3),lambda=H.label(g,96,417,553,32,'','',23,C.gold);measured.dataset.wavelengthMeasurement='growing-span';
  H.label(g,89,457,570,35,'Амплитуда постоянна и условна','Amplitude stays fixed and arbitrary',21,C.grey);
  const plot=H.plot(g,{x:797,y:274,w:360,h:120,xmin:400,xmax:700,ymin:1.5,ymax:3.3,xt:[400,550,700],yt:[1.5,2.4,3.3],title:'Энергия одного фотона · eV',enTitle:'Energy per photon · eV',xlabel:'λ в вакууме · nm',enXlabel:'Vacuum λ · nm'});
  const guide=plot.curve(nm=>PH.photon(nm).eV,C.grey);guide.el.setAttribute('opacity','.22');const curve=H.path(g,'',C.purple,2),point=plot.point(C.gold),reference=plot.point(C.grey);curve.dataset.photonEnergyTrace='';point.el.dataset.photonEnergyMarker='';reference.set(700,PH.photon(700).eV);
  const read=H.label(g,717,467,496,29,'','',22,C.gold);
  return{paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),nm=mix(700,400,phase(p,.4,.6)),energy=PH.photon(nm),period=.33*nm,cycles=p<.2?2*p:p<.4?.4:.4+4*Math.min(p-.4,.46),offset=period*(cycles%1),origin=157+offset;
   wave.setAttribute('d',Array.from({length:321},(_,i)=>{const x=111+536*i/320;return(i?'L':'M')+x+','+(339-30*Math.cos(2*Math.PI*((x-157)/period-cycles)));}).join(' '));
   crest.setAttribute('cx',origin);const m=phase(p,.22,.36);seg(bracket,origin,400,origin+period,400);seg(end1,origin,395,origin,405);seg(end2,origin+period,395,origin+period,405);measured.setAttribute('d','M'+origin+',400 L'+(origin+period*m)+',400');H.show(measure,p>=.2&&p<=.4?1:p>=.86?phase(p,.86,.92):.12);H.show(crest,p>=.2&&p<=.4?1:0);
   lambda.setText('λ = '+H.fmt(nm,0)+' nm');traceTo(curve,plot,v=>PH.photon(v).eV,700,nm);point.set(nm,energy.eV);H.show(reference.el,phase(p,.75,.87));
   read.setText('E = hc/λ = '+H.fmt(energy.eV,3)+' eV');
   return{stage,wavelengthNm:nm,joules:energy.joules,eV:energy.eV,wavePeriodPixels:period,wavelengthScale:.33,fieldAmplitude:30,fieldPhaseCycles:cycles,waveMeaning:'field not particle path',calculatedAtomicLevels:false,energyRatio400to700:PH.photon(400).eV/PH.photon(700).eV,measurementProgress:m};
  }};
 }
});

const halfLife=Math.log(2)/.4;
function reactionTime(p){p=phaseProgress(p);if(p<.12)return 0;if(p<.44)return halfLife*phase(p,.12,.44);if(p<=.52)return halfLife;if(p<.74)return mix(halfLife,2*halfLife,phase(p,.52,.74));if(p<=.82)return 2*halfLife;return mix(2*halfLife,8,phase(p,.82,1));}
specs.push({
 id:'kinetics',title:'Первый порядок: доля и время',enTitle:'First order: fraction and time',
 question:'Почему одинаковое время уменьшает A в одинаковое число раз?',enQuestion:'Why does equal elapsed time reduce A by the same factor?',
 control:'Ход объяснения скорости',enControl:'Rate explanation progress',duration:48000,
 value:p=>reactionTime(p).toFixed(3)+' s',
 stages:stages(['Начало','Закон','Полупериод','Ещё полупериод','Позже'],['Start','Rate law','Half-life','Another half-life','Later'],[0,.3,.48,.78,1]),
 source:'OpenStax · Integrated rate laws',url:'https://openstax.org/books/chemistry-2e/pages/12-4-integrated-rate-laws',
 answer:'[A]=[A]₀e^(−kt), а t½=ln2/k. При k=0.4 s⁻¹ доля A уменьшается вдвое каждые 1.733 s. Для A→B с отношением 1:1 сумма [A]+[B] сохраняется.',
 enAnswer:'[A]=[A]₀e^(−kt), with t½=ln2/k. At k=0.4 s⁻¹, A halves every 1.733 s. For a 1:1 A→B conversion, [A]+[B] is conserved.',
 captions:[
  'Начинаем с [A]₀ = 1 mM и [B]₀ = 0. Двадцать значков показывают доли популяции.',
  'Скорость убыли k[A] пропорциональна текущему A. Решение — экспонента, а не прямая линия.',
  'Достигаем одного полупериода t½ = ln2/k, удерживаем A = B = 0.5 mM и продолжаем реакцию.',
  'Движемся ко второму полупериоду и удерживаем четверть исходного A. За равное время убывает одинаковая доля.',
  'Модель даёт плавные концентрации. Значки округляют доли; конкретные времена реакции отдельных молекул здесь не предсказаны.'
 ],
 enCaptions:[
  'Start with [A]₀ = 1 mM and [B]₀ = 0. Twenty tokens represent population fractions.',
  'The loss rate k[A] is proportional to current A. Its solution is exponential, not a straight line.',
  'Reach one half-life, t½ = ln2/k, hold A = B = 0.5 mM, then continue the reaction.',
  'Advance to the second half-life and hold one quarter of the initial A. Equal time removes the same fraction.',
  'The model gives smooth concentrations. Tokens round fractions; individual molecular reaction times are not predicted.'
 ],
 note:'Абстрактная необратимая реакция A→B с отношением 1:1, постоянным объёмом, [A]₀=1 mM, [B]₀=0, k=0.4 s⁻¹ и постоянной температурой. PH.firstOrder вычисляет A, а B=1−A. Сумма 1 mM сохраняется. Каждый из 20 значков означает 1/20 популяции; число A округлено к ближайшему целому, остальные значки — B. Переключение значка не задаёт траекторию или время реакции отдельной молекулы. График и числа содержат непрерывные значения без округления до значков. Полупериоды показаны точными остановками, а ход объяснения не является равномерным ходом физического времени. Обратная реакция, поступление вещества и изменение k исключены.',
 enNote:'An abstract irreversible 1:1 A→B reaction has fixed volume, [A]₀=1 mM, [B]₀=0, k=0.4 s⁻¹ and constant temperature. PH.firstOrder calculates A; B=1−A. Their sum remains 1 mM. Each of 20 tokens denotes 1/20 of the population; the A count is rounded to the nearest integer and the remaining tokens denote B. Token changes do not predict an individual molecular trajectory or reaction time. Graphs and numerical readouts retain the continuous values. Exact half-life checkpoints are held during the explanation; explanation progress is not uniformly advancing physical time. Reverse reaction, replenishment and changes in k are excluded.',
 narration:[
  cue(0,'Начинаем с A. Каждая из двадцати меток обозначает долю популяции.','Begin with A. Each of twenty symbols denotes a population fraction.'),
  cue(.10,'Разрешим превращение A в B; сумма вещества останется прежней.','Allow A to convert to B; the total amount will stay the same.'),
  cue(.20,'Метки переходят к продукту, а их доли одновременно рисуют две кривые.','Symbols move to the product, while their fractions trace both curves.'),
  cue(.31,'По мере убыли A абсолютная скорость k[A] становится меньше.','As A is depleted, the absolute rate k[A] becomes smaller.'),
  cue(.44,'Прошёл один полупериод: A и B теперь по 0.5 mM.','One half-life has elapsed: A and B are now each 0.5 mM.'),
  cue(.50,'Остановимся на этой точке: из двадцати долей десять остались A.','Pause at this point: ten of twenty fractions remain A.'),
  cue(.54,'Запустим ещё такой же промежуток времени. В начале этого шага A уже меньше.','Run another equal time interval. This interval starts with less A.'),
  cue(.65,'За равное время исчезает та же доля оставшегося A, а не то же количество.','Equal time removes the same fraction of remaining A, not the same amount.'),
  cue(.74,'Второй полупериод оставил четверть исходного A: пять долей из двадцати.','The second half-life leaves one quarter of the initial A: five of twenty fractions.'),
  cue(.84,'Продолжим: кривая убывает всё медленнее, а B накапливается.','Continue: the decay curve becomes shallower as B accumulates.'),
  cue(.94,'Кривые непрерывны. Значки округляют доли и не предсказывают судьбу отдельной молекулы.','The curves are continuous. Symbols round fractions without predicting one molecule’s fate.')
 ],
 draw(g,H){
  H.label(g,85,212,575,38,'A → B    k = 0.4 s⁻¹','A → B    k = 0.4 s⁻¹',28,C.white);
  H.label(g,85,252,575,31,'20 долей · [A] + [B] = 1 mM','20 fractions · [A] + [B] = 1 mM',22,C.grey);
  H.label(g,66,297,37,30,'A','A',22,C.blue);H.label(g,66,415,37,30,'B','B',22,C.teal);
  const tokens=Array.from({length:20},(_,i)=>{const node=H.group(g);node.dataset.populationToken=String(i);const circle=H.circle(node,0,0,12,C.blue,.16),ring=H.circle(node,0,0,18,C.gold,0),text=H.label(node,-15,-15,30,30,'A','A',18,C.blue);return{node,circle,ring,text,x:119+(i%10)*52+Math.floor(i/10)*25,y:300+Math.floor(i/10)*38};});
  const counts=H.label(g,84,464,575,32,'','',22,C.white);
  const plot=H.plot(g,{x:797,y:274,w:360,h:120,xmin:0,xmax:8,ymin:0,ymax:1,xt:[0,4,8],yt:[0,.5,1],title:'[A] = [A]₀e⁻ᵏᵗ · mM',enTitle:'[A] = [A]₀e⁻ᵏᵗ · mM',xlabel:'Время реакции · s',enXlabel:'Reaction time · s'});
  const bands=[0,1].map(i=>{const box=H.rect(g,plot.x(i*halfLife),274,plot.x(halfLife)-plot.x(0),120,C.gold);box.dataset.halfLifeSpan=String(i+1);box.setAttribute('fill-opacity','.08');const end=H.line(g,plot.x((i+1)*halfLife),274,plot.x((i+1)*halfLife),394,C.gold,'3 5');return{box,end};});
  const acurve=H.path(g,'',C.blue,2),bcurve=H.path(g,'',C.teal,2),dots=[plot.point(C.blue),plot.point(C.teal)];acurve.dataset.kineticsTrace='A';bcurve.dataset.kineticsTrace='B';dots[0].el.dataset.kineticsMarker='A';dots[1].el.dataset.kineticsMarker='B';
  const halfRead=H.label(g,739,211,477,27,'','',20,C.gold),read=H.label(g,718,468,493,28,'','',21,C.gold);
  return{paint(p){p=phaseProgress(p);const stage=Math.min(4,Math.floor(p*5)),time=reactionTime(p),A=PH.firstOrder(1,.4,time),B=1-A,countA=Math.round(20*A);
   tokens.forEach((t,i)=>{const q=Math.max(0,Math.min(1,20*B-i)),isA=i>=20-countA,col=isA?C.blue:C.teal;move(t.node,t.x,t.y+108*q);t.node.dataset.species=isA?'A':'B';t.circle.setAttribute('stroke',col);t.circle.setAttribute('fill',col);t.text.setText(isA?'A':'B');t.text.el.setAttribute('fill',col);H.show(t.ring,q>0&&q<1?Math.sin(Math.PI*q):0);});
   traceTo(acurve,plot,t=>PH.firstOrder(1,.4,t),0,time);traceTo(bcurve,plot,t=>1-PH.firstOrder(1,.4,t),0,time);dots[0].set(time,A);dots[1].set(time,B);
   bands.forEach((b,i)=>{const amount=phase(time,i*halfLife,(i+1)*halfLife);b.box.setAttribute('width',(plot.x(halfLife)-plot.x(0))*amount);H.show(b.box,amount>0?1:0);H.show(b.end,amount>=1?1:0);});
   counts.setText('A: '+countA+' / 20     B: '+(20-countA)+' / 20');halfRead.setText('t½ = '+H.fmt(halfLife,3)+' s');read.setText('t = '+H.fmt(time,3)+' s    [A] = '+H.fmt(A,3)+' mM');
   return{stage,time,k:.4,A,B,total:A+B,concentrationUnit:'mM',timeUnit:'s',halfLife,tokenCount:20,countA,countB:20-countA,individualReactionTimesModeled:false,roundedPopulation:true};
  }};
 }
});
})(window);
