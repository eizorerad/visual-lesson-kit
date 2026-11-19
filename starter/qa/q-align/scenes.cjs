#!/usr/bin/env node
/* Portable scene-construction and transition smoke check. No browser is used.
 * Exports authored SVG and text contracts for independent font/layout review.
 * This does not validate native controls, CSS or physical browser gestures. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),output=process.argv[2],SVG='http://www.w3.org/2000/svg';
class Element {
 constructor(tag,attrs={},namespace=SVG){this.tagName=tag.split('.')[0];this.namespaceURI=namespace;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';this.classList={add:()=>{}};for(const [k,v] of Object.entries(attrs)){if(k==='style')Object.assign(this.style,v);else if(k==='html')this.innerHTML=v;else if(k.startsWith('on'))this.events[k.slice(2).toLowerCase()]=v;else this.setAttribute(k,v);}}
 append(...nodes){for(const node of nodes.flat()){if(node==null)continue;if(typeof node==='object'){node.parentNode=this;this.children.push(node);}else this.textContent+=node;}}
 setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
 getAttribute(k){return this.attributes[k]??null;}
 querySelectorAll(selector){const out=[];for(const c of this.children){if(selector==='[data-assignment-source]'&&c.getAttribute('data-assignment-source')!==null)out.push(c);out.push(...c.querySelectorAll(selector));}return out;}
 addEventListener(k,v){this.events[k]=v;}
}
const language={current:'ru',strings:{},notes:{},qa:{}},scenes=[],textBoxes=[],contracts=[];
const context={window:null,console,HTMLElement:Element,C:undefined,D:{dom:{s:(tag,attrs,children)=>{const e=new Element(tag,attrs);e.append(children);return e;},h:(tag,attrs,children)=>{const e=new Element(tag,attrs,'html');e.append(children);return e;}},i18n:{pack:(lang,pack)=>{for(const key of ['strings','notes','qa'])Object.assign(language[key],pack[key]||{});},text:str=>language.current==='en'?(language.strings[str]||str):str},deck:{register:scene=>scenes.push(scene),count:()=>scenes.length}},L:{contract:(el,options)=>{contracts.push({el,options});},watch:()=>{},textBox:(parent,options)=>{const el=new Element('text',{'font-size':options.size,fill:options.color,'data-layout-id':options.id});parent.append(el);const record={el,options:{...options},source:options.text||''};textBoxes.push(record);return {el,setText:text=>{record.source=String(text);},setBox:box=>Object.assign(record.options,box)};}},A:{run:fn=>{[0,.25,.5,.75,1].forEach(fn);return Promise.resolve();}},S:{text:()=>new Element('text')},LESSON:{title:'Q-Align',source:{label:'Q-Align'}}};
context.window=context;vm.createContext(context);
for(const name of ['lesson.js','film.js','graph-alignment.js','q-align-data.js','recipes/q-align-details.js','recipes/q-align-beginner.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),context,{filename:name});
function active(node){let value=1;for(let e=node;e;e=e.parentNode)value*=e.style.opacity===undefined?1:Number(e.style.opacity);return value>.05;}
function plain(node){const attrs={...node.attributes};if(node.style.opacity!==undefined)attrs.opacity=node.style.opacity;return {tag:node.tagName,attrs,children:node.children.filter(c=>c.namespaceURI===SVG).map(plain)};}
async function main(){const frames=[],interactions=[];let states=0;
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i],queue=[],disposals=[];textBoxes.length=0;contracts.length=0;
  const v=scene.build({index:i,step:fn=>queue.push(fn),onDispose:fn=>disposals.push(fn)});
  assert.equal(scene.notes.length,queue.length+1,scene.id+' Russian note count');assert.equal(language.notes[scene.id].length,queue.length+1,scene.id+' English note count');
  function capture(step){for(const lang of ['ru','en']){language.current=lang;const svg=v.children.find(e=>e.tagName==='svg'),frame={scene:i+1,id:scene.id,step,language:lang,title:language.current==='en'?(language.strings[scene.title]||scene.title):scene.title,caption:context.D.i18n.text(v.children.find(e=>e.tagName==='div'&&e.innerHTML!==undefined)?.innerHTML||''),data:v.dataset,svg:plain(svg),texts:textBoxes.filter(r=>active(r.el)).map(r=>({id:r.options.id,text:context.D.i18n.text(r.source),...r.options})).map(r=>({...r,text:context.D.i18n.text(textBoxes.find(q=>q.options.id===r.id).source)}))};frames.push(JSON.parse(JSON.stringify(frame)));}language.current='ru';}
  capture(0);for(let step=0;step<queue.length;step++){await queue[step]();capture(step+1);}states+=queue.length+1;
  const elements=[];function walk(e){elements.push(e);e.children.forEach(walk);}walk(v);
  const button=label=>{const b=elements.find(e=>e.tagName==='button'&&e.textContent===label);assert.ok(b,'Missing button '+label);b.events.click();};
  const input=value=>{const el=elements.find(e=>e.tagName==='input');assert.ok(el);el.value=String(value);el.events.input();};
  if(i+1===15){button('Без шума');assert.equal(v.dataset.truthConserved,8);button('Шум 0.1');assert.equal(v.dataset.truthConserved,7);interactions.push('noise variants');}
  if(i+1===17){input(2);assert.equal(v.dataset.validEnergy,-20);assert.equal(v.dataset.invalidEnergy,-24);input(3);assert.equal(v.dataset.validEnergy,-24);assert.equal(v.dataset.invalidEnergy,-16);interactions.push('binary penalty weights');}
  if(i+1===21){input(0);assert.equal(v.dataset.temperature,5);input(149);assert.ok(v.dataset.temperature>.01&&v.dataset.temperature<.011);interactions.push('cooling endpoints');}
  if(i+1===22){button('Число минимумов');assert.equal(v.dataset.r2Target,'log_minima');button('Успех SA');assert.equal(v.dataset.r2Target,'sa_hit_rate');assert.equal(v.dataset.r2Entropy,context.QAlignData.survey.r2_sa_hit_rate.avg_entropy);interactions.push('regression targets');}
  if(i+1===23){button('Один оптимум');assert.equal(v.dataset.fdcReference,'first');button('Ближайший из 4');assert.equal(v.dataset.fdcReference,'nearest');input(719);assert.equal(v.dataset.answerId,719);interactions.push('FDC reference and answer inspection');}
  if(i+1===24){button('Начало');assert.equal(v.dataset.walkStart,0);button('Середина');assert.equal(v.dataset.walkStart,360);button('Конец');assert.equal(v.dataset.walkStart,720);interactions.push('walk windows');}
  disposals.forEach(fn=>fn());
 }
 assert.equal(scenes.length,26);assert.equal(states,100);
 if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify({coverage:'construction, guided endpoints and direct control callbacks; no native browser UI',scenes:scenes.length,states,interactions,frames}));}
 console.log(JSON.stringify({scenes:scenes.length,states,endpoints:frames.length,notes:'RU/EN one per state',transitions:'five numeric samples per tween',controlCallbackChecks:interactions,output:output||null}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
