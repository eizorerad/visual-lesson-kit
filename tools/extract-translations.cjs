/* Authoring aid: capture source strings without translating or editing the scenes. */
const fs=require('node:fs'),path=require('node:path');const {JSDOM}=require('jsdom');
const kit=path.resolve(__dirname,'..'),starter=path.join(kit,'starter'),html=fs.readFileSync(path.join(starter,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'}),w=dom.window;w.matchMedia=()=>({matches:false});
const scenes=[],found=new Map();
for(const m of html.matchAll(/<script src="([^"]+)"/g)){const file=m[1];if(/\/(?:boot|player)\.js$/.test(file)||file.includes('/i18n/'))continue;w.eval(fs.readFileSync(path.join(starter,file),'utf8'));if(file==='js/deck.js')w.D.deck={register:s=>scenes.push(s),count:()=>scenes.length,scale:()=>1};}
function add(text,where){text=String(text).trim();if(!/[а-яё]/i.test(text))return;if(!found.has(text))found.set(text,new Set());found.get(text).add(where);}
function capture(root,where){const walker=w.document.createTreeWalker(root,w.NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())if(!n.parentElement.closest('script,style'))add(n.nodeValue,where);for(const el of root.querySelectorAll('*'))for(const attr of ['aria-label','title','placeholder','alt'])if(el.hasAttribute(attr))add(el.getAttribute(attr),where);}
(async()=>{capture(w.document.body,'shell');w.A.setInstant(true);
 for(const scene of scenes){const steps=[],cleanup=[],el=scene.build({index:scenes.indexOf(scene),step:fn=>steps.push(fn),onDispose:fn=>cleanup.push(fn)});w.document.querySelector('#frame').append(el);add(scene.title,scene.id);add(scene.chapter,scene.id);
  for(let step=0;step<=steps.length;step++){if(step)await steps[step-1]();capture(el,scene.id+'.'+step);}
  for(const button of el.querySelectorAll('.evidence-button')){button.click();const layer=w.document.querySelector('.evidence-layer');if(layer){capture(layer,scene.id+'.source');layer.querySelector('.evidence-close').click();}}
  for(const slider of el.querySelectorAll('input[type="range"]'))for(const v of [slider.min,(+slider.min+ +slider.max)/2,slider.max]){slider.value=v;slider.dispatchEvent(new w.Event('input',{bubbles:true}));capture(el,scene.id+'.input');}
  cleanup.forEach(fn=>fn());el.remove();
 }
 const result=[...found].map(([source,where])=>({source,where:[...where]}));fs.writeFileSync(path.join(kit,'verification/localization-source-strings.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({strings:result.length,scenes:scenes.length}));w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
