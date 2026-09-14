/* Optional molecular animation workbench. A visual replay is not a biological reversal. */
(function(global){'use strict';
let serial=0;
const specimens=[
 {actor:'histoneTail',name:'Хвост гистона H3',enName:'Histone H3 tail',parameter:'methylation',part:'three-methyl-groups',focus:'три метильные группы',enFocus:'three methyl groups',scale:1.05,source:'1KNE',meaning:'Метка H3K9me3 — три группы CH₃ на одном лизине.',enMeaning:'H3K9me3 means three CH₃ groups on one lysine.'},
 {actor:'mediator',name:'Mediator',enName:'Mediator',part:'mediator-head',focus:'головная часть',enFocus:'head module',scale:1.1,source:'7LBM',meaning:'У Mediator показаны три группы частей: tail, middle и head.',enMeaning:'Mediator is shown with tail, middle and head modules.'},
 {actor:'initiationComplex',name:'Комплекс инициации Pol II',enName:'Pol II initiation complex',parameter:'assembly',part:'mediator',focus:'Mediator в составе комплекса',enFocus:'Mediator within the assembly',scale:.72,source:'7LBM',meaning:'Pol II, Mediator и общие факторы показаны отдельными частями.',enMeaning:'Pol II, Mediator and general factors remain distinct components.'},
 {actor:'cas12a',name:'Cas12a',enName:'Cas12a',parameter:'opening',part:'ruvc',focus:'область RuvC',enFocus:'RuvC region',scale:1.05,source:'5B43',meaning:'Раздвижение долей — способ рассмотреть схему белка.',enMeaning:'Separating the lobes is a way to inspect the protein schematic.'},
 {actor:'cas13',name:'Cas13a',enName:'Cas13a',parameter:'opening',part:'hepn-1',focus:'область HEPN1',enFocus:'HEPN1 region',scale:1.05,source:'5XWP',meaning:'Cas13a показан без направляющей и РНК-мишени.',enMeaning:'Cas13a is shown without its guide or target RNA.'},
 {actor:'preMrna',name:'Пре-мРНК и сплайсинг',enName:'Pre-mRNA and splicing',parameter:'spliced',part:'intron',focus:'интронное лассо',enFocus:'intron lariat',scale:1,source:'5MQF',meaning:'Сначала возникает ветвление, затем соединяются экзоны.',enMeaning:'Branching comes first; exon ligation follows.'},
 {actor:'spliceosome',name:'Сплайсосома',enName:'Spliceosome',parameter:'separation',part:'u6-snrna',focus:'малая ядерная РНК U6',enFocus:'U6 small nuclear RNA',scale:.70,source:'5MQF',meaning:'Белковое окружение и РНК можно рассмотреть по отдельности.',enMeaning:'The protein surroundings and RNAs can be inspected separately.'}
];
function tr(ru,en){D.i18n.pack('en',{strings:{[ru]:en}});return ru;}
function text(parent,x,y,width,height,ru,en,size=25,color=C.white){tr(ru,en);return L.textBox(parent,{id:'molecular-check.'+(++serial),x,y,width,height,text:ru,size,color,padding:0,lineHeight:1.2,align:'center',valign:'middle'});}
function visible(o,alpha){const el=o.el||o.g||o;F.opacity(el,alpha);el.setAttribute('aria-hidden',alpha===0?'true':'false');}
function createSpecimen(v,spec){
 const actor=B[spec.actor](v.svg,spec.actor==='preMrna'?{width:600}:{});
 let chemistry=null;
 if(spec.actor==='histoneTail'){
  const n0=text(actor.g,-7,-122,43,34,'NH₃⁺','NH₃⁺',16,C.gold),n1=text(actor.g,-7,-122,43,34,'N⁺','N⁺',18,C.gold);
  const methyls=[[-25,-135],[50,-135],[56,-88]].map(([x,y])=>text(actor.g,x-25,y-17,50,34,'CH₃','CH₃',17,C.red));
  text(actor.g,-177,9,34,34,'1','1',16,C.grey);text(actor.g,-26,9,52,34,'K9','K9',19,C.gold);text(actor.g,63,9,34,34,'13','13',16,C.grey);
  actor.bounds={x:-180,y:-157,width:282,height:203};chemistry={n0,n1,methyls};
 }
 function paint(progress){
  if(typeof progress!=='number'||!Number.isFinite(progress)||progress<0||progress>4)throw new RangeError('Visual cycle progress must be in [0,4]');
  const reset=F.phase(progress,3,4),parameter=Math.min(1,progress/2)*(1-reset),zoom=F.phase(progress,2,3)*(1-reset),focus=F.phase(progress,1,2)*(1-reset);
  if(spec.parameter)actor.set({[spec.parameter]:parameter});
  const scale=spec.scale*(1+.3*zoom),b=actor.bounds,cx=640+75*zoom,cy=362;
  B.place(actor,cx-(b.x+b.width/2)*scale,cy-(b.y+b.height/2)*scale,scale);
  B.emphasis(actor,{level:'focus',part:spec.part,amount:focus,color:C.gold});
  if(chemistry){visible(chemistry.n0,parameter<.5?1:0);visible(chemistry.n1,parameter>=.5?1:0);chemistry.methyls.forEach(m=>visible(m,parameter));}
  actor.g.dataset.checkParameter=String(parameter);actor.g.dataset.checkZoom=String(zoom);return actor;
 }
 paint(0);return {actor,paint,focusPart:spec.part};
}
function register(spec){
 const id='check-'+spec.actor,title=spec.name+' · проверка анимации',enTitle=spec.enName+' · animation check';
 const chapter='Новые молекулярные элементы',enChapter='New molecular elements';tr(title,enTitle);tr(chapter,enChapter);
 const source='https://www.rcsb.org/structure/'+spec.source;
 const phases=['Исходный вид: один и тот же объект остаётся на сцене.','Промежуточная геометрия: это позиция в тестовом цикле.','Выделенная часть: '+spec.focus+'.','Объект увеличивается и перемещается; контуры сохраняют толщину.','Возврат к началу — повтор рисунка, не обратная биологическая реакция.'];
 const enPhases=['Initial view: the same object remains on the stage.','Intermediate geometry: this is a position in the visual test cycle.','Focused part: '+spec.enFocus+'.','The object enlarges and moves while its outline weight stays constant.','Returning to the start replays the drawing; it is not a reverse biological reaction.'];
 phases.forEach((s,i)=>tr(s,enPhases[i]));
 const note=(body)=>'<p>'+body+'</p><p><a href="'+source+'" target="_blank" rel="noopener">PDB '+spec.source+'</a></p>';
 const qa=[{q:'Что проверяет этот цикл?',a:'<p>Изменение геометрии, сохранение частей, масштаб, подсветку, ручную перемотку и увеличение. Это тест рисунка, не предсказание движения молекулы.</p>',source:'PDB '+spec.source,url:source}];
 const enQa=[{q:'What does this cycle check?',a:'<p>Geometry changes, persistent parts, scale, emphasis, manual scrubbing and enlarged detail. It tests a drawing, not predicted molecular motion.</p>',source:'PDB '+spec.source,url:source}];
 const ruNote=note(spec.meaning+' Нажмите «Весь цикл», чтобы проиграть изменение, выделение, увеличение и возврат. Ползунок позволяет остановиться на любом кадре. Щелчок по объекту открывает зафиксированный крупный план. У Mediator нет численного биологического состояния: проверяются оформление и положение. Числа 0–100% относятся к ходу проверки, а не к активности белка. Возврат пре-мРНК, меток и комплекса — графический повтор; он не изображает обратную реакцию.');
 const enNote=note(spec.enMeaning+' Press “Play cycle” to run the change, emphasis, enlargement and return. Scrub to any frame. Clicking the object opens a captured enlarged view. Mediator has no numeric biological state: only appearance and placement are tested. The 0–100% values describe visual progress, not protein activity. Returning the pre-mRNA, marks or complex is a graphical replay, not a reverse reaction.');
 D.i18n.pack('en',{notes:{[id]:[enNote]},qa:{[id]:enQa}});
 D.deck.register({id,title,chapter,notes:[ruNote],qa,build(ctx){
  const v=F.stage(ctx,title,chapter,''),state={p:0};v.root.dataset.sceneId=id;v.root.dataset.checkActor=spec.actor;
  text(v.svg,85,149,1110,64,spec.meaning,spec.enMeaning,27,C.grey);
  const drawing=createSpecimen(v,spec),actor=drawing.actor;
  text(v.svg,837,515,367,32,'Нажмите на объект: крупный план','Click the object: enlarged view',20,C.grey);
  let running=false,alive=true,version=0,inspector=null,slider=null,playButton=null,playLabel=null,lastRunning=null;
  const buttonText=tr('Весь цикл','Play cycle'),pauseText=tr('Пауза','Pause'),resetText=tr('Сброс','Reset');
  function paint(){
   drawing.paint(state.p);if(inspector)inspector.setBox();
   v.root.dataset.progress=String(state.p);v.root.dataset.running=String(running);
   v.root.dataset.actorBounds=JSON.stringify(actor.bounds);v.root.dataset.actorPose=JSON.stringify({x:actor.x,y:actor.y,scale:actor.scale});
   if(slider){slider.input.value=String(Math.round(state.p*25));slider.output.textContent=Math.round(state.p*25)+'%';}
   v.caption(D.i18n.text(phases[Math.min(4,Math.floor(state.p+1e-8))]));
   if(playButton&&lastRunning!==running){playButton.setLabel(running?pauseText:buttonText);playLabel.setText(running?pauseText:buttonText);playButton.setPressed(running);lastRunning=running;}
  }
  const driver=F.driver(state,paint);
  function stop(){version++;driver.cancel();running=false;if(alive)paint();}
  function set(value){stop();driver.set({p:value});}
  function play(){if(running){stop();return;}if(state.p>=4)driver.set({p:0});running=true;const token=++version;paint();driver.to({p:4},{duration:(4-state.p)*1700}).then(result=>{if(alive&&token===version&&result.completed){running=false;paint();}});}
  playButton=T.svgButton(v.svg,{id:id+'-play',box:{x:65,y:552,width:192,height:52},label:buttonText,pressed:false,onActivate:play});
  const buttonRect=D.dom.s('rect',{x:65,y:552,width:192,height:52,rx:7,fill:C.blue,'fill-opacity':.07,stroke:C.blue,'stroke-width':1,'pointer-events':'none'});playButton.g.prepend(buttonRect);
  playLabel=text(playButton.g,72,554,178,46,buttonText,'Play cycle',24,C.blue);
  const reset=T.svgButton(v.svg,{id:id+'-reset',box:{x:277,y:552,width:146,height:52},label:resetText,onActivate:()=>set(0)});
  text(reset.g,281,554,138,46,resetText,'Reset',24,C.grey);
  slider=T.control(v.root,tr('Ход цикла','Cycle progress'),0,100,0,1,value=>set(value/25),466,550,728);
  L.contract(slider.el,{id:id+'.scrubber',box:{x:460,y:540,width:740,height:68},space:v.root,measure:'content'});
  inspector=B.inspect(v.svg,actor,{id:id+'-detail',label:tr('Рассмотреть: '+spec.name,'Inspect: '+spec.enName),enLabel:'Inspect: '+spec.enName,title:spec.name,enTitle:spec.enName,description:spec.meaning,enDescription:spec.enMeaning,onOpen:stop});
  const unlang=D.i18n.onChange(paint);ctx.onDispose(()=>{alive=false;version++;driver.dispose();inspector.dispose();playButton.dispose();reset.dispose();unlang();});
  paint();return v.root;
 }});
}
global.MOLECULAR_CHECK={specimens,createSpecimen,register};specimens.forEach(register);
})(window);
