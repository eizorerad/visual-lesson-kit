(function(g){
'use strict';
const R={};let uid=0;
// Register the lesson in teaching order after all episode definitions are loaded.
// Shared by the rna-folding and rna-prediction templates; template-specific
// episodes live beside their own rna-order.js.
const episodes=[];
R.register=def=>episodes.push(def);
// Each template supplies its own teaching order, chapter names and chapter
// boundaries; the shared episode files never encode a presentation outline.
const DEFAULT_ORDER=['rna-map','rna-protein','rna-nucleotide','rna-chemistry','rna-pairs','rna-loops','rna-representations','rna-pseudoknot','rna-geometry','rna-trna-real','rna-docking','rna-anchors','rna-ions','rna-cotranscription','rna-evidence','rna-ml','rna-takeaways'];
const DEFAULT_CHAPTERS=[['Основания и цепь','Bases and backbone'],['Пары и форма','Pairs and shape'],['Контакты и среда','Contacts and environment'],['Путь и предсказание','Pathway and prediction']];
R.finish=function(config={}){
 const order=config.order||DEFAULT_ORDER,chapters=config.chapters||DEFAULT_CHAPTERS,cuts=config.cuts||[6,10,13],strict=config.strict!==false;
 const chosen=strict?episodes:episodes.filter(def=>order.includes(def.id));
 chosen.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).forEach(def=>{
  const i=order.indexOf(def.id);if(i<0)throw Error('Missing teaching order: '+def.id);
  def.chapter=chapters[i<cuts[0]?0:i<cuts[1]?1:i<cuts[2]?2:3];R.mount(def);
 });
};
R.t=(ru,en=ru)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
R.box=function(parent,x,y,width,height,ru,en=ru,size=26,color=C.white,align='center'){
 return L.textBox(parent,{id:'rna-text-'+(++uid),x,y,width,height,text:R.t(ru,en),size,color,padding:0,lineHeight:1.22,align,valign:'middle'});
};
R.label=function(parent,x,y,text,size=23,color=C.white,w=80,h=38){
 h=Math.max(h,size*1.5);const n=F.label(parent,x,y+size*.09,text,size,color);L.contract(n,{id:'rna-label-'+(++uid),box:{x:x-w/2,y:y-h/2,width:w,height:h},space:parent});return n;
};
R.rect=(p,x,y,w,h,color=C.grey,fill='none',rx=12)=>{const n=D.dom.s('rect',{x,y,width:w,height:h,rx,stroke:color,'stroke-width':1.5,fill});p.append(n);return n;};
R.path=(p,d,color=C.blue,width=3)=>{const n=D.dom.s('path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});p.append(n);return n;};
R.mix=(a,b,t)=>a.map((p,i)=>[F.lerp(p[0],b[i][0],t),F.lerp(p[1],b[i][1],t)]);
R.seq='GGACGAAACGUCC';
R.pairs=[[0,12],[1,11],[2,10],[3,9],[4,8]];
R.hairpinPoints=function(cx=600,cy=360,s=1){
 return [[-57,128],[-57,89],[-57,50],[-57,11],[-57,-28],[-45,-91],[0,-121],[45,-91],[57,-28],[57,11],[57,50],[57,89],[57,128]].map(p=>[cx+p[0]*s,cy+p[1]*s]);
};
R.chain=function(parent,seq,positions,pairs=[],radius=18,baseColor=C.blue){
 const q=F.group(parent),back=F.path(q,positions,C.grey,2.2),links=pairs.map(()=>F.line(q,0,0,0,0,C.gold,2,'4 5'));
 const nodes=[...seq].map((base,i)=>{const n=F.group(q);n.dataset.baseIndex=i;n.dataset.base=base;const dot=F.dot(n,0,0,radius,'var(--color-bg)');dot.setAttribute('stroke',baseColor);dot.setAttribute('stroke-width',1.7);R.label(n,0,1,base,radius*.96,C.white,radius*1.8,radius*1.9);return n;});
 function set(points,pairProgress=1){back.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));nodes.forEach((n,i)=>F.at(n,...points[i]));links.forEach((n,k)=>{const a=points[pairs[k][0]],b=points[pairs[k][1]],len=Math.hypot(b[0]-a[0],b[1]-a[1]),r=Math.min(radius+3,len/2),dx=(b[0]-a[0])/Math.max(1,len),dy=(b[1]-a[1])/Math.max(1,len);F.seg(n,a[0]+dx*r,a[1]+dy*r,b[0]-dx*r,b[1]-dy*r);F.opacity(n,typeof pairProgress==='number'?pairProgress:pairProgress[k]);});}
 set(positions,0);return {g:q,nodes,links,back,set};
};
R.helix=function(parent,{x=0,y=0,length=160,width=64,angle=0,color=C.blue,levels=5}={}){
 const q=F.group(parent);F.line(q,-width/2,-length/2,-width/2,length/2,color,2.6);F.line(q,width/2,-length/2,width/2,length/2,color,2.6);
 for(let i=0;i<levels;i++){const yy=-length/2+i*length/(levels-1);F.line(q,-width/2+4,yy,width/2-4,yy,C.gold,2);F.dot(q,-width/2,yy,4,color);F.dot(q,width/2,yy,4,color);}
 function set(p){x=p.x??x;y=p.y??y;angle=p.angle??angle;q.setAttribute('transform',`translate(${x} ${y}) rotate(${angle})`);}
 set({});return {g:q,set};
};
R.mount=function(def){
 const title=R.t(...def.title),chapter=R.t(...(def.chapter||['Укладка РНК','RNA folding']));
 const states=def.states;states.forEach(s=>R.t(s[0],s[1]));const source=def.source||['Авторская учебная схема',''];
 const qa=(def.qa||[]).map(q=>({q:q.q[0],a:q.a[0],source:q.source||source[0],url:q.url||source[1]}));
 D.i18n.pack('en',{notes:{[def.id]:states.map(s=>F.note(s[3]||s[1],source[0],source[1]))},qa:{[def.id]:(def.qa||[]).map(q=>({q:q.q[1],a:q.a[1],source:q.source||source[0],url:q.url||source[1]}))}});
 D.deck.register({id:def.id,title,chapter,notes:states.map(s=>F.note(s[2]||s[0],source[0],source[1])),qa,build(ctx){
  const v=F.stage(ctx,title,chapter,R.t(...(def.status||['Авторская схема · движение не является физической симуляцией','Authored schematic · motion is not a physical simulation'])));
  const model=def.build(ctx,v);if(model.patches.length!==states.length-1)throw Error(def.id+': notes mismatch');
  const driver=F.driver(model.state,model.paint);ctx.onDispose(driver.dispose);model.bind?.(driver);
  model.paint();v.caption(states[0][0]);
  model.patches.forEach((patch,i)=>ctx.step(()=>{v.caption(states[i+1][0]);return driver.to(patch,{duration:model.durations?.[i]||1700});}));
  v.root.dataset.rnaScene=def.id;return v.root;
 }});
};
g.RNA=R;
})(window);
