/* Example narrated film: the Wilcoxon rank-sum test as a game of pairs, told for a
 * school student. It shows the pieces a narrated film uses: a film identity, chapters,
 * shots with persistent actors (count cards that sort themselves), cues with a tone
 * and delivery markup in the spoken text, and questions. All counts are invented. */
(function(g){
'use strict';
const V=g.NARRATED,ph=(x,a,b)=>F.phase(x,a,b);
V.film({id:'narrated-film',title:['Тест Уилкоксона — игра в пары','The Wilcoxon test as a game of pairs'],
 chapter:['Учебный фильм с озвучкой','A narrated teaching film'],source:'Учебная схема · числа придуманы',
 kicker:'',stageNote:['Учебная схема · числа придуманы','Teaching schematic · numbers invented']});

V.chapter('teacher',['Учитель','Teacher']);

// ── Shot: line the records up ───────────────────────────────────────────────────
const CTRL=[0,0,1,0,0,0,2,0,0,0,0,1,0,0,0,0,0,1,0,0];
const OURS=[0,2,0,0,1,0,0,3,0,0,1,0,0,0,2,0,0,1,0,0];
const order=a=>a.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]||p[1]-q[1]).map(p=>p[1]);
V.shot({id:'lineup',fields:{line:0},build(k){
 const X0=110,P=54,rows=[[CTRL,'ctrl',C.blue,212,['группа 1: контроль','group 1: control']],[OURS,'ours',C.white,392,['группа 2: после воздействия','group 2: after treatment']]];
 const made=rows.map(([vals,id,color,y,label])=>{
  k.text({id:id+'-label',x:X0,y:y-46,w:600,h:28,text:label,size:19,color,align:'left'});
  const cards=V.cards(k,{id,x:X0,y,pitch:P,color,states:{s:vals}});cards.paint('s');
  const slot=new Array(vals.length);order(vals).forEach((orig,pos)=>{slot[orig]=pos;});
  const zeros=V.zeros(vals),q=k.group();
  k.line(X0,y+124,X0+zeros*P-12,y+124,C.red,2.5,'',q);
  k.text({id:id+'-z',x:X0+zeros*P,y:y+110,w:300,h:28,text:[`нулей: ${zeros} из 20`,`zeros: ${zeros} of 20`],size:18,color:C.red,align:'left'},q);
  return {cards,slot,y,q};
 });
 k.text({id:'note',x:780,y:152,w:430,h:26,text:['счёт одной величины · числа придуманы','counts of one quantity · invented'],size:16,color:C.grey,align:'right'});
 return v=>{
  const t=ph(v.line,0,.85);
  made.forEach(({cards,slot,y,q})=>{cards.cells.forEach((c,i)=>{const d=slot[i]-i;cards.place(i,V.lerp(X0+i*P,X0+slot[i]*P,t),y+Math.sin(Math.PI*t)*(d>0?-16:d<0?16:0));});F.opacity(q,ph(v.line,.8,1));});
 };
}});
V.cue({key:'teacher',tone:'warm',motion:2.4,patch:{},
 title:['Учитель не пересчитывает сумму','The teacher does not count the sum'],
 caption:['Тест Уилкоксона — как учитель: он не складывает числа, а выстраивает всех по порядку и смотрит, у кого больше.','The Wilcoxon test is like a teacher: it does not add numbers up, it lines everyone up and looks at who has more.'],
 voice:['Познакомимся с одним строгим проверяющим. [pause] Тест Уилкоксона похож на учителя, который *не* пересчитывает сумму. Он берёт две группы, смотрит на одну величину и выстраивает всех по порядку: у кого больше, у кого меньше. Числа здесь придуманы.',
  'Meet a strict checker. The Wilcoxon test is like a teacher who does not count the sum. It takes two groups, looks at one quantity and lines everyone up: who has more and who has less. The numbers here are invented.']});
V.cue({key:'lineup',tone:'teach',motion:3.6,patch:{line:1},
 title:['Выстраиваем по порядку','Lining them up'],
 caption:['Учитель сортирует записи по величине. Слева — все нули: их больше половины.','The teacher sorts the records by size. On the left are all the zeros: more than half.'],
 voice:['Вот учитель расставил всех по порядку. Слева стоят нули, и их очень много. Справа единицы, двойки, тройки. {emphatic, a key idea to remember} Учителю важно не сколько всего, а кто оказался правее.',
  'Here the teacher has lined everyone up. The zeros stand on the left, and there are many of them. On the right are the ones, twos and threes. What matters to the teacher is not the total but who ended up further right.']});

