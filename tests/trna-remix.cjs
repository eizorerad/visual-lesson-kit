'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function lesson(config){
 const registered=[];const w={TRNA_FILM_CONFIG:config,D:{i18n:{pack(){}},deck:{register:x=>registered.push(x)}},F:{note:(...args)=>args}};
 w.window=w;vm.createContext(w);
 for(const file of ['lib/anim.js','cinema-timeline.js','trna-magnesium-story.js','trna-story.js','trna-journey.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../starter/js',file),'utf8'),w,{filename:file});
 return {w,journey:w.TrnaJourney,scene:registered[0]};
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('empty config reproduces approved 39 cues / 398 seconds and scientific qualifications',()=>{
 const {journey}=lesson({});assert.equal(journey.cues.length,39);assert.equal(journey.duration,398);
 assert.equal(journey.cues[0].hold,8);assert.equal(journey.cues.at(-1).time,390);
 assert.match(journey.cues.find(c=>c.key==='pairs').noteEn,/A31–Ψ39.*ntSH/);
 assert.match(journey.cues.find(c=>c.key==='mg-bridge').captionEn,/water|Water/);
 assert.equal(journey.cues.find(c=>c.key==='mg-bridge').target.mgTurn,0);
});
test('subset/reordering starts from complete selected pose and clears stale layers',()=>{
 const base=lesson({}).journey,keys=['mg-bridge','elbow-pair','pair-contacts','volume','sequence'];
 const {journey,scene}=lesson({route:keys,overrides:{'mg-bridge':{hold:3},'pair-contacts':{motion:10,hold:9,text:{ru:{title:'Три контакта',note:'Пояснение'},en:{title:'Three contacts',note:'Explanation'}}}}});
 assert.deepEqual(Array.from(journey.cues,c=>c.key),keys);
 for(const c of journey.cues)assert.deepEqual(plain(c.target),plain(base.cues.find(x=>x.key===c.key).target),c.key+' target identical to approved source pose');
 assert.deepEqual(plain(journey.sample(0).values),plain(journey.cues[0].target),'First arbitrary source pose is visible at zero');
 assert.equal(journey.cues[2].hold,9);assert.equal(journey.cues[2].titleEn,'Three contacts');
 assert.equal(scene.notes[2][0],'Пояснение');assert.match(scene.notes[0][2],/rcsb.org/);assert.match(scene.notes[1][2],/PMC2440604/);
 assert.equal(journey.cues[1].target.mgCharge,0);assert.equal(journey.cues[2].target.elbowZoom,0);
});
test('reordering does not mutate the catalog, and unknown author fields fail clearly',()=>{
 const {journey}=lesson({route:[{key:'sequence',hold:2,text:{ru:{title:'Новый заголовок'}}},'volume']});
 assert.notEqual(journey.catalog[0].titleRu,journey.cues[0].titleRu);assert.equal(journey.catalog.length,39);
 for(const config of [{route:['bad']},{route:['sequence','sequence']},{overrides:{volume:{hold:Infinity}}},{rout:[]},{route:[{key:'volume',camera:3}]}])assert.throws(()=>lesson(config),/Unknown|Duplicate|finite/);
});
