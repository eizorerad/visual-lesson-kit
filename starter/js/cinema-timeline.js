/* Numeric scene timelines. Compile complete poses first, then choose a route.
 * Motion is an authored explanation, not a simulation of the subject. */
(function(g){
'use strict';
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clamp=value=>Math.max(0,Math.min(1,value));
function smooth(u){u=clamp(u);if(u>.5)return 1-smooth(1-u);return u*u*u*(u*(u*6-15)+10);}
function fields(object,allowed,label){
 if(!record(object))throw new TypeError(label+' must be an object');
 for(const key of Object.keys(object))if(!allowed.includes(key))throw new TypeError('Unknown '+label+' field '+key);
}
function timing(value,label,positive=false){
 if(!Number.isFinite(value)||(positive?value<=0:value<0))throw new TypeError(label+' must be a finite '+(positive?'positive':'nonnegative')+' number of seconds');
 return value;
}
function textPatch(text,label){
 fields(text,['ru','en'],label);const out={};
 for(const [lang,copy] of Object.entries(text)){
  fields(copy,['title','caption','note','approach'],label+'.'+lang);
  for(const [name,value] of Object.entries(copy)){
   if(typeof value!=='string')throw new TypeError(label+'.'+lang+'.'+name+' must be a string');
   out[name+(lang==='ru'?'Ru':'En')]=value;
  }
 }
 return out;
}
function patch(value,label){
 fields(value,['motion','hold','text'],label);
 const out={};
 for(const key of ['motion','hold'])if(own(value,key))out[key]=timing(value[key],label+'.'+key);
 if(own(value,'text'))Object.assign(out,textPatch(value.text,label+'.text'));
 return out;
}
function compile(options){
 fields(options,['baseline','catalog','route','overrides'],'timeline');
 const {baseline,catalog}=options;
 if(!record(baseline)||!Object.keys(baseline).length||Object.values(baseline).some(v=>!Number.isFinite(v)))throw new TypeError('Timeline baseline must contain finite numeric fields');
 if(!Array.isArray(catalog)||!catalog.length)throw new TypeError('Timeline catalog must be a nonempty array');
 const keys=Object.keys(baseline),known=new Map();
 for(const cue of catalog){
  if(!record(cue)||typeof cue.key!=='string'||!cue.key)throw new TypeError('Each catalog cue needs a nonempty key');
  if(known.has(cue.key))throw new TypeError('Duplicate catalog key '+cue.key);
  if(!record(cue.target)||Object.keys(cue.target).length!==keys.length||keys.some(k=>!own(cue.target,k)||!Number.isFinite(cue.target[k])))throw new TypeError(cue.key+' target must contain every baseline field with finite values');
  timing(cue.motion, cue.key+'.motion');timing(cue.hold,cue.key+'.hold');
  known.set(cue.key,cue);
 }
 const overrides=options.overrides===undefined?{}:options.overrides;
 if(!record(overrides))throw new TypeError('Timeline overrides must be an object');
 const patches=new Map();
 for(const [key,value] of Object.entries(overrides)){
  if(!known.has(key))throw new TypeError('Unknown override cue '+key);
  patches.set(key,patch(value,'override '+key));
 }
 const route=options.route===undefined?catalog.map(c=>c.key):options.route;
 if(!Array.isArray(route)||!route.length)throw new TypeError('Timeline route must be a nonempty array');
 const seen=new Set();let previous=null;
 const cues=route.map((entry,index)=>{
  const key=typeof entry==='string'?entry:entry&&entry.key;
  if(!known.has(key))throw new TypeError('Unknown route cue '+key);
  if(seen.has(key))throw new TypeError('Duplicate route cue '+key);seen.add(key);
  let local={};
  if(typeof entry!=='string'){
   fields(entry,['key','motion','hold','text'],'route '+key);
   const {key:ignored,...rest}=entry;local=patch(rest,'route '+key);
  }
  const override=patches.get(key)||{},custom={...override,...local};
  // Merge the text leaves, so route text can override one locale while the
  // other locale from a global override remains intact.
  const cue={...known.get(key),...custom};
  let motion=index?cue.motion:0;
  if(index===0&&own(custom,'motion')&&custom.motion!==0)throw new TypeError('The first cue is the initial pose; its motion must be 0');
  if(index)timing(motion,key+'.motion',true);
  const hold=timing(cue.hold,key+'.hold'),arrive=previous?previous.time+previous.hold:0,time=arrive+motion;
  if(!Number.isFinite(time+hold))throw new TypeError('Timeline duration must be finite');
  if(motion>0&&time<=arrive)throw new RangeError(key+'.motion is below clock precision at its arrival time');
  if(hold>0&&time+hold<=time)throw new RangeError(key+'.hold is below clock precision at its endpoint time');
  return previous=Object.freeze({...cue,index,arrive,time,motion,hold,target:Object.freeze({...cue.target})});
 });
 if(duration(cues)<=0)throw new TypeError('Timeline duration must be positive');
 return Object.freeze(cues);
}
function duration(cues){const last=cues[cues.length-1];return last.time+last.hold;}
function interpolate(a,b,p){
 if(a===b||p===1)return b;if(p===0)return a;
 const difference=b-a;
 // Preserve ordinary authored arithmetic; only opposite extreme endpoints
 // need the convex form to avoid overflowing their intermediate difference.
 return Number.isFinite(difference)?a+difference*p:(1-p)*a+p*b;
}
function sample(cues,baseline,time,ease=smooth){
 if(!Number.isFinite(time))throw new TypeError('Timeline time must be finite');
 if(typeof ease!=='function')throw new TypeError('Timeline easing must be a function');
 time=Math.max(0,Math.min(duration(cues),time));
 let right=cues.findIndex(c=>c.time>time);if(right<0)right=cues.length;
 const detail=(values,cue)=>({values:{...values},cue,transition:0,captionPhase:'detail',captionOpacity:1});
 if(right===0)return detail(cues[0].target,0);
 if(right===cues.length)return detail(cues[cues.length-1].target,cues.length-1);
 const a=cues[right-1],b=cues[right];if(time<b.arrive)return detail(a.target,right-1);
 const eased=u=>{const p=ease(u);if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('Timeline easing must return a finite value in [0,1]');return p;};
 const u=clamp((time-b.arrive)/b.motion),p=eased(u),values={};
 for(const k of Object.keys(baseline))values[k]=interpolate(a.target[k],b.target[k],p);
 const captionPhase=p>=.95?'detail':'approach';
 const captionOpacity=captionPhase==='detail'?eased(clamp((p-.95)/.05)):
  ((b.approachRu||b.approachEn)?eased(clamp(u/.15))*(1-eased(clamp((p-.75)/.2))):0);
 return {values,cue:right,transition:u,captionPhase,captionOpacity};
}
g.CinemaTimeline=Object.freeze({compile,sample,duration,smooth});
})(window);
