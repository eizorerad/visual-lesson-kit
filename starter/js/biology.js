/* Small, explicit teaching models. No fitting, differential expression or inferred biology. */
(function(global){
'use strict';
const K=global.K, freeze=Object.freeze;
function finite(v,name){if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(name+' must be finite');return v;}
function positive(v,name){finite(v,name);if(v<=0)throw new RangeError(name+' must be positive');return v;}
function id(v,name){if(typeof v!=='string'||!v.trim())throw new TypeError(name+' must be a nonempty string');return v;}
function array(v,name){if(!Array.isArray(v)||!v.length)throw new TypeError(name+' must be nonempty');for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))throw new TypeError(name+' must be dense');return v;}
function integer(v,name){if(!Number.isSafeInteger(v)||v<0)throw new RangeError(name+' must be a nonnegative safe integer');return v;}
function sum(values){return values.reduce((a,b)=>integer(a+b,'count sum'),0);}
function deep(v){if(v&&typeof v==='object'){Object.values(v).forEach(deep);freeze(v);}return v;}
function countRows(input,grouped=false){
 const seen=new Set();let width;
 return array(input,'rows').map(row=>{
  if(!row||typeof row!=='object')throw new TypeError('row required');const key=id(row.id,'row ID');if(seen.has(key))throw new RangeError('duplicate row ID');seen.add(key);
  const counts=array(row.counts,'counts').map(v=>integer(v,'count'));if(width===undefined)width=counts.length;if(counts.length!==width)throw new RangeError('count rows must be rectangular');sum(counts);
  return {id:key,...(grouped?{sample:id(row.sample,'sample'),stratum:id(row.stratum,'stratum')}:{ }),counts};
 });
}
function aggregateCounts(input,options={}){
 const cells=countRows(input,true),genes=array(options.genes,'genes').map(v=>id(v,'gene'));if(genes.length!==cells[0].counts.length||new Set(genes).size!==genes.length)throw new RangeError('unique genes must match columns');
 const groups=[],lookup=new Map(),samples=new Set(),strata=new Map(),totals=genes.map(()=>0);
 cells.forEach(cell=>{
  const key=JSON.stringify([cell.sample,cell.stratum]);if(!lookup.has(key)){const group={id:key,sample:cell.sample,stratum:cell.stratum,sourceIds:[],cellCount:0,counts:genes.map(()=>0)};lookup.set(key,group);groups.push(group);}
  const group=lookup.get(key);group.sourceIds.push(cell.id);group.cellCount++;cell.counts.forEach((v,j)=>{group.counts[j]=integer(group.counts[j]+v,'aggregate count');totals[j]=integer(totals[j]+v,'total count');});
  samples.add(cell.sample);if(!strata.has(cell.stratum))strata.set(cell.stratum,new Set());strata.get(cell.stratum).add(cell.sample);
 });sum(totals);
 return deep({genes,cells,groups,totals,cellCount:cells.length,sampleIds:[...samples],sampleCount:samples.size,strata:[...strata].map(([key,ss])=>({id:key,sampleIds:[...ss],sampleCount:ss.size}))});
}
function normalizeCountRows(input,options={}){
 const targetTotal=positive(options.targetTotal,'targetTotal'),raw=countRows(input);
 const rows=raw.map(row=>{
  const total=sum(row.counts);if(total===0)throw new RangeError('zero-total row '+row.id+' cannot be normalized');
  const factor=finite(targetTotal/total,'normalization factor');if(factor===0)throw new RangeError('normalization factor underflows');
  const normalized=row.counts.map(v=>finite((v/total)*targetTotal,'normalized value'));
  if(normalized.some((v,j)=>row.counts[j]>0&&v===0))throw new RangeError('normalized count underflows');
  return {id:row.id,raw:row.counts,total,factor,normalized,log1p:normalized.map(v=>Math.log1p(v))};
 });return deep({targetTotal,rows});
}
function alleleSummary(counts){
 if(!counts||typeof counts!=='object'||Object.keys(counts).sort().join(',')!=='AA,Aa,aa')throw new TypeError('exact AA, Aa, aa counts required');
 const observedCounts=['AA','Aa','aa'].map(k=>integer(counts[k],k)),individuals=sum(observedCounts);if(!individuals)throw new RangeError('at least one complete diploid required');
 const copies=integer(2*individuals,'allele copies'),A=integer(2*counts.AA+counts.Aa,'A copies'),a=integer(2*counts.aa+counts.Aa,'a copies'),p=A/copies,q=a/copies;
 const expected=[p*p,2*p*q,q*q];return deep({counts:{AA:counts.AA,Aa:counts.Aa,aa:counts.aa},individuals,copies,alleles:{A,a},p,q,observed:observedCounts.map(v=>v/individuals),expected,expectedCounts:expected.map(v=>v*individuals)});
}
function progress(value,name){finite(value,name);if(value<0||value>1)throw new RangeError(name+' must be in [0,1]');return value;}
function statePatch(current,patch){if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('state patch required');if(Object.keys(patch).some(k=>!Object.hasOwn(current,k)))throw new TypeError('unknown state field');return {...current,...patch};}
function region(options){const f={x:90,y:235,width:1100,height:290,...options.frame};['x','y'].forEach(k=>finite(f[k],k));['width','height'].forEach(k=>positive(f[k],k));finite(f.x+f.width,'right');finite(f.y+f.height,'bottom');return f;}
function text(parent,value,x,y,width=110,size=19,color=C.white){const label=F.label(parent,x,y,String(value),size,color);if(global.L)L.contract(label,{id:'biology-label',space:parent,box:{x:x-width/2,y:y-18,width,height:36}});return label;}
function rect(parent,x,y,width,height,color){const el=D.dom.s('rect',{x,y,width,height,fill:color});parent.append(el);return el;}
function countAggregation(parent,options={}){
 const model=aggregateCounts(options.cells,{genes:options.genes}),f=region(options),n=model.groups.length,step=f.height/n,sourceRows=Math.ceil(model.cells.length/2),sourceStep=f.height/sourceRows;
 if(step<Math.max(62,(model.genes.length-1)*28+30)||sourceStep<58||model.genes.length>3||Math.max(...model.groups.map(g=>g.cellCount))*140>f.width*.4||(f.width-130)/Math.max(1,model.cells.length-1)<132)throw new RangeError('aggregation marks need a larger frame or fewer displayed records');
 const maximum=Math.max(1,...model.groups.flatMap(g=>g.counts)),barWidth=f.width*.19,xScale=K.linearScale([0,maximum],[0,barWidth]);
 const g=F.group(parent);g.dataset.component='count-aggregation';const sourceIndex=new Map(model.cells.map((c,i)=>[c.id,i]));
 const actors=model.cells.map((cell,i)=>{
  const node=F.group(g);node.dataset.cellId=cell.id;node.dataset.sample=cell.sample;node.dataset.stratum=cell.stratum;node.dataset.rawCounts=JSON.stringify(cell.counts);
  F.dot(node,-50,0,8,cell.stratum===model.strata[0].id?C.blue:C.teal);text(node,cell.id+' '+cell.sample+'/'+cell.stratum,10,0,112,17);text(node,'['+cell.counts.join(', ')+']',10,24,105,18,C.grey);
  const gi=model.groups.findIndex(q=>q.sourceIds.includes(cell.id)),slot=model.groups[gi].sourceIds.indexOf(cell.id);
  return {node,id:cell.id,lane:f.x+65+i*(f.width-130)/Math.max(1,model.cells.length-1),from:{x:f.x+65+(i%2)*135,y:f.y+Math.floor(i/2)*sourceStep},to:{x:f.x+f.width*.26+slot*140,y:f.y+gi*step}};
 });
 const totals=model.groups.map((group,i)=>{
  const y=f.y+i*step;const label=text(g,group.sample+' / '+group.stratum,f.x+f.width*.62,y,135,20);label.dataset.aggregateId=group.id;label.dataset.sourceIds=JSON.stringify(group.sourceIds);
  const bars=group.counts.map((value,j)=>{const center=y+(j-(model.genes.length-1)/2)*28;const bar=rect(g,f.x+f.width*.74,center-6,0,12,j?C.purple:C.gold);bar.dataset.gene=model.genes[j];bar.dataset.aggregateId=group.id;bar.dataset.value=value;const gene=text(g,model.genes[j],f.x+f.width*.705,center,54,18,C.grey);gene.dataset.geneLabel=model.genes[j];const number=text(g,value,f.x+f.width*.965,center,52,18);return {bar,gene,number,value};});
  return {bars,label};
 });
 let state={group:0,sum:0};
 function setProgress(patch){const next=statePatch(state,patch);progress(next.group,'group');progress(next.sum,'sum');if(next.sum>0&&next.group!==1)throw new RangeError('group records before summing');
  const fan=F.phase(next.group,0,.3),align=F.phase(next.group,.3,.65),gather=F.phase(next.group,.65,1);
  actors.forEach(a=>{const x=F.lerp(F.lerp(a.from.x,a.lane,fan),a.to.x,gather),y=F.lerp(a.from.y,a.to.y,align);F.at(a.node,x,y);});
  totals.forEach((group,i)=>{F.opacity(group.label,next.group===1?1:0);group.bars.forEach(({bar,gene,number,value},j)=>{const inputs=model.groups[i].sourceIds.map(key=>model.cells[sourceIndex.get(key)].counts[j]),phase=next.sum*inputs.length;let partial=0;inputs.forEach((v,k)=>partial+=v*Math.max(0,Math.min(1,phase-k)));bar.setAttribute('width',xScale(partial));bar.dataset.assembled=String(partial);F.opacity(gene,next.group===1?1:0);F.opacity(number,next.sum===1?1:0);});});
  state=next;g.dataset.group=next.group;g.dataset.sum=next.sum;return api;
 }
 const api={g,model,actors,totals,xScale,setProgress,state:()=>freeze({...state})};setProgress(state);return api;
}
function countNormalization(parent,options={}){
 const initial=normalizeCountRows(options.rows,{targetTotal:options.targetTotal}),f=region(options),maxTotal=positive(options.maxTotal===undefined?initial.targetTotal:options.maxTotal,'maxTotal');
 const sourceRows=deep(initial.rows.map(row=>({id:row.id,counts:[...row.raw]})));
 if(initial.targetTotal>maxTotal||f.height/initial.rows.length<70||initial.rows[0].raw.length>3)throw new RangeError('normalization display does not fit declared frame/domain');
 const width=f.width*.235,rawMax=Math.max(1,...initial.rows.flatMap(r=>r.raw)),scales={raw:K.linearScale([0,rawMax],[0,width]),normalized:K.linearScale([0,maxTotal],[0,width]),log1p:K.linearScale([0,Math.log1p(maxTotal)],[0,width])};
 const g=F.group(parent);g.dataset.component='count-normalization';const columns=[f.x+40,f.x+f.width*.365,f.x+f.width*.705],dy=f.height/initial.rows.length;
 const marks=initial.rows.map((row,i)=>{
  const y=f.y+i*dy;const label=text(g,row.id,columns[0]-25,y,35,19);const triples=row.raw.map((value,j)=>{
   const yy=y+j*28,color=j?C.teal:C.blue;
   const raw=rect(g,columns[0],yy,scales.raw(value),12,color);raw.dataset.rawValue=value;raw.dataset.rowId=row.id;raw.dataset.geneIndex=j;
   const rtext=text(g,value,columns[0]+width+23,yy+6,42,18);rtext.dataset.rawValue=value;
   const normalized=rect(g,columns[1],yy,0,12,color),log=rect(g,columns[2],yy,0,12,color);for(const e of [normalized,log]){e.dataset.rowId=row.id;e.dataset.geneIndex=j;}
   const ntext=text(g,'',columns[1]+width+26,yy+6,62,18),ltext=text(g,'',columns[2]+width+30,yy+6,72,18);
   return {raw,normalized,log,ntext,ltext};
  });return {label,triples};
 });
 let current=initial,state={targetTotal:initial.targetTotal,normalize:0,log:0};
 function setState(patch){const next=statePatch(state,patch);positive(next.targetTotal,'targetTotal');if(next.targetTotal>maxTotal)throw new RangeError('target exceeds fixed display domain');progress(next.normalize,'normalize');progress(next.log,'log');if(next.log>0&&next.normalize!==1)throw new RangeError('normalize fully before log1p');
  const model=normalizeCountRows(sourceRows,{targetTotal:next.targetTotal});
  marks.forEach((row,i)=>row.triples.forEach((m,j)=>{const n=model.rows[i].normalized[j],l=model.rows[i].log1p[j];m.normalized.setAttribute('width',scales.normalized(n)*next.normalize);m.normalized.dataset.value=n;m.log.setAttribute('width',scales.log1p(l)*next.log);m.log.dataset.value=l;m.ntext.textContent=n.toFixed(2);m.ltext.textContent=l.toFixed(2);F.opacity(m.ntext,next.normalize===1?1:0);F.opacity(m.ltext,next.log===1?1:0);}));
  current=model;state=next;Object.entries(next).forEach(([k,v])=>g.dataset[k]=v);return api;
 }
 const api={g,marks,scales,maxTotal,setState,model:()=>current,state:()=>freeze({...state})};setState(state);return api;
}
function alleleFrequency(parent,options={}){
 const model=alleleSummary(options.counts),f=region(options);if(model.copies>120||f.height<240||f.width<900)throw new RangeError('allele display requires at most 120 copies and a sufficiently large frame');
 const g=F.group(parent);g.dataset.component='allele-frequency';const barWidth=f.width*.21,scale=K.linearScale([0,1],[0,barWidth]),names=['AA','Aa','aa'];
 const observed=names.map((name,i)=>{const y=f.y+i*f.height/3;const bar=rect(g,f.x+40,y,scale(model.observed[i]),18,C.grey);bar.dataset.observedGenotype=name;bar.dataset.value=model.counts[name];text(g,name,f.x+12,y+9,45,21);text(g,model.counts[name]+' / '+model.individuals,f.x+barWidth+90,y+9,86,19);return bar;});
 let ai=0,bi=0;const tokens=[];names.forEach((name,gi)=>{for(let person=0;person<model.counts[name];person++)for(let copy=0;copy<2;copy++){
  const allele=name[copy],index=allele==='A'?ai++:bi++,node=F.group(g);node.dataset.allele=allele;node.dataset.genotypeSource=name;node.dataset.individualId=name+'-'+(person+1);node.dataset.copy=copy;
  F.dot(node,0,0,7,allele==='A'?C.blue:C.teal);
  const columns=10,dx=23,base=allele==='A'?0:f.height*.52;
  tokens.push({node,from:{x:f.x+f.width*.36+copy*18+Math.floor(person/4)*43,y:f.y+gi*f.height/3+(person%4)*18},to:{x:f.x+f.width*.46+(index%columns)*dx,y:f.y+base+Math.floor(index/columns)*22}});
 }});
 const alleleLabels=[text(g,'A: '+model.alleles.A+' / '+model.copies,f.x+f.width*.555,f.y+64,235,20,C.blue),text(g,'a: '+model.alleles.a+' / '+model.copies,f.x+f.width*.555,f.y+f.height*.52+64,235,20,C.teal)];
 const expected=names.map((name,i)=>{const y=f.y+i*f.height/3;const bar=rect(g,f.x+f.width*.78,y,0,18,C.gold);bar.dataset.expectedGenotype=name;bar.dataset.value=model.expected[i];const label=text(g,(100*model.expected[i]).toFixed(0)+'%',f.x+f.width*.885,y+39,160,21);return {bar,label};});
 let state={count:0,expect:0};function setProgress(patch){const next=statePatch(state,patch);progress(next.count,'count');progress(next.expect,'expect');if(next.expect>0&&next.count!==1)throw new RangeError('count alleles before expectation');
  tokens.forEach(t=>F.at(t.node,F.lerp(t.from.x,t.to.x,next.count),F.lerp(t.from.y,t.to.y,next.count)));alleleLabels.forEach(n=>F.opacity(n,next.count===1?1:0));expected.forEach((e,i)=>{e.bar.setAttribute('width',scale(model.expected[i])*next.expect);F.opacity(e.label,next.expect===1?1:0);});state=next;g.dataset.count=next.count;g.dataset.expect=next.expect;return api;
 }
 const api={g,model,observed,tokens,expected,scale,setProgress,state:()=>freeze({...state})};setProgress(state);return api;
}
Object.assign(K,{aggregateCounts,normalizeCountRows,alleleSummary,countAggregation,countNormalization,alleleFrequency});
})(window);
