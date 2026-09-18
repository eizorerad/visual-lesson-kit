(function(){'use strict';
Bio3D.scene({id:'three-codes',chapter:['Три кода','Three codes'],title:['Как три кода превращаются в отсчёт','How three codes become a count'],notes:[
['После разрушения эмульсии, извлечения бусин и синтеза рассмотрим два примера ДНК-продуктов: из мРНК и из метки антитела. Это схема последующих продуктов библиотек для прослеживания происхождения кодов. Двойная спираль здесь не изображает первые промежуточные продукты обратной транскрипции, исходную РНК или само антитело. Цветные участки обозначают функции; порядок и длины нуклеотидов условны. Коды A, GCT и TGA — укороченные учебные примеры.','After emulsion breakage, bead recovery and synthesis, consider two example DNA products: one from mRNA and one from an antibody tag. These schematic downstream library products trace the ancestry of their codes. The double helix is not a snapshot of first-strand reverse-transcription intermediates, original RNA or antibody. Colored segments represent functions; sequence order and lengths are schematic. A, GCT and TGA are shortened teaching codes.'],
['Золотой участок отвечает «из какой клетки?». Оба продукта получили A от праймеров одной бусины. Поэтому РНК и ADT можно сопоставить одной клетке в выбранном примере. При doublet один barcode может относиться к нескольким клеткам.','The gold segment answers “which cell?”. Both products inherited A from primers on the same bead. RNA and ADT can therefore be linked to one cell in this selected example. In a doublet, one barcode may refer to more than one cell.'],
['Признак определяют по-разному: фрагмент RNA картируют на ген, здесь CD4; известную последовательность ДНК-метки сопоставляют антителу anti-CD4. Одинаковое имя мишени не превращает РНК и ADT в один вид измерения.','Feature identity is decoded differently: the RNA-derived sequence maps to a gene, CD4 here; the known antibody-tag sequence identifies the anti-CD4 reagent. A shared target name does not turn RNA and ADT into the same measurement.'],
['Фиолетовый UMI происходит из праймера бусины и включается в продукт до PCR. Для выбранного ADT это TGA. Его PCR-потомки сохраняют этот UMI. UMI рассматривают вместе с клеткой и признаком; короткие UMI могут случайно совпадать.','The purple UMI comes from the bead primer and is incorporated before PCR. The selected ADT carries TGA, which its PCR descendants retain. A UMI is interpreted together with cell and feature identity; short UMIs can collide.'],
['Показана связь исходного ADT-продукта с одной его PCR-копией. Копия появляется из того же примера и сохраняет все три поля: A, anti-CD4, TGA. Это условный показ родства продуктов, а не симуляция работы полимеразы. Третья молекула не означает третье независимое событие захвата.','The ADT product is now related to one of its PCR copies. The copy emerges from that same example and retains all three fields: A, anti-CD4, TGA. This illustrates product ancestry, not polymerase action. A third DNA product does not imply a third independent capture event.'],
['После секвенирования два ADT-чтения дают одинаковый ключ: клетка A, антитело anti-CD4, UMI TGA. В данных они образуют один уникальный ADT-отсчёт. Обе ДНК остаются отдельными; подсчёт не соединяет молекулы и не измеряет точное число белков. В реальном анализе также учитывают ошибки секвенирования и совпадения UMI.','After sequencing, the two ADT reads have the same key: cell A, anti-CD4 antibody and UMI TGA. In the data they yield one unique ADT count. Both DNA products remain separate; counting neither joins molecules nor measures an exact protein number. Real analysis also handles sequencing errors and UMI collisions.']
],qa:[['Одинаковый UMI в разных клетках — одна молекула?','Does the same UMI in different cells mean one molecule?','Нет. Дедупликация учитывает клетку и признак; короткие UMI могут случайно совпасть.','No. Deduplication is conditioned on cell and feature, and short UMIs can collide.'],['Почему UMI не равен коду антитела?','Why is a UMI different from an antibody code?','Код антитела идентифицирует реагент. UMI различает захваченные фрагменты в контексте клетки и признака; PCR-копии сохраняют UMI исходного продукта.','The antibody code identifies a reagent. A UMI distinguishes captured fragments within a cell and feature; PCR copies retain their source product’s UMI.']],build(ctx){
const v=Bio3D.stage(ctx,'Как три кода превращаются в отсчёт','How three codes become a count');
const st={cell:0,feature:0,umi:0,copy:0,dedup:0,chapter:0},model=V3.CodesMesh.create(),camera={cx:550,cy:399,scale:64};
const surface=V3.CellSurface.create(v.svg,camera,{frame:{x:60,y:147,width:1160,height:427},molecules:model.molecules,includeCell:false});
ctx.onDispose(surface.dispose);surface.g.dataset.codesProducts='3';
const p=F.group(v.svg),lines=F.group(p),labels=F.group(p);
Bio3D.text(labels,70,147,1140,32,'Схема ДНК-продуктов: прослеживаем происхождение кодов','Schematic DNA products: tracing where their codes came from',21,C.grey);
const headers=[Bio3D.text(labels,274,187,190,32,'Клеточный код','Cell barcode',21,C.gold),Bio3D.text(labels,436,187,100,32,'UMI','UMI',23,C.purple),Bio3D.text(labels,549,187,238,32,'Какой признак?','Which feature?',22,C.teal)];
const rowY=[300,409,518],rowLabels=[['ДНК из мРНК','DNA from mRNA'],['ДНК из ADT','DNA from ADT'],['PCR-копия ADT','ADT PCR copy']];
const productLabels=rowLabels.map((a,i)=>Bio3D.text(labels,65,rowY[i]-20,197,40,...a,21,i?C.teal:C.blue));
const values=model.molecules.map((m,i)=>{
 const group=F.group(labels);group.dataset.codesProduct=m.id;
 return {group,fields:[Bio3D.text(group,0,0,80,32,'A','A',24,C.gold),Bio3D.text(group,0,0,90,32,m.umi,m.umi,24,C.purple),Bio3D.text(group,0,0,220,32,i?'код anti-CD4':'фрагмент CD4',i?'anti-CD4 code':'CD4-derived fragment',21,i?C.teal:C.blue)],leaders:[C.gold,C.purple,i?C.teal:C.blue].map(color=>Bio3D.path(lines,'M0 0',color,1.4))};
});
// Explanatory panels fade sequentially. Molecular orientations stay fixed.
const panels=[
 ['Два источника','Two origins','ДНК из мРНК и ДНК-метки антитела.','DNA from mRNA and from an antibody tag.','Разберём три поля каждой записи.','Let’s inspect the three fields of each record.'],
 ['Из какой клетки?','Which cell?','A → клетка A','A → cell A','Один адрес связывает RNA и ADT.','One address links RNA and ADT.'],
 ['Что измерили?','What was measured?','RNA → ген CD4','RNA → gene CD4','ADT → антитело anti-CD4','ADT → anti-CD4 antibody'],
 ['UMI получен до PCR','UMI was added before PCR','Для этого ADT: TGA','For this ADT: TGA','PCR-копии сохранят тот же UMI.','PCR copies will retain the same UMI.'],
 ['PCR делает копию','PCR makes a copy','A · anti-CD4 · TGA','A · anti-CD4 · TGA','Все три поля копируются вместе.','All three fields are copied together.']
].map((a,i)=>{const g=F.group(labels);g.dataset.codesExplanation=String(i);Bio3D.text(g,848,252,353,62,a[0],a[1],25,i===1?C.gold:i===3?C.purple:C.white);Bio3D.text(g,858,326,333,74,a[2],a[3],23,i===2?C.blue:i===3?C.purple:C.white);Bio3D.text(g,858,414,333,90,a[4],a[5],22,i===2?C.teal:C.grey);return g;});
const copyArrow=Bio3D.path(lines,'M0 0',C.teal,2);copyArrow.dataset.codesConnector='pcr-copy';
const data=F.group(labels);data.dataset.codesData='';
Bio3D.text(data,844,237,366,48,'Секвенирование → данные','Sequencing → data',24,C.white);
Bio3D.text(data,858,285,337,28,'Клетка · антитело · UMI','Cell · antibody · UMI',19,C.grey);
const records=[0,1].map(i=>{
 const y=330+i*74,card=F.group(data);card.dataset.codesRecord=String(i);
 Bio3D.rect(card,861,y,334,46,C.teal,.06,6);
 Bio3D.text(card,866,y+5,56,36,'A','A',23,C.gold);Bio3D.text(card,922,y+5,194,36,'anti-CD4','anti-CD4',23,C.teal);Bio3D.text(card,1116,y+5,74,36,'TGA','TGA',23,C.purple);
 const track=Bio3D.path(lines,'M0 0',C.grey,1.4),token=F.group(labels);token.dataset.codesRead=String(i);token.dataset.codesTargetX='1028';token.dataset.codesTargetY=String(y+23);F.dot(token,0,0,5,C.teal);
 return {card,track,token,target:{x:1028,y:y+23}};
});
const result=F.group(data);result.dataset.codesCount='';
Bio3D.path(result,'M1203 353 L1213 353 L1213 427 L1203 427 M1213 390 L1213 487 L1034 487 L1034 497 M1029 492 L1034 497 L1039 492',C.purple,2);
Bio3D.rect(result,895,501,292,59,C.purple,.12,8);Bio3D.text(result,901,508,280,44,'1 отсчёт ADT','1 ADT count',30,C.purple);
const foot=Bio3D.text(labels,65,580,1150,29,'Учебные коды и геометрия; длины и порядок участков условны.','Teaching codes and geometry; segment lengths and order are schematic.',19,C.grey);
const grouping=Bio3D.text(labels,65,580,1150,29,'Один ключ A + anti-CD4 + TGA. Группируются записи, а не молекулы.','One key: A + anti-CD4 + TGA. Records are grouped; molecules stay separate.',19,C.grey);
const poses=[];
function paint(){
 const c=st.cell,f=st.feature,u=st.umi,b=st.copy,d=st.dedup,copyMove=F.phase(b,0,1),copyVisible=F.phase(b,.025,.22),copyLabels=F.phase(b,.84,1),focus=Math.max(c,f,u);
 const anchors=[];
 model.molecules.forEach((m,i)=>{
  const visibility=i===2?copyVisible:1,context=i===0?1-.56*d-.35*u:1;
  const base=.35+.65*(1-focus),alpha=visibility*context;
  const parts={linker:{opacity:(.4+.3*(1-focus))*alpha},primer:{opacity:(base+.65*c)*alpha},umi:{opacity:(base+.65*u)*alpha},[i?'tag':'rna']:{opacity:(base+.65*f)*alpha}};
  const y=i===2?rowY[1]+(rowY[2]-rowY[1])*copyMove:rowY[i];
  poses[i]=V3.CodesMesh.pose([0,(camera.cy-y)/camera.scale,i===0?-.28:.34],0,14,parts);poses[i].opacity=visibility;
  const projected=['cell','umi','feature'].map(key=>V3.CodesMesh.project(model.anchors[key],poses[i],camera));anchors.push(projected);
  const labelVisibility=i===2?copyLabels:1;
  projected.forEach((a,j)=>{
   const role=j===0?'primer':j===1?'umi':i?'tag':'rna',top=Math.min(...model.bounds[i][role].map(point=>V3.CodesMesh.project(point,poses[i],camera).y));
   const width=j===2?220:j===1?90:80,box={x:a.x-width/2,y:top-42,width,height:32};
   values[i].fields[j].setBox(box);F.opacity(values[i].fields[j].el,parts[role].opacity*labelVisibility);
   values[i].leaders[j].setAttribute('d',`M${a.x} ${box.y+34} L${a.x} ${a.y-6}`);F.opacity(values[i].leaders[j],parts[role].opacity*.65*labelVisibility);
  });
  F.opacity(productLabels[i].el,(i===2?copyLabels:1)*context);
 });
 surface.paint({cellOpacity:0,moleculePoses:poses});
 panels.forEach((g,i)=>F.opacity(g,Math.max(0,1-Math.abs(st.chapter-i)*2.8)*(i===4?1-F.phase(d,0,.14):1)));
 headers.forEach((h,i)=>F.opacity(h.el,i===0?.5+.5*(1-focus+c):i===1?.5+.5*(1-focus+u):.5+.5*(1-focus+f)));
 const endpoints=[1,2].map(i=>V3.CodesMesh.project(model.anchors.end,poses[i],camera));
 copyArrow.setAttribute('d',`M${endpoints[0].x+9} ${endpoints[0].y} L832 ${endpoints[0].y} L832 ${endpoints[1].y} L${endpoints[1].x+9} ${endpoints[1].y} M${endpoints[1].x+15} ${endpoints[1].y-5} L${endpoints[1].x+9} ${endpoints[1].y} L${endpoints[1].x+15} ${endpoints[1].y+5}`);
 F.opacity(copyArrow,F.phase(b,.24,.75)*(1-F.phase(d,0,.12)));
 const travel=F.phase(d,.2,.65),recordOpacity=F.phase(d,.62,.72),countOpacity=F.phase(d,.78,.98);
 F.opacity(data,F.phase(d,.16,.3));
 records.forEach((r,i)=>{
  const start={x:endpoints[i].x+10,y:endpoints[i].y},x=start.x+(r.target.x-start.x)*travel,y=start.y+(r.target.y-start.y)*travel;
  r.track.setAttribute('d',`M${start.x} ${start.y} L${r.target.x} ${r.target.y}`);F.opacity(r.track,F.phase(d,.16,.2)*(1-F.phase(d,.62,.72))*.5);
  F.at(r.token,x,y);F.opacity(r.token,F.phase(d,.16,.2)*(1-F.phase(d,.62,.72)));F.opacity(r.card,recordOpacity);
 });
 F.opacity(result,countOpacity);F.opacity(foot.el,1-F.phase(d,0,.3));F.opacity(grouping.el,F.phase(d,.78,.98));
 Object.assign(v.root.dataset,{codesCell:String(c),codesFeature:String(f),codesUmi:String(u),codesCopy:String(b),codesDedup:String(d),codesChapter:String(st.chapter),codesDnaProducts:copyVisible>.01?'3':'2',codesReadProgress:String(travel),codesRecordsArrived:travel===1?'2':'0',codesReadRecords:recordOpacity===1?'2':'0',codesUniqueAdt:countOpacity===1?'1':'0'});
}
Bio3D.motion(ctx,v,st,paint,[
 ['Начнём с двух продуктов: один из мРНК, другой из ДНК-метки антитела.','Start with two products: one from mRNA, one from an antibody DNA tag.'],
 ['Оба кода A указывают на одну клетку в нашем примере.','Both A barcodes identify the same cell in this example.'],
 ['Для RNA определяем ген; для ADT узнаём антитело по его коду.','For RNA, identify the gene; for ADT, look up the antibody code.'],
 ['UMI TGA был включён до PCR и сохраняется в копиях.','UMI TGA was incorporated before PCR and is retained in its copies.'],
 ['PCR-копия сохраняет A, anti-CD4 и TGA: нового захвата не было.','The PCR copy retains A, anti-CD4 and TGA: no new capture occurred.'],
 ['Два чтения с одним ключом дают один ADT-отсчёт.','Two reads with the same key yield one ADT count.']
],[{cell:1,chapter:1},{cell:0,feature:1,chapter:2},{feature:0,umi:1,chapter:3},{umi:0,copy:1,chapter:4},{dedup:1,chapter:5}],[2200,2400,2400,3400,3800]);paint();return v.root;}});
})();
