/* Shared bilingual molecular scene definitions and optional atlas registration. */
(function(){'use strict';
let uid=0;
const H={
 text(parent,x,y,width,height,ru,en,size=24,color=C.white){D.i18n.pack('en',{strings:{[ru]:en||ru}});return L.textBox(parent,{id:'molecular-atlas.'+(++uid),x,y,width,height,text:ru,size,color,padding:0,lineHeight:1.2,align:'center',valign:'middle'});},
 opacity(o,a){F.opacity(o.el||o.g||o,a);},
 register(c,draw){
 const strings={[c.title]:c.en.title,[c.chapter]:c.en.chapter};c.captions.forEach((s,i)=>strings[s]=c.en.captions[i]);
 D.i18n.pack('en',{strings,notes:{[c.id]:c.en.notes},qa:{[c.id]:c.en.qa}});
 D.deck.register({id:c.id,title:c.title,chapter:c.chapter,notes:c.notes,qa:c.qa,build(ctx){
  const v=F.stage(ctx,c.title,c.chapter,'');v.root.dataset.sceneId=c.id;
  const api=draw(v,ctx),state={p:0};
  let refreshInspection=()=>{};
  function paint(){api.paint(state);refreshInspection();v.root.dataset.progress=String(state.p);v.caption(c.captions[Math.min(c.captions.length-1,Math.floor(state.p+.000001))]);}
  const d=F.driver(state,paint);ctx.onDispose(d.dispose);paint();refreshInspection=attachInspection(v,ctx,api,d);
  c.captions.slice(1).forEach((_,i)=>ctx.step(()=>d.to({p:i+1},{duration:1900})));return v.root;
 }});
 }
};

const source=(url,label)=>'<p><a href="'+url+'" target="_blank" rel="noopener">'+label+'</a></p>';
const entries=[];
function entry(id,title,enTitle,cap,enCap,notes,enNotes,url,label,draw,options={}){
 if(entries.some(e=>e.content.id===id))throw new Error('Duplicate molecular scene ID: '+id);
 if(!cap.length||enCap.length!==cap.length||notes.length!==cap.length||enNotes.length!==cap.length)throw new Error('Every molecular state needs RU/EN captions and notes');
 const content={id,title,chapter:'Биологический атлас',captions:cap,notes:notes.map(n=>'<p>'+n+'</p>'+source(url,label)),qa:[{q:'Это точная молекулярная структура?',a:'<p>Это авторская схема по структурным референсам. Размеры и траектории условны; атомные координаты не вычислялись.</p>',source:label,url}],en:{title:enTitle,chapter:'Biology atlas',captions:enCap,notes:enNotes.map(n=>'<p>'+n+'</p>'+source(url,label)),qa:[{q:'Is this an exact molecular structure?',a:'<p>This is an original schematic informed by structural references. Sizes and paths are illustrative; no atomic coordinates were computed.</p>',source:label,url}]}};
 if(options.qa)content.qa=options.qa;if(options.enQa)content.en.qa=options.enQa;
 entries.push({content,draw});
 if(!window.H||window.H.atlas)H.register(content,draw);
 return content;
}
function attachInspection(v,ctx,api,driver){
 if(!globalThis.B||!B.inspect)return()=>{};
 const controls=(api.inspect||[]).map((item,i)=>{const control=B.inspect(v.svg,item.actor,{...item,id:(v.root.dataset.sceneId||'molecular')+'-detail-'+i,onOpen:()=>driver.cancel()});ctx.onDispose(control.dispose);control.trigger.g.style.cursor='zoom-in';return {control,actor:item.actor};});
 function refresh(){controls.forEach(({control,actor})=>{
  let visible=v.svg.contains(actor.g);for(let n=actor.g;visible&&n;n=n.parentElement){
   const style=n.ownerDocument.defaultView.getComputedStyle(n),value=name=>style.getPropertyValue(name)||n.style.getPropertyValue(name)||n.getAttribute(name);
   if(Number(value('opacity')??1)===0||value('display')==='none'||['hidden','collapse'].includes(value('visibility')))visible=false;
   if(n===v.svg)break;
  }
  control.setBox();control.trigger.setDisabled(!visible);control.trigger.g.style.visibility=visible?'':'hidden';
 });}
 refresh();return refresh;
}
window.MOLECULAR_ATLAS={H,add:entry,entries,attachInspection};
})();
