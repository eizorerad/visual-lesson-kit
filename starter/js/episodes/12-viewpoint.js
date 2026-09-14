(function(){
'use strict';
// Paired synthetic clouds. Each pair has the same x,y and different z.
// The camera changes; these source coordinates never do.
const OFFSETS=Array.from({length:16},(_,i)=>{
 const a=i*2.399963229728653,r=.25+.72*Math.sqrt((i+1)/16);
 return [Math.cos(a)*r,Math.sin(a)*r*.7,Math.sin(i*1.7)*.13];
});
const POINTS=[];
['P','Q'].forEach((group,g)=>{
 const z=g?1.15:-1.15,color=g?C.gold:C.blue;
 POINTS.push({id:group,xyz:[0,0,z],color,r:g?6:9});
 OFFSETS.forEach((d,i)=>POINTS.push({id:group+(i+1),xyz:[d[0],d[1],z+d[2]],color,r:g?4.5:6.5}));
});
D.deck.register({id:'viewpoint-cloud',chapter:'Ракурс и проекция',title:'Сменился ракурс, не данные',
 notes:[
  F.note('Это 34 придуманные точки: две группы по 17. Их цвет и ID заданы заранее. У каждой пары одинаковые x и y, но разные z; центры P и Q имеют координаты (0, 0, −1.15) и (0, 0, 1.15). Во фронтальном виде глубина не видна, поэтому точки попарно накладываются. Разный размер двух цветных отметок оставляет оба цвета различимыми: размер не кодирует величину. Проволочная рамка — пространственный ориентир. Перед нами линейная проекция учебного облака, а не реальные клетки или рассчитанный UMAP.'),
  F.note('Камера плавно меняет направление взгляда. Исходные координаты, пары, цвета и расстояния в трёхмерном пространстве остаются прежними; меняются только экранные координаты. Глубина становится видимой, поэтому группы расходятся на рисунке. Мы не раздвигаем сами группы и не переобучаем представление. Рамка движется вместе с облаком, а подписи остаются читаемыми. Проекция ортографическая: ближние отметки не увеличиваются, общий масштаб фиксирован.'),
  F.note('Сбоку видна разница по z, скрытая в первом кадре. Центры P и Q всё время находились на расстоянии 2.3 условной единицы друг от друга; их экранное расстояние зависит от взгляда. Ползунок позволяет проверить промежуточные ракурсы на том же облаке. Это полезная аналогия потери информации на плоском рисунке, но UMAP — нелинейное построение нового представления, а не отбрасывание одной оси. Поворот готового двумерного UMAP не восстановит исходные измерения. Для настоящего 3D UMAP нужны заранее вычисленные три координаты.'),
  F.note('Возвращаемся во фронтальный вид: группы снова накладываются. Ни точки, ни расстояния в пространстве не изменились. Этот обратимый переход отделяет свойства данных от свойств изображения. Не следует доказывать разделимость классов или наличие механизма только красивой картинкой. Для UMAP дополнительно важны параметры, устойчивость результата и проверка в исходном пространстве. В следующем образце отделим ещё две операции: наклон уже известной плоскости и раскрытие заранее заданной третьей координаты.')
 ],qa:[
  {q:'При повороте точки действительно разошлись?',a:'Разошлись их проекции на экран. У P и Q с самого начала одинаковые x и y и разные z. Все исходные трёхмерные координаты и расстояния сохраняются; меняется направление взгляда.',source:'Синтетические POINTS эпизода 12; ортографическая проекция K.project3D.'},
  {q:'Можно так повернуть двумерный UMAP и восстановить глубину?',a:'Нет. UMAP строит нелинейное представление. Из двух опубликованных координат неизвестную третью восстановить поворотом нельзя. Если UMAP уже рассчитан с n_components=3, можно вращать это готовое трёхмерное представление, но оно всё равно не тождественно исходному пространству признаков.',source:'UMAP: Basic UMAP Parameters, n_components.',url:'https://umap-learn.readthedocs.io/en/latest/parameters.html'}
 ],build(ctx){
  const v=F.stage(ctx,'Сменился ракурс, не данные','Шаблон 12 · один объект, другой взгляд','34 синтетические точки · ортографическая схема · не алгоритм UMAP');
  const stage=K.viewport(v.svg),state={angle:0,phase:0};
  F.label(stage,640,181,'Одно облако · две группы',28,C.white);
  const segments=[];
  for(const z of [-1.48,1.48])for(let k=0;k<4;k++){
   const corners=[[-1.3,-.95,z],[1.3,-.95,z],[1.3,.95,z],[-1.3,.95,z]];
   segments.push({id:'frame-'+z+'-'+k,from:corners[k],to:corners[(k+1)%4],color:'var(--color-dim)',width:1.1});
  }
  [[-1.3,-.95],[1.3,-.95],[1.3,.95],[-1.3,.95]].forEach((p,i)=>segments.push({id:'edge'+i,from:[...p,-1.48],to:[...p,1.48],color:'var(--color-dim)',width:1.1}));
  const cloud=K.spatialScene(stage,{camera:{cx:439,cy:371,scale:82},points:POINTS,segments,
   labels:[{id:'p-label',xyz:[0,0,-1.15],text:'P',color:C.blue,size:25,dx:-23,dy:-20},{id:'q-label',xyz:[0,0,1.15],text:'Q',color:C.gold,size:25,dx:23,dy:20}]});
  F.label(stage,986,295,'Те же точки',30,C.white);
  F.label(stage,986,350,'Те же координаты',26,C.grey);
  const viewLabel=F.label(stage,986,410,'',29,C.gold);
  F.label(stage,986,482,'Проекция ≠ UMAP',24,C.grey);
  let driver;
  const slider=T.control(v.root,'Ракурс',0,90,0,1,value=>driver.set({angle:value,phase:4}),250,552,380);
  function paint(){
   cloud.setCamera({pitch:-state.angle,yaw:-22*Math.sin(state.angle*Math.PI/90)});
   slider.input.value=state.angle;slider.output.textContent=Math.round(state.angle)+'°';
   viewLabel.textContent=state.angle<1?'Вид спереди':state.angle>89?'Вид сбоку':'Глубина становится видна';
   viewLabel.setAttribute('font-size',state.angle>1&&state.angle<89?25:29);
   Object.assign(v.root.dataset,{angle:String(state.angle),pointCount:String(POINTS.length),coordinateMode:'fixed-world'});
   if(state.angle<1) v.caption(state.phase===3?'Вернулись к первому виду. Точки и расстояния в пространстве не изменились.':'P и Q наложились на экране. По этой картинке глубина не видна.');
   else if(state.angle>89)v.caption('Сбоку различие видно. Оно было в данных с самого начала.');
   else v.caption('Меняется направление взгляда. Координаты самих точек остаются прежними.');
  }
  driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();
  ctx.step(()=>{driver.set({phase:1});return driver.to({angle:58},{duration:2300});});
  ctx.step(()=>{driver.set({phase:2});return driver.to({angle:90},{duration:1800});});
  ctx.step(()=>{driver.set({phase:3});return driver.to({angle:0},{duration:2600});});
  return v.root;
 }});
})();
