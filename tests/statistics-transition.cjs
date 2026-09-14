const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
test('permutation exposes in-transit assignment separately from completed observations',t=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.matchMedia=()=>({matches:true});t.after(()=>w.close());
 for(const n of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout','patterns','statistics'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',n+'.js'),'utf8'));
 const svg=w.D.dom.s('svg'),chart=w.K.permutationView(svg,{observations:[2,3,4,7,8,9].map((value,i)=>({id:'D'+i,value})),groupSize:3,domain:[0,10],x:115,y:267,width:650,height:230});
 chart.setProgress(.5/19);assert.deepEqual(JSON.parse(JSON.stringify(chart.snapshot().transition)),{from:0,to:1,progress:.5,moving:true});
 chart.setProgress(1/19);assert.equal(chart.snapshot().transition.moving,false);assert.equal(chart.snapshot().transition.from,1);
});
