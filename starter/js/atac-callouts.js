/* Local, upright annotations. Geometry is never moved to make room for text.
 * Fixed preferred offsets avoid jumping between sides; unsafe text fades. */
(function(g){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const rectangleGap=(a,b)=>{
 const dx=Math.max(a.x-b.x-b.width,b.x-a.x-a.width),dy=Math.max(a.y-b.y-b.height,b.y-a.y-a.height);
 return dx>0||dy>0?Math.hypot(Math.max(0,dx),Math.max(0,dy)):Math.max(dx,dy);
};
function create(parent,{id='callout'}={}){
 const entries=new Map();let obstacles=[],occupied=[],snapshots=[],disposed=false;
 function live(){if(disposed)throw new Error('AtacCallouts manager is disposed');}
 function add(key,ru,en,{width=170,height=52,size=20,color=C.white}={}){
  live();if(typeof key!=='string'||!key.trim())throw new TypeError('Callout key must be a nonempty string');
  if(entries.has(key))throw new RangeError('Duplicate callout key '+key);
  const group=F.group(parent);group.dataset.localCallout=key;
  const leader=F.line(group,0,0,0,0,color,1.2);leader.dataset.calloutLeader='';
  const box=F.group(group);box.dataset.calloutBox='';
  const plate=D.dom.s('rect',{x:0,y:0,width,height,rx:7,fill:'var(--color-bg)','fill-opacity':.86});box.append(plate);
  D.i18n.pack('en',{strings:{[ru]:en}});
  const text=L.textBox(box,{id:id+'-'+key,x:0,y:0,width,height,text:ru,size,color,align:'center',padding:6,lineHeight:1.12});
  group.style.opacity=0;entries.set(key,{group,leader,box,text,width,height});return group;
 }
 function begin(input=[]){
  live();
  obstacles=Array.isArray(input)?input:[...(input.rects||[]).filter(p=>p.opacity>.12),...(input.points||[]).filter(p=>p.opacity>.12&&p.x>=60&&p.x<=1220&&p.y>=201&&p.y<=554).map(p=>[p.x,p.y,p.radius])];
  occupied=[];snapshots=[];entries.forEach(e=>e.group.style.opacity=0);
 }
 function measure(e,anchor,offset,leader=true){
  const b={x:anchor[0]+offset[0],y:anchor[1]+offset[1],width:e.width,height:e.height};
  const cx=b.x+b.width/2,cy=b.y+b.height/2,dx=anchor[0]-cx,dy=anchor[1]-cy;
  const k=Math.min(b.width/2/Math.max(.001,Math.abs(dx)),b.height/2/Math.max(.001,Math.abs(dy)),1);
  const start=[cx+dx*k,cy+dy*k],distance=Math.hypot(anchor[0]-start[0],anchor[1]-start[1]),length=Math.max(0,distance-8);
  const end=distance>0?start.map((v,i)=>v+(anchor[i]-v)*length/distance):anchor;
  let gap=Math.min(b.x-62,1218-b.x-b.width,b.y-204,550-b.y-b.height);
  for(const o of obstacles){
   if(Array.isArray(o))gap=Math.min(gap,Math.hypot(Math.max(b.x-o[0],0,o[0]-b.x-b.width),Math.max(b.y-o[1],0,o[1]-b.y-b.height))-(o[2]||3));
   else gap=Math.min(gap,rectangleGap(b,o));
  }
  for(const o of occupied)gap=Math.min(gap,rectangleGap(b,o));
  return {b,start,end,length,gap,fit:ease((gap-5)/13)*(leader?1-ease((length-90)/20):1)};
 }
 // Run once for a cue's destination pose, never as a side-switching solver
 // during playback. The chosen offset then follows its anchor continuously.
 function suggest(key,{anchor,offset=[0,0],leader=true}={}){
  live();
  const e=entries.get(key);let best=offset,bestScore=-Infinity;
  const candidates=[offset];
  for(let x=-e.width-90;x<=90;x+=24)for(let y=-e.height-96;y<=96;y+=20)candidates.push([x,y]);
  for(const candidate of candidates){
   const m=measure(e,anchor,candidate,leader);
   const score=m.fit*1000-Math.hypot(candidate[0]-offset[0],candidate[1]-offset[1])*.45-m.length*.25;
   if(score>bestScore){bestScore=score;best=candidate;}
  }
  return best.slice();
 }
 function place(key,{anchor,offset=[0,0],opacity=1,leader=true}={}){
  live();
  const e=entries.get(key);if(!e||!anchor||anchor.some(v=>!Number.isFinite(v)))return null;
  const {b,start,end,length,gap,fit}=measure(e,anchor,offset,leader),alpha=clamp(opacity)*fit;
  e.box.setAttribute('transform',`translate(${b.x} ${b.y})`);F.seg(e.leader,...start,...end);
  e.leader.style.opacity=leader?'.7':'0';e.group.style.opacity=String(alpha);
  e.group.dataset.clearance=String(gap);e.group.dataset.leaderLength=String(length);e.group.dataset.calloutOpacity=String(alpha);
  e.group.dataset.anchorX=String(anchor[0]);e.group.dataset.anchorY=String(anchor[1]);
  if(alpha>.05)occupied.push(b);
  const result={id:key,anchor:anchor.slice(),box:b,opacity:alpha,clearance:gap,leaderLength:length};snapshots.push(result);return result;
 }
 return {add,begin,place,suggest,get snapshots(){return snapshots;},dispose(){if(disposed)return;disposed=true;entries.forEach(e=>{e.text.dispose();e.group.remove();});entries.clear();obstacles=[];occupied=[];snapshots=[];}};
}
g.AtacCallouts=Object.freeze({create,rectangleGap});
})(window);
