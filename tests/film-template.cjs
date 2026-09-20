'use strict';
/* The film template compiles into complete poses, bilingual copy and a remixable route without a DOM. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../starter/js'),plain=x=>JSON.parse(JSON.stringify(x));
function lesson(config){
 const registered=[],packs=[],w={D:{i18n:{pack:(code,definition)=>packs.push(definition)},deck:{register:x=>registered.push(x)}},F:{note:(...args)=>args}};
 w.window=w;vm.createContext(w);
 for(const file of ['cinema-timeline.js','film-config.js','recipes/film/pcr-film.js']){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});if(file==='film-config.js'&&config!==undefined)w.PCR_FILM_CONFIG=config;}
 return {w,film:w.PCR_FILM,scene:registered[0],packs};
}
test('default film has seven complete poses, a 40–70 second duration and bilingual copy',()=>{
 const {film,scene,packs}=lesson();
 assert.equal(film.cues.length,7);assert.equal(film.cues[0].motion,0);
 assert(film.duration>=40&&film.duration<=70,'duration '+film.duration);
 const fields=Object.keys(film.baseline).sort();
 for(const cue of film.cues){
  assert.deepEqual(Object.keys(cue.target).sort(),fields,cue.key+' carries every field');
  for(const key of ['titleRu','titleEn','captionRu','captionEn','noteRu','noteEn'])assert(typeof cue[key]==='string'&&cue[key].trim(),cue.key+' '+key);
  assert.notEqual(cue.titleRu,cue.titleEn);assert.match(cue.sourceUrl,/^https:\/\/doi\.org\//);
 }
 const target=Object.fromEntries(film.cues.map(c=>[c.key,c.target]));
 assert.deepEqual(plain(target.start),{melt:0,anneal:0,extend:0,copies:1,cycles:0,chart:0,legend:0});
 assert.equal(target.melt.melt,1);assert.equal(target.anneal.anneal,1);assert.equal(target.extend.extend,1);
 assert.equal(target.copies.copies,2);assert.equal(target.copies.cycles,1,'the copies cue is the first completed cycle, so the counter never falls back to 1');assert.equal(target.finale.legend,1);assert.equal(target.cycles.legend,0);assert.equal(target.cycles.copies,1024);assert.equal(target.cycles.cycles,10);assert.equal(target.finale.chart,1);
 assert.equal(scene.id,'pcr-film');assert.equal(scene.notes.length,7);assert.equal(scene.qa.length,3);
 const english=packs.find(p=>p.notes&&p.notes['pcr-film']);assert.equal(english.notes['pcr-film'].length,7);assert.equal(english.qa['pcr-film'].length,3);
 const mid=film.sample(film.cues[1].arrive+film.cues[1].motion/2).values;assert(mid.melt>0&&mid.melt<1,'motion interpolates the melt fraction');
});
test('a route subset keeps complete poses and text overrides, invalid configuration fails clearly',()=>{
 const {film}=lesson({route:['start','cycles',{key:'finale',hold:2,text:{ru:{title:'Итог'},en:{title:'Summary'}}}],overrides:{cycles:{motion:4}}});
 assert.deepEqual(film.cues.map(c=>c.key),['start','cycles','finale']);
 assert.equal(film.cues[1].motion,4);assert.equal(film.cues[1].target.copies,1024);assert.equal(film.cues[1].target.melt,1,'the skipped melt stays part of the complete pose');
 assert.equal(film.cues[2].titleRu,'Итог');assert.equal(film.cues[2].titleEn,'Summary');assert.equal(film.cues[2].hold,2);
 for(const config of [{route:['nowhere']},{route:['start','start']},{overrides:{cycles:{hold:-1}}},{extra:1}])assert.throws(()=>lesson(config),/Unknown|Duplicate|hold|route/);
});
