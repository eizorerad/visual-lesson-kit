/* Reusable teaching composition: a recurring map, shared numerical state, exact guides.
   All data below are invented. This recipe is optional, not a required lesson outline. */
(function(){
'use strict';
const A=Object.freeze(Array(8).fill(5)), B=Object.freeze([0,0,0,0,10,10,10,10]);
const colors=[C.blue,C.teal,C.gold], strings={};
function tr(ru,en){if(!Object.hasOwn(strings,ru)){strings[ru]=en;D.i18n.pack('en',{strings:{[ru]:en}});}return ru;}
function words(p,id,x,y,width,height,ru,en,size=25,color=C.white){return L.textBox(p,{id,x,y,width,height,text:tr(ru,en),size,color,padding:5,align:'center',valign:'middle'});}
function register(id,title,notes,q,a,build){D.i18n.pack('en',{notes:{[id]:notes.map(n=>F.note(n[1]))},qa:{[id]:[{q:q[1],a:a[1],source:'Invented eight-observation examples; exact calculations.'}]}});D.deck.register({id,title:tr(...title),chapter:tr('Связное объяснение','A connected explanation'),notes:notes.map(n=>F.note(n[0])),qa:[{q:q[0],a:a[0],source:'Придуманные наборы по восемь наблюдений; точные расчёты.'}],build});}
function stage(ctx,title){return F.stage(ctx,tr(...title),'',tr('Учебные данные · по 8 наблюдений · условные единицы','Teaching data · 8 observations each · arbitrary units'));}
function curve(p,points,color,width=2.5){const n=F.path(p,points,color,width);n.setAttribute('stroke-linecap','butt');n.setAttribute('stroke-linejoin','miter');return n;}
// Keep this composition local: the next topic supplies its own motifs and number of concepts.
function conceptMap(p){
 const xs=[260,640,1020], y=330, r=73;
 const groups=xs.map((x,i)=>{const g=F.group(p);g.dataset.conceptId=['observations','curve','comparison'][i];
 const ring=F.dot(g,x,y,r,C.bg);ring.setAttribute('stroke',colors[i]);ring.setAttribute('stroke-width',1.75);
 if(i===0)B.forEach((v,j)=>F.dot(g,x-44+j*12.5,y+24-v*4.8,4,colors[i]));
 if(i===1){curve(g,[[x-45,y+28],[x,y+28],[x,y-28],[x+45,y-28]],colors[i]);}
 if(i===2){curve(g,[[x-42,y],[x+42,y]],C.blue,2);curve(g,[[x-42,y+28],[x,y+28],[x,y-28],[x+42,y-28]],C.teal,2);[-25,25].forEach(dx=>K.guideSpan(g,{from:[x+dx,y],to:[x+dx,y+(dx<0?28:-28)],color:C.gold,tickSize:8}));}
 words(g,'map-label-'+i,x-155,y+95,310,60,['Наблюдения','Кривая','Сравнение'][i],['Observations','Curve','Comparison'][i],28,colors[i]);return g;});
 const arrows=xs.slice(0,-1).map((x,i)=>{const a=F.arrow(p,C.grey,1.5);a.shaft.setAttribute('stroke-linecap','butt');const from=K.boxAnchor({x:x-r,y:y-r,width:2*r,height:2*r},'right'),to=K.boxAnchor({x:xs[i+1]-r,y:y-r,width:2*r,height:2*r},'left');return {a,from,to};});
 return {set(n){groups.forEach((g,i)=>F.opacity(g,.2+.8*F.clamp(n-i)));arrows.forEach(({a,from,to},i)=>F.growArrow(a,...from,...to,F.clamp(n-i-1)));}};
}
const mapTitle=['Один вопрос связывает все шаги','One question connects every step'];
register('bridge-question',mapTitle,[
 ['Два придуманных набора: A содержит восемь пятёрок; B — четыре нуля и четыре десятки. Оба средних равны 5. Вопрос всей мини-истории: как увидеть различие, которое скрывает одно среднее?','Two invented samples: A contains eight fives; B contains four zeros and four tens. Both means are 5. The question for this mini-story is how to see a difference hidden by one mean.'],
 ['Карта заранее называет три операции: сохранить наблюдения, выразить их кривой, сравнить кривые. В конце вернёмся к тем же образам. Стрелки обозначают порядок объяснения, не причинные отношения.','The map names three operations: retain observations, express them as a curve, compare the curves. We return to the same motifs at the end. Arrows show explanatory order, not causal relationships.']
],['Почему нужна повторяющаяся карта?','Why repeat the map?'],['Она связывает локальный расчёт с исходным вопросом. Подсвечиваем изученные операции, не уровень научной доказанности. Для другой темы выбирайте другие образы и число частей.','It connects a local calculation to the opening question. Highlighting marks operations already explained, not scientific certainty. Choose different motifs and a different number of parts for another topic.'],ctx=>{
 const v=stage(ctx,mapTitle),p=K.viewport(v.svg),state={progress:1},map=conceptMap(p);
 words(p,'map-question',150,155,980,80,'Средние равны 5. Чем различаются наборы?','Both means are 5. How do the samples differ?',31);
 const promise=words(p,'map-promise',180,512,920,70,'Сохраним форму, затем измерим различие.','Retain the shape, then measure the difference.',28);
 function paint(){map.set(state.progress);F.opacity(promise.el,F.phase(state.progress,2,3));}
 const d=F.driver(state,paint);ctx.onDispose(d.dispose);paint();v.caption(tr('Начнём с наблюдений. Один вопрос останется с нами до конца.','Begin with the observations. Keep one question throughout.'));
 ctx.step(()=>{v.caption(tr('Теперь виден весь путь. Следующий шаг — построить кривую.','Now the whole path is visible. Next, build the curve.'));return d.to({progress:3},{duration:2000});});return v.root;
});
const gridTitle=['Квантили читают те же наблюдения','Quantiles read the same observations'];
register('bridge-grid',gridTitle,[
 ['Сверху — отсортированные восемь наблюдений B: 0,0,0,0,10,10,10,10. Каждое занимает 1/8 вероятности. У кривой Q(u) два уровня: 0 и 10. Наблюдения не создаются при рисовании кривой.','Above are the eight sorted B observations: 0,0,0,0,10,10,10,10. Each occupies 1/8 of probability. Q(u) has two levels: 0 and 10. Drawing the curve creates no observations.'],
 ['Двигаем u до 0.25. Правило type 1: k=ceil(8u); четвёрть набора — первые два наблюдения, поэтому Q(0.25)=0. Заливка полосы следует текущему u, а не округлённому рангу. Знак ≈ указывает на округление u в движении: ранг и квантиль используют полную текущую позицию.','Move u to 0.25. The type-1 rule is k=ceil(8u); a quarter of the sample is the first two observations, so Q(0.25)=0. The strip fill follows the current u rather than a rounded rank. The ≈ sign marks a rounded display during motion: rank and quantile use the full current position.'],
 ['При u=0.75 берём шестое наблюдение: Q=10. В самой точке u=0.5 правило type 1 возвращает четвёртое наблюдение, 0; правее — 10. Вертикальная часть линии обозначает скачок, не промежуточные значения.','At u=0.75 select the sixth observation: Q=10. Exactly at u=0.5, type 1 returns the fourth observation, 0; immediately to the right it returns 10. The vertical line marks a jump, not intermediate values.'],
 ['Сетка из 200 середин интервалов задаёт 200 вопросов к той же функции. Получаем 200 квантильных значений, но только два различных числа и всё ещё восемь наблюдений. Здесь сетка выбирается для демонстрации.','A grid of 200 interval midpoints asks the same function 200 questions. It gives 200 quantile values, but only two distinct numbers and still eight observations. This grid is a teaching choice.']
],['Почему 200 позиций не означают 200 разных значений?','Why do 200 positions not imply 200 distinct values?'],['Уровень u — адрес запроса, Q(u) — ответ. Много адресов могут возвращать одно и то же число. Более густая сетка не увеличивает размер выборки.','The level u is a query address; Q(u) is its answer. Many addresses can return the same number. A finer grid does not increase the sample size.'],ctx=>{
 const v=stage(ctx,gridTitle),p=K.viewport(v.svg),model=K.empiricalDistribution(B),state={u:.001,m:8,grid:0};let driver;
 const x=u=>140+620*u,y=q=>535-19*q;
 words(p,'grid-input-label',140,153,620,48,'B: восемь исходных наблюдений','B: eight original observations',25,C.teal);
 const cells=B.map((value,i)=>{const g=F.group(p);g.dataset.observationId='B'+i;g.dataset.value=value;F.dot(g,174+i*79,237,22,C.bg).setAttribute('stroke',C.teal);words(g,'B-'+i,149+i*79,211,50,52,String(value),String(value),24,C.teal);return g;});
 curve(p,[[x(0),y(0)],[x(1),y(0)]],C.grey,1);curve(p,[[x(0),y(0)],[x(0),y(10)]],C.grey,1);
 curve(p,[[x(0),y(0)],[x(.5),y(0)],[x(.5),y(10)],[x(1),y(10)]],C.teal);
 [0,.5,1].forEach(u=>words(p,'u-'+u,x(u)-30,545,60,40,String(u),String(u),20,C.grey));
 [0,10].forEach(q=>words(p,'q-'+q,75,y(q)-20,55,40,String(q),String(q),20,C.grey));
 words(p,'grid-x',290,578,360,42,'Доля u','Fraction u',20,C.grey);words(p,'grid-y',85,294,210,38,'Q(u), усл. ед.','Q(u), arb. units',20,C.grey);
 const strip=D.dom.s('rect',{x:x(0),y:285,width:0,height:6,fill:C.gold});p.append(strip);
 const guide=K.guideSpan(p,{from:[x(0),y(0)],to:[x(0),y(0)],color:C.gold});const point=F.dot(p,x(0),y(0),5,C.gold);
 const marks=Array.from({length:200},(_,i)=>{const n=F.dot(p,0,0,2,C.gold);n.dataset.gridMarker=i;return n;});
 const read=words(p,'grid-read',835,305,360,180,'','',27);
 const ucontrol=T.control(v.root,tr('Доля u','Fraction u'),.001,1,.001,.001,n=>driver.set({u:n}),855,520,320);
 const mcontrol=T.control(v.root,tr('Позиций сетки m','Grid positions m'),8,200,8,1,n=>driver.set({m:n}),855,520,320);
 function paint(){const k=Math.ceil(8*state.u),q=model.quantile(state.u),m=Math.round(state.m),grid=model.grid(m),show=state.grid>.5;
 const uPrefix=Math.abs(state.u-+state.u.toFixed(3))>1e-10?'u ≈ ':'u = ';
 strip.setAttribute('width',620*state.u);guide.setEndpoints([x(state.u),y(0)],[x(state.u),y(q)]);F.pos(point,x(state.u),y(q));F.opacity(guide.g,show?0:1);F.opacity(point,show?0:1);F.opacity(strip,show?0:1);
 cells.forEach((n,i)=>{n.firstChild.setAttribute('stroke-width',!show&&i===k-1?3:1);});
 marks.forEach((n,i)=>{F.opacity(n,show&&i<m?1:0);if(i<m){F.pos(n,x(grid.probabilities[i]),y(grid.values[i]));n.setAttribute('r',4.4-3.4*(m-8)/192);}});
 read.setText(show?tr(m+' позиций\n2 разных значения\n8 наблюдений',m+' positions\n2 distinct values\n8 observations'):tr(uPrefix+state.u.toFixed(3)+'\nk = ceil(8u) = '+k+'\nQ(u) = '+q,uPrefix+state.u.toFixed(3)+'\nk = ceil(8u) = '+k+'\nQ(u) = '+q));
 F.opacity(ucontrol.el,show?0:1);F.opacity(mcontrol.el,show?1:0);ucontrol.input.value=state.u;ucontrol.output.textContent=state.u.toFixed(3);mcontrol.input.value=m;mcontrol.output.textContent=m;
 v.root.dataset.gridSize=m;v.root.dataset.motionPhase=JSON.stringify(state);
 }
 driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Сначала видим восемь значений и ступенчатую кривую.','First, see eight values and their step curve.'));
 ctx.step(()=>{v.caption(tr('Двигаем u и одновременно пересчитываем ранг и квантиль.','Move u while updating the rank and quantile together.'));return driver.to({u:.25},{duration:1700});});
 ctx.step(()=>{v.caption(tr('Продолжим до 75%. Число и метка читают одну текущую позицию.','Continue to 75%. The number and marker read one current position.'));return driver.to({u:.75},{duration:1800});});
 ctx.step(()=>{driver.set({grid:1});v.caption(tr('Уплотняем сетку вопросов. Исходные восемь наблюдений сохраняются.','Make the query grid denser. The eight observations remain.'));return driver.to({m:200},{duration:2000});});return v.root;
});
const distTitle=['От зазора к расстоянию и центру','From gaps to distance and center'];
register('bridge-distance',distTitle,[
 ['Возвращаем A: восемь пятёрок. B остаётся прежним. Две кривые имеют среднее 5, но на каждой половине вероятности зазор равен 5. Вся история использует те же два набора.','Bring back A: eight fives. B remains unchanged. Both curves have mean 5, but the gap is 5 on each probability half. The entire story uses the same two samples.'],
 ['Каждая половина имеет вес 1/2. Квадрат расстояния: W₂²=1/2·5²+1/2·5²=25. Его единицы — квадрат исходных единиц. Тонкие отрезки показывают сравниваемые высоты.','Each half has weight 1/2. The squared distance is W₂²=1/2·5²+1/2·5²=25, in squared input units. Thin spans show the heights being compared.'],
 ['Обычное расстояние W₂ — корень из 25, то есть 5 в исходных единицах. Сумма половинок не равна 5: это результат дополнительного извлечения корня.','The distance W₂ is the square root of 25, hence 5 in input units. The weighted sum is not 5; that requires the additional square-root operation.'],
 ['Теперь ищем центральную кривую Rₜ=(1−t)Q_A+tQ_B. Ползунок меняет ровно t в этой формуле. Минимизируем сумму J=W₂²(A,Rₜ)+W₂²(B,Rₜ), а не расстояние между A и B.','Now seek a central curve Rₜ=(1−t)Q_A+tQ_B. The slider changes exactly t in this formula. Minimize the sum J=W₂²(A,Rₜ)+W₂²(B,Rₜ), not the distance between A and B.'],
 ['Для этих кривых J(t)=25[t²+(1−t)²]=50(t−1/2)²+12.5. Квадрат неотрицателен, поэтому минимум 12.5 достигается при t=1/2. Центральная кривая имеет уровни 2.5 и 7.5. Если разделить сумму J на два, минимум станет 6.25, но центр останется тем же.','Here J(t)=25[t²+(1−t)²]=50(t−1/2)²+12.5. The square is nonnegative, so the minimum 12.5 occurs at t=1/2. The center has levels 2.5 and 7.5. Dividing J by two gives a minimum of 6.25 but the same center.']
],['Почему центр — кривая, а минимум — число?','Why is the center a curve but the minimum a number?'],['Кривая R — кандидат, который выбираем. J(R) — число, оценивающее этого кандидата. Выбор кривой и значение критерия — разные объекты.','R is the candidate curve we choose. J(R) is a number evaluating that candidate. The selected curve and the criterion value are different objects.'],ctx=>{
 const v=stage(ctx,distTitle),p=K.viewport(v.svg),state={phase:0,t:0};let driver;
 const x=u=>140+600*u,y=q=>500-q*23;
 const result=K.wasserstein1D(A,B);curve(p,[[x(0),y(0)],[x(1),y(0)]],C.grey,1);curve(p,[[x(0),y(0)],[x(0),y(10)]],C.grey,1);
 curve(p,[[x(0),y(5)],[x(1),y(5)]],C.blue);curve(p,[[x(0),y(0)],[x(.5),y(0)],[x(.5),y(10)],[x(1),y(10)]],C.teal);
 words(p,'dist-legend',140,162,600,60,'A: все 5 · B: половина 0, половина 10','A: all 5 · B: half 0, half 10',23);
 [0,5,10].forEach(q=>words(p,'d-y'+q,75,y(q)-20,55,40,String(q),String(q),20,C.grey));[0,.5,1].forEach(u=>words(p,'d-x'+u,x(u)-35,510,70,40,String(u),String(u),20,C.grey));
 words(p,'dist-units',140,220,280,38,'Q(u), усл. ед.','Q(u), arb. units',20,C.grey);
 words(p,'dist-fraction',310,555,260,38,'Доля u','Fraction u',20,C.grey);
 const spans=[.25,.75].map(u=>K.guideSpan(p,{from:[x(u),y(5)],to:[x(u),y(5)],color:C.gold,tickSize:12}));
 const center=curve(p,[],C.gold,3);const read=words(p,'distance-formula',815,205,390,225,'','',28);
 const objective=words(p,'objective',815,428,390,72,'','',24,C.gold);
 const control=T.control(v.root,'t',0,1,0,.01,n=>driver.set({t:n}),855,540,310);
 function paint(){const q=K.quantileBarycenter([[5,5],[0,10]],[1-state.t,state.t]).values,J=K.wasserstein1D([5,5],q).squared+K.wasserstein1D([0,10],q).squared;
 spans.forEach((s,i)=>{const u=[.25,.75][i],b=[0,10][i];s.setEndpoints([x(u),y(5)],[x(u),y(5+(b-5)*F.clamp(state.phase))]);F.opacity(s.g,state.phase<2.5?1:0);});
 center.setAttribute('d',`M${x(0)},${y(q[0])}H${x(.5)}V${y(q[1])}H${x(1)}`);F.opacity(center,state.phase>=3?1:0);F.opacity(control.el,state.phase>=3?1:0);F.opacity(objective.el,state.phase>=3?1:0);
 if(state.phase<1)read.setText(tr('Средние: 5 и 5\nФорма различается','Means: 5 and 5\nThe shapes differ'));
 else if(state.phase<2)read.setText('W₂² = ½·5² + ½·5²\n= ½·25 + ½·25\n= 25');
 else if(state.phase<3)read.setText(tr('W₂² = 25\nW₂ = √25 = 5\nКорень возвращает единицы','W₂² = 25\nW₂ = √25 = 5\nThe root restores the units'));
 else read.setText(tr('Rₜ = (1−t)Q_A + tQ_B\nJ(t) = 25[t²+(1−t)²]\n= 50(t−½)² + 12.5','Rₜ = (1−t)Q_A + tQ_B\nJ(t) = 25[t²+(1−t)²]\n= 50(t−½)² + 12.5'));
 objective.setText('t = '+state.t.toFixed(2)+'  →  J = '+J.toFixed(2));
 if(state.phase>=3)v.caption(state.t===.5?tr('При t = ½ квадрат исчезает: центр Rₜ даёт минимум J = 12.5.','At t = ½ the square vanishes: center Rₜ gives the minimum J = 12.5.'):tr('Меняйте t: та же формула обновляет кривую Rₜ и её оценку J.','Change t: the same formula updates curve Rₜ and its score J.'));
 control.input.value=state.t;control.output.textContent=state.t.toFixed(2);
 Object.assign(v.root.dataset,{squared:result.squared,distance:result.distance,objective:J,motionPhase:JSON.stringify(state)});
 }
 driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Те же наборы теперь сопоставлены по одинаковым долям.','The same samples are now matched at equal probability levels.'));
 const caps=[['Сначала складываем квадраты зазоров с их весами.','First sum squared gaps with their weights.'],['Затем извлекаем корень. Это отдельная операция.','Then take the square root. This is a separate operation.'],['Новая задача: выбрать кривую Rₜ с наименьшей суммой квадратов расстояний.','A new task: choose Rₜ with the smallest sum of squared distances.'],['При t = ½ квадрат исчезает. Получаем центр и минимум J = 12.5.','At t = ½ the square vanishes. We obtain the center and minimum J = 12.5.']];
 caps.forEach((c,i)=>ctx.step(()=>{v.caption(tr(...c));return driver.to(i===3?{phase:4,t:.5}:{phase:i+1},{duration:i===3?2000:1400});}));return v.root;
});
const finalTitle=['Возвращаемся к исходному вопросу','Return to the opening question'];
register('bridge-synthesis',finalTitle,[
 ['В начале мы спросили, как увидеть различие при одинаковых средних. Карта остаётся в тех же местах с теми же образами: это три связанные операции, а не три независимых факта.','We began by asking how to see a difference when means agree. The map keeps the same positions and motifs: these are three connected operations rather than three separate facts.'],
 ['Наблюдения задают квантильную кривую. Густая сетка уточняет её численное представление, но не создаёт новых наблюдений.','Observations define the quantile curve. A denser grid refines its numerical representation but creates no new observations.'],
 ['Сравнение всей кривой различает наши два набора: W₂=5 при одинаковых средних 5. Это геометрическое различие учебных наборов. Оно само по себе ещё не является статистическим доказательством; следующий вопрос в исследовании — как оно соотносится со случайной вариацией.','Comparing the whole curves distinguishes our samples: W₂=5 although both means are 5. This is a geometric difference between teaching samples. It is not yet statistical evidence; the next research question is how it compares with random variation.']
],['Что должен делать финал объяснения?','What should an explanation’s ending do?'],['Ответить на первоначальный вопрос знакомыми объектами, показать собранные связи и назвать границу вывода. Новая таблица результатов без этой связи не заменяет финал.','Answer the initial question using familiar objects, show the assembled relationships, and name the limit of the conclusion. Another result table without that connection does not replace an ending.'],ctx=>{
 const v=stage(ctx,finalTitle),p=K.viewport(v.svg),state={progress:1},map=conceptMap(p);
 words(p,'final-question',140,155,1000,72,'Одно среднее скрывало различие формы.','One mean concealed a difference in shape.',32);
 const result=words(p,'final-result',175,518,930,74,'Средние: 5 = 5 · Расстояние кривых: W₂ = 5','Means: 5 = 5 · Curve distance: W₂ = 5',29,C.gold);
 function paint(){map.set(state.progress);F.opacity(result.el,F.phase(state.progress,2,3));v.root.dataset.conceptComplete=state.progress===3?'1':'0';}
 const d=F.driver(state,paint);ctx.onDispose(d.dispose);paint();v.caption(tr('Сохранили наблюдения — теперь соберём весь ответ.','We retained the observations. Now assemble the answer.'));
 ctx.step(()=>{v.caption(tr('Кривая хранит больше информации, чем одно среднее.','The curve retains more information than one mean.'));return d.to({progress:2},{duration:1600});});
 ctx.step(()=>{v.caption(tr('Различие измерено. Для научного вывода ещё нужна проверка случайной вариации.','The difference is measured. Scientific inference still needs a check against random variation.'));return d.to({progress:3},{duration:1600});});return v.root;
});
})();
