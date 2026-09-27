/* Narrated film: a registry of chapters, shots and cues, drawing helpers and the
 * delivery vocabulary of the narration. A shot is one composition of persistent
 * actors; a cue is one complete pose of the film clock with its RU/EN title,
 * caption and spoken text. Chapter files register shots and their cues in viewing
 * order; the composer (narrated-film.js) prefixes every shot field, accumulates
 * complete poses, cross-fades shots and stretches holds to the recorded voice.
 * Optional: a lesson only becomes a narrated video when the user asks for one. */
(function(g){
'use strict';
const V=g.NARRATED={chapters:[],shots:[],cues:[],meta:{}};
let chapter=null;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

V.tr=(ru,en)=>{if(typeof en==='string'&&en!==ru)D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
// A text source is either a literal (formula, number, name) or a [ru, en] pair.
const source=t=>Array.isArray(t)?V.tr(t[0],t[1]):String(t);
V.source=source;
V.lerp=(a,b,t)=>a+(b-a)*t;
V.clamp=t=>Math.max(0,Math.min(1,t));
V.fmt=(v,d=2)=>(v<0?'−':'')+Math.abs(v).toFixed(d);

/* Film identity: id, title and chapter line as [ru, en], a source label for the notes
 * and the stage's small print. Call once, before the composer loads. */
V.film=meta=>{V.meta={...V.meta,...meta};};

/* Narration delivery for neural voices. A cue's `tone` names a style below (or is a
 * style string of its own). Inside the RU voice text, {style} switches the style for
 * the rest of the clip; [pause] [long pause] [chuckle] [sigh] [breath] are inline
 * vocal tags; *word* is stressed. V.plain strips the markup for notes and subtitles;
 * offline voices ignore it. Replace or extend the table per film. */
V.TONE={
 warm:'warm and friendly storyteller for a school student, natural lively inflection',
 teach:'clear, friendly teacher explaining step by step, natural inflection, moderate pace',
 play:'playful and lively, smiling, light and bouncy',
 curious:'curious and intriguing, lively pace, rising intonation on questions',
 excited:'excited and delighted, energetic and bright',
 serious:'calm, serious and thoughtful, natural pace',
 careful:'careful and honest, gently cautionary, natural pace',
 wrap:'warm and encouraging, confident and satisfied'
};
V.plain=s=>String(s).replace(/\{[^}]*\}\s*/g,'').replace(/\s*\[(?:pause|long pause|chuckle|sigh|breath|laugh)\]\s*/g,' ').replace(/\*([^*]+)\*/g,'$1').replace(/\s+/g,' ').trim();

V.chapter=(id,name)=>{chapter={id,index:V.chapters.length,ru:name[0],en:name[1]};V.chapters.push(chapter);};
V.shot=spec=>{
 if(!chapter)throw new Error('Register a chapter before shot '+spec.id);
 if(V.shots.some(s=>s.id===spec.id))throw new Error('Duplicate shot '+spec.id);
 V.shots.push({fields:{},...spec,chapter:chapter.index,index:V.shots.length});
};
// Cues belong to the most recently registered shot unless they name one.
V.cue=spec=>{
 const shot=spec.shot||(V.shots.length?V.shots[V.shots.length-1].id:null);
 ['title','caption','voice'].forEach(k=>{if(!Array.isArray(spec[k])||spec[k].length!==2)throw new Error(spec.key+' needs '+k+' as [ru, en]');});
 if(V.cues.some(c=>c.key===spec.key))throw new Error('Duplicate cue '+spec.key);
 V.cues.push({...spec,shot,tone:V.TONE[spec.tone]||spec.tone||''});
};

/* Drawing kit bound to one shot group. Every text sits in a declared box. */
V.kit=(shotId,group)=>{
 const s=D.dom.s,id=name=>shotId+'-'+name,lang=[];
 const k={g:group,id,
  group:(parent=group)=>F.group(parent),
  text(o,parent=group){
   return L.textBox(parent,{id:id(o.id),x:o.x,y:o.y,width:o.w,height:o.h,text:source(o.text),size:o.size||22,
    color:o.color||C.white,align:o.align||'center',valign:o.valign||'middle',padding:0,lineHeight:o.lineHeight||1.25,
    ...(o.weight?{weight:o.weight}:{})});
  },
  // One line of differently coloured parts: [[text, colour, weight?], ...].
  rich(o,parent=group){
   const anchor={left:'start',center:'middle',right:'end'}[o.align||'center'];
   const el=s('text',{'font-size':o.size||26,'font-family':'var(--f-text)','text-anchor':anchor,'dominant-baseline':'central','data-i18n-ignore':''});
   el.style.whiteSpace='pre';parent.append(el);
   const x=o.align==='left'?o.x:o.align==='right'?o.x+o.w:o.x+o.w/2;
   const parts=o.parts.map(p=>{if(!Array.isArray(p))throw new TypeError('rich parts are [text, colour]');return [source(p[0]),p[1]||C.white,p[2]];});
   const render=()=>{
    el.textContent='';el.setAttribute('x',x);el.setAttribute('y',o.y+o.h/2);
    parts.forEach(([t,c,w])=>{const span=s('tspan',{fill:c});if(w)span.setAttribute('font-weight',w);span.textContent=D.i18n.text(t);el.append(span);});
    el.setAttribute('aria-label',el.textContent);
   };
   render();lang.push(render);
   L.contract(el,{id:id(o.id),box:{x:o.x,y:o.y,width:o.w,height:o.h},space:parent});
   return {el};
  },
  line:(x1,y1,x2,y2,color=C.grey,width=2,dash='',parent=group)=>F.line(parent,x1,y1,x2,y2,color,width,dash),
  rect(x,y,w,h,o={},parent=group){const el=s('rect',{x,y,width:w,height:h,rx:o.rx===undefined?3:o.rx,fill:o.fill||'none',stroke:o.stroke||'none','stroke-width':o.width||2,...(o.dash?{'stroke-dasharray':o.dash}:{}),...(o.opacity!==undefined?{'fill-opacity':o.opacity}:{})});parent.append(el);return el;},
  circle(x,y,r,o={},parent=group){const el=s('circle',{cx:x,cy:y,r,fill:o.fill||'none',stroke:o.stroke||'none','stroke-width':o.width||2,...(o.opacity!==undefined?{'fill-opacity':o.opacity}:{})});parent.append(el);return el;},
  path(d,o={},parent=group){const el=s('path',{d,fill:o.fill||'none',stroke:o.stroke||C.white,'stroke-width':o.width||2.5,'stroke-linejoin':'round','stroke-linecap':'round',...(o.dash?{'stroke-dasharray':o.dash}:{}),...(o.opacity!==undefined?{'fill-opacity':o.opacity}:{})});parent.append(el);return el;},
  arrow:(color=C.gold,width=4,parent=group)=>F.arrow(parent,color,width),
  onLang:fn=>lang.push(fn),
  relang:()=>lang.forEach(fn=>fn())
 };
 return k;
};

/* Small geometry helpers. */
V.scale=(d0,d1,r0,r1)=>v=>r0+(v-d0)*(r1-r0)/(d1-d0);
V.polar=(cx,cy,r,deg)=>[cx+r*Math.cos(deg*Math.PI/180),cy-r*Math.sin(deg*Math.PI/180)];
// Deterministic pseudo-random numbers for authored scatter.
V.rng=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};};
V.sum=a=>a.reduce((x,y)=>x+y,0);
V.zeros=a=>a.filter(v=>v===0).length;

