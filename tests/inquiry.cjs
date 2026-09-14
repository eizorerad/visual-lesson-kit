/* Invariants for teaching questions and persistent indexed sequences; no browser. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const {JSDOM}=require('jsdom');
const starter=path.resolve(__dirname,'../starter');
function environment(t){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'}),w=dom.window;
 w.matchMedia=()=>({matches:false});
 for(const file of ['lib/dom','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','patterns'])w.eval(fs.readFileSync(path.join(starter,'js',file+'.js'),'utf8'));
 const inquiry=path.join(starter,'js/inquiry.js');if(fs.existsSync(inquiry))w.eval(fs.readFileSync(inquiry,'utf8'));
 w.D.deck={count:()=>1};t.after(()=>w.close());return w;
}
test('ponder has separate accessible hint/answer state and no navigation interception',t=>{
 const w=environment(t);assert.equal(typeof w.T.ponder,'function','T.ponder must exist');
 const changes=[],card=w.T.ponder(w.document.body,{question:'Does the mean determine the spread?',hint:'Compare the extreme values.',answer:'No: different sets can have equal means.',onChange:s=>changes.push(s)});
 assert.equal(card.hint.hidden,true);assert.equal(card.answer.hidden,true);assert.equal(card.hintButton.getAttribute('aria-expanded'),'false');
 card.hintButton.click();assert.equal(card.hint.hidden,false);assert.equal(card.answer.hidden,true);assert.equal(card.hintButton.getAttribute('aria-expanded'),'true');
 card.answerButton.click();assert.equal(card.answer.hidden,false);assert.equal(card.answerButton.getAttribute('aria-controls'),card.answer.id);
 card.hide();assert.equal(card.answer.hidden,true);assert.equal(card.hint.hidden,false);
 card.setState({hint:false,answer:true});assert.equal(card.answer.hidden,false);assert.equal(card.hint.hidden,true);
 card.hideHint();card.reveal();assert.equal(card.state().answer,true);assert.equal(card.state().hint,false);
 let keys=0;w.document.addEventListener('keydown',()=>keys++);const e=new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});card.answerButton.dispatchEvent(e);assert.equal(keys,1);assert.equal(e.defaultPrevented,false);
 assert.equal(changes.length,2,'Only manual button actions notify authors; paint does not recurse');
 const other=w.T.ponder(w.document.body,{question:'Another?',answer:'Yes.'});assert.notEqual(card.answer.id,other.answer.id);assert.equal(other.hintButton.hidden,true);
 assert.throws(()=>w.T.ponder(w.document.body,{question:'',answer:'No.'}));assert.throws(()=>w.T.ponder(w.document.body,{question:'Q',answer:'A',width:0}));
});
test('sequence positions update the same tokens and pair endpoints',t=>{
 const w=environment(t);assert.equal(typeof w.K.sequenceTrack,'function','K.sequenceTrack must exist');
 const svg=w.D.dom.s('svg');w.document.body.append(svg);const tokens=[{id:'a',label:'A'},{id:'c',label:'C'},{id:'g',label:'G'},{id:'u',label:'U'}];
 const track=w.K.sequenceTrack(svg,{tokens,x:200,y:300,gap:80,pairs:[[0,3],[1,2]]}),original=Array.from(track.nodes),edges=Array.from(track.edges),backbone=track.backbone;
 assert.equal(track.nodes.length,4);assert.equal(track.edges.length,2);
 const start=track.positions.map(p=>({x:p.x,y:p.y})),end=[{x:300,y:250},{x:500,y:250},{x:500,y:450},{x:300,y:450}];
 for(let k=0;k<=40;k++){
  const a=k/40,p=start.map((p,i)=>({x:p.x+(end[i].x-p.x)*a,y:p.y+(end[i].y-p.y)*a}));track.setPositions(p);
  assert.deepEqual(Array.from(track.nodes),original);assert.deepEqual(Array.from(track.edges),edges);assert.equal(track.backbone,backbone);
  track.nodes.forEach((node,i)=>{assert.equal(node.dataset.tokenId,tokens[i].id);assert.equal(node.dataset.index,String(i));assert.equal(node.querySelector('[data-token-label]').textContent,tokens[i].label);assert.equal(node.getAttribute('transform'),'translate('+p[i].x+' '+p[i].y+')');});
  track.edges.forEach((edge,i)=>{const[a,b]=[[0,3],[1,2]][i];for(const[attr,value]of Object.entries({x1:p[a].x,y1:p[a].y,x2:p[b].x,y2:p[b].y}))assert.equal(+edge.getAttribute(attr),value);});
 }
 assert.equal(tokens[0].id,'a');assert.equal(tokens[0].color,undefined,'input tokens stay untouched');track.setPairsVisible(.5);assert.equal(track.edges[0].style.opacity,'0.5');
});
test('sequence selection links an index to explicit paired neighbors and remains keyboard accessible',t=>{
 const w=environment(t);assert.equal(typeof w.K.sequenceTrack,'function','K.sequenceTrack must exist');const svg=w.D.dom.s('svg');w.document.body.append(svg);const selected=[];
 const track=w.K.sequenceTrack(svg,{tokens:['A','C','G','U'],pairs:[[0,3],[1,2]],onSelect:index=>selected.push(index)});
 track.select(1);assert.equal(track.selection(),1);assert.equal(track.nodes[1].getAttribute('aria-pressed'),'true');assert(track.nodes[2].classList.contains('is-related'));assert(track.edges[1].classList.contains('is-selected'));assert(!track.edges[0].classList.contains('is-selected'));
 track.nodes[0].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.equal(track.selection(),0);assert.deepEqual(selected,[0]);
 const e=new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});track.nodes[3].dispatchEvent(e);assert.equal(track.selection(),3);assert.deepEqual(selected,[0,3]);assert.equal(e.defaultPrevented,true);
 const arrow=new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});track.nodes[3].dispatchEvent(arrow);assert.equal(arrow.defaultPrevented,false);
 track.select(null);assert.equal(track.selection(),null);assert(!track.nodes.some(n=>n.classList.contains('is-related')));assert.throws(()=>track.select(4));
});
test('sequence rejects invalid identities, geometry and pairs atomically',t=>{
 const w=environment(t);assert.equal(typeof w.K.sequenceTrack,'function','K.sequenceTrack must exist');const svg=w.D.dom.s('svg');w.document.body.append(svg);
 for(const options of [{tokens:[]},{tokens:['']},{tokens:[{id:'a',label:'A'},{id:'a',label:'B'}]},{tokens:['A','B'],positions:[{x:0,y:0}]},{tokens:['A'],positions:[{x:NaN,y:0}]},{tokens:['A','B'],pairs:[[0,2]]},{tokens:['A','B'],pairs:[[0,0]]},{tokens:['A','B'],pairs:[[0,1],[1,0]]},{tokens:['A'],radius:0}]){assert.throws(()=>w.K.sequenceTrack(svg,options));assert.equal(svg.childNodes.length,0);}
 const track=w.K.sequenceTrack(svg,{tokens:['A','B']});const before=track.g.outerHTML;assert.throws(()=>track.setPositions([{x:0,y:0},{x:1,y:Infinity}]));assert.equal(track.g.outerHTML,before);
});
