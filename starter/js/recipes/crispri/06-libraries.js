(function(){
'use strict';
H.register({
 id:'crispri-libraries',title:'Три числа, которые нельзя смешивать',titleEn:'Three counts that mean different things',chapter:'Библиотека',chapterEn:'Library design',
 notes:[
  ['Учебная библиотека таргетирует один ген G. В первом варианте A, B, C и D находятся в четырёх отдельных single-guide конструкциях. Каждая изображённая клетка получает одну копию одной конструкции. Буквы обозначают разные последовательности направляющих, а не гены. Число клеток на рисунке иллюстративно.','The teaching library targets one gene G. A, B, C and D initially occupy four separate single-guide constructs. Each illustrated cell receives a copy of one construct. Letters identify different guide sequences, not genes. Cell counts in the drawing are illustrative.'],
  ['Во втором варианте одна конструкция A+B содержит две направляющие одного гена. Все клетки этой группы получают копии одной и той же пары. Две совместно доставленные sgRNA не дают двух независимых оценок фенотипа: их отдельные вклады здесь не разделены.','The second design has one A+B construct containing two guides for the same gene. Cells in this group receive copies of that same pair. Two jointly delivered sgRNAs do not provide two independent phenotype estimates; their individual contributions are not separated.'],
  ['В третьем варианте есть две разные dual-guide конструкции — A+B и C+D. Теперь можно сравнить ответ на две пары. Итого нужно различать три числа: guides в конструкции, конструкций на ген, конструкций в клетке. В реальной библиотеке Replogle/Bonnar доступны подбиблиотеки 1+2, 3+4 и 5+6; выбор dual-guide не означает, что возможна только одна пара на ген.','The third design has two distinct dual-guide constructs: A+B and C+D. Their responses can now be compared. Distinguish guides per construct, constructs per gene, and constructs per cell. Replogle/Bonnar provide sublibraries 1+2, 3+4 and 5+6; dual-guide does not imply only one possible pair per gene.']
 ],qa:[
  ['Single-guide означает одну направляющую на ген во всей библиотеке?','Нет. Single-guide описывает одну sgRNA внутри отдельной конструкции. Один ген может быть представлен несколькими разными single-guide конструкциями.','Does single-guide mean only one guide per gene in the whole library?','No. Single-guide describes the sgRNA count inside one construct. Several distinct single-guide constructs can target the same gene.'],
  ['Почему A+B не равно двум независимым проверкам?','Обе направляющие действуют в одних клетках одновременно. Из этой группы нельзя отдельно оценить фенотип A и фенотип B.','Why is A+B not two independent checks?','Both guides act together in the same cells. That group does not separately estimate the phenotype caused by A or B.']
 ],sources:[H.sources.cell,H.sources.elife],
 build(ctx,v){
  const s={mode:0,delivery:1};let motion;
  const modes=[['A · B · C · D','A · B · C · D'],['Одна пара A+B','One pair A+B'],['Пары A+B и C+D','Pairs A+B and C+D']];
  const buttons=modes.map((m,i)=>H.button(ctx,v.svg,'library-design-'+i,80+i*380,151,360,48,m[0],m[1],()=>{
   motion.driver.set({mode:i,delivery:0});motion.driver.to({delivery:1},{duration:950});
  },i===0?C.blue:i===1?C.teal:C.purple));
  H.text(ctx,v.svg,80,218,570,42,'Разные конструкции для гена G','Distinct constructs for gene G',26);
  H.text(ctx,v.svg,735,218,470,54,'Копии конструкций в клетках','Copies of constructs in cells',25);
  const colors=[C.blue,C.teal,C.purple,C.gold],layers=[];
  const sourceCoordinates=[[[110,330],[390,330],[110,430],[390,430]],[[250,370]],[[250,325],[250,430]]];
  const designs=[[['A'],['B'],['C'],['D']],[['A','B']],[['A','B'],['C','D']]];
  designs.forEach((rows,k)=>{const layer=F.group(v.svg);layers.push(layer);rows.forEach((guides,j)=>{
   PD.cassette(layer,{x:sourceCoordinates[k][j][0],y:sourceCoordinates[k][j][1],width:k===0?210:270,guides,colors:guides.map(a=>colors['ABCD'.indexOf(a)])});
  });});
  const cells=Array.from({length:12},(_,i)=>{const x=785+(i%4)*120,y=305+Math.floor(i/4)*76;const cell=F.cell(v.svg,x,y,34,C.grey,'library-cell-'+i);cell.nucleus.style.display='none';const token=F.group(v.svg);H.rect(token,-29,-15,58,30,C.blue,.15,7);const label=H.text(ctx,token,-27,-14,54,28,'A','A',21,C.blue);return{x,y,token,label};});
  const cards=[['sgRNA / конструкцию','sgRNAs / construct'],['конструкций / ген','constructs / gene'],['конструкций / клетку','constructs / cell']];
  const values=cards.map((c,i)=>{const x=80+i*380;H.rect(v.svg,x,514,360,89,i===0?C.teal:i===1?C.purple:C.blue,.035,10);H.text(ctx,v.svg,x+12,522,336,31,c[0],c[1],22);return H.text(ctx,v.svg,x+12,555,336,41,'1','1',31,C.gold);});
  const captions=[
   ['A, B, C и D: четыре отдельные конструкции, каждая с одной sgRNA.','A, B, C and D: four separate constructs, one sgRNA in each.'],
   ['A+B: две sgRNA вместе; клетки повторяют одну и ту же интервенцию.','A+B: two sgRNAs together; cells repeat the same intervention.'],
   ['A+B и C+D: две конструкции позволяют сравнить независимые наборы направляющих.','A+B and C+D: two constructs let us compare different guide sets.']
  ];
  function paint(){
   const k=Math.max(0,Math.min(2,Math.round(s.mode)));layers.forEach((g,i)=>g.style.display=i===k?'':'none');buttons.forEach((b,i)=>b.setPressed(i===k));
   cells.forEach((cell,i)=>{const j=k===0?i%4:k===1?0:i%2;const origin=sourceCoordinates[k][j];const label=designs[k][j].join('+');cell.label.setText(label);const fromX=origin[0]+(k===0?105:135),fromY=origin[1];F.at(cell.token,F.lerp(fromX,cell.x,s.delivery),F.lerp(fromY,cell.y,s.delivery));F.opacity(cell.token,.25+.75*s.delivery);});
   values[0].setText(k===0?'1':'2');values[1].setText(String([4,1,2][k]));values[2].setText('1');v.caption(H.tr(...captions[k]));
   Object.assign(v.root.dataset,{libraryMode:String(k),guidesPerConstruct:k===0?'1':'2',constructsPerGene:String([4,1,2][k]),constructsPerCell:'1',delivery:String(s.delivery)});
  }
  motion=H.motion(ctx,v,s,paint,captions);
  ctx.step(()=>{motion.driver.set({mode:1,delivery:0});return motion.driver.to({delivery:1},{duration:1400});});
  ctx.step(()=>{motion.driver.set({mode:2,delivery:0});return motion.driver.to({delivery:1},{duration:1400});});
 }
});
})();
