(function(){
'use strict';
const TARGET=[1.5,1.1,1.35],BASE=[TARGET[0],TARGET[1],0],ORIGIN=[0,0,0];
D.deck.register({id:'plane-to-space',chapter:'От плоскости к пространству',title:'Плоскость становится опорой',
 notes:[
  F.note('Начинаем с знакомой координатной плоскости. Оси x и y задают два направления; стрелка вектора идёт к точке (1.5, 1.1) в условных единицах. Это проекция будущей трёхмерной точки на плоскость z=0. Третье значение в учебном наборе уже задано: 1.35. Оно пока не нарисовано. Мы не вычисляем его из x и y и не берём из двумерной картинки статьи. Сетка нужна для сохранения ориентира, а не для сложного вычисления.'),
  F.note('Сначала наклоняем только вид той же плоскости. Ось x опускается на рисунке, ось y уходит в глубину. Точка и её две координаты остаются на плоскости z=0; третья ось ещё не показана. Это поворот системы перед ортографической проекцией, без изменения масштаба данных. Экранные углы и длины меняются из-за ракурса, поэтому измерять по пикселям длину исходного вектора нельзя. Камера останавливается перед следующим смысловым действием.'),
  F.note('Теперь от того же начала координат вырастает третья ось z. Она представляет отдельное, заранее определённое направление; плоскость x–y стала опорой. Пока точка остаётся в основании. Рост оси — последовательное введение нового понятия, а не изменение измерений. В трёхмерном пространстве ось z перпендикулярна плоскости, хотя на плоском экране не обязана образовывать прямой угол с обеими нарисованными осями.'),
  F.note('Наконец раскрываем заданную координату z=1.35: точка вектора поднимается над своей проекцией, а стрелка идёт от общего начала к полной точке (1.5, 1.1, 1.35). Тонкая стрелка и кружок на плоскости сохраняют прежнюю проекцию. Пунктир соединяет проекцию с полной точкой и идёт параллельно z. Это анимация раскрытия третьего значения, не физическое движение, не траектория клетки и не восстановление потерянной информации. Ползунок меняет только ракурс. При возврате к виду сверху полная точка снова накладывается на свою проекцию, хотя третья координата остаётся заданной.')
 ],qa:[
  {q:'Откуда взялась третья координата?',a:'Она явно задана в TARGET: [1.5, 1.1, 1.35]. Камера её не вычисляет. В научном уроке нужен измеренный признак или заранее рассчитанная третья координата представления; из одного плоского изображения получить её нельзя.',source:'Авторский учебный TARGET эпизода 13; это не данные статьи.'},
  {q:'Почему оси на экране не выглядят взаимно перпендикулярными?',a:'Перпендикулярны направления в трёхмерном пространстве. Их двумерные проекции обычно не сохраняют все углы и длины. Один проектор используется для сетки, осей, точки, тени и направляющей. Числа следует вычислять из исходных координат.',source:'Геометрия ортографической проекции; K.project3D.'}
 ],build(ctx){
  const v=F.stage(ctx,'Плоскость становится опорой','Шаблон 13 · наклон → ось → координата','Учебная точка (1.5, 1.1, 1.35) · третья координата задана заранее');
  const stage=K.viewport(v.svg),state={tilt:0,axis:0,lift:0,phase:0};
  const segments=[];
  for(let i=-2;i<=4;i++){
   const x=i*.5;segments.push({id:'gx'+i,from:[x,-.5,0],to:[x,1.75,0],color:'var(--color-dim)',width:1});
  }
  for(let i=-1;i<=3;i++){
   const y=i*.5;segments.push({id:'gy'+i,from:[-1,y,0],to:[2,y,0],color:'var(--color-dim)',width:1});
  }
  segments.push(
   {id:'x-axis',from:[-.9,0,0],to:[2.15,0,0],color:C.blue,width:2.5,arrow:true},
   {id:'y-axis',from:[0,-.45,0],to:[0,1.9,0],color:C.teal,width:2.5,arrow:true},
   {id:'z-axis',from:ORIGIN,to:ORIGIN,color:C.red,width:2.5,arrow:true,opacity:0},
   {id:'shadow-arrow',from:ORIGIN,to:BASE,color:'var(--color-muted)',width:2,arrow:true,opacity:0},
   {id:'lift-line',from:BASE,to:BASE,color:C.gold,width:1.6,dash:'5 5',opacity:0},
   {id:'vector',from:ORIGIN,to:BASE,color:C.gold,width:4,arrow:true});
  const space=K.spatialScene(stage,{camera:{cx:400,cy:430,scale:128},segments,
   polygons:[{id:'floor',vertices:[[-1,-.5,0],[2,-.5,0],[2,1.75,0],[-1,1.75,0]],color:C.blue,opacity:.055}],
   points:[{id:'shadow',xyz:BASE,color:'var(--color-muted)',r:5,opacity:0},{id:'tip',xyz:BASE,color:C.gold,r:7}],
   labels:[{id:'x-label',xyz:[2.15,0,0],text:'x',color:C.blue,size:27,dx:22,dy:7},
    {id:'y-label',xyz:[0,1.9,0],text:'y',color:C.teal,size:27,dx:0,dy:-18},
    {id:'z-label',xyz:[0,0,1.9],text:'z',color:C.red,size:27,dx:-22,dy:-5,opacity:0}]});
  const heading=F.label(stage,1000,292,'',30,C.white);
  const detail=F.label(stage,1000,345,'',25,C.grey);
  const detail2=F.label(stage,1000,392,'',25,C.gold);
  const projection=F.label(stage,640,185,'Сначала видны только x и y',27,C.white);
  let driver,cameraDriver;
  const slider=T.control(v.root,'Наклон плоскости',0,1,0,.01,value=>cameraDriver.set({tilt:value}),250,552,380);
  function paint(){
   const tip=[TARGET[0],TARGET[1],TARGET[2]*state.lift];
   space.setCamera({yaw:-30*state.tilt,pitch:-62*state.tilt});
   space.setSegment('z-axis',ORIGIN,[0,0,1.9*state.axis]).setOpacity('z-axis',state.axis);
   space.setOpacity('z-label',F.clamp((state.axis-.7)/.3));
   space.setSegment('vector',ORIGIN,tip).setPoint('tip',tip).setSegment('lift-line',BASE,tip);
   space.setOpacity('shadow',state.lift).setOpacity('shadow-arrow',.65*state.lift).setOpacity('lift-line',state.lift);
   slider.input.value=state.tilt;slider.output.textContent=Math.round(state.tilt*100)+'%';
   Object.assign(v.root.dataset,{tilt:String(state.tilt),axis:String(state.axis),lift:String(state.lift),target:JSON.stringify(TARGET),coordinateMode:'dimension-reveal'});
   heading.textContent=state.phase<2?'Знакомая плоскость':state.phase<3?'Новое направление':'Точка над плоскостью';
   detail.textContent=state.phase<2?'Координаты не меняются':state.phase<3?'То же начало координат':'Внизу осталась проекция';
   detail2.textContent=state.phase<2?'Меняется только вид':state.phase<3?'Третья ось — z':'Связь видна по пунктиру';
   projection.textContent=state.phase<2?'Сначала видны только x и y':state.phase<3?'Останавливаем камеру. Вводим ось z.':'Раскрываем заданную координату z';
   if(state.phase===0)v.caption('Две координаты задают точку на плоскости. Начнём с этого знакомого вида.');
   else if(state.phase===1)v.caption('Наклоняем ту же плоскость. Стрелка и точка пока остаются на ней.');
   else if(state.phase===2)v.caption('От общего начала вырастает ось z. Это отдельное направление.');
   else if(state.tilt<.02)v.caption('Сверху точка и её проекция совпали на экране. Координата z сохранилась.');
   else v.caption('Точка поднимается над своей проекцией. Мы раскрываем заранее заданное значение.');
  }
  // Camera input can interrupt the camera, but must not truncate a z reveal.
  driver=F.driver(state,paint);cameraDriver=F.driver(state,paint);
  ctx.onDispose(()=>{driver.dispose();cameraDriver.dispose();});paint();
  ctx.step(()=>{driver.set({phase:1});return cameraDriver.to({tilt:1},{duration:2200});});
  ctx.step(()=>{driver.set({phase:2});return driver.to({axis:1},{duration:1050});});
  ctx.step(()=>{driver.set({phase:3});return driver.to({lift:1},{duration:2100});});
  return v.root;
 }});
})();
