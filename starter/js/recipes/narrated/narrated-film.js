/* Composer of a narrated film: one continuous deck scene on the cinema clock.
 * Complete poses: every cue carries the whole state (shot index, chapter and every
 * prefixed shot field), so any route starts from a finished pose. When a cue changes
 * shot, the cross-fade takes the first 40% of its motion and the new shot's fields
 * move afterwards, so no animation plays on a half-visible shot. Hold times stretch
 * to the recorded narration (voice-timing.js, written by tools/voice.py). */
(function(g){
'use strict';
const V=g.NARRATED,M=V.meta||{};
const ID=M.id||'narrated-film';
const SOURCE=M.source||'Учебная схема';
const LEAD=.5,TAIL=1.1; // narration starts LEAD s after a cue begins and leaves TAIL s of silence
const voice=g.NARRATED_VOICE||{};
const shots=V.shots,shotIndex=new Map(shots.map(s=>[s.id,s.index]));
// ?record hides the controls so a recorder captures the bare 1280×720 stage.
try{if(new URL(g.location.href).searchParams.has('record'))document.body.classList.add('narrated-record');}catch(e){}

const baseline={shot:0,chapter:0};
shots.forEach(s=>Object.entries(s.fields).forEach(([k,v])=>{baseline[s.id+'.'+k]=v;}));
let pose={...baseline};
const catalog=V.cues.map((c,i)=>{
 if(!shotIndex.has(c.shot))throw new Error('Cue '+c.key+' names unknown shot '+c.shot);
 const shot=shots[shotIndex.get(c.shot)],patch={shot:shot.index,chapter:shot.chapter};
 Object.entries(c.patch||{}).forEach(([k,v])=>{const key=c.shot+'.'+k;if(!V.own(baseline,key))throw new Error('Cue '+c.key+' patches unknown field '+key);patch[key]=v;});
 pose={...pose,...patch};
 const motion=i?(c.motion===undefined?2.2:c.motion):0,spoken=voice[c.key]||0;
 const hold=Math.max(c.hold===undefined?4:c.hold,spoken?spoken+LEAD+TAIL-motion:0);
 return {key:c.key,shot:c.shot,motion,hold:Math.round(hold*100)/100,target:{...pose},
  titleRu:c.title[0],titleEn:c.title[1],captionRu:c.caption[0],captionEn:c.caption[1],noteRu:V.plain(c.voice[0]),noteEn:V.plain(c.voice[1]),
  sourceLabel:c.source?c.source[0]:SOURCE,sourceUrl:c.source?c.source[1]:''};
});
// Captions are HTML: keep numbers with their units and operators on one line.
const nb=s=>String(s).replace(/ %/g,' %').replace(/(\d) (?=\d{3}\b)/g,'$1 ').replace(/ ([÷=×→]) /g,' $1 ');
catalog.forEach(c=>{c.captionRu=nb(c.captionRu);c.captionEn=nb(c.captionEn);});
const cues=CinemaTimeline.compile({baseline,catalog}),duration=CinemaTimeline.duration(cues);
const phase=(t,a,b)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
const sample=t=>{
 const f=CinemaTimeline.sample(cues,baseline,t),b=cues[f.cue],a=cues[f.cue-1];
 if(!(f.transition>0&&f.transition<1)||!a||a.target.shot===b.target.shot)return f;
 const ps=phase(f.transition,0,.4),pf=phase(f.transition,.35,1),values={};
 Object.keys(baseline).forEach(k=>{const x=a.target[k],y=b.target[k];values[k]=x+(y-x)*(k==='shot'||k==='chapter'?ps:pf);});
 return {...f,values};
};

// Shot visibility from the continuous shot index: the old shot leaves, the next arrives, with a short overlap.
function visibility(s,j){
 if(s<=j-1||s>=j+1)return 0;if(s===j)return 1;
 return s<j?F.phase(s-(j-1),.42,1):1-F.phase(s-j,0,.58);
}
const cite=c=>'<p class="note-source">'+(c.sourceUrl?'<a href="'+c.sourceUrl+'" target="_blank" rel="noopener">'+c.sourceLabel+'</a>':c.sourceLabel)+'</p>';
const note=c=>'<p>'+c.noteRu+'</p>'+cite(c),noteEn=c=>'<p>'+c.noteEn+'</p>'+cite(c);
const qa=lang=>(V.questions||[]).map(q=>({q:q[lang==='en'?1:0],a:q[lang==='en'?3:2],source:SOURCE}));
D.i18n.pack('en',{notes:{[ID]:cues.map(noteEn)},qa:{[ID]:qa('en')}});
const pair=(x,fallback)=>Array.isArray(x)?V.tr(x[0],x[1]):x||fallback;

D.deck.register({id:ID,title:pair(M.title,'Учебный фильм'),
 chapter:pair(M.chapter,'Учебный фильм'),notes:cues.map(note),qa:qa('ru'),
 build(ctx){
  const v=F.stage(ctx,cues[0].titleRu,M.kicker||'',pair(M.stageNote,'Учебная схема'));
  v.heading.setAttribute('data-i18n-ignore','');v.cap.setAttribute('data-i18n-ignore','');
  const svg=v.svg,state={time:0};
  // Chapter route in the title band: the viewer always sees where the film is.
  const route=D.dom.h('div.narrated-route',{'data-i18n-ignore':''});
  const stops=V.chapters.map(ch=>{const el=D.dom.h('span',{},ch.ru);route.append(el);return el;});
  v.root.append(route);
  L.contract(route,{id:'narrated-route',box:{x:60,y:12,width:1160,height:26},space:v.root,measure:'content'});
  const mounted=shots.map(shot=>{
   const group=F.group(svg),kit=V.kit(shot.id,group);F.opacity(group,0);
   return {shot,group,kit,keys:Object.keys(shot.fields),paint:shot.build(kit),shown:false};
  });
  let lastCopy='',lastRoute='';
  function paint(){
   const frame=sample(state.time),values=frame.values,cue=cues[frame.cue],lang=D.i18n.lang()==='en'?'En':'Ru';
   const copy=frame.cue+':'+lang;
   if(copy!==lastCopy){v.title(cue['title'+lang]);v.caption(cue['caption'+lang]);lastCopy=copy;}
   const current=cue.target.chapter,routeKey=current+':'+lang;
   if(routeKey!==lastRoute){stops.forEach((el,i)=>{el.textContent=lang==='En'?V.chapters[i].en:V.chapters[i].ru;el.classList.toggle('is-current',i===current);el.classList.toggle('is-past',i<current);});lastRoute=routeKey;}
   const env={time:state.time,lang,cue:cue.key};
   mounted.forEach(m=>{
    const a=visibility(values.shot,m.shot.index);
    if(a<=0){if(m.shown){F.opacity(m.group,0);m.shown=false;}return;}
    F.opacity(m.group,a);m.shown=true;
    const local={};m.keys.forEach(k=>{local[k]=values[m.shot.id+'.'+k];});
    m.paint(local,env);
   });
   v.root.dataset.cue=String(frame.cue);v.root.dataset.filmTime=state.time.toFixed(3);
   g.NARRATED_FILM.snapshot={time:state.time,key:cue.key,cue:frame.cue,shot:cue.shot};
  }
  const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);
  const controller=Cinema.mount(ctx,{root:v.root,state,driver,cues,duration,narrativeIndex:t=>sample(t).cue});
  ctx.onDispose(D.i18n.onChange(()=>{mounted.forEach(m=>m.kit.relang());lastCopy='';lastRoute='';paint();}));
  cues.slice(1).forEach((c,i)=>ctx.step(()=>controller.go(i+1,true)));
  paint();return v.root;
 }});
g.NARRATED_FILM={id:ID,title:M.title||null,cues,duration,sample,baseline,lead:LEAD,snapshot:null};
})(window);
