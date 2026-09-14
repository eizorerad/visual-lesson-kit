/* Worked compositions, not an obligatory outline for future lessons. */
(function(){
'use strict';
const tr=(ru,en)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
function text(p,id,x,y,w,h,ru,en,size=25,color=C.white){return L.textBox(p,{id,x,y,width:w,height:h,text:tr(ru,en),size,color,padding:5,align:'center',valign:'middle'});}
function register(id,title,notes,qa,build){
 const sources={ 'geo-circle':['OpenStax: Unit circle','https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-3-unit-circle'], 'geo-projection':['PCA reference','https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html'], 'geo-linear-map':['MIT: Area, volume and determinants','https://ocw.mit.edu/ans7870/18/18.013a/textbook/chapter04/section02.html'] };
 const source=sources[id];
 D.i18n.pack('en',{notes:{[id]:notes.map(p=>F.note(p[1]))},qa:{[id]:qa.map(p=>({q:p[2],a:F.note(p[3]),source:source[0],url:source[1]}))}});
 D.deck.register({id,title:tr(...title),chapter:tr('Геометрия как объяснение','Geometry as explanation'),notes:notes.map(p=>F.note(p[0])),qa:qa.map(p=>({q:p[0],a:F.note(p[1]),source:source[0],url:source[1]})),build});
}
register('geo-circle',['Вращение становится волной','Rotation becomes a wave'],[
 ['Радиус равен единице. Его конец имеет координаты (cos θ, sin θ). Справа та же вертикальная координата откладывается против угла, измеренного в радианах. Это две картинки одной вычисленной величины.','The radius is one. Its endpoint has coordinates (cos θ, sin θ). On the right, the same vertical coordinate is plotted against angle in radians. These are two views of one calculated value.'],
 ['Угол достигает π/3. Горизонтальная компонента равна 1/2, вертикальная — √3/2. Радиус поворачивается по окружности, а не движется по хорде между двумя кадрами. Подвигайте ползунок и проследите за связью высот.','At π/3, the horizontal component is 1/2 and the vertical component is √3/2. The radius rotates around the circle rather than moving along a chord between frames. Move the slider and follow the linked heights.'],
 ['В третьей четверти обе компоненты отрицательны. Длина радиуса остаётся равной единице, поэтому cos² θ + sin² θ = 1. Знак сообщает направление, а не отрицательную длину.','In the third quadrant, both components are negative. The radius remains one, so cos² θ + sin² θ = 1. The sign reports direction, not a negative length.'],
 ['Полный оборот равен 2π радиан. Высота возвращается к нулю; график хранит пройденные значения. Такой приём полезен для циклов, фаз и колебаний, но здесь нет измеренных биологических периодов.','A complete turn is 2π radians. Height returns to zero, while the trace retains the values traversed. This operation helps explain cycles, phases and oscillation; no measured biological period is supplied here.']
 ],[
 ['Почему график синуса проходит ниже оси?','Вертикальная координата точки отрицательна ниже центра окружности. Длина радиуса при этом остаётся положительной.','Why does the sine graph go below the axis?','The point’s vertical coordinate is negative below the circle’s center. Radius length remains positive.'],
 ['Это модель биологического ритма?','Пока нет. Это геометрическая связь угла и проекции. Для биологического ритма нужны измерения, единицы времени и модель.','Is this a biological rhythm model?','Not yet. This is the geometric relation between angle and projection. A biological rhythm requires measurements, time units and a model.']
 ],ctx=>{
 const v=F.stage(ctx,tr('Вращение становится волной','Rotation becomes a wave'),'',tr('Учебная геометрия · единичная окружность','Illustrative geometry · unit circle')),p=K.viewport(v.svg),state={angle:0};
 text(p,'circle-heading',100,160,480,60,'Один радиус, две компоненты','One radius, two components',28);
 text(p,'wave-heading',670,160,470,60,'Та же высота на графике','The same height on a graph',28);
 const view=K.unitCircleView(p,{cx:320,cy:360,radius:130,traceFrame:{x:670,y:230,width:470,height:260}});
 const readout=text(p,'circle-values',110,535,490,58,'','',24),control=T.control(v.root,tr('Угол θ, радианы','Angle θ, radians'),0,2*Math.PI,0,.01,value=>driver.set({angle:value}),735,550,410);
 function paint(){view.setAngle(state.angle);const q=view.snapshot(),formatted=x=>(Math.abs(x)<.0005?0:x).toFixed(2);readout.setText('cos θ = '+formatted(q.cos)+' · sin θ = '+formatted(q.sin));control.input.value=state.angle;control.output.textContent=state.angle.toFixed(2);v.root.dataset.operation='angle-to-height';v.caption(tr('Угол задаёт координаты. Справа сохраняется след высоты.','Angle determines the coordinates. The trace retains the height.'));}
 const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();
 v.caption(tr('Следите за одной точкой: поворот задаёт её высоту.','Follow one point: rotation determines its height.'));
 [[Math.PI/3,'Высота точки равна sin θ. Её след появляется справа.','The point’s height is sin θ. Its trace appears on the right.'],[4*Math.PI/3,'Направление меняется: обе компоненты могут быть отрицательными.','Direction changes: both components can be negative.'],[2*Math.PI,'Оборот завершён. Вращение и волна описывают одну величину.','The turn is complete. Rotation and the wave describe one quantity.']].forEach(([angle,ru,en])=>ctx.step(()=>{v.caption(tr(ru,en));return driver.to({angle},{duration:2200});}));return v.root;
 });

const CLOUD=[[-2,-1.2],[-1,0],[-.4,-.4],[.4,.6],[1,1.1],[2,1.4]].map((xy,i)=>({id:'G'+(i+1),xy}));
register('geo-projection',['Проекция сохраняет не всё','A projection cannot keep everything'],[
 ['Шесть условных наблюдений имеют два заданных признака. Мы вычли среднее каждого признака: центр облака находится в начале координат. Это центрирование, а не приведение признаков к одинаковой дисперсии.','Six illustrative observations have two supplied features. Each feature mean has been subtracted, placing the cloud center at the origin. This is centering, not scaling the features to equal variance.'],
 ['Каждая точка движется к ортогональной проекции на выбранную прямую. Пустой кружок сохраняет исходное наблюдение, пунктир показывает остаток. Новых наблюдений не возникает; проекция теряет поперечную компоненту.','Each point moves to its orthogonal projection on the chosen line. A hollow marker retains the original observation, and the dashed segment shows its residual. No observations are added; projection loses the perpendicular component.'],
 ['Меняем направление оси, сохраняя исходные значения и масштаб. Дисперсия координат вдоль оси и сумма квадратов остатков меняются согласованно. Ползунок позволяет проверить другие направления.','Change the axis direction while preserving source values and scale. Variance along the axis and squared residuals change together. The slider lets you try other directions.'],
 ['Для этих центрированных двумерных данных первая главная компонента максимизирует дисперсию проекций. Это одновременно минимизирует сумму квадратов остатков при одном ортогональном направлении. Здесь показан точный расчёт 2D PCA; UMAP решает другую задачу. При одинаковых собственных значениях единственная лучшая ось не определена.','For these centered two-dimensional data, the first principal component maximizes projected variance. It also minimizes squared residuals for one orthogonal direction. This is an exact 2D PCA calculation; UMAP solves a different problem. Equal eigenvalues leave no unique best axis.']
 ],[
 ['Движущиеся точки — новые измерения?','Нет. Это изображения прежних измерений после проекции. Их пустые исходные маркеры сохраняются.','Are moving points new measurements?','No. They represent the same measurements after projection. Their original hollow markers remain.'],
 ['PCA автоматически выравнивает единицы признаков?','Нет. В этом примере вычитаются средние, но масштабы признаков не меняются. Решение о стандартизации зависит от смысла данных.','Does PCA automatically equalize feature units?','No. This example subtracts means but preserves feature scales. Standardization is a separate, context-dependent decision.']
 ],ctx=>{
 const v=F.stage(ctx,tr('Проекция сохраняет не всё','A projection cannot keep everything'),'',tr('Учебные точки · центрирование и ортогональная проекция','Illustrative points · centering and orthogonal projection')),p=K.viewport(v.svg),state={angle:0,progress:0};
 const view=K.projectionView(p,{records:CLOUD,cx:430,cy:390,scale:64,extent:2.65});
 text(p,'projection-units',120,160,610,55,'Два центрированных признака · условные единицы','Two centered features · illustrative units',23);
 text(p,'projection-key',820,195,335,130,'Пустые точки — исходные данные. Пунктир — остаток.','Hollow points are source data. Dashes show residuals.',26);
 text(p,'projection-score-label',815,335,340,60,'Сохранённая дисперсия','Variance retained',25);
 const ratio=text(p,'projection-ratio',820,400,330,70,'','',39,C.gold);
 const control=T.control(v.root,tr('Направление оси, градусы','Axis direction, degrees'),-90,90,0,.1,value=>driver.set({angle:value*Math.PI/180}),780,545,380);
 function paint(){view.setState(state);const q=view.snapshot();ratio.setText(q.explainedFraction===null?'—':(100*q.explainedFraction).toFixed(1)+'%');control.input.value=state.angle*180/Math.PI;control.output.textContent=(state.angle*180/Math.PI).toFixed(1)+'°';v.root.dataset.operation='orthogonal-projection';if(state.progress>0)v.caption(Math.abs(Math.cos(state.angle-view.pca.angle))>1-1e-10?tr('Первая главная компонента сохраняет максимум дисперсии.','The first principal component retains the most variance.'):tr('Выбранное направление сохраняет часть дисперсии. Сравните другие углы.','The selected direction retains some variance. Compare other angles.'));}
 const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Можно ли сохранить облако на одной прямой?','Can one line preserve the whole cloud?'));
 ctx.step(()=>{v.caption(tr('Отделяем проекцию от исходной точки. Пунктир показывает потерю.','Separate the projection from its source. Dashes expose the loss.'));return driver.to({progress:1},{duration:2000});});
 ctx.step(()=>{v.caption(tr('Поворачиваем направление, сохраняя исходные точки.','Rotate the direction while keeping the source points fixed.'));return driver.to({angle:-Math.PI/4},{duration:2200});});
 ctx.step(()=>{v.caption(tr('Первая главная компонента сохраняет максимум дисперсии.','The first principal component retains the most variance.'));return driver.to({angle:view.pca.angle},{duration:2400});});return v.root;
 });

register('geo-linear-map',['Матрица меняет сетку','A matrix transforms the grid'],[
 ['Сначала два единичных направления задают квадрат площадью 1. Матрица описывает, куда переходят эти два направления. Точки на сетке получают координаты из одного и того же отображения.','Two unit directions initially define a square of area 1. A matrix specifies where these directions go. Every grid point follows the same map.'],
 ['Сдвиг наклоняет квадрат в параллелограмм, сохраняя площадь. Здесь A=[[1,1],[0,1]]: первый базисный вектор остаётся на месте, второй получает горизонтальную компоненту. Это изменение координат объектов, не поворот камеры.','A shear turns the square into a parallelogram while preserving area. Here A=[[1,1],[0,1]]: the first basis vector stays put and the second gains a horizontal component. This changes object coordinates; it is not camera rotation.'],
 ['Растяжение по x добавляется к сдвигу: A=[[2,1],[0,1]]. Площадь становится 2. Её значение вычисляется из матрицы каждого кадра, а не независимо интерполируется между двумя подписями.','An x stretch is added to the shear: A=[[2,1],[0,1]]. Area becomes 2. The value is calculated from each frame’s matrix, not separately interpolated between two labels.'],
 ['Отображение A=[[1,0],[0,0]] складывает плоскость на прямую. Определитель и площадь равны нулю, поэтому обратное восстановление второй координаты невозможно. Отражение — другая операция: отрицательный определитель меняет ориентацию, но площадь берётся по модулю.','The map A=[[1,0],[0,0]] collapses the plane onto a line. Determinant and area are zero, so the second coordinate cannot be recovered. Reflection is different: a negative determinant reverses orientation, while area uses its absolute value.']
 ],[
 ['Почему отрицательный определитель не означает отрицательную площадь?','Знак определителя хранит ориентацию. Множитель обычной площади равен абсолютному значению определителя.','Why does a negative determinant not mean negative area?','The determinant sign records orientation. Ordinary area scales by the absolute determinant.'],
 ['Сжатие в линию можно обратить?','Не для произвольной исходной точки: разные вторые координаты дают один результат. Нулевая площадь отмечает эту потерю информации.','Can collapse onto a line be reversed?','Not for an arbitrary original point: distinct second coordinates produce the same result. Zero area marks this loss of information.']
 ],ctx=>{
 const v=F.stage(ctx,tr('Матрица меняет сетку','A matrix transforms the grid'),'',tr('Учебная геометрия · линейное отображение','Illustrative geometry · linear map')),p=K.viewport(v.svg),state={shear:0,stretch:1,height:1};
 const view=K.linearMapView(p,{matrix:[[1,0],[0,1]],cx:430,cy:410,scale:95,extent:3.1,progress:1});
 text(p,'map-heading',110,162,600,55,'Сетка следует за двумя направлениями','The grid follows two basis directions',27);
 text(p,'map-area-title',815,205,335,100,'Площадь образа квадрата','Area of the mapped square',27);
 const area=text(p,'map-area',830,315,310,75,'','',45,C.gold),matrix=text(p,'map-matrix',805,395,355,92,'','',26);
 const control=T.control(v.root,tr('Высота второго направления','Height of the second direction'),-1,1,1,.01,value=>driver.set({height:value}),755,550,400);
 function paint(){view.setMatrix([[state.stretch,state.shear],[0,state.height]]);const q=view.snapshot();area.setText(q.area.toFixed(2));matrix.setText('[ '+state.stretch.toFixed(1)+'   '+state.shear.toFixed(1)+' ]\n[ 0.0   '+state.height.toFixed(1)+' ]');control.input.value=state.height;control.output.textContent=state.height.toFixed(2);v.root.dataset.operation='linear-map-area';v.caption(q.orientation===0?tr('Площадь равна нулю: второе направление потеряно.','Area is zero: the second direction is lost.'):q.orientation<0?tr('Ориентация отражена. Площадь остаётся неотрицательной.','Orientation is reversed. Area remains nonnegative.'):tr('Площадь вычисляется из двух направлений на каждом кадре.','Area is calculated from the two directions at every frame.'));}
 const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Два направления задают весь рисунок.','Two directions determine the entire drawing.'));
 ctx.step(()=>{v.caption(tr('Возвращаем высоту 1 и наклоняем второе направление.','Return to height 1 and shear the second direction.'));return driver.to({shear:1,stretch:1,height:1},{duration:2000});});
 ctx.step(()=>{v.caption(tr('Растягиваем первое направление при единичной высоте.','Stretch the first direction at unit height.'));return driver.to({stretch:2,shear:1,height:1},{duration:2000});});
 ctx.step(()=>{v.caption(tr('Плоскость складывается в линию. Одна координата теряется.','The plane collapses onto a line. One coordinate is lost.'));return driver.to({height:0,shear:0,stretch:1},{duration:2300});});return v.root;
 });
})();
