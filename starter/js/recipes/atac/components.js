/* Independent actor recipes. No film clock/controller/story is loaded.
 * Copy one registration and its dependencies into another lesson.
 * Source coordinates and pedagogical data retain their scientific meanings.
 */
(function(g){
'use strict';
const tr=(ru,en)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
const copy=key=>{const row=g.ATAC_COPY.find(r=>r.key===key);if(!row)throw Error('Missing ATAC copy '+key);return row;};
const row=(key,pose,overrides={})=>({...copy(key),pose,...overrides});
const examples=[
 {id:'atac-source-views',actor:'AtacStructureViews',status:['Координаты PDB · камера меняет представление','PDB coordinates · camera changes the view'],states:[
  row('nucleosome-real',{stage:0,turn:0}),row('histone-octamer',{stage:1,turn:24}),row('wrapped-dna',{stage:2,turn:40}),row('tn5-real',{stage:3,turn:0}),row('tn5-end-dna',{stage:4,turn:0})]},
 {id:'atac-origin-example',actor:'AtacFragmentOrigin',status:['Два поясняющих примера · длины условны','Two explanatory examples · arbitrary length units'],states:[
  row('short-origin',{stage:0,turn:0}),row('nucleosomal-origin',{stage:1,turn:0}),row('contour-length',{stage:2,turn:0})]},
 {id:'atac-reading-example',actor:'AtacReadViews',status:['Синтетическая вставка F001 · схема синтеза','Synthetic insert F001 · synthesis schematic'],states:[
  row('read-orientation',{stage:0}),row('read-one',{stage:1}),row('read-two',{stage:2}),row('paired-reads',{stage:3}),row('mapping',{stage:4})]},
 {id:'atac-histogram-example',actor:'AtacSignals',status:['150 исходных фрагментов · учебные данные','150 original fragments · synthetic data'],states:[
  row('lengths',{stage:11,lengthReveal:0},{titleRu:'Каждый фрагмент имеет свою длину',titleEn:'Each fragment has its own length',captionRu:'Ось разбита на интервалы по 25 п. н.; по вертикали будем считать фрагменты.',captionEn:'The axis uses 25 bp bins; the vertical axis will count fragments.'}),
  row('lengths',{stage:11,lengthReveal:.55},{titleRu:'Собираем фрагменты в интервалы',titleEn:'Group fragments into length bins',captionRu:'Каждая исходная молекула добавляет один вклад в свой интервал.',captionEn:'Each original molecule adds one contribution to its bin.'}),
  row('lengths',{stage:11,lengthReveal:1},{titleRu:'Распределение построено из тех же записей',titleEn:'The distribution uses the same records',captionRu:'В сумме — 150 фрагментов. Форма распределения здесь создана для обучения.',captionEn:'The total is 150 fragments. This distribution is a synthetic teaching example.'})]}
];
g.AtacComponentExamples={catalog:examples,active:null};
for(const spec of examples){
 const first=spec.states[0],notes=lang=>spec.states.map(r=>F.note(r['note'+lang],r.sourceLabel,r.sourceUrl));
 D.i18n.pack('en',{notes:{[spec.id]:notes('En')}});
 D.deck.register({id:spec.id,title:tr(first.titleRu,first.titleEn),chapter:tr('Хроматин, структура и измерения','Chromatin, structure and measurements'),notes:notes('Ru'),
  build(ctx){
   const v=F.stage(ctx,tr(first.titleRu,first.titleEn),'',tr(...spec.status));
   v.heading.setAttribute('data-i18n-ignore','');v.cap.setAttribute('data-i18n-ignore','');
   const actor=g[spec.actor].create(v.svg),state={visibility:1,...first.pose};let index=0;
   function paint(){
    const current=spec.states[index],lang=D.i18n.lang()==='en'?'En':'Ru';
    v.title(current['title'+lang]);v.caption(current['caption'+lang]);
    const snapshot=actor.paint(state);v.root.dataset.component=spec.id;
    g.AtacComponentExamples.active={id:spec.id,state,snapshot,paint,actor,select};
   }
   const driver=F.driver(state,paint);
   function select(i,animate=false){
    if(!Number.isInteger(i)||!spec.states[i])throw new RangeError('Unknown component state');
    index=i;return animate?driver.to(spec.states[i].pose,{duration:2200}):driver.set(spec.states[i].pose);
   }
   ctx.onDispose(driver.dispose);ctx.onDispose(actor.dispose);
   ctx.onDispose(()=>{if(g.AtacComponentExamples.active?.id===spec.id)g.AtacComponentExamples.active=null;});
   ctx.onDispose(D.i18n.onChange(paint));
   spec.states.slice(1).forEach((r,i)=>ctx.step(()=>select(i+1,true)));
   paint();return v.root;
  }
 });
}
})(window);
