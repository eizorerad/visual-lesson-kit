'use strict';
/* The narrated film compiles into complete poses with resolved tones, plain notes and
 * voice-fitted holds, and a shot change fades in before the new shot moves; no DOM. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../starter/js');
function load(voice){
 const registered=[],packs=[];
 const phase=(t,a=0,b=1)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q===0||q===1?q:q*q*(3-2*q);};
 const w={D:{i18n:{pack:(code,definition)=>packs.push(definition)},deck:{register:x=>registered.push(x)}},F:{phase},
  location:{href:'file:///index.html'},document:{body:{classList:{add(){}}}}};
 w.window=w;vm.createContext(w);
 const files=['cinema-timeline.js','recipes/narrated/core.js','recipes/narrated/voice-timing.js','recipes/narrated/example-pairs.js','recipes/narrated/narrated-film.js'];
 for(const file of files){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});if(file.endsWith('voice-timing.js')&&voice)w.NARRATED_VOICE=voice;}
 return {w,V:w.NARRATED,film:w.NARRATED_FILM,scene:registered[0],packs};
}
test('the example film registers complete poses, tones, plain bilingual notes and questions',()=>{
 const {V,film,scene,packs}=load();
 assert.equal(scene.id,'narrated-film');assert.equal(film.cues.length,5);assert.equal(V.chapters.length,2);
 const fields=Object.keys(film.baseline).sort();
 for(const cue of film.cues){
  assert.deepEqual(Object.keys(cue.target).sort(),fields,cue.key+' carries every field');
  for(const key of ['titleRu','titleEn','captionRu','captionEn','noteRu','noteEn'])assert(typeof cue[key]==='string'&&cue[key].trim(),cue.key+' '+key);
  assert.doesNotMatch(cue.noteRu,/[{}*]|\[(pause|chuckle|breath|sigh)\]/,cue.key+' note keeps no delivery markup');
 }
 for(const cue of V.cues)assert(Object.values(V.TONE).includes(cue.tone),cue.key+' tone resolves to a style string');
 assert.equal(scene.notes.length,5);assert.equal(scene.qa.length,3);
 const english=packs.find(p=>p.notes&&p.notes['narrated-film']);assert.equal(english.notes['narrated-film'].length,5);
});
test('markup is stripped, cue keys are unique and captions keep numbers with their units',()=>{
 const {V,film}=load();
 assert.equal(V.plain('Вот *главное*. [pause] {excited and bright} Ген изменился! [chuckle]'),'Вот главное. Ген изменился!');
 assert.throws(()=>V.cue({key:'pairs',title:['a','b'],caption:['a','b'],voice:['a','b']}),/Duplicate cue/);
 assert.throws(()=>V.cue({key:'x',title:['a'],caption:['a','b'],voice:['a','b']}),/title/);
 assert(film.cues.every(c=>!/\d %/.test(c.captionRu)),'no breakable space before %');
});
test('a shot change fades the new shot in before its fields move',()=>{
 const {film}=load(),cues=film.cues,i=cues.findIndex(c=>c.key==='pairs'),c=cues[i];
 assert.notEqual(cues[i-1].target.shot,c.target.shot);
 const early=film.sample(c.arrive+c.motion*.3).values,done=film.sample(c.arrive+c.motion*.4).values;
 assert.equal(early['pairs.play'],0,'the new shot has not started moving at 30% of the motion');
 assert.equal(done.shot,c.target.shot,'the cross-fade is complete at 40% of the motion');
 assert(done['pairs.play']<.05,'and the new shot has barely begun to move');
 const late=film.sample(c.arrive+c.motion*.7).values;
 assert(late['pairs.play']>0&&late['pairs.play']<1);
 const same=cues.findIndex(x=>x.key==='draws'),d=cues[same],mid=film.sample(d.arrive+d.motion/2).values;
 assert(mid['pairs.tally']>0&&mid['pairs.tally']<1,'within one shot fields move over the whole motion');
});
test('holds stretch to the recorded narration',()=>{
 const base=load().film.cues.find(c=>c.key==='pairs');
 const voiced=load({pairs:20}).film.cues.find(c=>c.key==='pairs');
 assert.equal(base.hold,4);assert.equal(voiced.hold,Math.round((20+1.6-voiced.motion)*100)/100);
});
