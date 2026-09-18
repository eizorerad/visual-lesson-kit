'use strict';
/* Controller integration checks against the lesson's real driver/deck runtime.
   PLAYWRIGHT_MODULE may point to an existing Playwright installation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
const project = path.resolve(__dirname, '../..');
const {launch}=require('./browser.cjs');

(async () => {
  const browser = await launch(playwright);
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<main id="stage"><div id="frame"></div></main><nav id="chrome" class="chrome"><button data-action="prev">←</button><button class="scene-progress" data-action="overview"><span id="counter"></span><span id="stepCount"></span><span id="stepDots"></span></button><button data-action="next">→</button><button data-action="reading">Read</button><button data-action="more">More</button></nav><aside id="notes"><div id="notesBody"></div></aside><div id="moreMenu" hidden><button id="speedToggle"><span id="speedValue">1×</span></button></div>');
    for (const file of ['js/lib/dom.js','js/lib/i18n.js','js/lib/anim.js','js/film.js','js/deck.js','js/player.js']) await page.addScriptTag({path:path.join(project,file)});
    const source = path.join(project,'js/trna-cinema.js');
    if (fs.existsSync(source)) await page.addScriptTag({path:source});
    assert.equal(await page.evaluate(() => typeof window.Cinema?.mount), 'function', 'cinematic playback controller must be available');
    await page.evaluate(() => {
      D.touch = {start(){}};
      D.i18n.pack('en',{label:'EN'});
      D.deck.register({id:'test-film',title:'Film',notes:['Start','Middle','End'],build(ctx){
        const root = document.createElement('section');
        const actor = document.createElement('span'); actor.id = 'actor'; root.append(actor);
        const state = {time:0}; let controller;
        const driver = F.driver(state, () => {actor.dataset.time = state.time; if(controller)controller.update();});
        controller = Cinema.mount(ctx,{root,state,driver,duration:3,cues:[{time:0,titleRu:'Начало',titleEn:'Start'},{time:1,titleRu:'Середина',titleEn:'Middle'},{time:2,titleRu:'Конец',titleEn:'End'}],
          narrativeIndex:window.useIncomingCue ? time => time>.25&&time<1?1:time>1.25&&time<2?2:Math.min(2,Math.floor(time)) : undefined});
        [1,2].forEach(i => ctx.step(() => controller.go(i,true)));
        ctx.onDispose(driver.dispose);
        driver.set({time:0});
        return root;
      }});
      D.deck.boot();
      window.firstActor = document.getElementById('actor');
    });
    const current = () => page.evaluate(() => TRNA_FILM.current());
    assert.equal((await current()).time,0,'film starts paused at opening frame');
    assert.equal((await current()).playing,false);
    assert.equal(await page.evaluate(() => CINEMA===TRNA_FILM),true,'generic controller alias shares one clock');
    await page.locator('#chrome [data-action="overview"]').click();
    await page.waitForTimeout(260);
    const paused = await page.evaluate(() => {TRNA_FILM.pause(); return TRNA_FILM.current().time;});
    assert(paused>0 && paused<1,'play must produce an intermediate frame');
    await page.waitForTimeout(200);
    assert.equal((await current()).time,paused,'pause must hold the exact numeric frame');
    await page.evaluate(() => {TRNA_FILM.seek(0);TRNA_FILM.play();});
    await page.waitForTimeout(120);
    const speedStart = await page.evaluate(() => {document.getElementById('speedToggle').click();return {time:TRNA_FILM.current().time,wall:performance.now()};});
    await page.waitForTimeout(500);
    const speedEnd = await page.evaluate(() => ({time:TRNA_FILM.current().time,wall:performance.now()}));
    const speedRate = (speedEnd.time-speedStart.time)/((speedEnd.wall-speedStart.wall)/1000);
    assert(speedRate>.25&&speedRate<.75,'switching to 0.5× immediately retimes the advancing film clock; measured rate='+speedRate);
    assert.equal((await current()).playing,true,'speed changes preserve the playing state');
    await page.evaluate(() => {TRNA_FILM.pause();document.getElementById('speedToggle').click();document.getElementById('speedToggle').click();});
    assert.equal((await current()).playing,false,'speed changes do not start a paused film');
    await page.evaluate(() => {TRNA_FILM.play(); TRNA_FILM.seek(1.5);});
    await page.waitForTimeout(200);
    assert.equal((await current()).time,1.5,'seek invalidates previous playback writes');
    assert.deepEqual(await page.evaluate(() => [D.deck.current().step, location.hash, document.querySelector('#notesBody .is-now')?.textContent]),[1,'#1.1','2Middle']);
    await page.evaluate(() => D.i18n.setLang('en'));
    assert.equal((await current()).time,1.5,'language change preserves exact time');
    assert.match(await page.locator('#trnaTimeline').innerText(),/Middle/);
    await page.locator('#chrome [data-action="prev"]').click();
    assert.equal((await current()).time,0,'previous navigates to preceding cue');
    await page.locator('#chrome [data-action="next"]').click();
    assert.equal((await current()).time,1);
    await page.evaluate(() => D.deck.next());
    assert.equal((await current()).time,2,'touch/deck navigation uses persistent film actors');
    assert.equal(await page.evaluate(() => document.getElementById('actor')===firstActor),true);
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Home');
    assert.equal((await current()).time,0);
    await page.locator('.trna-seek').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await current()).time,1,'timeline arrows seek by a useful one-second increment');
    await page.keyboard.press('Home');
    assert.equal((await current()).time,0,'timeline Home seeks to the opening');
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    await page.keyboard.press('Space');
    assert.equal((await current()).playing,false);
    await page.evaluate(() => {TRNA_FILM.seek(2.8); TRNA_FILM.play();});
    await page.waitForTimeout(350);
    assert.equal((await current()).time,3,'playback stops at bounded duration');
    assert.equal((await current()).playing,false);
    await page.evaluate(() => {TRNA_FILM.play();});
    await page.waitForTimeout(120);
    assert((await current()).time<1,'play at end restarts');
    await page.evaluate(() => TRNA_FILM.pause());
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(() => {TRNA_FILM.seek(0); TRNA_FILM.play();});
    await page.waitForTimeout(150);
    assert.equal((await current()).time,0,'reduced motion holds cue instead of jumping to film end');
    await page.waitForTimeout(950);
    assert.equal((await current()).time,1,'reduced motion advances to a reading cue');
    await page.evaluate(() => {TRNA_FILM.pause(); location.hash='#1.2';});
    await page.waitForTimeout(150);
    assert.equal((await current()).time,2,'manual hash jump remains authoritative');
    assert.equal(await page.locator('#chrome > button').count(),5,'five shell controls remain');
    assert.equal(await page.locator('#trnaTimeline').count(),1,'rebuilding cleans up the old timeline');
    await page.evaluate(() => {window.useIncomingCue=true;D.deck.show(0,0);TRNA_FILM.seek(.6);});
    assert.deepEqual(await page.evaluate(() => [TRNA_FILM.current().index,D.deck.current().step,location.hash,document.querySelector('.trna-cue-title').textContent]),
      [1,1,'#1.1','Middle'],'the timeline, note and hash must announce the visible incoming narrative cue');
    await page.locator('#chrome [data-action="next"]').click();
    assert.equal((await current()).time,1,'next finishes the incoming pose without skipping it');
    await page.evaluate(() => TRNA_FILM.seek(.6));
    await page.locator('#chrome [data-action="prev"]').click();
    assert.equal((await current()).time,0,'previous returns to the preceding narrative cue during a transition');
    assert.deepEqual(errors,[]);
    console.log('PASS: exact pause, interrupted seek, cue/notes/hash sync, incoming narrative cue sync/navigation, language, persistent navigation, keyboard, end/restart, reduced motion and manual hash navigation.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