/* A row of count cards: one card per record (a cell, a pupil, a sample) holding up to
 * six unit dots stacked from the bottom and one count label per named state. Each card
 * is its own group, so it can move (place). paint(a, b, t) morphs state a into b: kept
 * dots stay, new dots fade in in `grow`, lost dots fade out in red; the labels change
 * one after the other, never on top of each other. zeros(name, t) frames zero cards. */
V.cards=(k,o)=>{
 const s=D.dom.s,w=o.w||42,h=o.h||88,states=o.states,names=Object.keys(states),n=states[names[0]].length;
 const parent=o.parent||k.g,color=o.color||C.blue,SLOTS=6;
 const cells=[];
 for(let i=0;i<n;i++){
  const q=s('g');parent.append(q);
  const rect=k.rect(0,0,w,h,{stroke:color,width:2,fill:color,opacity:.07,rx:7},q);
  const zero=k.rect(-3,-3,w+6,h+6,{stroke:C.red,width:2.5,dash:'5 4',rx:9},q);F.opacity(zero,0);
  const slots=[];for(let j=0;j<SLOTS;j++)slots.push(k.circle(w/2,h-11-j*13,5.2,{fill:C.gold},q));
  const labels={};names.forEach(name=>{labels[name]=k.text({id:o.id+'-'+name+'-'+i,x:w/2-22,y:h+3,w:44,h:24,text:String(states[name][i]),size:17,color:C.grey},q);});
  const x=o.x+i*(o.pitch||54),y=o.y;F.at(q,x,y);
  cells.push({q,rect,zero,slots,labels,x,y,cx:x+w/2});
 }
 return {cells,w,h,
  place(i,x,y){const c=cells[i];c.x=x;c.y=y;F.at(c.q,x,y);},
  paint(a,b=a,t=1,opt={}){
   const grow=opt.grow||C.gold,A=states[a],B=states[b];
   cells.forEach((c,i)=>{
    const va=A[i],vb=B[i];
    c.slots.forEach((dot,j)=>{
     if(j<Math.min(va,vb)){F.opacity(dot,1);F.put(dot,'fill',C.gold);}
     else if(j>=va&&j<vb){F.opacity(dot,t);F.put(dot,'fill',grow);}
     else if(j>=vb&&j<va){F.opacity(dot,1-t);F.put(dot,'fill',C.red);}
     else F.opacity(dot,0);
    });
    names.forEach(name=>F.opacity(c.labels[name].el,name===a&&name===b?1:name===a?(va===vb?1:1-F.phase(t,0,.5)):name===b?(va===vb?0:F.phase(t,.5,1)):0));
   });
  },
  zeros(name,t){cells.forEach((c,i)=>F.opacity(c.zero,states[name][i]===0?t:0));}
 };
};
V.own=own;
})(window);
