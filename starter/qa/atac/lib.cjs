/* Shared preflight for the canonical ATAC-film regression suite. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const canonicalKeys=JSON.parse(fs.readFileSync(path.join(root,'assets/atac/story-copy.json'),'utf8')).map(c=>c.key);
async function assertDefaultRoute(page){
 const actual=await page.evaluate(()=>({keys:ATAC_FILM.cues.map(c=>c.key),duration:ATAC_FILM.duration,cues:ATAC_FILM.cues,canonical:AtacStory.build({})}));
 const message='This regression suite requires the default 46-cue / 240.6-second route with unchanged cue timing, copy, sources and target poses. Use qa/atac/remix.cjs for a custom route, then audit its own text, transitions and layout.';
 assert.deepEqual(actual.keys,canonicalKeys,message);
 assert(Math.abs(actual.duration-240.6)<1e-8,message);
 assert.deepEqual(actual.cues,actual.canonical,message);
}
module.exports={assertDefaultRoute};
