/* Binary ranking and linked threshold geometry. No generated data or paper results. */
(function(g){
'use strict';
const s=D.dom.s,rankings=new WeakSet();
function fields(value,allowed,name){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(name+' must be an object');
 for(const key of Object.keys(value))if(!allowed.includes(key))throw new TypeError('Unknown '+name+' field: '+key);
}
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;}
function dense(values,name){if(!Array.isArray(values)||!values.length)throw new TypeError(name+' must be a nonempty dense array');for(let i=0;i<values.length;i++)if(!Object.hasOwn(values,i))throw new TypeError(name+' must not contain holes');}
function freeze(items){return Object.freeze(items.map(item=>Object.freeze(item)));}
function binaryRanking(options){
 fields(options,['observations'],'ranking');dense(options.observations,'observations');const ids=new Set();
 const observations=freeze(options.observations.map((item,index)=>{
  fields(item,['id','score','positive'],'observation');
  if(typeof item.id!=='string'||!item.id.trim()||ids.has(item.id))throw new TypeError('Observation IDs must be nonempty unique strings');
  if(typeof item.positive!=='boolean')throw new TypeError('positive must be boolean');
  ids.add(item.id);return {id:item.id,score:finite(item.score,'score'),positive:item.positive,index};
 }));
 const positives=observations.filter(o=>o.positive).length,negatives=observations.length-positives;
 const sorted=observations.slice().sort((a,b)=>b.score-a.score),groups=[];let tp=0,fp=0;
 for(let i=0;i<sorted.length;){const score=sorted[i].score,ids=[];while(i<sorted.length&&sorted[i].score===score){const item=sorted[i++];ids.push(item.id);if(item.positive)tp++;else fp++;}
  groups.push({score,ids:Object.freeze(ids),selected:tp+fp,TP:tp,FP:fp,TN:negatives-fp,FN:positives-tp,precision:tp/(tp+fp),recall:positives?tp/positives:null});
 }
 const curve=positives?groups.map(q=>({score:q.score,recall:q.recall,precision:q.precision})):[],rectangles=[];let previous=0,ap=0;
 curve.forEach(q=>{if(q.recall>previous){rectangles.push({left:previous,right:q.recall,precision:q.precision,score:q.score});ap+=(q.recall-previous)*q.precision;}previous=q.recall;});
 function at(threshold){finite(threshold,'threshold');let TP=0,FP=0;observations.forEach(o=>{if(o.score>=threshold){if(o.positive)TP++;else FP++;}});const selected=TP+FP;
  return Object.freeze({threshold,selected,TP,FP,TN:negatives-FP,FN:positives-TP,precision:selected?TP/selected:null,recall:positives?TP/positives:null});
 }
 const api=Object.freeze({observations,positives,negatives,groups:freeze(groups),curve:freeze(curve),rectangles:freeze(rectangles),averagePrecision:positives?ap:null,at});rankings.add(api);return api;
}
function frame(value,name){fields(value,['x','y','width','height'],name);const r={};for(const key of ['x','y','width','height'])r[key]=finite(value[key],name+'.'+key);if(r.width<=0||r.height<=0||!Number.isFinite(r.x+r.width)||!Number.isFinite(r.y+r.height))throw new RangeError(name+' must have positive finite dimensions');return Object.freeze(r);}
function thresholdCurve(parent,options){
 fields(options,['ranking','scoreDomain','scoreFrame','prFrame','threshold','radius'],'thresholdCurve');
 if(!parent||typeof parent.append!=='function')throw new TypeError('parent must be an SVG parent');
 const ranking=options.ranking;if(!rankings.has(ranking))throw new TypeError('ranking must come from K.binaryRanking');
 dense(options.scoreDomain,'scoreDomain');if(options.scoreDomain.length!==2)throw new TypeError('scoreDomain needs exactly two endpoints');
 const domain=options.scoreDomain.map((v,i)=>finite(v,'scoreDomain['+i+']'));if(domain[0]>=domain[1]||!Number.isFinite(domain[1]-domain[0]))throw new RangeError('scoreDomain must be finite and increasing');
 if(ranking.observations.some(o=>o.score<domain[0]||o.score>domain[1]))throw new RangeError('All scores must lie in scoreDomain');
 const sf=frame(options.scoreFrame,'scoreFrame'),pf=frame(options.prFrame,'prFrame'),radius=options.radius===undefined?8:finite(options.radius,'radius');if(radius<=0||radius>Math.min(sf.width,sf.height)/10)throw new RangeError('radius does not fit scoreFrame');
 function thresholdValue(value){finite(value,'threshold');if(value<domain[0]||value>domain[1])throw new RangeError('threshold must lie in the fixed scoreDomain');return value;}
 function unit(value){finite(value,'progress');if(value<0||value>1)throw new RangeError('progress must lie in [0,1]');return value;}
 let threshold=thresholdValue(options.threshold===undefined?domain[1]:options.threshold),areaProgress=0,prProgress=1;
 const scoreScale=K.linearScale(domain,[sf.x,sf.x+sf.width]),recallScale=K.linearScale([0,1],[pf.x,pf.x+pf.width]),precisionScale=K.linearScale([0,1],[pf.y+pf.height,pf.y]);
 // Compute all positions before appending anything. Duplicate scores within a class stack vertically.
 const peers=new Map();ranking.observations.forEach(o=>{const key=o.positive+':'+o.score;if(!peers.has(key))peers.set(key,[]);peers.get(key).push(o.id);});
 const positions=ranking.observations.map(o=>{const list=peers.get(o.positive+':'+o.score),offset=(list.indexOf(o.id)-(list.length-1)/2)*(2*radius+5),y=sf.y+sf.height*(o.positive?.24:.76)+offset;if(y-radius<sf.y||y+radius>sf.y+sf.height)throw new RangeError('Tied observation stack does not fit scoreFrame');return {x:scoreScale(o.score),y};});
 for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)if(Math.hypot(positions[i].x-positions[j].x,positions[i].y-positions[j].y)<2*radius+4)throw new RangeError('Score markers overlap; increase the frame or reduce radius');
 const root=s('g',{'data-threshold-curve':''}),scoreGroup=F.group(root),prGroup=F.group(root),areaGroup=F.group(prGroup);
 F.line(scoreGroup,sf.x,sf.y+sf.height,sf.x+sf.width,sf.y+sf.height,C.grey,1.5);
 [0,.5,1].forEach(t=>{const value=domain[0]+(domain[1]-domain[0])*t,x=scoreScale(value);F.line(scoreGroup,x,sf.y+sf.height,x,sf.y+sf.height+5,C.grey,1);F.label(scoreGroup,x,sf.y+sf.height+26,String(+value.toPrecision(5)),19,C.grey);});
 const points=ranking.observations.map((o,i)=>{const node=F.group(scoreGroup);F.at(node,positions[i].x,positions[i].y);node.dataset.observationId=o.id;node.dataset.score=String(o.score);node.dataset.positive=String(o.positive);const dot=F.dot(node,0,0,radius,o.positive?C.teal:C.red);dot.setAttribute('stroke',o.positive?C.teal:C.red);dot.setAttribute('stroke-width',2);node.setAttribute('role','img');node.setAttribute('aria-label',o.id+', score '+o.score+', '+(o.positive?'positive':'negative'));return node;});
 const thresholdLine=F.line(scoreGroup,scoreScale(threshold),sf.y,scoreScale(threshold),sf.y+sf.height,C.gold,2);
 const areaRects=ranking.rectangles.map(q=>{const rect=s('rect',{x:recallScale(q.left),y:precisionScale(q.precision),width:recallScale(q.right)-recallScale(q.left),height:precisionScale(0)-precisionScale(q.precision),fill:C.gold,'fill-opacity':.23,'data-ap-rectangle':'','data-left':q.left,'data-right':q.right,'data-precision':q.precision});areaGroup.append(rect);return rect;});
 F.line(prGroup,pf.x,pf.y+pf.height,pf.x+pf.width,pf.y+pf.height,C.grey,1.5);F.line(prGroup,pf.x,pf.y+pf.height,pf.x,pf.y,C.grey,1.5);
 [0,.5,1].forEach(value=>{F.label(prGroup,recallScale(value),pf.y+pf.height+27,String(value),19,C.grey);F.label(prGroup,pf.x-17,precisionScale(value),String(value),19,C.grey,'end');});
 const curve=s('path',{fill:'none',stroke:C.white,'stroke-width':2.5,'stroke-linejoin':'round',d:''});prGroup.append(curve);
 const dot=F.dot(prGroup,pf.x,pf.y+pf.height,6,C.gold);
 function paint(){
  const stats=ranking.at(threshold),tx=scoreScale(threshold);F.seg(thresholdLine,tx,sf.y,tx,sf.y+sf.height);
  points.forEach((node,i)=>{const selected=ranking.observations[i].score>=threshold;node.dataset.selected=String(selected);F.opacity(node,selected?1:.32);});
  // AP belongs to the entire ranking. Its area must never appear under a prefix alone.
  const visible=areaProgress>0?ranking.curve:ranking.curve.filter(q=>q.score>=threshold);let previous=0,d='';
  visible.forEach((q,i)=>{const x0=recallScale(previous),x=recallScale(q.recall),y=precisionScale(q.precision);d+=(i?' L':'M')+x0+','+y+' L'+x+','+y;previous=q.recall;});curve.setAttribute('d',d);
  if(stats.precision!==null&&stats.recall!==null){F.pos(dot,recallScale(stats.recall),precisionScale(stats.precision));F.opacity(dot,1);}else{F.pos(dot,pf.x,pf.y+pf.height);F.opacity(dot,0);}
  F.opacity(prGroup,prProgress);F.opacity(areaGroup,areaProgress);root.dataset.threshold=String(threshold);root.dataset.selected=String(stats.selected);
 }
 const api={g:root,scoreGroup,prGroup,points,curve,areaRects,dot,thresholdLine,scoreScale,recallScale,precisionScale,scoreDomain:Object.freeze(domain),scoreFrame:sf,prFrame:pf,
  setThreshold(value){threshold=thresholdValue(value);paint();return api;},revealArea(value){areaProgress=unit(value);paint();return api;},showPR(value){prProgress=unit(value);paint();return api;},stats(){return ranking.at(threshold);}};
 paint();parent.append(root);return api;
}
g.K.binaryRanking=binaryRanking;g.K.thresholdCurve=thresholdCurve;
})(window);
