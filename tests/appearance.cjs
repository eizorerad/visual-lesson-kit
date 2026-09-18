/* Appearance state and reactive-color contracts; browser paint/layout is checked separately. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value)), settle=()=>new Promise(resolve=>setImmediate(resolve));
const key='visual-lesson-kit.appearance.v1';
function fixture(t,{stored,config,storageError=false,full=false}={}){
 assert.ok(fs.existsSync(path.join(root,'js/appearance.js')),'appearance runtime exists');
 const dom=new JSDOM(read('index.html'),{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'});
 t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});
 if(stored!==undefined)w.localStorage.setItem(key,stored);
 if(storageError)Object.defineProperty(w,'localStorage',{get(){throw new Error('storage denied');}});
 w.LESSON=config||{};w.eval(read('js/appearance.js'));
 const files=['js/lib/dom.js','js/lib/i18n.js','js/i18n/en.js','js/lib/touch.js','js/lib/anim.js','js/lib/plot.js','js/lib/svg.js','js/deck.js','js/lesson.js','js/film.js','js/patterns.js','js/matrices.js','js/partitions.js'];
 if(full)files.push('js/player.js');for(const file of files)w.eval(read(file));
 w.D.appearance.bind();return w;
}
function luminance(hex){return hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('appearance applies validated defaults before CSS and body; storage may be absent, corrupt or denied',t=>{
 for(const stored of [undefined,'{broken','null','[]','42','{"background":"red","palette":"unknown","font":{}}']){
  const w=fixture(t,{stored});assert.deepEqual(plain(w.D.appearance.get()),{background:'black',palette:'warm',font:'sans'});
  assert.equal(w.document.documentElement.style.getPropertyValue('--color-bg'),'#000000');
 }
 const denied=fixture(t,{storageError:true});assert.deepEqual(plain(denied.D.appearance.get()),{background:'black',palette:'warm',font:'sans'});assert.equal(denied.D.appearance.set({background:'white'}).background,'white');
 const partial=fixture(t,{config:{appearance:{background:'white',palette:'ocean',font:'serif'}},stored:'{"background":"black","palette":"unknown"}'});assert.deepEqual(plain(partial.D.appearance.get()),{background:'black',palette:'ocean',font:'serif'});
 const html=read('index.html');assert.ok(html.indexOf('js/appearance.js')<html.indexOf('rel="stylesheet"'));assert.ok(html.indexOf('js/config.js')<html.indexOf('js/appearance.js'));
});
test('all palette modes provide exactly five stable roles with readable text and accents',t=>{
 const w=fixture(t),a=w.D.appearance,css=w.document.documentElement.style;
 assert.deepEqual(Object.keys(a.presets.palettes),['warm','ocean','botanical']);
 for(const background of ['black','white'])for(const palette of Object.keys(a.presets.palettes)){
  a.set({background,palette});const bg=background==='black'?'#000000':'#FFFFFF';assert.equal(css.getPropertyValue('--color-bg'),bg);
  const colors=['primary','secondary','focus','contrast','auxiliary'].map(role=>css.getPropertyValue('--color-'+role));assert.equal(new Set(colors).size,5);
  for(const color of [...colors,css.getPropertyValue('--color-text'),css.getPropertyValue('--color-muted')])assert.ok(contrast(color,bg)>=4.5,palette+' '+background+' '+color);
 }
 const original=w.C.blue;a.set({palette:'ocean'});assert.equal(w.C.blue,original);assert.match(original,/^var\(--color-primary\)$/);assert.equal(Object.keys(w.C).length,24);
 assert.ok(Object.isFrozen(a.presets.palettes.warm.black));
});
test('switching every setting preserves scene, progress, input, language, reading state and active animation',async t=>{
 const w=fixture(t,{full:true}),d=w.document;let builds=0,disposals=0;const state={x:0},frames=[];const realTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,delay,...args)=>delay===80?0:realTimeout(fn,delay,...args);w.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
 let driver,mark;w.D.deck.register({id:'one',title:'Пример',notes:['Первый','Второй'],build(ctx){builds++;ctx.onDispose(()=>disposals++);const root=w.D.dom.h('section',{},[w.D.dom.h('input',{type:'range',value:17})]),svg=w.D.dom.s('svg');root.append(svg);mark=w.F.dot(svg,10,10,5,w.C.blue);driver=w.F.driver(state,()=>mark.setAttribute('cx',state.x));ctx.step(()=>driver.to({x:10},{duration:1000}));return root;}});
 w.D.deck.boot();w.D.deck.next();await settle();frames.shift()(0);frames.shift()(500);assert.equal(state.x,5);
 w.D.i18n.setLang('en');await settle();d.querySelector('[data-action="reading"]').click();d.querySelector('[data-action="more"]').click();
 const mounted=w.D.deck.root(),input=mounted.querySelector('input');input.value='33';const before=plain(w.D.deck.current()),transform=d.querySelector('#frame').style.transform,notes=d.querySelector('#notesBody');notes.scrollTop=97;
 for(const change of [{background:'white'},{palette:'ocean'},{font:'serif'}])w.D.appearance.set(change);
 assert.equal(w.D.deck.root(),mounted);assert.equal(input.value,'33');assert.equal(builds,1);assert.equal(disposals,0);assert.equal(state.x,5);assert.equal(w.D.i18n.lang(),'en');assert.equal(d.querySelector('#frame').style.transform,transform);assert.equal(notes.scrollTop,97);assert.deepEqual(plain(w.D.deck.current()),before);
 assert.equal(d.querySelector('#moreMenu').hidden,false);assert.equal(d.body.classList.contains('notes-open'),true);assert.equal(mark.getAttribute('fill'),w.C.blue);
 frames.shift()(1000);await settle();assert.equal(state.x,10);assert.equal(mark.getAttribute('fill'),'var(--color-primary)');assert.equal(w.D.deck.current().busy,false);
});
test('native appearance controls persist selections, support both locales and do not steal select arrows',async t=>{
 const w=fixture(t,{full:true}),d=w.document;w.D.deck.register({id:'one',title:'One',build(){return w.D.dom.h('section','One');}});w.D.deck.boot();
 assert.equal(d.querySelectorAll('#chrome > button').length,5);d.querySelector('[data-action="more"]').click();d.querySelector('#appearanceSettings').open=true;
 for(const [field,value]of Object.entries({background:'white',palette:'botanical',font:'serif'})){
  const select=d.querySelector('[data-appearance="'+field+'"]');assert.ok(select);select.value=value;select.dispatchEvent(new w.Event('change',{bubbles:true}));
  select.focus();const arrow=new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});select.dispatchEvent(arrow);assert.equal(arrow.defaultPrevented,false);assert.equal(d.activeElement,select);
 }
 w.D.i18n.setLang('en');await settle();assert.match(d.querySelector('#appearanceSettings summary').textContent,/Appearance/);assert.match(d.querySelector('[data-appearance="font"]').textContent,/Serif/);
 const stored=w.localStorage.getItem(key),reload=fixture(t,{stored});assert.deepEqual(plain(reload.D.appearance.get()),{background:'white',palette:'botanical',font:'serif'});
 assert.equal(reload.document.documentElement.dataset.font,'serif');
 w.D.appearance.set({background:[],palette:'__proto__',font:null});assert.deepEqual(plain(w.D.appearance.get()),{background:'white',palette:'botanical',font:'serif'});
});
test('derived ramps remain reactive after theme changes while literal hex interpolation stays numeric',t=>{
 const w=fixture(t),svg=w.D.dom.s('svg');w.document.body.append(svg);
 assert.equal(w.P.mixHex('#000000','#FFFFFF',.5),'rgb(128,128,128)');
 const ramp=w.P.diverging(.5,1),sequential=w.P.sequential(.25),blend=w.P.mixHex(w.C.blue,w.C.teal,.4);
 for(const value of [ramp,sequential,blend]){assert.match(value,/color-mix\(in srgb,/);assert.doesNotMatch(value,/NaN|undefined/);}
 assert.match(ramp,/var\(--color-bg\)/);assert.match(ramp,/var\(--color-contrast\)/);
 const matrix=w.K.heatmap(svg,{values:[[-2,0,1,2]],domain:[-2,2],x:0,y:0,cellWidth:30,cellHeight:30});
 const colors=matrix.cells.map(node=>node.getAttribute('fill'));w.D.appearance.set({background:'white',palette:'ocean'});
 assert.deepEqual(matrix.cells.map(node=>node.getAttribute('fill')),colors);assert.equal(w.P.diverging(.5,1),ramp);assert.equal(w.P.sequential(.25),sequential);assert.equal(w.P.mixHex(w.C.blue,w.C.teal,.4),blend);
 assert.match(matrix.cell(0,1).getAttribute('fill'),/var\(--color-bg\)/);assert.deepEqual(plain(matrix.values),[[-2,0,1,2]]);
 const partition=w.K.partitionActors(svg,{items:[{id:'one'}],initialGroup:'all',groups:{all:{x:0,y:0,columns:1,dx:20,dy:20,color:w.C.blue},next:{x:100,y:100,columns:1,dx:20,dy:20,color:w.C.teal}}});
 partition.setPartition({next:['one']},.5);const dot=partition.actors[0].dot,fill=dot.getAttribute('fill'),position=plain(partition.position('one'));
 w.D.appearance.set({background:'black',palette:'botanical'});assert.equal(dot.getAttribute('fill'),fill);assert.deepEqual(plain(partition.position('one')),position);
 partition.setPartition({next:['one']},.75);assert.equal(partition.actors[0].dot,dot);assert.match(dot.getAttribute('fill'),/var\(--color-secondary\)/);assert.equal(partition.counts.next,1);

});
test('author presets are bounded, contrast-checked, safely named and cannot replace built-ins',t=>{
 const colors=['#993311','#226633','#663399','#993355','#225588'];
 const w=fixture(t,{config:{appearance:{background:'white',palette:'custom',font:'custom',palettes:{custom:{label:{ru:'Своя',en:'Custom'},black:['#F29F87','#ACB978','#BDA9E2','#E07D92','#82ABC4'],white:colors},bad:{black:colors,white:colors},duplicates:{black:['#aBcDeF','#AbCdEf','#ABCDEF','#abcdef','#Abcdef'],white:colors},warm:{black:colors,white:colors}},fonts:{custom:{label:{ru:'Своя',en:'Custom'},family:'Local Serif',fallback:'serif'},bad:{family:'x; background:red',fallback:'serif'}}}}});
 assert.deepEqual(plain(w.D.appearance.get()),{background:'white',palette:'custom',font:'custom'});assert.equal(w.D.appearance.presets.palettes.bad,undefined);assert.equal(w.D.appearance.presets.palettes.duplicates,undefined);assert.equal(w.D.appearance.presets.fonts.bad,undefined);
 assert.match(w.document.documentElement.style.getPropertyValue('--f-text'),/"Local Serif"/);w.D.appearance.set({font:'serif'});assert.equal(w.document.documentElement.style.getPropertyValue('--f-text'),'');
});

test('appearance round trips preserve source-image data, links and inline source colors',async t=>{
 const w=fixture(t),d=w.document,container=d.createElement('section');
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
 const sourceSvg='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#cc3300"/></svg>');
 container.innerHTML='<img alt="Unmodified paper figure"><svg xmlns="http://www.w3.org/2000/svg"><image width="10" height="10"/><g data-source-artwork=""><rect width="10" height="10" fill="#cc3300" stroke="#0033aa"/></g></svg>';
 const image=container.querySelector('img'),svgImage=container.querySelector('image');image.src=png;svgImage.setAttribute('href',sourceSvg);
 d.body.append(container);const nodes=[...container.querySelectorAll('*')],before=container.innerHTML;
 for(const background of ['white','black'])for(const palette of ['ocean','botanical','warm'])for(const font of ['serif','sans']){
  w.D.appearance.set({background,palette,font});await settle();
  assert.equal(container.innerHTML,before,'theme updates cannot recolor or rewrite source markup');
  assert.deepEqual([...container.querySelectorAll('*')],nodes,'source nodes retain identity');
  assert.equal(image.src,png);assert.equal(svgImage.getAttribute('href'),sourceSvg);
 }
});
