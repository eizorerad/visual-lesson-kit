/* Original CITE-seq teaching schematic. Fixed surface coordinates; no molecular dynamics. */
(function(){
'use strict';
Bio3D.scene({
 id:'surface',
 title:['От белковой мишени к общему адресу','From protein target to shared address'],
 chapter:['Мечение и совместный захват','Labelling and co-capture'],
 notes:[
  ['Фиолетовые участки обозначают белки на поверхности клетки. Золотые объекты — антитела с ДНК-меткой. Рельеф вдохновлён микрофотографиями лимфоцитов: микроворсинки — выросты мембраны, а не отдельные белки. Это один пример клеточной поверхности. Цвета, положения, число и размеры условны; антитела и ДНК увеличены. Это авторская объёмная иллюстрация, а не атомная структура или расчёт молекулярного движения. Антитела состоят из объёмных белковых доменов с общим освещением и перекрытиями; это условная геометрия, а не атомная модель. Гликаны опущены.','Purple sites denote cell-surface proteins. Gold objects are antibodies carrying DNA tags. The relief is inspired by lymphocyte micrographs: microvilli are membrane projections, not separate proteins. This is one example of a cell surface. Colours, positions, counts and sizes are illustrative; antibodies and DNA are enlarged. This original volumetric illustration is not an atomic structure or a molecular-motion calculation. Antibodies consist of three-dimensional protein domains with shared lighting and occlusion; the geometry is illustrative, not atomic. Glycans are omitted.'],
  ['Антитело связывается с распознаваемым эпитопом поверхностного белка. Его олигонуклеотид несёт штрихкод, определяющий антитело, и участок poly(A). Здесь все показанные антитела условно распознают один тип мишени; число значков не измеряет количество белка. Связывающий конец Fab обращён к мишени. Одна ДНК-нить и место её крепления показаны условно: химия конъюгации, место и число меток могут различаться.','An antibody binds a recognised epitope on a surface protein. Its oligonucleotide carries an antibody-identifying barcode and a poly(A) tract. Here the illustrated antibodies recognise one schematic target type; the number of icons is not a protein-abundance measurement. A Fab binding tip faces the target. The single DNA strand and its attachment site are schematic: conjugation chemistry, attachment sites and tag stoichiometry can vary.'],
  ['Поворот показывает те же неподвижные участки с другой стороны. Объекты на дальней стороне скрываются за непрозрачной клеткой; у края они могут выступать за её контур. Поворачивается клетка вместе со связанными антителами. Свободные антитела остаются в окружающем растворе и движутся независимо; новые белки или связи не возникают. Ползунок позволяет самостоятельно осмотреть поверхность и прерывает текущий поворот.','Rotation reveals the same fixed sites from another viewpoint. Objects on the far side are occluded by the opaque cell; near the edge they may project beyond its contour. The cell turns together with its bound antibodies. Free antibodies remain in the surrounding medium and move independently; no new proteins or bonds appear. The slider lets you inspect the surface and interrupts the current camera rotation.'],
  ['Приближение показывает то же связанное антитело. Его два плеча Fab распознают эпитопы; здесь с мишенью соприкасается один связывающий конец. Гибкий шарнир соединяет плечи с участком Fc. ДНК-метка содержит штрихкод антитела и хвост poly(A); место её крепления показано условно. Масштаб увеличен для объяснения строения.','The close-up shows the same bound antibody. Its two Fab arms recognise epitopes; here one binding tip contacts the target. A flexible hinge connects the arms with the Fc region. The DNA tag contains an antibody barcode and a poly(A) tail; its attachment site is schematic. The view is enlarged to explain the architecture.'],
  ['Возвращаемся к общей поверхности клетки. Приближение не изменяло антитело и не отрывало его от мишени: менялись только ракурс и масштаб изображения. Несвязавшиеся антитела ещё присутствуют вокруг клетки; следующий шаг показывает их удаление при отмывке.','We return to the whole-cell view. Zooming did not change the antibody or detach it from its target: only the viewing angle and image scale changed. Unbound antibodies are still present around the cell; the next step shows their removal during washing.'],
  ['Отмывка удаляет несвязавшиеся меченые антитела и уменьшает фон; она не гарантирует полного отсутствия фоновых ДНК-меток. В объёмной сцене поток уносит свободные антитела; связанные метки остаются у клетки. Движение потока и молекул схематично, гидродинамика не рассчитывается. Штрихкод клетки и UMI уже находятся в праймерах бусины. После захвата они войдут в ДНК-продукты при последующем синтезе.','Washing removes unbound tagged antibodies and reduces background; it does not guarantee that all background DNA tags disappear. In the three-dimensional scene, flow carries away free antibodies while bound tags remain with the cell. The flow and molecular trajectories are schematic, not a hydrodynamic simulation. The cell barcode and UMI already exist in the bead primers. Following capture, they become part of DNA products during subsequent synthesis.']
 ,...Bio3D.CaptureStage.notes],
 qa:[
  ['Содержит ли антитело штрихкод клетки?','Does the antibody already carry a cell barcode?',
   'Нет. До разделения по клеткам его ДНК-метка сообщает, какое антитело использовано. Штрихкод клетки и UMI содержатся в праймере бусины и входят в продукты при последующем синтезе. Общий клеточный код позволяет связать РНК и метки антител с одной клеткой.',
   'No. Before cells are partitioned, its DNA tag identifies the antibody. The cell barcode and UMI are in the bead primer and become part of products during subsequent synthesis. The shared cell barcode allows RNA and antibody tags to be assigned to the same cell.'],
  ['Появляются ли при повороте новые белки?','Does rotating the view create new proteins?',
   'Нет. Все координаты белков фиксированы. Поворот клетки меняет проекцию и перекрытия связанных объектов. Свободные антитела в растворе не прикреплены к клетке и не следуют за её вращением.',
   'No. All protein coordinates are fixed. Cell rotation changes the projection and overlap of bound objects. Free antibodies in the medium are not attached and do not follow cell rotation.'],
  ['Зачем отмывать клетку после мечения?','Why wash after antibody labelling?',
   'Несвязавшиеся ДНК-меченые антитела могут дать фоновый сигнал. Отмывка уменьшает их количество, но не делает эксперимент автоматически свободным от фона.',
   'Unbound DNA-tagged antibodies can contribute background signal. Washing reduces their abundance, but does not automatically make the experiment background-free.'],
  ['В каждой капле ровно одна клетка?', 'Does every droplet contain exactly one cell?',
   'Нет. Показан выбранный случай: одна клетка и одна бусина. В опыте бывают пустые капли и doublets — капли с несколькими клетками.',
   'No. This is a selected one-cell/one-bead event. Experiments also produce empty droplets and doublets containing multiple cells.'],
  ['Захват уже дописывает код A в РНК?', 'Does capture append barcode A to RNA?',
   'Нет. Код уже есть в праймерах бусины. На показанном этапе хвост poly(A) связывается с oligo-dT праймера. Клеточный код и UMI входят в ДНК-продукты при последующем синтезе; в этом варианте Drop-seq — после разрушения эмульсии и извлечения бусин.',
   'No. The barcode already exists in bead primers. At this stage, a template poly(A) tail hybridizes to a primer oligo-dT segment. The cell barcode and UMI become part of DNA products during later synthesis, after emulsion breakage and bead recovery in this Drop-seq variant.']
 ],
 build(ctx){
  const v=Bio3D.stage(ctx,'Как белок получает ДНК-метку?','How does a protein get a DNA tag?');
  const svg=v.svg,s=D.dom.s;
  // One driver owns cell orientation and molecules, so a wash frame has a single draw.
  const view={yaw:-28,pitch:-43,zoom:0,bind:0,wash:0,medium:0,encounter:0,encap:0,lysis:0,capture:0,inspection:0};
  const center={cx:620,cy:361,scale:151},frame={x:65,y:147,width:1150,height:427};
  const captions=[
   ['Меченые антитела находятся вокруг клетки.','Tagged antibodies surround the cell.'],
   ['Связывание оставляет ДНК-метку рядом с её белковой мишенью.','Binding keeps a DNA tag beside its protein target.'],
   ['Другой ракурс — те же белки, антитела и ДНК-метки.','A different viewpoint: the same proteins, antibodies and DNA tags.'],
   ['То же связанное антитело: теперь рассмотрим его строение.','The same bound antibody: now explore its structure.'],
   ['Общий вид: рядом с клеткой ещё остаются свободные антитела.','Whole-cell view: free antibodies still remain around the cell.'],
   ['Отмывка удаляет свободные антитела; связанные метки остаются.','Washing removes free antibodies; bound tags remain.']
  ,...Bio3D.CaptureStage.captions].map(c=>Bio3D.str(...c));
  const point=(n,t,r,q=0)=>n.map((x,i)=>x*r+t[i]*q);
  const anchors=(n,t,shift=0)=>[[1.065,0],[1.19,.09],[1.105,.24],[1.36,.055],[1.39,.1],[1.37,.16],[1.36,.26],[1.37,.35]].map(([r,q])=>point(n,t,r+shift,q));
  const sites=Array.from({length:12},(_,i)=>{
   const z=1-2*(i+.5)/12,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-z*z);
   const n=[r*Math.cos(a),r*Math.sin(a),z],t=[-Math.sin(a),Math.cos(a),0];
   return {id:'surface-'+i,n,t,normal:n,space:'cell',anchors:anchors(n,t,V3.CellSurface.surfaceRadius(n)-1),receptor:true,detail:i===2?'full':'compact'};
  });
  // The medium uses a fixed laboratory frame. Cell rotation never changes
  // these locations or orientations; only independent drift/washing moves them.
  const freeCenters=[
   [-2.45,.45,.30],[-2.12,-.60,.60],[-3.05,-.12,-.25],
   [2.30,.62,.15],[2.85,-.35,.55],[2.10,-.72,-.30],
   [3.15,.08,-.50],[-2.85,.92,.20]
  ];
  const free=freeCenters.map((c,i)=>{
   const z=.82-1.64*(i+.5)/8,a=i*2.399963+.65,r=Math.sqrt(1-z*z);
   const n=[r*Math.cos(a),r*Math.sin(a),z],t=[-Math.sin(a),Math.cos(a),0],shape=anchors(n,t),h=shape[1];
   return {id:'free-'+i,n,t,normal:n,space:'environment',exitSide:Math.sign(c[0]),anchors:shape.map(p=>p.map((v,j)=>c[j]+(v-h[j])*.8)),receptor:false,detail:'compact'};
  });
  const initialAngle=-28*Math.PI/180,initialPitch=-43*Math.PI/180;
  sites.forEach((site,i)=>{
   const x=[-2.6,-2.05,2.05,2.6][i%4],y=[.7,0,-.7][Math.floor(i/4)],z=.6;
   const ca=Math.cos(initialAngle),sa=Math.sin(initialAngle),cb=Math.cos(initialPitch),sb=Math.sin(initialPitch);
   const start=[ca*x+cb*sa*y+sb*sa*z,-sa*x+cb*ca*y+sb*ca*z,-sb*y+cb*z];
   site.startOffset=start.map((v,j)=>v-site.anchors[1][j]);
  });
  const captureModel=V3.CaptureMesh.create();
  const molecules=[...sites,...free,captureModel.bead,...captureModel.rnas,captureModel.droplet],poses=molecules.map(()=>({offset:[0,0,0],opacity:1}));
  const world=F.group(svg),defs=s('defs',{}),clip=s('clipPath',{id:'cite-surface-inspection-clip'}),clipRect=s('rect',frame);
  clip.append(clipRect);defs.append(clip);svg.append(defs);world.setAttribute('clip-path','url(#cite-surface-inspection-clip)');
  const cell=V3.CellSurface.create(world,center,{frame,molecules,environmentView:{yaw:0,pitch:0}});ctx.onDispose(cell.dispose);
  const captureStage=Bio3D.CaptureStage.create(svg,world,{model:captureModel,sites,poses,center,root:v.root});
  Bio3D.text(svg,78,578,570,27,'Не в масштабе · молекулы увеличены','Not to scale · molecules enlarged',17,C.grey,'left');

  // No separate antibody inset: all leaders refer to the molecule in the model.
  const annotation=F.group(svg);annotation.dataset.surfaceAnnotation='';
  const label=(id,ru,en,x,y,w,color,size=23)=>{
   const line=Bio3D.path(annotation,'',C.grey,1.25),dot=s('circle',{r:2.5,fill:color});annotation.append(dot);
   const text=Bio3D.text(annotation,x,y,w,40,ru,en,size,color,'left');
   line.setAttribute('stroke-opacity','.7');line.dataset.partLeader=id;dot.dataset.partAnchor=id;
   return {id,line,dot,text,x,y,cy:y+20};
  };
  const callouts=[
   label('polyA','Хвост poly(A)','poly(A) tail',750,163,360,C.teal),
   label('barcode','Штрихкод антитела','Antibody barcode',810,238,390,C.teal),
   label('Fc','Fc','Fc',810,322,300,C.gold,27),
   label('hinge','Гибкий шарнир','Flexible hinge',810,394,390,C.gold),
   label('Fab','Плечо Fab','Fab arm',810,466,390,C.gold),
   label('binding','Связывающий участок','Antigen-binding site',720,540,480,C.gold,22)
  ];
  const otherFab=label('Fab-other','Fab','Fab',378,274,100,C.gold,26);
  let slider,lastClip='',washGuided=false,captureStarted=false;
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  function paint(){
   const camera={...center,yaw:view.yaw,pitch:view.pitch},project=p=>K.project3D(p,camera);
   sites.forEach((site,i)=>{
    for(let j=0;j<3;j++)poses[i].offset[j]=site.startOffset[j]*(1-view.bind);
    poses[i].opacity=1;
   });
   free.forEach((m,i)=>{
    const progress=F.phase(view.wash,i*.018,.87+i*.018);
    const phase=view.medium*1.6+i*1.73,drift=[.045*Math.sin(phase),.05*Math.cos(phase*.8),.06*Math.sin(phase*.65)];
    // Outward wash paths remain clear of the cell instead of crossing through it.
    const offset=poses[sites.length+i].offset;
    offset[0]=drift[0]+m.exitSide*progress*4.8;
    offset[1]=drift[1]+Math.sin(progress*Math.PI)*.12*(i%2?1:-1);
    offset[2]=drift[2]+progress*.30*(i%2?1:-1);
    poses[sites.length+i].opacity=(1-F.phase(view.zoom,0,.16))*(1-F.phase(progress,.8,1));
   });
   const base=sites[2].anchors.map(project),magnification=1+4.25*view.zoom;
   const panX=view.zoom*(570-5.25*base[1].x),panY=view.zoom*(390-5.25*base[1].y);
   const captureCamera=captureStage.paint(view);
   cell.paint({...view,magnification,panX,panY,...(view.encounter>0?captureCamera:{cellDissolve:0,cellOpacity:1}),moleculePoses:poses});
   const width=String(1150-460*view.zoom);if(width!==lastClip){clipRect.setAttribute('width',width);lastClip=width;}
   const p=base.map(p=>({x:p.x*magnification+panX,y:p.y*magnification+panY}));
   const endpoints=[lerp(p[6],p[7],.65),lerp(p[5],p[6],.5),lerp(p[1],p[3],.66),p[1],lerp(p[1],p[0],.52),p[0]];
   callouts.forEach((a,i)=>{
    const q=endpoints[i],elbow=a.x-45;
    a.line.setAttribute('d',`M${q.x} ${q.y} L${elbow} ${a.cy} H${a.x-15}`);
    a.dot.setAttribute('cx',q.x);a.dot.setAttribute('cy',q.y);
   });
   const second=lerp(p[1],p[2],.55);
   otherFab.line.setAttribute('d',`M${second.x} ${second.y} L445 324 V317`);
   otherFab.dot.setAttribute('cx',second.x);otherFab.dot.setAttribute('cy',second.y);
   F.opacity(annotation,F.phase(view.zoom,.94,1));
   if(slider){
    const hidden=view.zoom>.001||captureStarted||view.encounter>.001;slider.el.style.visibility=hidden?'hidden':'';slider.input.disabled=hidden||washGuided||view.bind<1;slider.el.setAttribute('aria-hidden',String(hidden));
    const degrees=Math.round(view.yaw)+'°';slider.input.value=String(Math.round(view.yaw));
    if(slider.output.textContent!==degrees){slider.output.textContent=degrees;slider.input.setAttribute('aria-valuetext',degrees);}
   }
   v.root.dataset.surfaceYaw=String(view.yaw);v.root.dataset.surfaceBind=String(view.bind);v.root.dataset.surfaceWash=String(view.wash);
   v.root.dataset.surfaceZoom=String(view.zoom);v.root.dataset.surfaceFocus='2';
   v.root.dataset.freeMoleculesVisible=String(poses.slice(sites.length,sites.length+free.length).filter(p=>p.opacity>.05).length);
  }
  const motion=F.driver(view,paint);ctx.onDispose(motion.dispose);
  slider=Bio3D.control(ctx,v,'Повернуть клетку','Rotate the cell',-180,180,view.yaw,value=>{if(!washGuided&&!captureStarted)motion.set({yaw:value});},90,535,320);
  v.caption(captions[0]);paint();
  ctx.step(()=>{v.caption(captions[1]);return motion.to({bind:1,medium:1},{duration:2600});});
  ctx.step(()=>{v.caption(captions[2]);return motion.to({yaw:106,pitch:-48,medium:2},{duration:3100});});
  ctx.step(()=>{v.caption(captions[3]);return motion.to({yaw:106,pitch:-48,zoom:1,medium:2.3},{duration:2800});});
  ctx.step(()=>{v.caption(captions[4]);return motion.to({zoom:0,medium:2.6},{duration:2000});});
  ctx.step(async()=>{washGuided=true;paint();v.caption(captions[5]);try{await motion.to({wash:1,yaw:146,pitch:-38,medium:3.6},{duration:4300});}finally{washGuided=false;paint();}});
  ctx.step(()=>{captureStarted=true;paint();v.title(Bio3D.str('Одна клетка — общий адрес РНК и ADT','One cell — a shared RNA and ADT address'));v.caption(captions[6]);return motion.to({encounter:1},{duration:3200});});
  ctx.step(()=>{v.caption(captions[7]);return motion.to({encap:1},{duration:2400});});
  ctx.step(()=>{v.caption(captions[8]);return motion.to({lysis:1},{duration:4000});});
  ctx.step(()=>{v.caption(captions[9]);return motion.to({capture:1},{duration:4400});});
  ctx.step(()=>{v.caption(captions[10]);return motion.to({inspection:1},{duration:3000});});
  ctx.step(()=>{v.caption(captions[11]);return motion.to({inspection:2},{duration:2600});});
  return v.root;
 }
});
})();
