/* Source-linked chemistry scenes. Drawing progress is separate from physical time. */
(function(global){'use strict';
let serial=0;const specimens=[];
function tr(ru,en){D.i18n.pack('en',{strings:{[ru]:en}});return ru;}
function label(g,x,y,w,h,ru,en=ru,size=24,color=C.white){tr(ru,en);return L.textBox(g,{id:'chemistry.'+(++serial),x,y,width:w,height:h,text:ru,size,color,padding:0,lineHeight:1.16,align:'center',valign:'middle'});}
function el(g,tag,attrs){const n=D.dom.s(tag,attrs);g.append(n);return n;}
const show=(a,p)=>{F.opacity(a.el||a.g||a,p);};
function line(g,x1,y1,x2,y2,color=C.grey,dash=''){return el(g,'line',{x1,y1,x2,y2,stroke:color,'stroke-width':1.25,'stroke-dasharray':dash,'vector-effect':'non-scaling-stroke'});}
function circle(g,x,y,r,color=C.blue,fill=.08){return el(g,'circle',{cx:x,cy:y,r,fill:color,'fill-opacity':fill,stroke:color,'stroke-width':1.25,'vector-effect':'non-scaling-stroke'});}
function path(g,d,color=C.blue,width=1.5){return el(g,'path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'});}
function rect(g,x,y,w,h,color=C.blue){return el(g,'rect',{x,y,width:w,height:h,rx:7,fill:color,'fill-opacity':.08,stroke:color,'stroke-width':1.15,'vector-effect':'non-scaling-stroke'});}
function arrow(g,x1,y1,x2,y2,color=C.gold,kind='force',curve=0){return CH.arrow(g,{x1,y1,x2,y2,color,kind,curve});}
function formula(g,x,y,w,t,size=31){return label(g,x,y,w,52,t,t,size,C.white);}
const fmt=(n,d=2)=>{const s=Number(n).toFixed(d);return Number(s)===0?s.replace('-',''):s;};
function plot(g,o){const {x,y,w,h,xmin,xmax,ymin,ymax}=o;const sx=v=>x+(v-xmin)*w/(xmax-xmin),sy=v=>y+h-(v-ymin)*h/(ymax-ymin);
 line(g,x,y,x,y+h,C.grey);line(g,x,y+h,x+w,y+h,C.grey);
 const xt=o.xt||[xmin,(xmin+xmax)/2,xmax],yt=o.yt||[ymin,(ymin+ymax)/2,ymax];
 xt.forEach(t=>{line(g,sx(t),y+h,sx(t),y+h+5);label(g,sx(t)-33,y+h+8,66,27,String(t),String(t),17,C.grey);});
 yt.forEach(t=>{line(g,x-4,sy(t),x+w,sy(t),'color-mix(in srgb, var(--color-text) 12%, transparent)');label(g,x-54,sy(t)-14,45,28,String(t),String(t),17,C.grey);});
 label(g,x,y-42,w,32,o.title,o.enTitle||o.title,21,C.grey);label(g,x,y+h+37,w,33,o.xlabel,o.enXlabel||o.xlabel,20,C.grey);
 return {x:sx,y:sy,curve(fn,color=C.blue){const p=path(g,'',color);const draw=f=>p.setAttribute('d',Array.from({length:121},(_,i)=>{const a=xmin+(xmax-xmin)*i/120,b=f(a);return(i?'L':'M')+sx(a)+','+sy(b);}).join(' '));draw(fn);return {el:p,draw};},point(color=C.gold){const p=circle(g,x,y,6,color,.9);return {el:p,set(a,b){p.setAttribute('cx',sx(a));p.setAttribute('cy',sy(b));}};}};
}
function move(item,x,y,scale=1){const n=item.g||item.el||item;if(![x,y,scale].every(Number.isFinite)||scale<=0)throw new TypeError('finite actor pose required');n.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);return item;}
function trace(item,progress){const n=item.g||item.el||item,t=F.clamp(progress);if(!Number.isFinite(progress))throw new TypeError('finite trace progress required');
 const shaft=n.querySelector?.('[data-arrow-shaft]');if(shaft){F.revealStroke(shaft,t);show(n.querySelector('[data-arrow-head]'),t>=.995?1:0);const cross=n.querySelector('[data-arrow-cross]');if(cross)show(cross,t>0?1:0);}
 else if(n.matches?.('path,line,polyline,polygon,circle,ellipse,rect'))F.revealStroke(n,t);
 else n.querySelectorAll('path,line,polyline').forEach(stroke=>F.revealStroke(stroke,t));return item;
}
const H={tr,label,el,show,line,circle,path,rect,arrow,formula,fmt,plot,move,trace,group:F.group};
function createSpecimen(v,spec){const g=F.group(v.svg);g.dataset.chemDrawing=spec.id;const item=spec.draw(g,H);const obj={g,metrics:{},detail:item.detail||{g,x:0,y:0,scale:1,bounds:{x:80,y:212,width:1120,height:284}}};
 obj.paint=p=>{if(typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new RangeError('Chemistry progress must be in [0,1]');const result=item.paint(p)||{};obj.metrics=result;g.dataset.model=JSON.stringify(result);return result;};obj.paint(0);return obj;}
function register(spec){const id='chem-'+spec.id,chapter='От химии к биологии';tr(spec.title,spec.enTitle);tr(chapter,'From chemistry to biology');tr(spec.question,spec.enQuestion);tr(spec.control,spec.enControl);
 const note=(text)=>'<p>'+text+'</p><p><a href="'+spec.url+'" target="_blank" rel="noopener">'+spec.source+'</a></p>';
 const qa=[{q:spec.question,a:'<p>'+spec.answer+'</p>',source:spec.source,url:spec.url}],enQa=[{q:spec.enQuestion,a:'<p>'+spec.enAnswer+'</p>',source:spec.source,url:spec.url}];
 D.i18n.pack('en',{notes:{[id]:[note(spec.enNote)]},qa:{[id]:enQa}});
 D.deck.register({id,title:spec.title,chapter,notes:[note(spec.note)],qa,build(ctx){
  const v=F.stage(ctx,spec.title,chapter,''),state={p:0};v.root.dataset.sceneId=id;v.root.dataset.chemScene=spec.id;
  label(v.svg,90,149,1100,54,spec.question,spec.enQuestion,27,C.grey);
  const a=createSpecimen(v,spec),phaseButtons=[];let running=false,alive=true,version=0,slider,playButton,playLabel,inspector,lastPlayText,entryFrame=0,entryPending=false,resumeVisible=false;
  const reduced=()=>global.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  v.root.dataset.storyDuration=String(spec.duration||7000);(spec.narration||[]).forEach(cue=>tr(cue.ru,cue.en));
  const playText=tr('Рассказать','Tell the story'),resumeText=tr('Продолжить','Continue'),replayText=tr('Ещё раз','Replay'),pauseText=tr('Пауза','Pause'),resetText=tr('Сначала','Restart');
  function paint(){a.paint(state.p);v.root.dataset.progress=String(state.p);v.root.dataset.running=String(running);v.root.dataset.metrics=JSON.stringify(a.metrics);
   if(slider){slider.input.value=String(Math.round(state.p*100));slider.output.textContent=spec.value?spec.value(state.p):Math.round(state.p*(spec.duration||7000)/1000)+' / '+Math.round((spec.duration||7000)/1000)+' s';slider.input.setAttribute('aria-valuetext',slider.output.textContent);}
   const captions=spec.captions||[spec.answer],ens=spec.enCaptions||[spec.enAnswer],i=spec.stages?Math.max(0,spec.stages.findLastIndex(s=>state.p+1e-8>=s.at)):Math.min(captions.length-1,Math.floor(state.p*captions.length));phaseButtons.forEach((b,k)=>{b.api.setPressed(k===i);b.outline.setAttribute('stroke-width',k===i?'2':'1');b.outline.setAttribute('stroke',k===i?C.gold:C.dim);});v.root.dataset.explanationPhase=String(i);
   const cueIndex=spec.narration?Math.max(0,spec.narration.findLastIndex(c=>state.p+1e-8>=c.at)):-1,spoken=cueIndex>=0?spec.narration[cueIndex]:{ru:captions[i],en:ens[i]};v.root.dataset.narrationIndex=String(cueIndex);tr(spoken.ru,spoken.en);v.caption(D.i18n.text(spoken.ru));
   const buttonText=running?pauseText:state.p>=1?replayText:state.p>0?resumeText:playText;if(playButton&&buttonText!==lastPlayText){playButton.setLabel(buttonText);playLabel.setText(buttonText);playButton.setPressed(running);lastPlayText=buttonText;}if(inspector)inspector.setBox();
  }
  const driver=F.driver(state,paint);function cancelEntry(){entryPending=false;if(entryFrame){global.cancelAnimationFrame(entryFrame);entryFrame=0;}}function stop(){cancelEntry();resumeVisible=false;version++;driver.cancel();running=false;if(alive)paint();}function set(p){stop();driver.set({p});}
  function play(){cancelEntry();if(running){stop();return;}if(state.p>=1)driver.set({p:0});running=true;const token=++version;paint();driver.to({p:1},{duration:(1-state.p)*(spec.duration||7000),ease:'linear'}).then(r=>{if(alive&&token===version&&r.completed){running=false;paint();}});}
  playButton=T.svgButton(v.svg,{id:id+'-play',box:{x:65,y:552,width:166,height:52},label:playText,pressed:false,onActivate:play});rect(playButton.g,65,552,166,52,C.blue).setAttribute('pointer-events','none');playLabel=label(playButton.g,70,554,156,46,playText,'Tell the story',22,C.blue);
  const reset=T.svgButton(v.svg,{id:id+'-reset',box:{x:247,y:552,width:126,height:52},label:resetText,onActivate:()=>{set(0);if(!reduced())play();}});label(reset.g,251,554,118,46,resetText,'Restart',23,C.grey);
  slider=T.control(v.root,spec.control,0,100,0,1,n=>set(n/100),416,550,790);L.contract(slider.el,{id:id+'.control',box:{x:408,y:540,width:807,height:69},space:v.root,measure:'content'});
  if(spec.stages){
   const gap=9,width=(1120-gap*(spec.stages.length-1))/spec.stages.length;
   spec.stages.forEach((stage,k)=>{const x=80+k*(width+gap),labelText=tr(stage.label,stage.enLabel),next=spec.stages[k+1]?.at??1,seek=stage.seek??Math.min(1,stage.at+(next-stage.at)*.80);
    const api=T.svgButton(v.svg,{id:id+'-phase-'+k,box:{x,y:502,width,height:36},label:labelText,pressed:false,onActivate:()=>{set(reduced()?seek:stage.at);if(!reduced())play();}});api.g.dataset.phaseAt=String(stage.at);api.g.dataset.phaseSeek=String(seek);
    const outline=line(api.g,x+6,538,x+width-6,538,C.dim);outline.setAttribute('pointer-events','none');label(api.g,x+3,503,width-6,34,stage.label,stage.enLabel,17,C.grey);phaseButtons.push({api,outline});
   });
  }
  inspector=B.inspect(v.svg,a.detail,{id:id+'-detail',label:tr('Увеличить схему','Enlarge diagram'),enLabel:'Enlarge diagram',title:spec.title,enTitle:spec.enTitle,description:spec.detailText||'Тот же объект и состояние; масштаб рисунка условный.',enDescription:spec.enDetailText||'The same object and state; drawing scale is illustrative.',onOpen:stop});
  function tryEntry(){entryFrame=0;if(entryPending&&alive&&v.root.isConnected&&!global.document.hidden){entryPending=false;play();}}
  function visibility(){if(global.document.hidden){const was=running,pending=entryPending;stop();entryPending=pending;resumeVisible=was;}else if(resumeVisible){resumeVisible=false;play();}else tryEntry();}
  const unlang=D.i18n.onChange(paint);global.document.addEventListener('visibilitychange',visibility);
  ctx.onDispose(()=>{alive=false;cancelEntry();version++;driver.dispose();inspector.dispose();playButton.dispose();reset.dispose();phaseButtons.forEach(b=>b.api.dispose());unlang();global.document.removeEventListener('visibilitychange',visibility);});paint();
  // Start only in a real configured lesson; QA and reduced-motion entry remain still.
  if(global.LESSON&&global.LESSON.chemistryNarration!==false&&!new URLSearchParams(global.location.search).has('qa')&&!reduced()){entryPending=true;entryFrame=global.requestAnimationFrame(tryEntry);}
  return v.root;
 }});
}
function add(spec){if(specimens.some(s=>s.id===spec.id))throw Error('Duplicate chemistry scene');specimens.push(spec);register(spec);}
global.CHEMISTRY_BRIDGE={specimens,createSpecimen,register,add,H};

// The revised foundation scenes are authored and reviewed in separate modules.
if(!global.CHEMISTRY_FOUNDATIONS||global.CHEMISTRY_FOUNDATIONS.length!==5)throw new Error('Load the five chemistry foundation scenes before chemistry-bridge.js');
global.CHEMISTRY_FOUNDATIONS.forEach(add);

// Context recipes are loaded as data before this registry.
const context=global.CHEMISTRY_APPLICATIONS||[];
for(const id of ['catalysis','occupancy','histone']){const matches=context.filter(s=>s.id===id);if(matches.length!==1)throw new Error('Load one context recipe: '+id);add(matches[0]);}
})(window);
