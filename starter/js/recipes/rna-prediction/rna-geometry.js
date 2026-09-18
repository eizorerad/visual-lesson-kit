/* A deliberately schematic, articulated two-hairpin chain: fixed pairs, changing geometry. */
(function(){
'use strict';const R=RNA;
const SEQ=R.seq+'AAA'+R.seq,PAIRS=R.pairs.concat(R.pairs.map(([a,b])=>[a+16,b+16]));
const base=Array.from({length:13},()=>[0,0,0]);
for(let k=0;k<5;k++){const a=k*.56;base[k]=[-15*Math.cos(a),45-k*20,-15*Math.sin(a)];base[12-k]=[15*Math.cos(a),45-k*20,15*Math.sin(a)];}
base[5]=[-17,-58,-2];base[6]=[0,-71,0];base[7]=[17,-58,2];
function modulePoints(cx,angle,depth){const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),d=depth*Math.PI/180;return base.map(([x,y,z])=>{const yy=y*Math.cos(d)-z*Math.sin(d),zz=y*Math.sin(d)+z*Math.cos(d);return[cx+x*c-yy*s,x*s+yy*c,zz];});}
function geometry(turn){const a=modulePoints(-46,25,0),b=modulePoints(46,F.lerp(64,-25,turn),F.lerp(-20,0,turn));const start=a[12],end=b[0],join=[.25,.5,.75].map(t=>[F.lerp(start[0],end[0],t),F.lerp(start[1],end[1],t)+24*Math.sin(Math.PI*t),F.lerp(start[2],end[2],t)]);return a.concat(join,b);}
function project(p){const c=Math.cos(.26),s=Math.sin(.26);return[825+(p[0]*c+p[2]*s)*2.1,370+p[1]*2.1,-p[0]*s+p[2]*c];}
R.register({id:'rna-geometry',title:['Одни пары — разные расположения в 3D','The same pairs, different 3D arrangements'],
 status:['Две учебные шпильки · геометрия условна','Two toy hairpins · schematic geometry'],
 source:['Chu et al., 2009 · RNA junctions and helix orientation','https://pmc.ncbi.nlm.nih.gov/articles/PMC2779674/'],
 states:[
 ['Карта пар хранит партнёров, но не угол между двумя стеблями.','A pair map stores partners, but not the angle between two stems.','Даже правильная вторичная структура оставляет пространственную задачу. В новом учебном примере две шпильки GGACGAAACGUCC соединены тремя A: всего 29 позиций и 10 заданных пар. Цвета обозначают два стебля. Слева одна неизменная карта пар, справа её условная пространственная реализация. Размеры и углы не взяты из экспериментальной структуры; здесь не запускается предсказание 3D.','Even a correct secondary structure leaves a spatial problem to solve. In this new toy example two GGACGAAACGUCC hairpins are joined by three A residues: 29 positions and 10 supplied pairs in total. Colors identify the two stems. A fixed pair map is on the left; a schematic spatial realization is on the right. Dimensions and angles do not come from an experimental structure; no 3D predictor is run here.'],
 ['Меняем ориентацию второго стебля. Все десять пар сохраняются.','Change the second stem’s orientation. All ten pairs stay intact.','Стебель A остаётся неподвижным, стебель B поворачивается как жёсткий модуль, а условный соединитель меняет форму. Это демонстрация недоопределённости 3D по одним парам, не рассчитанная траектория молекулы и не набор равновероятных состояний. Реальный соединитель ограничивает доступные ориентации; геометрия и энергетика здесь не рассчитываются.','Stem A stays fixed, stem B rotates as a rigid module, and the schematic connector changes shape. This demonstrates that pairs alone underdetermine 3D; it is neither a calculated molecular trajectory nor a set of equally probable states. Real junctions constrain accessible orientations; geometry and energetics are not calculated here.'],
 ['Дальний контакт добавляет условие: два участка должны встретиться.','A long-range contact adds a condition: two regions must meet.','Золотая скобка выделяет сближенные петли как условный пример дополнительного пространственного ограничения. Она не означает новую каноническую пару или конкретную водородную связь. Дополнительные ограничения помогают сузить возможные пространственные расположения, но одной карты пар и одной такой скобки недостаточно для уникальной 3D-структуры. Предиктору нужны модель геометрии и взаимодействий, условия среды и независимая проверка результата. В известной тРНК 1EHZ пространственное расположение было задано экспериментальными координатами.','The gold bracket marks nearby loops as a schematic additional spatial constraint. It does not represent a new canonical pair or a specific hydrogen bond. Extra constraints help narrow the possible spatial arrangements, but a pair map and one such bracket do not specify a unique 3D structure. A predictor needs a model of geometry and interactions, environmental conditions, and independent validation of its result. For the known 1EHZ tRNA, the spatial arrangement was supplied by experimental coordinates.']
 ],qa:[{q:['Меняется ли вторичная структура при этом повороте?','Does secondary structure change during this rotation?'],a:['В этой учебной модели — нет: все 10 пар и порядок 29 позиций сохранены. Меняется взаимная ориентация двух стеблей.','In this toy model, no: all 10 pairs and the order of 29 positions persist. The relative orientation of the two stems changes.']},{q:['Можно ли сделать вывод о наиболее устойчивой форме?','Can this identify the most stable shape?'],a:['Нет. Для этого нужны дополнительные физические ограничения и энергии в заданных условиях. Схема показывает недостающую информацию, а не выбирает состояние.','No. That requires additional physical constraints and energies under specified conditions. The diagram exposes missing information; it does not choose a state.']}],
 build(ctx,v){const state={turn:0,contact:0};
 R.box(v.svg,80,151,347,43,'Неизменная карта пар','Fixed pair map',27,C.white);
 R.box(v.svg,500,151,708,43,'Меняется только расположение','Only the arrangement changes',27,C.white);
 const flatA=R.hairpinPoints(174,326,.53),flatB=R.hairpinPoints(337,326,.53),join=[[223,425],[255,442],[285,425]],flat=flatA.concat(join,flatB);
 const map=R.chain(v.svg,SEQ,flat,PAIRS,6,C.blue);map.nodes.forEach((n,i)=>{n.querySelector('text').setAttribute('opacity',0);n.querySelector('circle').setAttribute('stroke',i<13?C.blue:i<16?C.grey:C.teal);});map.set(flat,1);map.links.forEach((line,i)=>line.setAttribute('stroke',i<5?C.blue:C.teal));
 R.box(v.svg,95,221,142,35,'Стебель A','Stem A',23,C.blue);R.box(v.svg,266,221,142,35,'Стебель B','Stem B',23,C.teal);
 R.box(v.svg,77,477,350,57,'10 пар · те же партнёры','10 pairs · same partners',26,C.gold);
 R.box(v.svg,77,544,350,50,'Одна цепь · 29 позиций','One chain · 29 positions',22,C.grey);
 F.line(v.svg,456,174,456,588,C.grey,1);
 const world=F.group(v.svg),segments=[],beads=[];
 for(let i=0;i<28;i++){const el=F.group(world),halo=F.line(el,0,0,0,0,'var(--color-bg)',8),line=F.line(el,0,0,0,0,i<12?C.blue:i<16?C.grey:C.teal,3.5);segments.push({el,line,halo,a:i,b:i+1,pair:false});}
 PAIRS.forEach(([a,b],i)=>{const el=F.group(world),halo=F.line(el,0,0,0,0,'var(--color-bg)',6),line=F.line(el,0,0,0,0,i<5?C.blue:C.teal,2.5);el.dataset.geometryPair=(a+1)+','+(b+1);segments.push({el,line,halo,a,b,pair:true});});
 [...SEQ].forEach((base,i)=>{const el=F.group(world),dot=F.dot(el,0,0,6,i<13?C.blue:i<16?C.grey:C.teal);dot.setAttribute('stroke','var(--color-bg)');dot.setAttribute('stroke-width',1.5);el.dataset.geometryIndex=i+1;beads.push({el,dot});});
 const aLabel=R.box(v.svg,591,550,200,38,'Стебель A','Stem A',25,C.blue),bLabel=R.box(v.svg,915,550,200,38,'Стебель B','Stem B',25,C.teal);
 const aLead=F.line(v.svg,0,0,0,0,C.blue,1),bLead=F.line(v.svg,0,0,0,0,C.teal,1);
 const call=F.group(v.svg),brace=R.path(call,'',C.gold,3),contactLead=F.line(call,0,0,0,0,C.gold,1.2);
 R.box(call,505,214,228,72,'Дальний контакт','Long-range contact',25,C.gold);

 R.t('Дальние контакты ограничивают геометрию','Long-range contacts constrain geometry');
 function paint(){const xyz=geometry(state.turn),pts=xyz.map(project),sorted=[];
 segments.forEach(s=>{const a=pts[s.a],b=pts[s.b];F.seg(s.line,a[0],a[1],b[0],b[1]);F.seg(s.halo,a[0],a[1],b[0],b[1]);sorted.push({el:s.el,z:(a[2]+b[2])/2});});
 beads.forEach((b,i)=>{F.at(b.el,pts[i][0],pts[i][1]);sorted.push({el:b.el,z:pts[i][2]+1000});});sorted.sort((a,b)=>a.z-b.z).forEach(s=>world.append(s.el));
 const a=pts[0],b=pts[16];F.seg(aLead,690,550,a[0],a[1]+9);F.seg(bLead,1015,550,b[0],b[1]+9);
 const l=pts[6],r=pts[22];brace.setAttribute('d',`M${l[0]} ${l[1]-13} v-13 H${r[0]} v13`);F.seg(contactLead,726,248,(l[0]+r[0])/2-8,(l[1]+r[1])/2-30);F.opacity(call,state.contact);

 v.root.dataset.rnaSequence=SEQ;v.root.dataset.rnaPairs=JSON.stringify(PAIRS.map(p=>p.map(i=>i+1)));v.root.dataset.geometryTurn=state.turn;v.root.dataset.geometryKind='schematic articulated modules';
 }
 return {state,paint,patches:[{turn:1},{contact:1}],durations:[2800,1100]};
 }});
})();
