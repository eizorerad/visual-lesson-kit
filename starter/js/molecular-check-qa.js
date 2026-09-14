/* Optional diagnostics for the animation template, enabled only by ?qa=1. */
(function(){'use strict';
if(new URLSearchParams(location.search).get('qa')!=='1')return;
function start(){
 const output=document.createElement('pre');output.id='check-qa';output.hidden=true;document.body.append(output);
 const toolbar=document.createElement('div');toolbar.dataset.noSwipe='';toolbar.style.cssText='position:fixed;top:3px;right:6px;z-index:2000;display:flex;gap:5px;font:12px sans-serif';
 for(const value of [0,25,50,75,100]){const button=document.createElement('button');button.textContent='Frame '+value+'%';button.onclick=()=>{const input=document.querySelector('#frame input[type=range]');if(input){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}};toolbar.append(button);}
 const capture=document.createElement('button');capture.textContent='Captured motion';capture.hidden=true;toolbar.append(capture);document.body.append(toolbar);
 const identities=new WeakMap();let pending=false,lastCapture=null,history=[];
 capture.onclick=()=>{if(!lastCapture)return;const layer=document.createElement('div');layer.id='check-motion-view';layer.style.cssText='position:fixed;inset:0;background:var(--color-bg);z-index:5000';const frame=document.createElement('div');frame.className='slide-frame';frame.style.cssText=document.querySelector('#frame').style.cssText;frame.append(lastCapture.clone.cloneNode(true));layer.append(frame);const close=document.createElement('button');close.textContent='Close captured motion';close.style.cssText='position:fixed;right:8px;top:5px';close.onclick=()=>layer.remove();layer.append(close);document.body.append(layer);};
 function inspect(){pending=false;const root=document.querySelector('#frame [data-check-actor]');if(!root)return;
  const actor=root.querySelector('[data-bio-actor]'),shapes=[...actor.querySelectorAll('g,path,line,circle,ellipse,rect')];
  if(!identities.has(root))identities.set(root,shapes);const initial=identities.get(root),sameNodes=initial.length===shapes.length&&initial.every((n,i)=>n===shapes[i]);
  const audit=L.audit(root,{visibleOnly:true}),progress=+root.dataset.progress,pose=JSON.parse(root.dataset.actorPose),bounds=JSON.parse(root.dataset.actorBounds);
  const stageBounds={left:pose.x+bounds.x*pose.scale,top:pose.y+bounds.y*pose.scale,right:pose.x+(bounds.x+bounds.width)*pose.scale,bottom:pose.y+(bounds.y+bounds.height)*pose.scale};
  if(root.dataset.running==='true'&&progress%1>.44&&progress%1<.56){lastCapture={scene:root.dataset.sceneId,progress,clone:root.cloneNode(true)};capture.hidden=false;}
  const result={scene:root.dataset.sceneId,actor:root.dataset.checkActor,progress,running:root.dataset.running==='true',sameNodes,shapeCount:shapes.length,stageBounds,scale:pose.scale,parameter:+actor.dataset.checkParameter,contracted:audit.contracted,checked:audit.checked,unmeasured:audit.unmeasured,issues:audit.issues,uncontractedText:audit.uncontractedText,captured:lastCapture?{scene:lastCapture.scene,progress:lastCapture.progress}:null};
  if(!sameNodes||result.issues.some(i=>i.kind!=='unmeasured'))history.push(result);if(history.length>80)history.shift();
  output.textContent=JSON.stringify({current:result,history});output.dataset.scene=result.scene;output.dataset.progress=String(progress);output.dataset.ready=String(result.unmeasured===0);
 }
 const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(inspect);}});observer.observe(document.querySelector('#frame'),{subtree:true,attributes:true,childList:true,characterData:true});
 document.fonts.ready.then(()=>requestAnimationFrame(inspect));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
