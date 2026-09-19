'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'../starter/js'),plain=x=>JSON.parse(JSON.stringify(x));
function lesson(config){
 const registered=[],w={ATAC_FILM_CONFIG:config,D:{i18n:{pack(){}},deck:{register:x=>registered.push(x)}},F:{note:(...args)=>args}};
 w.window=w;vm.createContext(w);
 for(const file of ['cinema-timeline.js','atac-copy.js','atac-story.js','atac-camera-story.js','atac-journey.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});
 return {w,film:w.ATAC_FILM,scene:registered[0]};
}
test('empty config exactly preserves the reviewed film, including copy, poses and timings',()=>{
 const {film}=lesson({});assert.equal(film.cues.length,46);assert(Math.abs(film.duration-240.6)<1e-9);
 // Fingerprint of the approved standalone source's compiled cues, measured
 // before promotion. The fixture does not depend on a sibling lesson folder.
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(film.cues)).digest('hex'),'9ccd5e8aa48e56237888f3917a67d21df9204592f5a2b1560bc9e476fb10e9f5');
 assert.equal(film.catalog.length,46);assert.deepEqual(Array.from(film.defaultRoute),Array.from(film.cues,c=>c.key));
 assert.equal(film.sample(0).values.focus,.65);assert.equal(film.sample(0).values.chrom,1);
});
test('reordered source poses clear omitted actors and retain scientific sources',()=>{
 const original=lesson({}).film,keys=['tn5-real','lengths','nucleosome-real','paired-reads','question'];
 const {film,scene}=lesson({route:keys,overrides:{'lengths':{motion:4,hold:7,text:{ru:{title:'Длины',note:'Пояснение'},en:{title:'Lengths',note:'Explanation'}}}}});
 assert.deepEqual(Array.from(film.cues,c=>c.key),keys);assert.equal(film.cues[0].motion,0);
 for(const cue of film.cues)assert.deepEqual(plain(cue.target),plain(original.cues.find(c=>c.key===cue.key).target),cue.key+' complete pose');
 assert.deepEqual(plain(film.sample(0).values),plain(film.cues[0].target));
 assert.equal(film.cues[1].titleRu,'Длины');assert.equal(film.cues[1].titleEn,'Lengths');assert.equal(scene.notes[1][0],'Пояснение');assert.match(scene.notes[0][2],/1MUH|10\.1126/);
 assert.equal(film.cues[1].target.origin,0);assert.equal(film.cues[2].target.reads,0);assert.equal(film.cues.at(-1).motion,2,'question is also usable after another cue');
 assert.notEqual(film.catalog.find(c=>c.key==='lengths').titleRu,'Длины');
});
test('local text overrides merge leaves and changed timings leave original poses intact',()=>{
 const {film}=lesson({route:['question',{key:'nucleosome-real',motion:8,text:{ru:{title:'Заголовок'}}}],overrides:{'nucleosome-real':{hold:9,text:{ru:{caption:'Подпись'},en:{title:'Title'}}}}});
 const cue=film.cues[1];assert.equal(cue.motion,8);assert.equal(cue.hold,9);assert.equal(cue.titleRu,'Заголовок');assert.equal(cue.captionRu,'Подпись');assert.equal(cue.titleEn,'Title');assert.equal(film.duration,20.2);
});
test('invalid configuration fails clearly instead of silently using a different route',()=>{
 const bad=[null,[],false,{rout:[]},{baseline:{}},{route:[]},{route:['missing']},{route:['tn5','tn5']},{overrides:{missing:{hold:1}}},{overrides:{tn5:{hold:Infinity}}},{overrides:{tn5:{motion:NaN}}},{route:[{key:'tn5',motion:1}]},{route:['tn5',{key:'dock',motion:0}]},{overrides:{tn5:{text:{ru:{title:Infinity}}}}},{overrides:{tn5:{text:{fr:{title:'Tn5'}}}}},{route:[{key:'tn5',target:{chrom:0}}]}];
 for(const config of bad)assert.throws(()=>lesson(config),/object|Unknown|nonempty|Duplicate|finite|initial|positive|string/,JSON.stringify(config));
});
test('custom cuts show only source stages, independent of seek history',()=>{
 const {w,film}=lesson({route:['peaks','tn5-real','lengths','histone-octamer','question','tn5-end-dna']});
 const render=time=>plain(w.AtacStory.renderFrame(film.cues,film.sample(time),time));
 const times=film.cues.slice(1).flatMap(c=>[.05,.25,.5,.75,.95].map(u=>c.arrive+u*c.motion));
 const snapshots=times.map(render);
 for(let i=0;i<times.length;i++){
  const f=snapshots[i],cue=film.cues[f.cue],prev=film.cues[f.cue-1],s=f.values;
  assert.equal(f.representationTransition,'complete-view-dissolve');
  for(const [visible,stage] of [['structure','structureStage'],['signal','signalStage'],['origin','originStage'],['reads','readStage'],['extra','extraStage']])if(s[visible]>0)assert([prev.target[stage],cue.target[stage]].includes(s[stage]),stage+' cannot traverse omitted stages');
  assert.equal(s.origin,0,'omitted origin example cannot appear');
 }
 for(let i=times.length-1;i>=0;i--)assert.deepEqual(render(times[i]),snapshots[i]);
 const normal=lesson({});for(const cue of normal.film.cues.slice(1)){const t=cue.arrive+cue.motion*.4,f=normal.film.sample(t);assert.equal(normal.w.AtacStory.renderFrame(normal.film.cues,f,t),f,'authored edge is unchanged: '+cue.key);}
});
function camera(w,film){
 const registration={center:[640,375],diagonal:400,bp:147},proteinRegistration={center:[640,375],diagonal:300};
 const chromatin={paint:s=>({anchors:{cutA:[610,360]},geometry:{labelObstacles:null},registration,enzymeRegistration:proteinRegistration,input:s}),setView(){}},structure={paint:s=>({...s,registration,proteinRegistration}),setView(){}},extras={paint:s=>s};
 return w.AtacCameraStory.create({cues:film.cues,sample:film.sample,chromatin,structure,extras});
}
test('camera bridges require their real authored predecessor, not just destination key',()=>{
 for(const key of ['nucleosome-real','tn5-real','linker','dock','stagger','two-events']){
  const {w,film}=lesson({route:[key]}),view=camera(w,film).paint(film.sample(0),0);assert.equal(view.cameraStory,null,key+' starts directly');assert.equal(view.zoomBridge,null);
 }
 for(const destination of ['nucleosome-real','tn5-real']){
  const {w,film}=lesson({route:['lengths',destination]}),cue=film.cues[1],t=cue.arrive+cue.motion/2,view=camera(w,film).paint(w.AtacStory.renderFrame(film.cues,film.sample(t),t),t);
  assert.equal(view.cameraStory,null);assert.equal(view.out.input.visibility,0,'does not fabricate a missing chromatin source');
 }
 const {w,film}=lesson({route:['nucleosome','nucleosome-real']}),c=film.cues[1],t=c.arrive+c.motion/2;
 assert.equal(camera(w,film).paint(film.sample(t),t).cameraStory.kind,'nucleosome-entry');
});
test('canonical regression guard rejects changed text or balanced timing changes',async()=>{
 const {film,w}=lesson({}),{assertDefaultRoute}=require('../starter/qa/atac/lib.cjs');
 const expected={keys:Array.from(film.cues,c=>c.key),duration:film.duration,cues:plain(film.cues),canonical:plain(w.AtacStory.build({}))};
 await assertDefaultRoute({evaluate:async()=>expected});
 for(const change of [
  data=>{data.cues[0].titleRu='Другой заголовок';},
  data=>{data.cues[0].noteEn='A new scientific claim';},
  data=>{data.cues[1].hold+=1;data.cues[2].hold-=1;},
  data=>{data.cues[3].target.structureStage=3;}
 ]){const modified=plain(expected);change(modified);await assert.rejects(()=>assertDefaultRoute({evaluate:async()=>modified}),/unchanged cue timing.*copy.*sources.*target poses/);}
});
