/* Q-Align from first principles. Four-person teaching example first;
 * source-backed six-node instance afterwards. Input graph positions stay fixed. */
(function(){
'use strict';
const Z=window.QAlignData,N=Z.adj1.length,BASE='https://github.com/eizorerad/Q-Align/blob/'+Z.provenance.commit+'/',SOURCE=BASE+Z.provenance.notebook;
const translations={};
function tr(ru,en){if(!Object.hasOwn(translations,ru)){translations[ru]=en;D.i18n.pack('en',{strings:{[ru]:en}});}return ru;}
tr('Q-Align · код и проверенные эксперименты','Q-Align · code and verified experiments');
tr('Q-Align: объяснение с нуля','Q-Align: explained from scratch');
function w(p,id,x,y,width,height,ru,en,size=27,color=C.white,align='center'){return L.textBox(p,{id,x,y,width,height,text:tr(ru,en),size,color,padding:4,align,lineHeight:1.25});}
function panel(p,x,y,width,height,color=C.grey){const el=D.dom.s('rect',{x,y,width,height,rx:20,fill:C.bg,stroke:color,'stroke-width':1.2,'stroke-opacity':.3});p.append(el);return el;}
function stage(ctx,title){const v=F.stage(ctx,tr(...title),'Q-Align');v.root.classList.add('qalign-scene');return {...v,p:F.group(v.svg)};}
function reg(id,title,notes,qa,build,meta={}){const url=meta.notebook?BASE+meta.notebook:id==='qalign-evidence'?BASE+'Q_Align_Tutorial.ipynb':SOURCE;D.i18n.pack('en',{notes:{[id]:notes.map(([,en])=>F.note(en,'',url))},qa:{[id]:qa.map(([q,a])=>({q:q[1],a:a[1],source:'Q-Align · '+Z.provenance.commit.slice(0,7),url}))}});D.deck.register({id,title:tr(...title),chapter:meta.deep?tr('Q-Align — внутри ноутбука','Q-Align — inside the notebook'):tr('Q-Align — шаг за шагом','Q-Align — step by step'),notes:notes.map(([ru])=>F.note(ru,'',url)),qa:qa.map(([q,a])=>({q:q[0],a:a[0],source:'Q-Align · '+Z.provenance.commit.slice(0,7),url})),build});}
function steps(ctx,v,s,paint,initial,sequence){const d=F.driver(s,paint);ctx.onDispose(d.dispose);paint();v.caption(tr(...initial));sequence.forEach(({patch,caption,before,duration=1800})=>ctx.step(()=>{if(before)before(d);v.caption(tr(...caption));return d.to(patch,{duration});}));return d;}
function buttons(v,labels,onChange,x,y,width){const el=T.buttons(v.root,labels.map(a=>tr(...a)),i=>{onChange(i);v.caption(tr('Выбрано: '+labels[i][0]+'. Посмотрите на результат.','Selected: '+labels[i][1]+'. Look at the result.'));},x,y);el.style.maxWidth=(width-16)+'px';L.contract(el,{id:'choice.buttons',box:{x:x-8,y:y-8,width,height:65},space:v.root,measure:'content'});return el;}
function slider(v,label,min,max,value,step,onChange,x,y,width){const q=T.control(v.root,tr(...label),min,max,value,step,value=>{onChange(value);v.caption(tr('Вы изменили значение. Посмотрите, что получилось.','You changed the value. Look at the result.'));},x,y,width);L.contract(q.el,{id:'choice.slider',box:{x:x-10,y:y-10,width:width+20,height:65},space:v.root,measure:'content'});return q;}
const A4=[[0,1,0,0],[1,0,1,0],[0,1,0,1],[0,0,1,0]],B4=[[0,0,1,1],[0,0,0,1],[1,0,0,0],[1,1,0,0]];
const DEMO=[[0,1,2,3],[0,2,1,3],[1,3,0,2]],TOY_LEFT=[[210,270],[440,310],[400,470],[180,445]],TOY_RIGHT=[[950,450],[770,260],[1080,285],[780,480]];
const BEST=Z.globalOptima[0],WORST=Z.energies.indexOf(Math.max(...Z.energies)),MID=Z.energies.findIndex(e=>e===-22),CHOICES=[WORST,MID,BEST];
const count=id=>GA.conserved(Z.adj1,Z.adj2,Z.permutations[id]);
function toy(p,id){return GA.paired(p,{id,a:A4,b:B4,left:TOY_LEFT,right:TOY_RIGHT,leftLabels:['A','B','C','D'],rightLabels:['1','2','3','4'],r:25});}
function real(p,id){return GA.paired(p,{id,a:Z.adj1,b:Z.adj2,left:GA.ring(N,300,350,155,120),right:[[890,245],[1050,310],[1015,460],[805,473],[720,340],[870,385]],leftLabels:['0','1','2','3','4','5'],rightLabels:'abcdef'.split(''),r:23});}
const toyLabel=['Учебный пример: четыре человека','Teaching example: four people'];

reg('qalign-question',['Точки — люди. Линии — знакомства.','Dots are people. Lines are friendships.'],[
 ['Начнём без формул. Представьте четырёх человек: A, B, C и D. Каждая точка обозначает одного человека. Это выдуманный учебный пример, не социальные данные.','Start without formulas. Imagine four people: A, B, C and D. Each dot represents one person. This is an invented teaching example, not social data.'],
 ['Линия A—B означает, что A и B знакомы. Положение точек на рисунке само по себе ничего не означает.','A line A—B means that A and B know one another. Where a dot sits on the page has no meaning by itself.'],
 ['Добавим знакомства B—C и C—D. Получилась схема из четырёх точек и трёх связей.','Add friendships B—C and C—D. We now have a diagram with four dots and three connections.'],
 ['Такую схему называют графом. Точки — вершины, линии — рёбра. Этого достаточно для следующего шага: сравнить две схемы.','This kind of diagram is called a graph. Dots are vertices; lines are edges. That is enough to begin comparing two diagrams.']
],[[['Нужно знать теорию графов заранее?','Do I need to know graph theory already?'],['Нет. Пока достаточно помнить: точка — объект, линия — связь двух объектов.','No. For now, remember: a dot is an object, and a line is a connection between two objects.']], [['Это сеть реальных людей?','Is this a real social network?'],['Нет, первые три сцены — придуманный пример для объяснения. Затем мы явно перейдём к данным из Q-Align.','No. The first three scenes use an invented teaching example. We then explicitly switch to Q-Align data.']]],ctx=>{
 const title=['Точки — люди. Линии — знакомства.','Dots are people. Lines are friendships.'],v=stage(ctx,title),p=v.p,s={phase:0};
 const net=GA.network(p,{id:'four-people',adj:A4,positions:[[295,278],[490,340],[440,505],[230,470]],labels:['A','B','C','D'],r:32,color:C.blue});
 const box=F.group(p);panel(box,695,235,480,300,C.teal);const message=w(box,'people-meaning',725,258,420,245,'','',36,C.teal);
 w(p,'people-source',105,553,490,48,...toyLabel,22,C.grey);
 function paint(){net.edgeList.forEach(({line},i)=>F.opacity(line,s.phase>=(i===0?1:2)?1:0));message.setText(s.phase<1?tr('Одна точка —\nодин человек','One dot —\none person'):s.phase<2?tr('Одна линия —\nодно знакомство','One line —\none friendship'):s.phase<3?tr('4 человека\n3 знакомства','4 people\n3 friendships'):tr('Это граф:\nточки и связи','This is a graph:\ndots and connections'));v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Сначала просто посмотрим на четырёх человек.','First, look at four people.'],[
  {patch:{phase:1},caption:['A и B знакомы — соединим их линией.','A and B know each other — draw a line.']},
  {patch:{phase:2},caption:['Рисунок показывает, кто с кем связан.','The diagram shows who is connected to whom.']},
  {patch:{phase:3},caption:['Теперь мы знаем слово «граф»: это схема связей.','We now know the word “graph”: a diagram of connections.']}
 ]);return v.root;
});

reg('qalign-matching',['Кто кому соответствует?','Who corresponds to whom?'],[
 ['Слева люди подписаны буквами, справа — числами. Обе схемы описывают одни и те же три знакомства, но имена и расположение различаются. Это тот же учебный пример.','The left diagram uses letters, the right uses numbers. Both show the same three friendships, with different names and layouts. This is the same teaching example.'],
 ['Пунктир A→2 означает нашу догадку: человек A слева соответствует человеку 2 справа. Пунктир связывает наши выбранные пары, а не знакомых.','A dashed A→2 line is our guess that person A corresponds to person 2. Dashed lines show the pairs we choose, not friendships.'],
 ['Выберем пару для каждого человека. На каждой стороне каждый человек используется ровно один раз. Точки остаются на своих местах.','Choose one pair for each person. Each person is used exactly once on either side. The dots stay where they are.'],
 ['Другой выбор пар может оказаться лучше. Положение точек и знакомства не меняются. Дальше научимся проверять выбранный ответ.','A different choice of pairs may work better. Positions and friendships stay fixed. Next, we learn to check a proposed answer.']
],[[['Почему точки не выстраиваются в одинаковый рисунок?','Why do the dots not move into matching layouts?'],['Задача — найти пары объектов по их связям. Место точки на экране не даёт ответа. Поэтому обе схемы зафиксированы.','The task is to match objects using their connections. A dot’s screen position is not an answer. Both layouts are therefore fixed.']], [['Линии и пунктир означают одно и то же?','Do solid and dashed lines mean the same thing?'],['Сплошная линия — знакомство внутри одной схемы. Пунктир — наш выбор пары между двумя схемами.','A solid line is a friendship within one graph. A dashed line is our chosen pair between the two graphs.']]],ctx=>{
 const v=stage(ctx,['Кто кому соответствует?','Who corresponds to whom?']),p=v.p,s={phase:0,choice:0};let d;
 const pair=toy(p,'toy-matching');w(p,'toy-a',110,162,400,58,'Имена: A, B, C, D','Names: A, B, C, D',28,C.blue);w(p,'toy-b',730,162,400,58,'Имена: 1, 2, 3, 4','Names: 1, 2, 3, 4',28,C.teal);
 const summary=w(p,'toy-pair-meaning',150,490,980,55,'','',30,C.gold);
 buttons(v,[['Другой выбор пар','Another set of pairs'],['Подходящий выбор','A matching choice']],i=>d.set({choice:i?2:0,phase:3}),375,552,540);
 function paint(){const perm=DEMO[Math.round(s.choice)],visible=s.phase<1?0:s.phase<2?1:4;pair.set(perm,{visible,emphasis:false,focus:s.phase>=1&&s.phase<2?[0]:[]});summary.setText(s.phase<1?tr('Две схемы. Нужно найти пары.','Two diagrams. Find the pairs.'):s.phase<2?'A → '+(perm[0]+1):tr('У каждого человека — ровно одна пара','Each person gets exactly one partner'));Object.assign(v.root.dataset,{permutation:perm.join(','),motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Те же знакомства можно нарисовать и подписать по-разному.','The same friendships can have different layouts and names.'],[
  {patch:{phase:1},before:d=>d.set({choice:2}),caption:['Сначала выберем одну пару: A ↔ 2.','First, choose one pair: A ↔ 2.']},
  {patch:{phase:2},caption:['Теперь у всех четырёх людей есть своя пара.','Now all four people have their own partner.']},
  {patch:{phase:3},before:d=>d.set({choice:0}),caption:['Можно выбрать другие пары. Но сохранятся ли знакомства?','We can choose other pairs. Will their friendships still match?']}
 ]);return v.root;
});

reg('qalign-check',['Как проверить выбранные пары?','How do we check our chosen pairs?'],[
 ['Проверяем знакомства одно за другим. Если A и B знакомы слева, их выбранные пары должны быть знакомы справа.','Check each friendship. If A and B are connected on the left, their chosen partners should be connected on the right.'],
 ['При первом выборе пар ни одно из трёх знакомств не совпадает. Яркие линии обозначают совпавшие связи, красные — несовпавшие.','The first choice preserves none of the three friendships. Bright lines mean preserved connections; red lines mean unmatched ones.'],
 ['Другой выбор сохраняет два знакомства из трёх. Это лучше, но всё ещё не лучший ответ.','Another choice preserves two of the three friendships. It is better, but it is still not the best answer.'],
 ['Последний выбор сохраняет все три знакомства. Он подходит. Для этой цепочки есть два равно хороших ответа; здесь показан один.','The final choice preserves all three friendships. It fits. This path has two equally good answers; we show one.']
],[[['Как сравнить два ответа?','How do we compare two answers?'],['Посчитать совпавшие связи. В этом учебном примере больше совпадений означает лучший ответ.','Count preserved connections. In this example, more matches mean a better answer.']], [['Обязательно существует только один правильный ответ?','Must there be exactly one correct answer?'],['Нет. Симметрия сети может дать несколько равно хороших соответствий.','No. Network symmetry can produce several equally good correspondences.']]],ctx=>{
 const v=stage(ctx,['Как проверить выбранные пары?','How do we check our chosen pairs?']),p=v.p,s={phase:0,choice:0};let d;const pair=toy(p,'toy-check');
 w(p,'check-source',130,162,400,54,'Проверяем знакомства','Check the friendships',27,C.blue);w(p,'check-target',740,162,400,54,'Там тоже есть связь?','Connected there too?',25,C.teal);
 const result=w(p,'check-result',185,490,910,55,'','',34,C.gold);buttons(v,[['0 совпадений','0 matches'],['2 совпадения','2 matches'],['3 совпадения','3 matches']],i=>d.set({choice:i,phase:3}),350,552,610);
 function paint(){const perm=DEMO[Math.round(s.choice)],c=pair.set(perm,{visible:4,emphasis:true});result.setText(tr('Совпало '+c+' из 3 знакомств',c+' of 3 friendships match'));Object.assign(v.root.dataset,{conserved:c,permutation:perm.join(','),motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Важны совпавшие связи, а не похожее расположение точек.','Matching connections matter more than matching layouts.'],[
  {patch:{phase:1},caption:['Этот выбор не сохранил ни одного знакомства.','This choice preserved no friendships.']},
  {patch:{phase:2},before:d=>d.set({choice:1}),caption:['Другой выбор сохранил два знакомства. Уже лучше.','Another choice preserves two friendships. That is better.']},
  {patch:{phase:3},before:d=>d.set({choice:2}),caption:['Три из трёх: нашли подходящий ответ.','Three out of three: we found a fitting answer.']}
 ]);return v.root;
});

reg('qalign-size',['Больше точек — намного больше вариантов','More dots mean many more choices'],[
 ['Для четырёх объектов есть 24 способа выбрать взаимно однозначные пары. Можно выписать их все.','There are 24 one-to-one pairings of four objects. We can list them all.'],
 ['Для шести объектов уже 720 способов. Один вариант может выглядеть убедительно, но остальные тоже нужно учитывать.','Six objects already have 720 pairings. One might look convincing, but other choices still matter.'],
 ['Для десяти объектов — 3 628 800 способов. Число способов растёт очень быстро. Это комбинаторный расчёт, а не измеренное время работы программы.','Ten objects have 3,628,800 pairings. The number grows rapidly. This is a combinatorial count, not measured program runtime.']
],[[['Откуда берутся 24 варианта?','Where do the 24 choices come from?'],['Первому объекту доступны 4 пары, второму — 3, третьему — 2, последнему — 1. Получается 4×3×2×1=24.','The first object has 4 choices, then 3, then 2, then 1. That gives 4×3×2×1=24.']], [['Почему не перебрать вообще всё?','Why not try absolutely everything?'],['Для маленьких примеров это возможно. Но с ростом числа объектов полный перебор быстро становится слишком большим.','That works for small examples. As the number of objects grows, exhaustive search quickly gets too large.']]],ctx=>{
 const v=stage(ctx,['Больше точек — намного больше вариантов','More dots mean many more choices']),p=v.p,s={phase:0};const cards=[];
 [['4','24'],['6','720'],['10','3 628 800']].forEach(([n,total],i)=>{const x=95+i*380,g=F.group(p);panel(g,x,224,330,307,[C.blue,C.teal,C.gold][i]);w(g,'size-n'+i,x+15,245,300,64,i===0?'4 точки':n+' точек',n+' dots',33,[C.blue,C.teal,C.gold][i]);w(g,'size-total'+i,x+13,326,304,98,total,total,47,C.white);w(g,'size-caption'+i,x+20,443,290,65,'вариантов','pairings',27,C.grey);cards.push(g);});
 w(p,'size-takeaway',130,548,1020,57,'Перебор быстро становится огромным','Exhaustive search quickly gets huge',29,C.gold);
 function paint(){cards.forEach((g,i)=>F.opacity(g,s.phase>=i?1:.16));v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Четыре точки — всего 24 варианта.','Four dots have just 24 pairings.'],[
  {patch:{phase:1},caption:['Добавили две точки — стало уже 720 вариантов.','Add two dots — we now have 720 pairings.']},
  {patch:{phase:2},caption:['Для больших сетей нужен поиск, который не проверяет всё подряд.','Larger networks need search methods that do not try every possibility.']}
 ]);return v.root;
});

reg('qalign-instance',['Теперь — пример из Q-Align','Now, an example from Q-Align'],[
 ['Учебный пример закончился. Теперь перед нами два настоящих входных графа из эксперимента Q-Align: по шесть вершин, восемь связей в первом. Люди были аналогией; эти сети сгенерированы программой.','The teaching example is over. These are actual inputs from a Q-Align experiment: six vertices per graph and eight edges in the first. People were an analogy; these networks are computer-generated.'],
 ['Плохой выбор сохраняет только одну связь из восьми. Положение точек и набор связей в обеих сетях остаются неизменными.','A poor pairing preserves only one of the eight connections. Dot positions and both graphs’ edge sets stay fixed.'],
 ['Другой выбор сохраняет пять связей. Мы меняем соответствия, а не подгоняем рисунки друг к другу.','Another pairing preserves five connections. We change correspondences rather than moving the layouts into alignment.'],
 ['Лучший ответ сохраняет все восемь связей. У этой задачи четыре равно хороших ответа. Это пример ER, n=6, noise=0.1, seed=105 из Phase 1.','The best answer preserves all eight connections. This instance has four equally good answers. It is the Phase 1 ER instance with n=6, noise=0.1 and seed=105.']
],[[['Зачем нужен Q-Align?','What is Q-Align for?'],['Он исследует, можно ли по устройству сетей заранее понять, насколько трудно найти хорошее соответствие между ними.','It investigates whether network structure can tell us how difficult it will be to find a good correspondence.']], [['Этот рисунок — биологическая сеть?','Is this a biological network?'],['Нет. В этих экспериментах используются маленькие синтетические сети. Биологические сети — возможная область применения.','No. These experiments use small synthetic networks. Biological networks are a possible application.']]],ctx=>{
 const v=stage(ctx,['Теперь — пример из Q-Align','Now, an example from Q-Align']),p=v.p,s={phase:0,rank:WORST};let d;const pair=real(p,'source-example');
 w(p,'real-left',95,164,430,56,'Первая сеть: 6 точек','First network: 6 dots',28,C.blue);w(p,'real-right',714,164,440,56,'Вторая сеть: другие имена','Second network: different names',27,C.teal);const value=w(p,'real-score',175,490,930,55,'','',34,C.gold);
 buttons(v,[['Слабый ответ','Poor answer'],['Лучше','Better'],['Лучший','Best']],i=>d.set({rank:CHOICES[i],phase:3}),415,552,540);
 function paint(){const id=Math.round(s.rank),perm=Z.permutations[id],c=pair.set(perm,{visible:s.phase<1?0:6});value.setText(s.phase<1?tr('Задача та же: найти пары по связям','Same task: find pairs using their connections'):tr('Совпало '+c+' из 8 связей',c+' of 8 connections match'));Object.assign(v.root.dataset,{permutation:perm.join(','),permutationId:id,conserved:c,motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Применим знакомую идею к данным проекта.','Apply the idea we have learned to the project’s data.'],[
  {patch:{phase:1},caption:['Этот ответ сохранил только одну связь.','This answer preserves just one connection.']},
  {patch:{phase:2},before:d=>d.set({rank:MID}),caption:['Другой ответ сохранил пять.','Another answer preserves five.']},
  {patch:{phase:3},before:d=>d.set({rank:BEST}),caption:['Лучший ответ сохранил восемь из восьми.','The best answer preserves eight out of eight.']}
 ]);return v.root;
});

reg('qalign-energy',['Компьютер ставит ответу оценку','The computer gives each answer a score'],[
 ['Мы уже умеем считать совпавшие связи. У слабого ответа одна связь из восьми.','We can already count preserved connections. A poor answer preserves one of eight.'],
 ['Чтобы сравнивать ответы, программа превращает этот счёт в число. В Q-Align более низкое число означает лучший ответ. Для пяти связей получается −22.','The program turns the count into a number so it can compare answers. In Q-Align, a lower number means a better answer. Five preserved connections give −22.'],
 ['Восемь связей дают оценку −28 — лучшую для этой задачи. В коде эту оценку называют энергией. Это функция оценки, а не измерение физической энергии.','Eight connections give −28, the best score for this instance. The code calls this score energy. It is an objective value, not measured physical energy.']
],[[['Почему больше совпадений даёт меньшее число?','Why do more matches give a lower number?'],['Так выбрано правило счёта, чтобы решатель искал минимум. На допустимых ответах этого примера E=−2C−12, где C — число совпавших связей.','That scoring rule lets the solver minimize the objective. For valid pairings here, E=−2C−12, where C is the conserved-edge count.']], [['Нужно запоминать формулу?','Do I need to memorize the formula?'],['Для понимания урока достаточно помнить: больше совпавших связей — лучше; ниже оценка — лучше.','For this lesson, remember: more preserved connections is better, and a lower score is better.']]],ctx=>{
 const v=stage(ctx,['Компьютер ставит ответу оценку','The computer gives each answer a score']),p=v.p,s={phase:0,rank:WORST};let d;
 w(p,'score-count-title',92,216,545,60,'Совпавшие связи','Preserved connections',31,C.blue);
 const pegs=Array.from({length:8},(_,i)=>{const el=D.dom.s('rect',{x:120+i*68,y:310,width:47,height:47,rx:9,fill:C.dim});p.append(el);return el;});
 const found=w(p,'score-found',95,385,560,105,'','',46,C.blue);
 panel(p,760,225,425,285,C.teal);const score=w(p,'score-value',785,267,375,110,'','',53,C.gold);
 w(p,'score-rule',782,391,380,91,'Ниже — лучше','Lower is better',30,C.teal);
 const term=w(p,'score-term',150,501,980,46,'В коде эта оценка называется «энергия»','The code calls this score “energy”',28,C.grey);
 buttons(v,[['1 связь','1 connection'],['5 связей','5 connections'],['8 связей','8 connections']],i=>d.set({rank:CHOICES[i],phase:2}),405,552,600);
 function paint(){const id=Math.round(s.rank),c=count(id);pegs.forEach((el,i)=>el.setAttribute('fill',i<c?C.blue:C.dim));found.setText(tr(c+' из 8',c+' of 8'));score.setText(s.phase<1?tr('Оценка ответа','Answer score'):String(Z.energies[id]));F.opacity(term.el,s.phase>=2?1:0);Object.assign(v.root.dataset,{conserved:c,energy:Z.energies[id],permutationId:id,motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Ответы можно сравнивать по числу совпавших связей.','Compare answers by how many connections they preserve.'],[
  {patch:{phase:1},before:d=>d.set({rank:MID}),caption:['Программа использует оценку: меньше — лучше.','The program uses a score: lower is better.']},
  {patch:{phase:2},before:d=>d.set({rank:BEST}),caption:['Нашли восемь совпадений. Их оценка — −28.','We found eight matches. Their score is −28.']}
 ]);return v.root;
});

// Actual three-state minimax path. Segments illustrate swaps, not continuous states.
function barrierView(v,{compact=false}={}){const p=v.p,es=Z.barrier.energies,x=[205,490,775],y=e=>(compact?490:510)-(e+28)*(compact?45:55),points=es.map((e,i)=>[x[i],y(e)]);
 F.line(p,133,255,133,526,C.grey,1.2);w(p,'path-axis',85,162,460,76,'Оценка ответа: ниже — лучше','Answer score: lower is better',27,C.grey);
 F.path(p,points,C.teal,3);points.forEach(([xx,yy],i)=>{F.dot(p,xx,yy,10,i===2?C.gold:C.teal);w(p,'path-value'+i,xx-82,compact?500:542,164,compact?48:60,String(es[i]),String(es[i]),30,C.grey);});
 F.line(p,205,y(es[0]),490,y(es[0]),C.grey,1.3,'4 5');
 const worse=w(p,'path-worse',325,227,345,55,'Временно хуже','Temporarily worse',26,C.red),dot=F.dot(p,...points[0],14,C.gold);
 return {paint(progress,showWorse=1){const i=Math.min(1,Math.floor(progress)),t=progress-i;F.pos(dot,F.lerp(points[i][0],points[i+1][0],t),F.lerp(points[i][1],points[i+1][1],t));F.opacity(worse.el,showWorse);}};
}
reg('qalign-trap',['Хороший ответ может оказаться ловушкой','A good answer can be a trap'],[
 ['Найдём ответ с оценкой −26. Это неплохо, но лучший ответ этой задачи имеет оценку −28. На рисунке показаны три реальных ответа из Q-Align.','Consider an answer scoring −26. It is good, but the best score here is −28. The diagram shows three actual Q-Align pairings.'],
 ['Из текущего ответа нельзя сразу улучшить оценку одним обменом двух назначений. Такие состояния называют локальными минимумами.','No single swap of two assignments immediately improves this answer. Such states are called local minima.'],
 ['Один путь к лучшему ответу сначала ведёт к оценке −24: временно хуже. Потом можно получить −28. Здесь самый маленький необходимый подъём равен 2.','One route to the best answer first reaches −24, temporarily worse, then −28. The smallest necessary climb here is 2.'],
 ['Если принимать только немедленные улучшения, этот путь будет закрыт. Линии между точками показывают обмены между дискретными ответами, а не измеренную гладкую поверхность.','If we accept only immediate improvements, this route is blocked. Segments show swaps between discrete answers, not a measured smooth surface.']
],[[['Почему нельзя сразу взять лучший ответ?','Why not choose the best answer immediately?'],['В настоящем поиске его ещё не знают. В маленьком примере мы заранее перебрали все 720 ответов, чтобы проверить работу алгоритма.','A search algorithm does not already know it. We enumerate all 720 pairings in this small example to check the algorithm.']], [['Кривая придумана для объяснения?','Was the curve invented for teaching?'],['Три ответа, их оценки и допустимые обмены вычислены из исходной задачи. Линии между ними — способ показать эти обмены.','The three pairings, scores and valid swaps are computed from the source instance. Connecting segments visualize those swaps.']]],ctx=>{
 const v=stage(ctx,['Хороший ответ может оказаться ловушкой','A good answer can be a trap']),p=v.p,s={phase:0,progress:0};const path=barrierView(v);
 panel(p,917,244,290,287,C.teal);const message=w(p,'trap-message',937,263,250,249,'','',32,C.teal);
 function paint(){path.paint(s.progress,s.phase>=2?1:0);message.setText(s.phase<1?tr('Хорошо:\n−26','Good:\n−26'):s.phase<2?tr('Сразу улучшить\nне получается','No immediate\nimprovement'):s.progress<1?tr('Нужен шаг\nчерез худший ответ','A worse answer\nopens the route'):s.progress<2?tr('−24:\nвременно хуже','−24:\ntemporarily worse'):tr('−28:\nлучший ответ','−28:\nthe best answer'));v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Неплохой ответ ещё не означает лучший ответ.','A good answer is not necessarily the best answer.'],[
  {patch:{phase:1},caption:['Каждый немедленный шаг не улучшает оценку. Поиск застрял.','No immediate move improves the score. Search is stuck.']},
  {patch:{phase:2,progress:1},caption:['Чтобы пройти дальше, иногда нужно временно ухудшить ответ.','Moving forward can require a temporarily worse answer.'],duration:2300},
  {patch:{phase:3,progress:2},caption:['После этого можно добраться до лучшего ответа.','After that, we can reach the best answer.'],duration:2300}
 ]);return v.root;
});

reg('qalign-barrier',['Иногда полезно сделать шаг назад','Sometimes a step back helps'],[
 ['Мы видели путь −26→−24→−28. Для первого шага компьютер должен согласиться на временное ухудшение.','We saw the route −26→−24→−28. The computer must accept a temporary setback to make the first move.'],
 ['Осторожный поиск редко принимает ухудшения. При T=0.5 шанс принять именно этот шаг примерно 1.8%. Ползунок регулирует условную «смелость».','Cautious search rarely accepts setbacks. At T=0.5, this particular worsening move has about a 1.8% acceptance chance. The slider adjusts the algorithm’s “boldness”.'],
 ['При T=5 шанс около 67%. Это повышает шанс пройти данный барьер, но не гарантирует лучший итоговый ответ.','At T=5 the chance is about 67%. This makes crossing this barrier more likely, without guaranteeing the best final answer.'],
 ['Так работает часть имитационного отжига: иногда принимается ухудшение. В коде вероятность exp(−ΔE/T), здесь ΔE=2. T — параметр алгоритма.','This is part of simulated annealing: sometimes accept a worse answer. The code uses exp(−ΔE/T), here with ΔE=2. T is an algorithm parameter.']
],[[['Компьютер действительно нагревают?','Is the computer actually heated?'],['Нет. «Температура» — название параметра, который управляет вероятностью принять ухудшение.','No. “Temperature” is the name of a parameter controlling how often a worse answer is accepted.']], [['67% — шанс найти лучший ответ?','Is 67% the chance of finding the best answer?'],['Нет. Это шанс принять один конкретный ухудшающий шаг. Успех всего поиска оценивается отдельно.','No. It is the chance of accepting one particular worsening move. Overall search success is measured separately.']]],ctx=>{
 const v=stage(ctx,['Иногда полезно сделать шаг назад','Sometimes a step back helps']),p=v.p,s={phase:0,temperature:.5,progress:0};let d;const path=barrierView(v);
 panel(p,921,225,285,300,C.teal);w(p,'risk-title',942,240,245,112,'Шанс рискнуть','Chance to accept',28,C.teal);const chance=w(p,'risk-chance',942,359,245,89,'','',49,C.gold),mood=w(p,'risk-mood',933,456,261,52,'','',27,C.grey);
 const control=slider(v,['Уровень риска','Risk level'],.05,5,.5,.05,value=>d.set({temperature:value}),908,549,278);
 function paint(){path.paint(s.progress);const probability=Math.exp(-2/s.temperature);chance.setText(probability<.0001?'< 0.01%':(probability*100).toFixed(1)+'%');mood.setText(s.temperature<1?tr('Осторожный поиск','Cautious search'):tr('Больше риска','More risk'));control.input.value=s.temperature;control.output.textContent=D.i18n.text(s.temperature<1?tr('низкий','low'):tr('высокий','high'));Object.assign(v.root.dataset,{temperature:s.temperature,acceptance:probability,motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Осторожный поиск почти всегда отвергает ухудшение.','Cautious search almost always rejects a setback.'],[
  {patch:{phase:1},caption:['Низкий риск: пройти этот барьер трудно.','Low risk: this barrier is hard to cross.']},
  {patch:{phase:2,temperature:5},caption:['Добавим риска — ухудшающий шаг принимается чаще.','Allow more risk — the setback is accepted more often.']},
  {patch:{phase:3,progress:2},caption:['Принять шаг назад иногда помогает добраться до лучшего ответа.','Accepting a setback can help us reach a better answer.'],duration:2600}
 ]);return v.root;
});

reg('qalign-annealing',['Много проб. Потом — меньше риска.','Many attempts. Then less risk.'],[
 ['Алгоритм начинает со случайного ответа, меняет две пары и решает, принимать ли новый ответ. Это один реальный запуск функции SA из Q-Align.','The algorithm starts with a random pairing, swaps two assignments and decides whether to accept the new answer. This is an actual Q-Align SA run.'],
 ['В начале алгоритм чаще разрешает шаги назад. Линия показывает оценку текущего ответа после каждого шага. Ниже — лучше.','Early on, the algorithm accepts more setbacks. The line shows the current answer’s score after each step. Lower is better.'],
 ['Потом риск уменьшается. В этом запуске поиск застрял и не нашёл −28. Кнопки показывают неудачный и удачный запуск одного эксперимента.','Risk then decreases. This run gets stuck and misses −28. The buttons show a failed and a successful run from the same experiment.'],
 ['Из 50 запусков 21 нашёл лучший ответ при бюджете 150 шагов — это 42%. В других задачах и при другом бюджете результат может отличаться.','Of 50 runs, 21 found the optimum with a budget of 150 steps: 42%. Other instances and budgets may produce different results.']
],[[['Что значит один шаг?','What is one step?'],['Предложить обмен двух назначений и решить, принять ли его. Если его отвергли, текущий ответ остаётся прежним.','Propose swapping two assignments and decide whether to accept it. A rejected move leaves the current answer unchanged.']], [['Почему линия может идти вверх?','Why can the line go up?'],['Алгоритм иногда принимает более плохой текущий ответ. При этом он отдельно помнит лучший найденный ответ.','The algorithm sometimes accepts a worse current answer. It separately remembers the best answer seen.']]],ctx=>{
 const v=stage(ctx,['Много проб. Потом — меньше риска.','Many attempts. Then less risk.']),p=v.p,s={step:0,run:0,phase:0};let d;const x=i=>155+4.5*i,y=e=>493-(e+28)*18;
 F.line(p,155,245,155,508,C.grey,1.2);F.line(p,155,508,844,508,C.grey,1.2);w(p,'sa-score-title',90,161,660,76,'Оценка текущего ответа: ниже — лучше','Current answer score: lower is better',27,C.grey);
 [-28,-24,-20,-16].forEach(e=>w(p,'sa-tick'+e,71,y(e)-21,75,43,String(e),String(e),21,C.grey));[0,50,100,150].forEach(i=>w(p,'sa-step'+i,x(i)-32,516,64,39,String(i),String(i),22,C.grey));
 F.line(p,155,y(-28),842,y(-28),C.gold,1.4,'5 5');w(p,'sa-target',170,y(-28)-52,460,48,'Цель: −28','Target: −28',24,C.gold,'left');
 const trace=F.path(p,[],C.teal,2.8),dot=F.dot(p,155,y(-18),8,C.gold);panel(p,922,230,282,292,C.teal);const read=w(p,'sa-read',944,253,238,177,'','',31,C.teal),answer=w(p,'sa-answer',941,433,245,76,'','',28,C.gold);
 const control=slider(v,['Выбрать шаг поиска','Choose a search step'],0,150,0,1,value=>d.set({step:value}),190,556,630);buttons(v,[['Не нашёл','Did not find it'],['Нашёл','Found it']],i=>d.set({run:i,step:0}),934,554,290);
 function paint(){const run=Z.runs[Math.round(s.run)],i=Math.round(s.step),row=run.history[i],points=run.history.slice(0,i+1).map((r,j)=>[x(j),y(r.energy)]);trace.setAttribute('d',points.map((q,i)=>(i?'L':'M')+q.join(',')).join(' '));F.pos(dot,x(i),y(row.energy));read.setText(tr('Шаг '+i+' из 150\nСейчас: '+row.energy,'Step '+i+' of 150\nCurrent: '+row.energy));answer.setText(row.best===-28?tr('Лучший ответ найден','Best answer found'):tr('Лучший пока: '+row.best,'Best so far: '+row.best));control.input.value=i;control.output.textContent=i;Object.assign(v.root.dataset,{run:run.number,step:i,energy:row.energy,bestEnergy:row.best,motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Компьютер пробует менять пары и сравнивает ответы.','The computer tries changing pairs and compares the answers.'],[
  {patch:{phase:1,step:35},caption:['Поначалу допускаются и улучшения, и шаги назад.','Early on, both improvements and setbacks are allowed.'],duration:2700},
  {patch:{phase:2,step:150},caption:['Потом риск уменьшается. Посмотрим на итог этого запуска.','Risk decreases later. Look at how this run finishes.'],duration:3000},
  {patch:{phase:3},caption:['21 из 50 запусков нашёл лучший ответ. Попробуйте обе кнопки.','21 of 50 runs found the best answer. Try both buttons.']}
 ]);return v.root;
});

reg('qalign-graphlets',['В сети спрятаны маленькие узоры','A network contains little patterns'],[
 ['Вернёмся к первой сети из Q-Align. В ней можно искать маленькие рисунки связей: например, цепочку из трёх точек.','Return to Q-Align’s first network. We can look for small connection patterns, such as a three-dot chain.'],
 ['Треугольник означает, что три выбранные точки связаны друг с другом. В этом графе есть два таких треугольника.','A triangle means all three selected dots are connected to one another. This graph contains two such triangles.'],
 ['Такие маленькие узоры называют графлетами. Здесь показаны три типа, а код рассматривает восемь типов на трёх и четырёх вершинах.','These small patterns are called graphlets. We show three types here; the code considers eight types with three or four vertices.']
],[[['Цепочка и треугольник могут быть в одной сети?','Can one network contain both chains and triangles?'],['Да. Мы каждый раз выбираем небольшую группу точек и смотрим на все связи внутри неё.','Yes. We select a small group of dots and inspect all connections between them.']], [['Почему у звезды написано 0?','Why does the star have a count of 0?'],['В этом графе нет нужной связной звезды из четырёх вершин как индуцированного подграфа. Сам рисунок справа объясняет, какой узор мы искали.','This graph has no such connected four-node induced star. The picture on the right shows the pattern being searched for.']]],ctx=>{
 const v=stage(ctx,['В сети спрятаны маленькие узоры','A network contains little patterns']),p=v.p,s={phase:0},net=GA.network(p,{id:'pattern-source',adj:Z.adj1,positions:GA.ring(N,300,365,150,130),r:26,color:C.blue});
 w(p,'pattern-graph',94,166,435,65,'Та же сеть из Q-Align','The same Q-Align network',28,C.blue);
 const cards=[],keys=['P3','K3','S3'],names=[['Цепочка','Chain'],['Треугольник','Triangle'],['Звезда','Star']];
 keys.forEach((key,i)=>{const yy=236+i*119,g=F.group(p);panel(g,625,yy,565,102,C.teal);GA.motif(g,{id:'basic-'+key,name:key,x:644,y:yy+12,width:103,height:67,color:C.teal});w(g,'basic-name'+i,770,yy+21,255,62,...names[i],31,C.teal);w(g,'basic-count'+i,1057,yy+21,104,62,String(Z.graphlets.counts[key]),String(Z.graphlets.counts[key]),40,C.gold);cards.push(g);});
 const term=w(p,'pattern-name',96,540,440,64,'Маленький узор = графлет','Little pattern = graphlet',28,C.gold);
 function paint(){const key=s.phase<1?'P3':'K3',nodes=Z.graphlets.occurrences[key][0],edges=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(nodes.includes(i)&&nodes.includes(j)&&Z.adj1[i][j])edges.push([i,j]);net.highlight({vertices:nodes,edges});cards.forEach((g,i)=>F.opacity(g,s.phase>=i?1:.12));F.opacity(term.el,s.phase>=2?1:0);v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Найдём маленькую цепочку внутри большой схемы.','Find a little chain inside the larger diagram.'],[
  {patch:{phase:1},caption:['А вот три точки, связанные в треугольник.','Here are three dots connected in a triangle.']},
  {patch:{phase:2},caption:['Посчитав такие узоры, можно описать устройство сети.','Counting such patterns describes how the network is built.']}
 ]);return v.root;
});

reg('qalign-fingerprint',['Узоры дают «отпечаток» сети','Patterns give a network a “fingerprint”'],[
 ['Для каждого типа узора запишем, сколько раз он встретился. Справа — восемь проверенных подсчётов той же первой сети.','Record how often each pattern occurs. The right side shows eight verified counts from the same first network.'],
 ['Получился список чисел: много одних узоров, мало других. Это простое описание структуры сети. Разные сети могут иметь одинаковые числа.','We get a list of counts: many of some patterns, fewer of others. It is a simple description of structure. Different networks can have the same counts.'],
 ['Разнообразие этих частот можно собрать в одно число — энтропию. Здесь H≈1.890 бит. Сама по себе большая энтропия не означает более трудный поиск.','The diversity of these frequencies can be summarized by one number: entropy. Here H≈1.890 bits. Higher entropy does not by itself mean harder search.']
],[[['Отпечаток однозначно определяет сеть?','Does the fingerprint uniquely identify the network?'],['Нет. Это удобная аналогия для набора признаков, а не уникальный идентификатор или полный рисунок сети.','No. It is an analogy for a set of features, not a unique identifier or a complete network reconstruction.']], [['Это уже распределение графлетных степеней?','Is this a graphlet degree distribution?'],['Нет. Здесь общие частоты узоров. Распределения графлетных степеней описывают роли отдельных вершин подробнее.','No. These are global pattern counts. Graphlet degree distributions describe individual vertex roles in more detail.']], [['Подсчёт совпадает с исходным ноутбуком?','Does the count exactly match the original notebook?'],['Здесь исправлен учебный счётчик: он проверяет связность. Треугольник с отдельной точкой не считается цепочкой. Регрессии исходных 225 задач не пересчитаны с этой коррекцией и показываются отдельно.','The teaching counter checks connectivity. A triangle plus an isolated dot is not a chain. The original 225-instance regressions were not recalculated with this correction and are treated separately.']]],ctx=>{
 const v=stage(ctx,['Узоры дают «отпечаток» сети','Patterns give a network a “fingerprint”']),p=v.p,s={phase:0};
 const net=GA.network(p,{id:'fingerprint-source',adj:Z.adj1,positions:GA.ring(N,269,320,117,95),r:23,color:C.blue});net.highlight({all:true});w(p,'fingerprint-left',80,163,390,62,'Считаем маленькие узоры','Count the little patterns',27,C.blue);
 const keys=Object.keys(Z.graphlets.counts),names=[['Цепочка из 3','3-dot chain'],['Треугольник','Triangle'],['Цепочка из 4','4-dot chain'],['Звезда','Star'],['Квадрат','Square'],['Треугольник с хвостом','Triangle with a tail'],['Квадрат с диагональю','Square with a diagonal'],['Все связаны со всеми','All connected to all']];
 const rows=keys.map((key,i)=>{const yy=230+i*40,g=F.group(p);GA.motif(g,{id:'tally-'+key,name:key,x:610,y:yy-15,width:57,height:32,color:C.teal});w(g,'tally-name'+i,683,yy-20,330,42,...names[i],23,C.grey,'left');const bar=D.dom.s('rect',{x:1023,y:yy-10,width:Z.graphlets.counts[key]*12,height:20,rx:4,fill:C.teal});g.append(bar);w(g,'tally-count'+i,1147,yy-22,60,46,String(Z.graphlets.counts[key]),String(Z.graphlets.counts[key]),26,C.gold);return g;});
 const explanation=w(p,'fingerprint-explain',95,447,395,132,'','',32,C.gold);
 function paint(){rows.forEach(g=>F.opacity(g,s.phase<1?.25:1));explanation.setText(s.phase<1?tr('Сеть →\nчисла узоров','Network →\npattern counts'):s.phase<2?tr('Много цепочек,\nмало треугольников','Many chains,\nfewer triangles'):tr('Разнообразие\nможно измерить','Diversity\ncan be measured'));v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['У каждого типа узора есть свой счётчик.','Each pattern type has its own counter.'],[
  {patch:{phase:1},caption:['Список частот помогает сравнивать устройство разных сетей.','The frequency list helps compare different networks.']},
  {patch:{phase:2},caption:['Но по этому числу ещё нельзя уверенно предсказать трудность поиска.','This number alone does not yet reliably predict search difficulty.']}
 ]);return v.root;
});

reg('qalign-evidence',['Помогут ли узоры предсказать трудность?','Can patterns predict search difficulty?'],[
 ['Вот главный исследовательский вопрос Q-Align: можно ли по устройству двух сетей заранее понять, насколько трудно найти хорошие пары?','This is Q-Align’s research question: can the structure of two networks tell us in advance how hard it is to find good pairings?'],
 ['Повторно проверены 225 маленьких задач Tutorial: пять моделей сетей, размеры 5, 6, 7, три уровня шума и пять seeds. Для каждой задачи — 50 запусков по 150 шагов.','The 225 small Tutorial instances were rerun: five network models, sizes 5, 6 and 7, three noise levels and five seeds. Each instance uses 50 runs of 150 steps.'],
 ['Связь с энтропией обнаружена, но она слабая. R² для log числа минимумов — 0.174, для успеха SA — 0.097. Это доля объяснённой вариации, а не процент правильных прогнозов.','Entropy has a weak association: R² is 0.174 for log minimum count and 0.097 for SA success. This measures explained variation, not the percentage of correct predictions.'],
 ['Для числа минимумов спектральный разрыв сильнее, R²=0.203. Нужны исправленные признаки и независимые задачи для проверки прогноза. Квантового преимущества эти результаты не показывают.','Spectral gap is stronger for minimum count, with R²=0.203. Corrected features and independent instances are needed to validate predictions. These results do not demonstrate quantum advantage.']
],[[['Можно уже сказать: больше узоров — труднее поиск?','Can we already say more patterns mean harder search?'],['Нет. Проверяется связь конкретных признаков с результатами конкретного алгоритма. Общего такого правила пока нет.','No. The experiments test particular features against one algorithm’s outcomes. Such a general rule has not been established.']], [['Что показано квадратиками?','What do the squares represent?'],['Каждый квадратик — одна из 225 исследованных задач. Это счётчик задач, а не карта успехов отдельных запусков.','Each square is one of the 225 studied instances. It counts instances, not successful individual runs.']]],ctx=>{
 const v=stage(ctx,['Помогут ли узоры предсказать трудность?','Can patterns predict search difficulty?']),p=v.p,s={phase:0};
 w(p,'evidence-grid-title',90,159,490,75,'Проверили 225 маленьких задач','Tested 225 small instances',29,C.blue);
 const grid=F.group(p);for(let i=0;i<225;i++)grid.append(D.dom.s('rect',{x:112+(i%15)*25,y:258+Math.floor(i/15)*18,width:16,height:11,rx:3,fill:C.blue,'fill-opacity':.68}));
 panel(p,666,230,520,322,C.teal);const conclusion=w(p,'evidence-simple',690,247,472,285,'','',35,C.teal);
 function paint(){F.opacity(grid,s.phase>=1?1:.16);conclusion.setText(s.phase<1?tr('Узоры сети →\nтрудность поиска?','Network patterns →\nsearch difficulty?'):s.phase<2?tr('Сравнили узоры\nи успех поиска','Compared patterns\nwith search success'):s.phase<3?tr('Связь есть,\nно она слабая','There is a link,\nbut it is weak'):tr('Готового прогноза\nпока нет','A reliable predictor\nis still to come'));v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Идея проекта: оценивать трудность поиска по устройству сетей.','Project idea: estimate search difficulty from network structure.'],[
  {patch:{phase:1},caption:['Каждый квадратик — одна проверенная задача.','Each square is one tested instance.']},
  {patch:{phase:2},caption:['Первые результаты дают повод продолжить исследование.','Initial results give us a reason to keep investigating.']},
  {patch:{phase:3},caption:['Чтобы уверенно предсказывать, нужны проверки на новых задачах.','Reliable prediction needs tests on new instances.']}
 ]);return v.root;
});

reg('qalign-qubo',['Запишем выбор с помощью «да» и «нет»','Record our choices with “yes” and “no”'],[
 ['Теперь разберём название QUBO. Начнём с простой таблицы: строка — точка первой сети, столбец — точка второй.','Now we can approach the term QUBO. Start with a simple table: a row is a first-network dot and a column is a second-network dot.'],
 ['Единица означает «эту пару выбрали». Пустая клетка означает ноль — «не выбрали». В каждой строке должна быть одна единица.','A one means “we chose this pair”. An empty cell means zero: “we did not”. Each row should contain one one.'],
 ['В каждом столбце тоже одна единица: нельзя использовать одну и ту же вторую точку дважды. Для шести точек таблица содержит 36 вопросов «да или нет».','Each column also has one one: we cannot use a target dot twice. For six dots, the table contains 36 yes/no decisions.'],
 ['QUBO записывает оценку ответа и штрафы за нарушения через эти нули и единицы. X — таблица 6×6; Q — другая таблица коэффициентов 36×36. Если 36 решений обозначить вектором x, оценка записывается E(x)=xᵀQx. В исследуемом коде поиск ограничен допустимыми перестановками.','QUBO expresses the score and penalties using these zeros and ones. X is the 6×6 assignment table; Q is a separate 36×36 coefficient matrix. With the 36 decisions in a vector x, the objective is E(x)=xᵀQx. The studied code searches only valid permutations.']
],[[['QUBO — это название квантового компьютера?','Is QUBO the name of a quantum computer?'],['Нет. Это способ записать задачу оптимизации с переменными 0 или 1. Такую задачу могут решать разные, в том числе классические, методы.','No. It is a formulation of an optimization problem with 0/1 variables. Different methods, including classical ones, can solve it.']], [['Можно сразу отправить эти штрафы любому решателю?','Can these penalties be sent straight to any solver?'],['Нужно проверить их достаточность. В исходном коде α=1, β=γ=2 не исключают все недопустимые двоичные ответы: для K₄ неправильное назначение даёт −24 вместо лучшего допустимого −20. Перестановочный поиск такого ответа не допускает.','Penalty sufficiency must be checked. Source defaults α=1, β=γ=2 do not exclude all invalid binary assignments: for K₄ an invalid assignment scores −24 versus the best valid −20. Permutation search does not allow that invalid assignment.']]],ctx=>{
 const v=stage(ctx,['Запишем выбор с помощью «да» и «нет»','Record our choices with “yes” and “no”']),p=v.p,s={phase:0,row:0};let d;const perm=Z.permutations[BEST];
 const matrix=GA.matrix(p,{id:'beginner-X',n:N,x:772,y:247,size:46,labels:'abcdef'.split('')});w(p,'table-title',690,163,435,64,'Таблица выбранных пар','Table of chosen pairs',29,C.gold);
 panel(p,96,226,485,302,C.teal);const message=w(p,'table-explain',119,248,439,258,'','',32,C.teal);
 const control=slider(v,['Проверить строку','Inspect a row'],0,5,0,1,value=>d.set({row:value}),747,549,319);
 function paint(){const row=Math.round(s.row);matrix.set(perm,s.phase<2?row:-1);message.setText(s.phase<1?tr('Строка '+row+'\nи столбец '+String.fromCharCode(97+perm[row])+' — выбранная пара','Row '+row+'\nand column '+String.fromCharCode(97+perm[row])+' — a chosen pair'):s.phase<2?tr('1 — пару выбрали\nПустая клетка — 0','1 — pair chosen\nEmpty cell — 0'):s.phase<3?tr('Одна 1 в строке.\nОдна 1 в столбце.','One 1 per row.\nOne 1 per column.'):tr('QUBO:\nзапись оценки\nчерез 0 и 1','QUBO:\na scoring problem\nwritten with 0 and 1'));control.input.value=row;control.output.textContent=row;Object.assign(v.root.dataset,{row,variables:36,qSize:36,motionPhase:JSON.stringify(s)});}
 d=steps(ctx,v,s,paint,['Договоримся, как записать выбранные пары для компьютера.','Agree on how to record chosen pairs for the computer.'],[
  {patch:{phase:1,row:3},caption:['Галочку «да» заменили единицей, «нет» — нулём.','Replace “yes” with one and “no” with zero.']},
  {patch:{phase:2},caption:['Каждая точка используется ровно один раз.','Each dot is used exactly once.']},
  {patch:{phase:3},caption:['Оценку и штрафы можно записать как QUBO. Формула есть в пояснениях.','The score and penalties can be formulated as QUBO. Notes give the details.']}
 ]);return v.root;
});

window.QAlignDetails({Z,N,tr,w,panel,stage,reg,steps,buttons,slider,real,barrierView});

reg('qalign-next',['Что уже сделано и куда тут Qiskit?','What is implemented, and where does Qiskit fit?'],[
 ['Сформулируем проект простыми словами: искать пары в двух сетях трудно. Q-Align проверяет, помогут ли маленькие узоры связей заранее оценить эту трудность.','Put simply: matching two networks can be hard. Q-Align tests whether little connection patterns help estimate that difficulty in advance.'],
 ['В репозитории уже есть классический поиск, точный перебор маленьких задач, графлетные признаки и измерения качества поиска. Phase 1 дополнительно считает FDC, автокорреляцию и барьеры.','The repository already has classical search, exact small-instance enumeration, graphlet features and search measurements. Phase 1 also computes FDC, autocorrelation and barriers.'],
 ['Qiskit и IBM объясняют интерес к квантовым вычислениям. Но в этом репозитории ещё нет запуска на квантовом компьютере. Сравнение с ним — возможный следующий эксперимент.','Qiskit and IBM explain the interest in quantum computing. This repository has not yet run on a quantum computer. A solver comparison is a possible next experiment.'],
 ['Для разговора с Наташей: «Когда мы встретились на конференции, я как раз увлёкся Qiskit с другом. Затем меня заинтересовал вопрос: могут ли графлеты помочь понять, какие сети трудно сопоставлять? В Q-Align я исследую эту связь сначала на маленьких классических примерах».','For Natasha: “Around the time we met at the conference, a friend and I became interested in Qiskit. I then wondered whether graphlets could help explain which networks are hard to match. In Q-Align, I study that connection first with small classical examples.”']
],[[['В чём главный вопрос проекта?','What is the project’s main question?'],['Можно ли по маленьким узорам связей заранее понять, насколько трудно будет сопоставить две сети?','Can little connection patterns tell us in advance how difficult matching two networks will be?']], [['Что говорить о квантовом преимуществе?','What can we say about quantum advantage?'],['Пока это гипотеза. Сначала нужно исправить счётчик и штрафы, проверить прогноз на новых задачах и согласовать бюджет сравнения решателей.','It remains a hypothesis. First correct the counter and penalties, validate prediction on new instances and agree on solver-comparison budgets.']]],ctx=>{
 const v=stage(ctx,['Что уже сделано и куда тут Qiskit?','What is implemented, and where does Qiskit fit?']),p=v.p,s={phase:0};const cards=[];
 const titles=[['Описать сеть','Describe the network'],['Найти пары','Find the pairs'],['Сравнить методы','Compare methods']],descs=[['Маленькие узоры:\nграфлеты','Little patterns:\ngraphlets'],['Классический поиск\nуже работает','Classical search\nalready works'],['Qiskit / IBM:\nследующий эксперимент','Qiskit / IBM:\na future experiment']];
 titles.forEach((title,i)=>{const x=95+i*380,g=F.group(p);panel(g,x,235,330,290,[C.blue,C.teal,C.gold][i]);w(g,'final-title'+i,x+15,251,300,107,...title,31,[C.blue,C.teal,C.gold][i]);w(g,'final-desc'+i,x+15,365,300,142,...descs[i],28,C.grey);cards.push(g);});
 const bottom=w(p,'final-main-question',116,540,1048,72,'Могут ли узоры заранее подсказать трудность поиска?','Can patterns tell us how hard search will be?',29,C.gold);
 function paint(){cards.forEach((g,i)=>F.opacity(g,s.phase>=i?1:.2));F.opacity(bottom.el,s.phase>=3?1:0);v.root.dataset.motionPhase=JSON.stringify(s);}
 steps(ctx,v,s,paint,['Сначала описываем устройство сети.','First, describe how a network is built.'],[
  {patch:{phase:1},caption:['Затем проверяем, как компьютер ищет хорошие пары.','Then test how the computer finds good pairings.']},
  {patch:{phase:2},caption:['Сравнение с квантовым поиском ещё предстоит сделать.','A comparison with quantum search is still to come.']},
  {patch:{phase:3},caption:['Теперь эту идею можно объяснить своими словами.','You can now explain the idea in your own words.']}
 ]);return v.root;
});
})();
