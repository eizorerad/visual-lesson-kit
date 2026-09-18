'use strict';
/* Cue-local copy remains independent even when authors reuse the same Russian
 * heading with different English wording. Run after building dist/lesson.html. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE);}
const {launch}=require('./browser.cjs'),root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await launch(pw);
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const config={route:['sequence','cloverleaf'],overrides:{
   sequence:{text:{ru:{title:'Одна молекула',caption:'Один источник'},en:{title:'Sequence view',caption:'Read the sequence'}}},
   cloverleaf:{text:{ru:{title:'Одна молекула',caption:'Один источник',approach:''},en:{title:'Shape view',caption:'Read the pairing map',approach:'The map takes shape'}}}
  }};
  const original=fs.readFileSync(path.join(root,'dist/lesson.html'),'utf8'),marker='<script>/* js/trna-journey.js */';
  assert(original.includes(marker),'Build a standalone tRNA lesson before running this check');
  await page.setContent(original.replace(marker,'<script>window.TRNA_FILM_CONFIG='+JSON.stringify(config)+';</script>'+marker),{waitUntil:'load'});
  await page.waitForFunction(()=>window.CINEMA&&TrnaJourney.snapshot);
  await page.evaluate(()=>{D.i18n.setLang('en');CINEMA.seek(0);});
  assert.equal(await page.locator('.film-title').innerText(),'Sequence view');
  assert.equal(await page.locator('.film-caption').innerText(),'Read the sequence');
  await page.evaluate(()=>CINEMA.seek(TrnaJourney.cues[1].time));
  assert.equal(await page.locator('.film-title').innerText(),'Shape view');
  assert.equal(await page.locator('.film-caption').innerText(),'Read the pairing map');
  await page.evaluate(()=>{const c=TrnaJourney.cues[1];CINEMA.seek(c.arrive+c.motion*.25);});
  assert.equal(await page.locator('.film-caption').innerText(),'The map takes shape');
  const exact=await page.evaluate(()=>CINEMA.current().time);
  await page.evaluate(()=>D.i18n.setLang('ru'));
  assert.equal(await page.locator('.film-caption').innerText(),'');
  assert.equal(await page.evaluate(()=>CINEMA.current().time),exact);
  await page.evaluate(()=>D.i18n.setLang('en'));
  assert.equal(await page.locator('.film-caption').innerText(),'The map takes shape');
  assert.deepEqual(errors,[]);console.log('PASS cue-local RU/EN copy, repeated source text, EN-only approach and exact-frame locale round trip');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
