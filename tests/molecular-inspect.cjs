const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{JSDOM}=require('jsdom');
function env(){const d=new JSDOM('<main id="frame"><svg xmlns="http://www.w3.org/2000/svg"></svg></main>',{runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;for(const name of ['lib/dom.js','lib/i18n.js','lesson.js','interaction-regions.js','molecular.js','molecular-inspect.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));return w;}
test('inspection preserves source nodes and state; Escape consumes navigation and returns focus',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.cas9(svg,{x:300,y:300,scale:2}),before=a.g.outerHTML;
 const i=w.B.inspect(svg,a,{id:'cas',label:'Рассмотреть белок',enLabel:'Inspect protein',title:'Cas9',enTitle:'Cas9'});i.trigger.g.focus();i.open();
 const dialog=w.document.querySelector('[data-molecular-detail]');assert.ok(dialog);assert.equal(dialog.getAttribute('aria-modal'),'true');assert.equal(a.g.outerHTML,before);assert.equal(w.document.activeElement.tagName,'BUTTON');
 let navigated=false;w.document.addEventListener('keydown',()=>navigated=true);dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(navigated,false);assert.equal(w.document.querySelector('[data-molecular-detail]'),null);assert.equal(w.document.activeElement,i.trigger.g);i.dispose();i.dispose();assert.equal(svg.querySelector('[data-vlk-button]'),null);
});
test('a magnified detail preserves effective ink width and cannot duplicate source IDs',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.cas9(svg,{scale:3});a.recognition.id='original-part';w.B.emphasis(a,{level:'focus',part:'recognition'});const i=w.B.inspect(svg,a,{id:'detail',label:'Доля',enLabel:'Lobe',title:'Cas9',enTitle:'Cas9',part:'recognition',detailBounds:{x:-84,y:-62,width:168,height:70}});i.open();
 const clone=w.document.querySelector('[data-molecular-detail] svg');assert.equal(w.document.querySelectorAll('#original-part').length,1);const edge=clone.querySelector('[data-bio-part="recognition"] [stroke]');assert.ok(Math.abs(+edge.getAttribute('stroke-width')-2.2)<1e-9);assert.equal(edge.getAttribute('vector-effect'),'non-scaling-stroke');i.dispose();assert.equal(w.document.querySelector('[data-molecular-detail]'),null);
});
test('inspection never reveals absent histone marks and reads current dynamic bounds',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.nucleosome(svg,{marked:0});
 const i=w.B.inspect(svg,a,{id:'histones',label:'Гистоны',enLabel:'Histones',title:'Гистоны',enTitle:'Histones',part:'histone-octamer'});a.bounds={x:-100,y:-100,width:200,height:200};i.open();
 const detail=w.document.querySelector('[data-molecular-detail]');assert.equal(detail.querySelector('[data-bio-part="histone-methylation"]').getAttribute('opacity'),'0');assert.equal(detail.querySelector('svg').getAttribute('viewBox'),'-110 -110 220 220');i.dispose();
});
test('interactive SVG exposes buttons to assistive technology and restores its original role after last disposal',()=>{
 const w=env(),svg=w.document.querySelector('svg');svg.setAttribute('role','img');
 const a=w.B.cas9(svg),opts={label:'Белок',enLabel:'Protein',title:'Cas9',enTitle:'Cas9'};
 const first=w.B.inspect(svg,a,{...opts,id:'first'}),second=w.B.inspect(svg,a,{...opts,id:'second'});
 assert.equal(svg.getAttribute('role'),'group');first.dispose();assert.equal(svg.getAttribute('role'),'group');second.dispose();assert.equal(svg.getAttribute('role'),'img');
});
test('moving inspection boxes use actor-to-parent coordinates through nested transforms',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.cas9(svg,{x:1,y:2});a.bounds={x:-2,y:-1,width:4,height:2};
 // jsdom has no SVG CTM implementation; these are screen matrices from a parent
 // at scale 2 and an actor rotated 90 degrees under an additional scale of 3.
 svg.getScreenCTM=()=>({a:2,b:0,c:0,d:2,e:100,f:50});let current={a:0,b:6,c:-6,d:0,e:220,f:290};a.g.getScreenCTM=()=>current;
 const i=w.B.inspect(svg,a,{id:'nested',label:'Белок',enLabel:'Protein',title:'Белок',enTitle:'Protein'}),box=()=>['x','y','width','height'].map(k=>+i.trigger.hit.getAttribute(k));
 assert.deepEqual(box(),[57,114,6,12]);
 current={a:0,b:8,c:-8,d:0,e:260,f:330};i.setBox();assert.deepEqual(box(),[76,132,8,16]);i.dispose();
});
test('captured orientation and stroke widths retain ancestor scale while removing screen zoom',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.cas9(svg,{scale:2});a.bounds={x:-2,y:-1,width:4,height:2};
 svg.getScreenCTM=()=>({a:2,b:0,c:0,d:2,e:100,f:50});
 for(const node of [a.g,...a.g.querySelectorAll('*')])node.getScreenCTM=()=>({a:0,b:12,c:-12,d:0,e:220,f:290});
 const i=w.B.inspect(svg,a,{id:'nested-snapshot',label:'Белок',enLabel:'Protein',title:'Белок',enTitle:'Protein'});i.open();
 const captured=w.document.querySelector('[data-molecular-detail] svg'),clone=captured.querySelector('[data-bio-actor]');assert.equal(clone.getAttribute('transform'),'matrix(0 6 -6 0 60 120)');
 const bounds=captured.getAttribute('viewBox').split(' ').map(Number);[52.8,106.8,14.4,26.4].forEach((value,j)=>assert.ok(Math.abs(bounds[j]-value)<1e-9));
 const original=a.g.querySelector('[stroke-width]'),copy=clone.querySelector('[stroke-width]');assert.equal(+copy.getAttribute('stroke-width'),+original.getAttribute('stroke-width')*6);i.dispose();
});
test('snapshot respects inline non-scaling stroke widths and inline part opacity',()=>{
 const w=env(),svg=w.document.querySelector('svg'),a=w.B.cas9(svg,{scale:3}),edge=a.g.querySelector('[stroke-width]');edge.style.strokeWidth='4px';edge.setAttribute('vector-effect','non-scaling-stroke');a.nuclease.style.opacity='.4';
 const i=w.B.inspect(svg,a,{id:'styled',label:'Белок',enLabel:'Protein',title:'Белок',enTitle:'Protein',part:'recognition'});i.open();
 const clone=w.document.querySelector('[data-molecular-detail] svg'),copied=clone.querySelector('[stroke-width]');assert.equal(+copied.getAttribute('stroke-width'),4);assert.equal(copied.style.strokeWidth,'4px');assert.equal(+clone.querySelector('[data-bio-part="nuclease"]').style.opacity,.4*.13);i.dispose();
});
test('snapshot retains inherited opacity and hidden ancestors without changing source visibility',()=>{
 const w=env(),svg=w.document.querySelector('svg'),group=w.document.createElementNS(svg.namespaceURI,'g');svg.append(group);group.style.opacity='.3';const a=w.B.cas9(group);a.g.style.opacity='.5';
 const i=w.B.inspect(svg,a,{id:'faded',label:'Белок',enLabel:'Protein',title:'Белок',enTitle:'Protein'});i.open();
 let clone=w.document.querySelector('[data-molecular-detail] [data-bio-actor]');assert.equal(+clone.parentElement.getAttribute('opacity'),.3);assert.equal(+clone.style.opacity,.5);assert.equal(+a.g.style.opacity,.5);
 i.close();group.style.display='none';i.open();clone=w.document.querySelector('[data-molecular-detail] [data-bio-actor]');assert.equal(clone.parentElement.getAttribute('display'),'none');i.dispose();
});
test('dialog language and single-active cleanup retain pose and independent canvas roles',()=>{
 const w=env(),svg=w.document.querySelector('svg');svg.setAttribute('role','img');const second=w.document.createElementNS(svg.namespaceURI,'svg');w.document.body.append(second);
 const a=w.B.cas9(svg),b=w.B.cas9(second),options={label:'Белок',enLabel:'Protein',title:'Крупный белок',enTitle:'Large protein',description:'Описание',enDescription:'Description'};
 const first=w.B.inspect(svg,a,{...options,id:'first'}),last=w.B.inspect(second,b,{...options,id:'last'}),before=a.g.outerHTML;first.open();w.D.i18n.setLang('en');
 let dialog=w.document.querySelector('[data-molecular-detail]');assert.equal(dialog.querySelector('h2').textContent,'Large protein');assert.equal(dialog.querySelector('button').textContent,'Close detail');assert.equal(first.trigger.g.getAttribute('aria-label'),'Protein');
 dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(w.document.activeElement,dialog.querySelector('button'));assert.equal(a.g.outerHTML,before);
 last.open();assert.equal(w.document.querySelectorAll('[data-molecular-detail]').length,1);assert.equal(w.document.querySelector('[data-molecular-detail]').dataset.molecularDetail,'last');first.dispose();assert.equal(svg.getAttribute('role'),'img');assert.equal(second.getAttribute('role'),null);last.dispose();last.dispose();w.D.i18n.setLang('ru');assert.equal(w.document.querySelector('[data-molecular-detail]'),null);assert.throws(()=>last.open(),/disposed/);
});
test('nested SVG inspection exposes every enclosing image role until its last control is disposed',()=>{
 const w=env(),svg=w.document.querySelector('svg'),inner=w.document.createElementNS(svg.namespaceURI,'svg');svg.setAttribute('role','img');inner.setAttribute('role','img');svg.append(inner);
 const options={label:'Белок',enLabel:'Protein',title:'Белок',enTitle:'Protein'},outerControl=w.B.inspect(svg,w.B.cas9(svg),{...options,id:'outer'}),innerControl=w.B.inspect(inner,w.B.cas9(inner),{...options,id:'inner'});
 outerControl.dispose();assert.equal(svg.getAttribute('role'),'group','the outer image must keep exposing the nested button');assert.equal(inner.getAttribute('role'),'group');innerControl.dispose();assert.equal(svg.getAttribute('role'),'img');assert.equal(inner.getAttribute('role'),'img');
});
