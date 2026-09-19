/* Lesson-specific composition helpers; scientific actors remain kit objects. */
(function(g){
'use strict';
const dict={};
function tr(ru,en){if(en && !dict[ru]){dict[ru]=en;D.i18n.pack('en',{strings:{[ru]:en}});}return ru;}
function text(ctx,parent,x,y,width,height,ru,en,size=25,color=C.white,align='center'){
 const t=L.textBox(parent,{x,y,width,height,text:tr(ru,en),size,color,align,padding:0,lineHeight:1.2});ctx.onDispose(t.dispose);return t;
}
function rect(p,x,y,w,h,color=C.grey,fill=.06,r=12){const n=D.dom.s('rect',{x,y,width:w,height:h,rx:r,fill:color,'fill-opacity':fill,stroke:color,'stroke-opacity':.45,'stroke-width':1.4});p.append(n);return n;}
function button(ctx,p,id,x,y,w,h,ru,en,fn,color=C.blue){
 const b=T.svgButton(p,{id,box:{x,y,width:w,height:h},label:tr(ru,en),onActivate:fn,pressed:false});
 const bg=rect(b.g,x,y,w,h,color,.06,8);text(ctx,b.g,x+10,y+5,w-20,h-10,ru,en,21,color);ctx.onDispose(b.dispose);
 return {g:b.g,setPressed(v){b.setPressed(v);bg.setAttribute('fill-opacity',v?.19:.035);bg.setAttribute('stroke-opacity',v?.9:.35);},dispose:b.dispose};
}
function register(def){
 const notes=def.notes.map(n=>'<p>'+n[0]+'</p>');
 const enNotes=def.notes.map(n=>'<p>'+n[1]+'</p>');
 const sources=(def.sources||[]).map(s=>'<p><a href="'+s[1]+'" target="_blank" rel="noopener">'+s[0]+'</a></p>').join('');
 const qa=(def.qa||[]).map(q=>({q:tr(q[0],q[2]),a:'<p>'+q[1]+'</p>',source:def.source||'Учебная схема'}));
 const enQA=(def.qa||[]).map(q=>({q:q[2],a:'<p>'+q[3]+'</p>',source:def.sourceEn||'Schematic teaching example'}));
 D.i18n.pack('en',{notes:{[def.id]:enNotes.map(n=>n+sources)},qa:{[def.id]:enQA}});
 D.deck.register({id:def.id,title:tr(def.title,def.titleEn),chapter:tr(def.chapter,def.chapterEn),notes:notes.map(n=>n+sources),qa,build:ctx=>{
  const v=F.stage(ctx,def.title,def.chapter,tr(def.source||'Учебная схема · не молекулярная симуляция',def.sourceEn||'Schematic · not a molecular simulation'));
  v.root.dataset.lessonScene=def.id;def.build(ctx,v);return v.root;
 }});
}
function motion(ctx,v,state,paint,captions){
 const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);v.caption(tr(...captions[0]));paint();
 return {driver,step(patch,index,duration=1800){ctx.step(()=>{v.caption(tr(...captions[index]));return driver.to(patch,{duration});});}};
}
function complex(parent,x,y,color=C.blue,scale=1){
 const outer=F.group(parent);F.at(outer,x,y);const body=F.group(outer);body.setAttribute('transform','scale('+scale+')');
 const cas=B.cas9(body,{color:C.white});const krab=B.protein(body,{kind:'krab',x:76,y:-54,scale:.48,color:C.purple});
 F.line(body,48,-32,67,-46,C.purple,2);
 const guide=B.guide(body,{x:-12,y:-10,scale:.67,spacerColor:color,scaffoldColor:color});
 return {g:outer,body,cas,krab,guide};
}
g.H={tr,text,rect,button,register,motion,complex,sources:{cell:['Replogle et al., Cell 2022','https://pmc.ncbi.nlm.nih.gov/articles/PMC9380471/'],elife:['Replogle, Bonnar et al., eLife 2022','https://elifesciences.org/articles/81856'],arc:['Arc Institute · Virtual Cell Challenge 2025','https://arcinstitute.org/news/behind-the-data-virtual-cell-challenge'],lenti:['Addgene · Lentiviral Vector Guide','https://www.addgene.org/guides/lentivirus/'],krab:['Stoll et al., EMBO Journal 2022','https://pmc.ncbi.nlm.nih.gov/articles/PMC9753469/'],gilbert:['Gilbert et al., Cell 2014','https://pmc.ncbi.nlm.nih.gov/articles/PMC4253859/']}};
})(window);
