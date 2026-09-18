'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{launch}=require('./browser.cjs');
function runtime(failures=[]){const calls=[],browser={};return {calls,browser,chromium:{async launch(options){calls.push(options);if(failures.length)throw failures.shift();return browser;}}};}
test('browser checks prefer bundled Chromium and preserve explicit launch options',async()=>{
 const old=process.env.PLAYWRIGHT_CHANNEL;delete process.env.PLAYWRIGHT_CHANNEL;
 try{const pw=runtime();assert.equal(await launch(pw,{headless:false,timeout:5000}),pw.browser);assert.deepEqual(pw.calls,[{headless:false,timeout:5000}]);}
 finally{if(old!==undefined)process.env.PLAYWRIGHT_CHANNEL=old;}
});
test('missing bundled Chromium falls back to installed Chrome without masking other errors',async()=>{
 const old=process.env.PLAYWRIGHT_CHANNEL;delete process.env.PLAYWRIGHT_CHANNEL;
 try{
  const pw=runtime([new Error("Executable doesn't exist at /test/chromium")]);assert.equal(await launch(pw),pw.browser);assert.deepEqual(pw.calls,[{headless:true},{headless:true,channel:'chrome'}]);
  const failure=new Error('Browser crashed during startup'),broken=runtime([failure]);await assert.rejects(launch(broken),e=>e===failure);assert.equal(broken.calls.length,1);
 }finally{if(old!==undefined)process.env.PLAYWRIGHT_CHANNEL=old;}
});
test('explicit browser channel or environment remains authoritative on failure',async()=>{
 const old=process.env.PLAYWRIGHT_CHANNEL;process.env.PLAYWRIGHT_CHANNEL='chrome';
 try{
  const pw=runtime();await launch(pw);assert.equal(pw.calls[0].channel,'chrome');
  const failure=new Error("Executable doesn't exist at /test/edge"),broken=runtime([failure]);await assert.rejects(launch(broken,{channel:'msedge'}),e=>e===failure);assert.deepEqual(broken.calls,[{headless:true,channel:'msedge'}]);
 }finally{if(old===undefined)delete process.env.PLAYWRIGHT_CHANNEL;else process.env.PLAYWRIGHT_CHANNEL=old;}
});
