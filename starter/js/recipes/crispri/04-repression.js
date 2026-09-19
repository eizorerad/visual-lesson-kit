(function(){
'use strict';
H.register({id:'target-and-repress',title:'Кто подавляет транскрипцию?',titleEn:'What represses transcription?',chapter:'Механизм',chapterEn:'Mechanism',
sources:[H.sources.gilbert,H.sources.krab,H.sources.elife],notes:[
 ['Перед нами два отдельных комплекса: guide A и guide B связаны с разными молекулами одного белка dCas9–KRAB. Белок заранее экспрессируется в выбранной клеточной модели. Форма, расстояния и время на рисунке схематичны. Сайты A и B здесь выбраны около одного промотора.','Two separate complexes contain guide A and guide B, each bound to a different molecule of the same dCas9–KRAB fusion protein. The chosen cell model already expresses this protein. Shapes, distances and timing are schematic. Sites A and B here are near one promoter.'],
 ['Комплекс распознаёт участок геномной ДНК: важны комплементарность направляющей и подходящий PAM на ДНК. Направляющая не ищет молекулу мРНК. dCas9 удерживается у мишени, но его нуклеазная активность отключена. Успешное связывание не означает автоматически сильного подавления.','The complex recognizes genomic DNA using guide complementarity and a suitable PAM on the DNA. It does not target the mRNA molecule. dCas9 binds the target with its nuclease activity disabled. Binding alone does not automatically imply strong repression.'],
 ['KRAB привлекает клеточный корепрессор KAP1/TRIM28. Через связанные механизмы, включая SETDB1 и HP1, формируется репрессивное состояние хроматина; характерная метка — H3K9me3. Это схема функциональных связей, не полная молекулярная структура или последовательность всех реакций.','KRAB recruits the cellular corepressor KAP1/TRIM28. Associated mechanisms, including SETDB1 and HP1, establish repressive chromatin; H3K9me3 is a characteristic mark. This is a functional schematic, not a complete molecular structure or a sequence of every reaction.'],
 ['Образуется меньше новых транскриптов целевого гена. Существующие мРНК и белки не исчезают мгновенно. Два guides могут повысить надёжность подавления, но не гарантируют удвоения эффекта. Переключатели показывают возможные механистические случаи, а не измеренную эффективность отдельных guides.','Fewer new target-gene transcripts are produced. Existing mRNA and proteins do not disappear instantly. Two guides can improve repression reliability but do not guarantee a doubling of the effect. The controls show possible mechanistic cases, not measured guide efficacies.']
],qa:[
 ['Если B не работает, A тоже перестанет работать?','Не обязательно. Комплекс с A может подавлять транскрипцию самостоятельно. Эффективность зависит от направляющей, положения мишени, хроматина и экспрессии эффектора.','If B fails, must A also fail?','No. The A complex may repress transcription on its own. Efficacy depends on guide sequence, target position, chromatin and effector expression.'],
 ['KRAB — отдельная guide RNA?','Нет. KRAB — белковый домен, слитый с dCas9. Guide RNA задаёт адрес, а домен KRAB привлекает клеточные механизмы репрессии.','Is KRAB another guide RNA?','No. KRAB is a protein domain fused to dCas9. The guide RNA specifies a target, while KRAB recruits cellular repression machinery.']
],build(ctx,v){
 const p=v.svg,state={bind:0,recruit:0,output:0,a:1,b:1};
 H.rect(p,170,376,510,68,C.grey,.035,12);
 H.text(ctx,p,170,465,490,36,'Промотор · два сайта около TSS','Promoter · two sites near the TSS',23,C.grey);
 B.dna(p,{x:640,y:410,width:1080,amplitude:8,color:C.grey,color2:C.grey});
 const siteA=H.rect(p,320,399,72,22,C.blue,.18,3),siteB=H.rect(p,550,399,72,22,C.teal,.18,3);
 const a=H.complex(p,350,255,C.blue,.9),b=H.complex(p,580,255,C.teal,.9);
 const nameA=H.text(ctx,p,245,169,210,36,'Комплекс A','Complex A',24,C.blue);
 const nameB=H.text(ctx,p,475,169,210,36,'Комплекс B','Complex B',24,C.teal);
 H.text(ctx,p,735,455,440,40,'Целевой ген → мРНК','Target gene → mRNA',24,C.gold);
 const tss=F.arrow(p,C.gold,2);tss.set(734,437,734,381);
 H.text(ctx,p,710,342,70,30,'TSS','TSS',21,C.gold);
 const chain=F.group(p),k=B.protein(chain,{kind:'kap1',x:865,y:265,scale:.55,color:C.purple}),s=B.protein(chain,{kind:'setdb1',x:1070,y:265,scale:.55,color:C.purple});
 H.text(ctx,chain,785,177,170,35,'KAP1 / TRIM28','KAP1 / TRIM28',21,C.purple);
 H.text(ctx,chain,987,177,165,35,'SETDB1 / HP1','SETDB1 / HP1',21,C.purple);
 const link=F.arrow(chain,C.purple,2);link.set(916,265,1015,265);
 const recruitment=F.path(chain,[[666,349],[725,275],[799,265]],C.purple,2);
 const recruitArrow=F.arrow(chain,C.purple,2);recruitArrow.set(798,265,819,265);
 const nucs=[860,1050].map(x=>B.nucleosome(p,{x,y:410,scale:.64,color:C.purple,marked:0}));
 const mark=H.text(ctx,p,814,305,330,38,'Хроматин: H3K9me3','Chromatin: H3K9me3',23,C.purple);
 const transcripts=Array.from({length:6},(_,i)=>{const g=F.group(p);B.transcript(g,{x:850+i*54,y:494,scale:.35,color:C.gold});return g;});
 const caps=[
 ['Guide задаёт адрес; dCas9 связывает ДНК; KRAB привлекает репрессию.','The guide specifies the target; dCas9 binds DNA; KRAB recruits repression.'],
 ['Два комплекса связывают два участка ДНК. Разреза нет.','Two complexes bind two DNA sites. No DNA cleavage occurs.'],
 ['KRAB привлекает белки, меняющие состояние хроматина.','KRAB recruits proteins that alter the chromatin state.'],
 ['Подавляется образование новых мРНК. Старые молекулы исчезают постепенно.','Production of new mRNA is reduced. Existing molecules decay gradually.']
 ];
 const captions=caps.map(x=>H.tr(...x));
 const buttons=[];
 function paint(){
  F.at(a.g,350,F.lerp(255,410,state.bind*state.a));F.at(b.g,580,F.lerp(255,410,state.bind*state.b));
  F.opacity(a.g,state.a?1:.28);F.opacity(b.g,state.b?1:.28);
  const active=state.a||state.b?1:0;
  recruitment.setAttribute('d',state.b?'M666,349 L725,275 L799,265':'M436,349 L710,310 L799,265');
  F.opacity(chain,state.recruit*active);F.opacity(mark.el,state.recruit*active);
  nucs.forEach(n=>{F.opacity(n.g,state.recruit*active);n.set({marked:state.output*active});});
  transcripts.forEach((n,i)=>F.opacity(n,(i<2?1:1-state.output*active)));
  [siteA,siteB].forEach((n,i)=>n.setAttribute('fill-opacity',(i===0?state.a:state.b)? .1+.28*state.bind:.05));
  buttons.forEach((b,i)=>b.setPressed(i===0?state.a===1&&state.b===1:i===1?state.a===1&&state.b===0:state.a===0&&state.b===0));
  v.root.dataset.activeGuides=String(state.a+state.b);v.root.dataset.bound=state.bind;
 }
 const m=H.motion(ctx,v,state,paint,caps);
 const modes=[['Оба комплекса','Both complexes',1,1],['Только A активен','Only A active',1,0],['Без связывания','No binding',0,0]];
 modes.forEach((z,i)=>buttons.push(H.button(ctx,p,'guide-mode-'+i,145+i*330,553,310,46,z[0],z[1],()=>{m.driver.set({bind:1,recruit:1,output:1,a:z[2],b:z[3]});v.caption(H.tr(i===0?'Две guides могут помочь. Эффект не обязан удваиваться.':i===1?'A может подавлять ген самостоятельно; B здесь не вносит вклад.':'Без направленного связывания нет показанной локальной репрессии.',i===0?'Two guides can help. The effect need not double.':i===1?'A may repress the gene on its own; B contributes nothing here.':'Without targeted binding, the local repression shown here is absent.'));},i===2?C.grey:C.blue)));
 m.step({bind:1,recruit:0,output:0,a:1,b:1},1,2100);m.step({bind:1,recruit:1,output:0,a:1,b:1},2,1700);m.step({bind:1,recruit:1,output:1,a:1,b:1},3,1700);paint();
}});
})();