// ── Shot: the game of pairs ─────────────────────────────────────────────────────
const PAIRS=[[0,0],[2,0],[0,1],[0,0],[1,0],[0,0],[3,1],[0,0]];
V.shot({id:'pairs',fields:{play:0,tally:0},build(k){
 const X0=150,P=132;
 k.text({id:'ours',x:60,y:190,w:84,h:52,text:['гр. 2','gr. 2'],size:18,color:C.white,align:'left'});
 k.text({id:'ctrl',x:60,y:316,w:84,h:52,text:['гр. 1','gr. 1'],size:18,color:C.blue,align:'left'});
 const top=V.cards(k,{id:'top',x:X0,y:168,pitch:P,color:C.white,h:80,states:{s:PAIRS.map(p=>p[0])}}),
  bottom=V.cards(k,{id:'bot',x:X0,y:292,pitch:P,color:C.blue,h:80,states:{s:PAIRS.map(p=>p[1])}});
 top.paint('s');bottom.paint('s');
 const verdicts=PAIRS.map(([a,b],i)=>{
  const [t,c]=a>b?[['победа','win'],C.gold]:a<b?[['поражение','loss'],C.blue]:[['ничья','draw'],C.grey];
  return k.text({id:'v'+i,x:X0+i*P-40,y:404,w:122,h:28,text:t,size:18,color:c,weight:a===b?400:600});
 });
 const tally=k.group(),BX=150,BW=1000,Y=470;
 let x=BX;[[3/8,C.gold,['победы 3','wins 3']],[4/8,C.grey,['ничьи 4','draws 4']],[1/8,C.blue,['пораж. 1','losses 1']]].forEach(([f,c,label],i)=>{k.rect(x,Y,BW*f-4,34,{fill:c,opacity:.55,rx:3},tally);k.text({id:'t'+i,x,y:Y+38,w:BW*f-4,h:26,text:label,size:18,color:c},tally);x+=BW*f;});
 k.text({id:'rule',x:90,y:545,w:1120,h:56,text:['побед заметно больше, чем поражений → «различие есть» · ничьи ничего не решают','clearly more wins than losses → “there is a difference” · draws decide nothing'],size:20,color:C.white,align:'left'},tally);
 return v=>{verdicts.forEach((t,i)=>F.opacity(t.el,ph(v.play,i/10,i/10+.25)));F.opacity(tally,ph(v.tally,0,1));};
}});
V.cue({key:'pairs',tone:'play',motion:4,patch:{play:1},
 title:['Игра в пары','The game of pairs'],
 caption:['Берём одну запись из второй группы и одну из первой. У кого больше — тот победил. Поровну — ничья. И так все возможные пары.','Take one record from group two and one from group one. Whoever has more wins. Equal means a draw. Repeat for every possible pair.'],
 voice:['Проще всего понять тест как игру в пары. Берём одну запись из второй группы и одну из первой. У кого больше, тот победил. Если поровну — ничья. И так перебираем все возможные пары. {clear teacher, stating the rule} Если вторая группа выигрывает заметно чаще, чем проигрывает, учитель говорит: различие есть.',
  'The easiest way to understand the test is as a game of pairs. Take one record from group two and one from group one. Whoever has more wins. If equal, it is a draw. Go through every possible pair. If group two wins clearly more often than it loses, the teacher says: there is a difference.']});
V.cue({key:'draws',tone:'serious',motion:2.4,patch:{tally:1},
 title:['Ничьи ничего не говорят','Draws say nothing'],
 caption:['Когда нулей много, больше половины пар — «0 против 0». Решают только победы и поражения.','When zeros are common, more than half of the pairs are “0 against 0”. Only wins and losses decide.'],
 voice:['А теперь главное. [pause] Когда нулей много, больше половины пар — это ноль против ноля, ничья. Ничьи учителю ничего не говорят. Всё решают оставшиеся пары. {emphatic, a key idea to remember} Запомни: если нули никуда не деваются, учителю трудно что-то заметить.',
  'Now the key point. When zeros are common, more than half of the pairs are zero against zero, a draw. Draws tell the teacher nothing. Everything is decided by the remaining pairs. Remember: if the zeros do not go anywhere, it is hard for the teacher to notice anything.']});

V.chapter('summary',['Итог','Summary']);
V.shot({id:'cheat',fields:{go:0},build(k){
 const items=[[['порядок, а не сумма','order, not the sum'],C.white],[['каждая пара: победа, ничья или поражение','each pair: a win, a draw or a loss'],C.gold],[['решают победы против поражений; ничьи не помогают','wins against losses decide; draws do not help'],C.teal]];
 const rows=items.map(([t,c],i)=>{const q=k.group();k.rect(90,190+i*120,1120,96,{stroke:c,width:2,fill:c,opacity:.06},q);k.text({id:'c'+i,x:110,y:198+i*120,w:1080,h:80,text:t,size:28,color:c,weight:600,align:'left'},q);return q;});
 return v=>{rows.forEach((q,i)=>F.opacity(q,ph(v.go,i/4,(i+1.5)/4)));};
}});
V.cue({key:'cheat',tone:'wrap',motion:3.6,patch:{go:1},
 title:['Шпаргалка','Cheat sheet'],
 caption:['Тест смотрит на порядок, а не на сумму. Каждая пара — победа, ничья или поражение. Решают победы против поражений.','The test looks at order, not the sum. Each pair is a win, a draw or a loss. Wins against losses decide.'],
 voice:['Соберём всё в шпаргалку. Тест Уилкоксона смотрит на порядок, а не на сумму. Каждая пара — победа, ничья или поражение. И решают победы против поражений. [pause] {warm, smiling, friendly goodbye} Спасибо, что досмотрел!',
  'Let us gather it into a cheat sheet. The Wilcoxon test looks at order, not at the sum. Each pair is a win, a draw or a loss. And wins against losses decide. Thanks for watching!']});

V.questions=[
 ['Почему тест не складывает числа?','Why does the test not add the numbers?',
  'Тест Уилкоксона — ранговый: он заменяет числа их местами в общем ряду. Так он устойчив к редким огромным значениям, но и не видит, насколько велико различие внутри одной пары.',
  'The Wilcoxon test works with ranks: it replaces numbers by their places in the joint line. That makes it robust to rare huge values, but it also ignores how large the difference inside one pair is.'],
 ['Что значит «ничья»?','What does a “draw” mean?',
  'Две записи с одинаковым значением. В ранговом тесте они получают средний ранг и не сдвигают результат ни в одну сторону.',
  'Two records with the same value. In a rank test they share the average rank and push the result in neither direction.'],
 ['Какие числа в фильме придуманы?','Which numbers in the film are invented?',
  'Все: счёты в карточках и пары придуманы для наглядности.',
  'All of them: the counts on the cards and the pairs are invented for clarity.']
];
})(window);
