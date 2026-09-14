/* Questions and indexed sequences. Adapted mechanics; no inherited scientific data. */
(function(g){
'use strict';
const h=D.dom.h,s=D.dom.s;let nextQuestion=0;
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;}
function nonempty(value,name){if(typeof value!=='string'||!value.trim())throw new TypeError(name+' must be a nonempty string');return value;}
function ponder(root,options){
 const o=Object.assign({x:665,y:205,width:500,height:340,hint:''},options);
 nonempty(o.question,'question');nonempty(o.answer,'answer');if(typeof o.hint!=='string')throw new TypeError('hint must be a string');
 ['x','y','width','height'].forEach(k=>finite(o[k],k));if(o.width<=0||o.height<=0)throw new RangeError('Question dimensions must be positive');
 if(o.onChange!==undefined&&typeof o.onChange!=='function')throw new TypeError('onChange must be a function');
 const id='kit-ponder-'+(++nextQuestion),state={hint:false,answer:false};
 const question=h('h2.kit-ponder-question',{id:id+'-question'},o.question);
 const hint=h('p.kit-ponder-hint',{id:id+'-hint',hidden:true},o.hint),answer=h('p.kit-ponder-answer',{id:id+'-answer',hidden:true,'aria-live':'polite'},o.answer);
 const hintButton=h('button',{type:'button','aria-controls':hint.id,'aria-expanded':'false',hidden:!o.hint},'Подсказка');
 const answerButton=h('button',{type:'button','aria-controls':answer.id,'aria-expanded':'false'},'Ответ');
 const controls=h('div.kit-ponder-controls',{},[hintButton,answerButton]);
 const el=h('section.kit-ponder',{role:'group','aria-labelledby':question.id,style:{left:o.x+'px',top:o.y+'px',width:o.width+'px',height:o.height+'px'}},[question,controls,h('div.kit-ponder-hint-slot',{},hint),h('div.kit-ponder-answer-slot',{},answer)]);
 root.append(el);
 function paint(){hint.hidden=!state.hint||!o.hint;answer.hidden=!state.answer;hintButton.setAttribute('aria-expanded',String(!hint.hidden));answerButton.setAttribute('aria-expanded',String(state.answer));hintButton.textContent=state.hint?'Скрыть подсказку':'Подсказка';answerButton.textContent=state.answer?'Скрыть ответ':'Ответ';}
 function setState(next){for(const key of ['hint','answer'])if(Object.prototype.hasOwnProperty.call(next,key)&&typeof next[key]!=='boolean')throw new TypeError(key+' state must be boolean');Object.assign(state,next);paint();return api;}
 function manual(key){setState({[key]:!state[key]});if(o.onChange)o.onChange({...state});}
 hintButton.addEventListener('click',()=>manual('hint'));answerButton.addEventListener('click',()=>manual('answer'));
 const api={el,question,hint,answer,hintButton,answerButton,setState,state:()=>({...state}),reveal:()=>setState({answer:true}),hide:()=>setState({answer:false}),showHint:()=>setState({hint:true}),hideHint:()=>setState({hint:false})};
 paint();return api;
}
function sequenceTrack(parent,options){
 const o=Object.assign({x:200,y:320,gap:80,radius:22,color:C.white,pairColor:C.blue,indexColor:C.grey,showIndices:true,pairs:[]},options);
 if(!Array.isArray(o.tokens)||!o.tokens.length)throw new TypeError('tokens must be a nonempty array');
 ['x','y','gap','radius'].forEach(k=>finite(o[k],k));if(o.gap<=0||o.radius<=0)throw new RangeError('gap and radius must be positive');
 if(o.onSelect!==undefined&&typeof o.onSelect!=='function')throw new TypeError('onSelect must be a function');
 const tokens=Array.from(o.tokens,(value,i)=>{
  const token=typeof value==='string'?{id:'token-'+i,label:value}:value;
  if(!token||typeof token!=='object')throw new TypeError('Invalid token '+i);
  return Object.freeze({id:nonempty(token.id===undefined?'token-'+i:token.id,'token id'),label:nonempty(token.label,'token label'),color:token.color||o.color});
 });
 if(new Set(tokens.map(t=>t.id)).size!==tokens.length)throw new RangeError('Token IDs must be unique');
 const index=value=>{if(!Number.isInteger(value)||value<0||value>=tokens.length)throw new RangeError('Token index outside sequence');return value;};
 if(!Array.isArray(o.pairs))throw new TypeError('pairs must be an array');
 const seen=new Set(),pairs=Array.from(o.pairs,pair=>{if(!Array.isArray(pair)||pair.length!==2)throw new TypeError('A pair needs two indices');const a=index(pair[0]),b=index(pair[1]);if(a===b)throw new RangeError('A pair needs distinct indices');const key=Math.min(a,b)+':'+Math.max(a,b);if(seen.has(key))throw new RangeError('Duplicate unordered pair');seen.add(key);return Object.freeze([a,b]);});
 function positions(values){if(!Array.isArray(values)||values.length!==tokens.length)throw new RangeError('One position is required per token');return Array.from(values,(p,i)=>{if(!p||typeof p!=='object')throw new TypeError('Invalid position '+i);return Object.freeze({x:finite(p.x,'position x '+i),y:finite(p.y,'position y '+i)});});}
 let placed=positions(o.positions||tokens.map((_,i)=>({x:o.x+i*o.gap,y:o.y}))),selected=null;
 const group=F.group(parent);group.classList.add('sequence-track');group.setAttribute('role','group');group.setAttribute('aria-label',o.label||'Последовательность с заданными парами');
 const backbone=F.path(group,[],C.dim,2);
 const edges=pairs.map(([a,b])=>{const edge=F.line(group,0,0,0,0,o.pairColor,2,'5 4');edge.classList.add('sequence-pair');edge.dataset.pair=a+':'+b;return edge;});
 const nodes=tokens.map((token,i)=>{
  const node=s('g.sequence-token',{role:'button',tabindex:0,'aria-label':'Позиция '+(i+1)+': '+token.label,'aria-pressed':'false','data-token-id':token.id,'data-index':i});
  node.append(s('circle',{cx:0,cy:0,r:o.radius,fill:'var(--color-bg)',stroke:token.color,'stroke-width':2}));
  const label=F.label(node,0,1,token.label,o.radius*.9,token.color);label.dataset.tokenLabel='';
  if(o.showIndices)F.label(node,0,o.radius+19,String(i+1),16,o.indexColor);
  node.addEventListener('click',()=>{select(i);if(o.onSelect)o.onSelect(i);});
  node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();select(i);if(o.onSelect)o.onSelect(i);}});
  group.append(node);return node;
 });
 function paintPositions(){nodes.forEach((node,i)=>F.at(node,placed[i].x,placed[i].y));backbone.setAttribute('d',placed.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' '));edges.forEach((edge,i)=>{const [a,b]=pairs[i];F.seg(edge,placed[a].x,placed[a].y,placed[b].x,placed[b].y);});}
 function setPositions(next){placed=positions(next);paintPositions();api.positions=Object.freeze(placed.slice());return api;}
 function select(value){if(value!==null)index(value);selected=value;const neighbors=new Set();pairs.forEach(([a,b])=>{if(a===value)neighbors.add(b);if(b===value)neighbors.add(a);});nodes.forEach((node,i)=>{node.classList.toggle('is-selected',i===value);node.classList.toggle('is-related',neighbors.has(i));node.setAttribute('aria-pressed',String(i===value));});edges.forEach((edge,i)=>edge.classList.toggle('is-selected',pairs[i].includes(value)));return api;}
 function setPairsVisible(value){finite(value,'pair visibility');const opacity=Math.max(0,Math.min(1,value));edges.forEach(edge=>F.opacity(edge,opacity));return api;}
 const api={g:group,nodes,edges,backbone,tokens:Object.freeze(tokens),pairs:Object.freeze(pairs),positions:Object.freeze(placed.slice()),setPositions,setPairsVisible,select,selection:()=>selected};
 paintPositions();select(null);return api;
}
T.ponder=ponder;K.sequenceTrack=sequenceTrack;
})(window);
