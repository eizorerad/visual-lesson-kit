/* Real index, all gallery states and live locale switching. jsdom, not browser QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const starter=process.env.LESSON_TEST_DIR||path.resolve(__dirname,'../starter');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const cyrillic=/[А-Яа-яЁё]/;
const plain=(w,html)=>{const div=w.document.createElement('div');div.innerHTML=html;return div.textContent;};

async function fixture(t,{clock=false}={}){
  const html=fs.readFileSync(path.join(starter,'index.html'),'utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/?lang=ru'}),w=dom.window;
  t.after(()=>w.close());w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  Object.defineProperty(w,'innerWidth',{value:1440,configurable:true});Object.defineProperty(w,'innerHeight',{value:960,configurable:true});
  const errors=[];w.console.error=(...args)=>errors.push(args.map(String).join(' '));
  t.after(()=>assert.deepEqual(errors,[],'no swallowed scene, observer or animation errors'));
  // CSS determines visibility, not text measurements. Font/image payloads are unnecessary.
  for(const match of html.matchAll(/<link[^>]+href="(css\/[^\"]+)"/g)){
    if(/font/.test(match[1]))continue;
    const style=w.document.createElement('style');style.textContent=fs.readFileSync(path.join(starter,match[1]),'utf8');w.document.head.append(style);
  }
  const frames=new Map(),timers=new Map();let token=0;
  if(clock){
    const timeout=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);
    w.requestAnimationFrame=fn=>{const id=++token;frames.set(id,fn);return id;};
    w.cancelAnimationFrame=id=>frames.delete(id);
    w.setTimeout=(fn,ms,...args)=>{if(ms===80){const id=++token;timers.set(id,fn);return id;}return timeout(fn,ms,...args);};
    w.clearTimeout=id=>{if(timers.has(id))timers.delete(id);else clear(id);};
  }
  // Let jsdom finish parsing before executing boot.js, so boot runs exactly once.
  await settle();
  const scenes=[],scripts=[...html.matchAll(/<script[^>]+src="([^\"]+)"/g)].map(m=>m[1]);
  assert(scripts.includes('js/i18n/en.js')&&scripts.includes('js/i18n/en-notes.js'),'index loads both English packs');
  for(const file of scripts){
    w.eval(fs.readFileSync(path.join(starter,file),'utf8'));
    if(file==='js/deck.js'){
      const register=w.D.deck.register;
      w.D.deck.register=scene=>{scenes.push(scene);register(scene);};
    }
  }
  await settle();assert.equal(scenes.length,13);assert.equal(w.D.deck.count(),13);
  assert.equal(w.D.i18n.lang(),'ru');assert.equal(typeof w.D.i18n.qa,'function');
  assert(w.document.querySelector('[data-action="language"]'),'toolbar exposes language control');
  async function advance(time){
    // A browser frame invokes every callback queued for that frame with the
    // same timestamp. Layout and animation are independent subscribers.
    const batch=[...frames.keys()];assert(batch.length,'actual scheduler has a queued frame');
    for(const id of batch){
      const callback=frames.get(id);if(!callback)continue; // An earlier callback may cancel it.
      frames.delete(id);callback(time);await Promise.resolve();
    }
    // Callbacks queued during this batch remain pending for the next frame.
  }
  return {w,scenes,advance};
}

async function go(w,index,step){
  w.D.deck.show(index,step);
  for(let i=0;i<40;i++){await settle();if(!w.D.deck.current().busy)break;}
  assert.equal(w.D.deck.current().busy,false,'instant replay settled');
  assert.deepEqual(JSON.parse(JSON.stringify(w.D.deck.current())),{index,step,steps:3,busy:false});
  assert(!w.document.querySelector('.scene-error'));
}
async function language(w,target){
  if(w.D.i18n.lang()!==target)w.document.querySelector('[data-action="language"]').click();
  await settle();assert.equal(w.D.i18n.lang(),target);assert.equal(w.document.documentElement.lang,target);
}
function visible(w,node,root){
  for(let el=node.nodeType===3?node.parentElement:node;el;el=el.parentElement){
    if(el.hidden||el.hasAttribute('data-i18n-ignore')||['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName))return false;
    const style=w.getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden'||(style.opacity!==''&&+style.opacity<=.01))return false;
    if(el.tagName==='DETAILS'&&!el.open){const summary=el.querySelector('summary');if(!summary||!summary.contains(node))return false;}
    if(el===root)break;
  }
  return true;
}
function visibleStrings(w,root){
  const out=[],walk=w.document.createTreeWalker(root,w.NodeFilter.SHOW_TEXT);let node;
  while((node=walk.nextNode()))if(node.nodeValue.trim()&&visible(w,node,root))out.push(node.nodeValue.trim());
  return out;
}
function english(w,root,label){
  const missing=visibleStrings(w,root).filter(text=>cyrillic.test(text));
  assert.deepEqual([...new Set(missing)],[],label+': untranslated visible text');
}
function frozenState(w){
  const root=w.D.deck.root(),svg=[...root.querySelectorAll('svg *')];
  const attrs=svg.map(node=>[...node.attributes].filter(a=>!['aria-label','title','aria-valuetext','lang'].includes(a.name)&&!a.name.startsWith('data-i18n')).map(a=>[a.name,a.value]));
  const inputs=[...root.querySelectorAll('input,select,textarea')];
  return {root,svg,attrs,inputs,values:inputs.map(n=>({value:n.value,checked:n.checked,disabled:n.disabled})),data:JSON.stringify(root.dataset),current:JSON.stringify(w.D.deck.current())};
}
function unchanged(w,before,label){
  const after=frozenState(w);
  assert.equal(after.root,before.root,label+': scene was not rebuilt');
  assert.deepEqual(after.svg,before.svg,label+': SVG actors retained');
  assert.deepEqual(after.attrs,before.attrs,label+': geometry, data and selection retained');
  assert.deepEqual(after.inputs,before.inputs,label+': input nodes retained');
  assert.deepEqual(after.values,before.values,label+': input state retained');
  assert.equal(after.data,before.data,label+': scene state data retained');
  assert.equal(after.current,before.current,label+': current scene and step retained');
}
function textState(root){return [...root.querySelectorAll('.film-title,.film-caption,svg text')].map(n=>n.textContent);}
function openPanel(w,mode){if(w.document.querySelector('#notes').dataset.mode!==mode||!w.document.body.classList.contains('notes-open'))w.document.querySelector('[data-action="'+mode+'"]').click();}

test('controlled frame clock runs a timestamped batch, honors cancellation and defers new callbacks',async t=>{
  const {w,advance}=await fixture(t,{clock:true}),seen=[];let cancelled;
  w.requestAnimationFrame(time=>{seen.push(['first',time]);w.cancelAnimationFrame(cancelled);w.requestAnimationFrame(next=>seen.push(['next-frame',next]));});
  w.requestAnimationFrame(time=>seen.push(['second',time]));
  cancelled=w.requestAnimationFrame(time=>seen.push(['cancelled',time]));
  await advance(125);assert.deepEqual(seen,[['first',125],['second',125]]);
  await advance(250);assert.deepEqual(seen,[['first',125],['second',125],['next-frame',250]]);
});

test('real gallery: all 52 states translate RU→EN→RU without rebuilding or changing science',async t=>{
  const {w,scenes}=await fixture(t);let checked=0;
  for(let index=0;index<scenes.length;index++)for(let step=0;step<4;step++){
    await go(w,index,step);await language(w,'ru');openPanel(w,'notes');await settle();
    const root=w.D.deck.root(),before=frozenState(w),ru=textState(root),ruTitle=root.querySelector('.film-title').textContent,activeRu=w.document.querySelector('.note-block.is-now').textContent;
    await language(w,'en');unchanged(w,before,scenes[index].id+' state '+step);
    english(w,root,scenes[index].id+' state '+step);english(w,w.document.querySelector('#chrome'),'toolbar');
    assert(!cyrillic.test(root.querySelector('.film-title').textContent),'title is English');
    assert.notEqual(root.querySelector('.film-title').textContent,ruTitle,'title changed language');
    const enNotes=w.D.i18n.notes(scenes[index]),blocks=[...w.document.querySelectorAll('.note-block')];
    assert.equal(enNotes.length,4);assert.equal(blocks.length,4);
    blocks.forEach((block,i)=>{assert(block.textContent.includes(plain(w,enNotes[i])),'full English note is rendered');assert(!cyrillic.test(block.textContent),'all note states are English');});
    assert.equal(blocks.indexOf(w.document.querySelector('.note-block.is-now')),step,'same note state highlighted');
    await language(w,'ru');unchanged(w,before,'Russian return');assert.deepEqual(textState(root),ru,'exact source labels and dynamic caption restored');
    assert.equal(w.document.querySelector('.note-block.is-now').textContent,activeRu,'source note restored');checked++;
  }
  assert.equal(checked,52);t.diagnostic('13 episodes × 4 states; actual index script order, DOM identity and numeric attribute parity');
});

test('all translated QA refresh in the same panel; EN bootstrap search finds scene 10',async t=>{
  const {w,scenes}=await fixture(t);let notes=0,questions=0;
  for(let index=0;index<scenes.length;index++){
    await go(w,index,0);await language(w,'ru');openPanel(w,'questions');await settle();
    const root=w.D.deck.root(),body=w.document.querySelector('#notesBody'),sourceNotes=scenes[index].notes,sourceQa=scenes[index].qa;
    await language(w,'en');assert.equal(w.D.deck.root(),root);assert.equal(w.document.querySelector('#notesBody'),body);assert.equal(w.document.querySelector('#notes').dataset.mode,'questions');
    const translated=w.D.i18n.qa(scenes[index]),cards=[...body.querySelectorAll('.qa-item')];assert.equal(translated.length,2);assert.equal(cards.length,2);
    translated.forEach((item,i)=>{assert.equal(cards[i].querySelector('summary').textContent,item.q);assert.equal(cards[i].querySelector('.qa-answer').textContent,plain(w,item.a));assert.equal(cards[i].querySelector('.qa-source').textContent,item.source);assert(!cyrillic.test(item.q+' '+plain(w,item.a)+' '+item.source),'question, answer and source are English even when collapsed');assert.equal(item.url,sourceQa[i].url);questions++;});
    english(w,body,scenes[index].id+' questions');english(w,w.document.querySelector('#notesHead'),'question heading');
    const hrefs=html=>[...html.matchAll(/href=["']([^"']+)/g)].map(m=>m[1]);
    w.D.i18n.notes(scenes[index]).forEach((note,i)=>{assert.deepEqual(hrefs(note),hrefs(sourceNotes[i]));notes++;});
    await language(w,'ru');assert.equal(body.querySelector('summary').textContent,sourceQa[0].q,'same question panel refreshes to Russian');
  }
  assert.equal(notes,52);assert.equal(questions,26);
  await go(w,9,3);await language(w,'en');openPanel(w,'guide');await settle();
  const root=w.D.deck.root(),body=w.document.querySelector('#notesBody'),search=body.querySelector('input[type="search"]');search.value='bootstrap';search.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
  assert([...body.querySelectorAll('.qa-scene-jump')].some(n=>/^10\s*·/.test(n.textContent)),'English bootstrap search returns resampling scene 10');
  english(w,body,'English guide search');
  await language(w,'ru');assert.equal(w.D.deck.root(),root);assert.equal(w.document.querySelector('#notesBody'),body);assert.equal(body.querySelector('input[type="search"]').value,'bootstrap','guide query retained');
  await language(w,'en');english(w,body,'guide after roundtrip');assert.equal(body.querySelector('input[type="search"]').value,'bootstrap');
});

test('QA reading focus, disclosure states and scroll survive RU→EN→RU',async t=>{
  const {w,scenes}=await fixture(t);await go(w,9,1);openPanel(w,'questions');await settle();
  const body=w.document.querySelector('#notesBody'),cards=[...body.querySelectorAll('.qa-item')];
  assert.equal(cards.length,2);cards[0].open=false;cards[1].open=true;
  const originalFocus=cards[1].querySelector('summary');originalFocus.focus();
  assert.equal(w.document.activeElement,originalFocus,'reader starts on the second question summary');
  // jsdom has no layout; this verifies restoration of the scroll value, not pixel visibility.
  body.scrollTop=137;const before=frozenState(w);
  for(const lang of ['en','ru']){
    await language(w,lang);unchanged(w,before,'QA reading state '+lang);
    assert.equal(w.document.querySelector('#notesBody'),body,'same open notes panel');
    assert.equal(w.document.querySelector('#notes').dataset.mode,'questions');
    const currentCards=[...body.querySelectorAll('.qa-item')],summary=currentCards[1].querySelector('summary');
    assert.deepEqual(currentCards.map(card=>card.open),[false,true],'closed and open answers retain their reading state');
    assert.equal(w.document.activeElement,summary,'focus follows the same logical question after translation replaces its DOM');
    assert.notEqual(summary,originalFocus,'assertion covers a rebuilt question, not an untouched summary');
    assert.equal(summary.textContent,w.D.i18n.qa(scenes[9])[1].q,'focused question matches the current language');
    assert.equal(body.scrollTop,137,'notes-body scroll value restored');
  }
});

test('manual threshold and selected sequence pair survive language switches and future paints',async t=>{
  const {w}=await fixture(t);await go(w,10,2);
  let root=w.D.deck.root(),slider=root.querySelector('input[type="range"]');slider.value='.6';slider.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
  assert.equal(root.dataset.selected,'4');assert.equal(root.dataset.threshold,'0.6');const threshold=frozenState(w);
  await language(w,'en');unchanged(w,threshold,'manual threshold');english(w,root,'manual threshold caption');assert.match(root.querySelector('.film-caption').textContent,/4.*2.*2/,'translated manual caption retains counts');
  slider.value='1';slider.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();assert.equal(root.dataset.selected,'0');assert.equal(root.dataset.precision,'null');english(w,root,'new manual paint while English');assert.match(root.querySelector('.film-caption').textContent,/precision is undefined/,'new input replaces the previous translated caption');
  const empty=frozenState(w);await language(w,'ru');unchanged(w,empty,'empty selection');
  await go(w,5,3);root=w.D.deck.root();const chosen=root.querySelector('.sequence-token[data-index="2"]');chosen.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  slider=root.querySelector('input[type="range"]');slider.value='.35';slider.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();assert(chosen.classList.contains('is-selected'));const sequence=frozenState(w);
  await language(w,'en');unchanged(w,sequence,'selected sequence and bend');english(w,root,'selected sequence');
  await language(w,'ru');unchanged(w,sequence,'selected sequence return');assert(chosen.classList.contains('is-selected'));
});

test('sequence pair controls retain two fixed rows and text contracts across locales and fonts',async t=>{
  const {w}=await fixture(t);await go(w,5,3);
  const root=w.D.deck.root(),group=root.querySelector('.lesson-buttons'),buttons=[...group.querySelectorAll('button')];
  assert.equal(buttons.length,2);
  for(const font of ['sans','serif'])for(const lang of ['ru','en']){
    w.D.appearance.set({font});await language(w,lang);
    assert.equal(w.D.deck.root(),root,'appearance and translation retain the scene');
    assert.deepEqual([...group.querySelectorAll('button')],buttons,'both interactive nodes are retained');
    const style=w.getComputedStyle(group);
    assert.equal(style.display,'grid','control rows cannot depend on localized intrinsic widths');
    assert.equal(style.left,'944px');assert.equal(style.top,'466px');assert.equal(style.width,'250px');
    assert.equal(style.gridTemplateColumns,'250px');assert.equal(style.gridTemplateRows,'48px 48px');assert.equal(style.gap,'12px');
    const contracts=w.L.audit(root).results.filter(result=>result.id.startsWith('sequence-pair-button-'));
    assert.deepEqual(JSON.parse(JSON.stringify(contracts.map(result=>result.box))),[
      {x:963,y:475,width:212,height:30},{x:963,y:535,width:212,height:30}
    ],'contracts reserve the CSS padding and border inside each fixed row');
    assert(contracts.every(result=>result.kind==='unmeasured'),'jsdom cannot establish native text fit');
    for(const [index,button]of buttons.entries()){
      assert.equal(button.textContent,lang==='ru'?['Пара 1 ↔ 8','Пара 3 ↔ 6'][index]:['Pair 1 ↔ 8','Pair 3 ↔ 6'][index]);
      button.click();await settle();
      assert(root.querySelector('.sequence-token[data-index="'+(index?2:0)+'"]').classList.contains('is-selected'),'each button still selects its intended pair');
    }
  }
  t.diagnostic('CSS/contract structure and actions only; native font geometry is not available in jsdom');
});

test('switching during an actual F.driver tween preserves progress and lets later frames finish in English',async t=>{
  const {w,advance}=await fixture(t,{clock:true});await go(w,10,0);w.A.setInstant(false);w.D.deck.next();await settle();await advance(0);await advance(1100);await settle();
  const root=w.D.deck.root();assert.equal(w.D.deck.current().busy,true);assert.equal(w.D.deck.current().step,1);assert(Math.abs(+root.dataset.threshold-.875)<1e-12);assert.equal(root.dataset.selected,'1');
  const pending=frozenState(w),running=w.A.debug().running;assert(running>0,'actual animation remains pending');
  await language(w,'en');unchanged(w,pending,'pending driver');assert.equal(w.A.debug().running,running,'locale change does not finish the tween');english(w,root,'English intermediate caption');
  await advance(1600);await settle();assert(+root.dataset.threshold<.875&&+root.dataset.threshold>.8);english(w,root,'later frame writes translated dynamic text');
  w.A.finishAll();for(let i=0;i<20&&w.D.deck.current().busy;i++)await settle();
  assert.equal(w.D.deck.current().busy,false);assert.equal(root.dataset.threshold,'0.8');assert.equal(root.dataset.selected,'2');assert.equal(w.D.i18n.lang(),'en');english(w,root,'completed English driver state');
  const completed=frozenState(w);await language(w,'ru');unchanged(w,completed,'completed driver return');
});
