(function(){
'use strict';
const TOKENS='ABCDEFGH'.split('').map((label,i)=>({id:'example-'+i,label,color:'var(--color-text)'})),PAIRS=[[0,7],[1,6],[2,5]];
D.deck.register({id:'sequence-and-pairs',chapter:'Сохраняем индекс и связь',title:'Символы те же. Меняется раскладка.',notes:[
 F.note('Восемь условных символов A–H расположены в строке. Маленькая цифра показывает постоянный индекс, а линия соединяет соседей по порядку. Здесь нет последовательности из статьи и нет предсказанной структуры. Символы — общие элементы компонента: ими могут быть буквы, позиции, этапы или другие именованные объекты. Их текст и идентификаторы сохраняются при изменении раскладки.'),
 F.note('Та же строка плавно изгибается в дугу. Новые символы не создаются, их порядок вдоль линии не меняется. Радиус дуги вычислен из постоянной длины учебной линии; промежуточные положения явно задаёт автор эпизода. Это геометрическая перестановка рисунка, а не физическая симуляция сворачивания молекулы. Плавное движение помогает проследить каждую позицию по её номеру.'),
 F.note('Раскрываем три отношения, заранее заданные автором: позиции 1 и 8, 2 и 7, 3 и 6. В коде это индексы 0–7, 1–6, 2–5. Пунктир обозначает именно эти пары; близость на холсте не создаёт новую связь автоматически. Компонент принимает пары как входные данные и проверяет их индексы, но не выводит их из букв и не знает правил комплементарности.'),
 F.note('Выбрана позиция 2: её контур, связанная позиция 7 и соединяющий их пунктир выделены. Можно выбрать другую букву щелчком, клавишей Enter или пробелом; стрелки продолжают управлять уроком. Ползунок меняет только изгиб рисунка. Индексы, буквы и заданные связи остаются прежними. Так можно разделить три вещи: порядок объектов, выбранные отношения и экранное расположение.')
],qa:[
 {q:'Возникают ли пары из-за близости символов на рисунке?',a:'Нет. Список пар явно задан автором, а раскладка только отображает его. Изменение координат не пересчитывает пары.',source:'Учебная схема: 1↔8, 2↔7, 3↔6; никакой биологической модели здесь нет.'},
 {q:'Можно ли считать дугу предсказанной структурой РНК?',a:'Нет. A–H — условные символы, а дуга вычислена для визуального объяснения. Для научной структуры нужны отдельные данные или явно указанная модель.',source:'Геометрический пример компонента K.sequenceTrack; данные статьи не используются.'}
],build(ctx){
 const v=F.stage(ctx,'Символы те же. Меняется раскладка.','Строка → заданная раскладка → пары → выбор','A–H и пары заданы автором · это не молекулярная структура');
 const stage=K.viewport(v.svg),state={fold:0,pairs:0,controls:0};let chosen=null;
 function positions(){const angle=Math.PI*state.fold,length=700,n=TOKENS.length;return TOKENS.map((_,i)=>{if(angle<1e-7)return{x:640+(i/(n-1)-.5)*length,y:300};const radius=length/angle,a=-angle/2+i*angle/(n-1);return{x:640+radius*Math.sin(a),y:300+radius*(Math.cos(a)-Math.cos(angle/2))};});}
 const track=K.sequenceTrack(stage,{tokens:TOKENS,positions:positions(),pairs:PAIRS,radius:23,onSelect(index){chosen=index;paint();}});
 const pairText=F.label(stage,640,185,'Заданные пары: 1 ↔ 8 · 2 ↔ 7 · 3 ↔ 6',27,C.blue);
 const detail=F.group(stage),which=F.label(detail,1060,383,'',25,C.gold),partner=F.label(detail,1060,420,'',23,C.blue);
 const slider=T.control(v.root,'Изгиб схемы',0,1,0,.01,value=>{A.finishAll();state.fold=value;paint();},85,430,260);
 const buttons=T.buttons(v.root,['Пара 1 ↔ 8','Пара 3 ↔ 6'],index=>{chosen=index?2:0;paint();},944,466);
 Object.assign(buttons.style,{width:'250px',display:'grid',gridTemplateColumns:'250px',gridTemplateRows:'48px 48px',gap:'12px'});
 const buttonRows=L.rows({x:944,y:466,width:250,height:108},2,{gap:12});
 [...buttons.children].forEach((button,i)=>L.contract(button,{id:'sequence-pair-button-'+i,box:buttonRows[i],space:v.root,measure:'content',padding:[9,19]})); // 8/18px CSS padding + 1px border.
 function paint(){
  track.setPositions(positions());track.setPairsVisible(state.pairs);track.select(chosen);
  F.opacity(pairText,state.pairs);F.opacity(detail,state.controls);F.opacity(slider.el,state.controls);F.opacity(buttons,state.controls);
  slider.input.value=state.fold;slider.output.textContent=state.fold.toFixed(2);
  const pair=PAIRS.find(p=>p.includes(chosen)),other=pair?pair.find(i=>i!==chosen):null;
  which.textContent=chosen===null?'Выберите символ':'Выбрана позиция '+(chosen+1);partner.textContent=other===null?'Нет заданной пары':'Пара: позиция '+(other+1);
 }
 paint();v.caption('Номер фиксирует личность позиции. Линия показывает порядок символов.');
 F.step(ctx,v,state,{fold:1},paint,'Следите за теми же буквами и индексами, пока строка изгибается.',2400);
 F.step(ctx,v,state,{pairs:1},paint,'Пунктир показывает заданные отношения, а не расстояние между соседями в строке.',1600);
 ctx.step(()=>{chosen=1;v.caption('Выберите символ и измените изгиб. Его индекс и заданная пара сохраняются.');return F.tween(state,{controls:1},paint,900);});
 return v.root;
}});
})();
