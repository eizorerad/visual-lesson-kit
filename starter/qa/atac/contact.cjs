'use strict';
const fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'qa-output/atac');
const report=JSON.parse(fs.readFileSync(path.join(out,'visual-report.json'),'utf8'));
const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'dist/lesson.html'))).digest('hex');
if(!report.ok||report.artifactSha256!==hash)throw new Error('Run node qa/atac/visual.cjs on the current artifact before making contact sheets.');
(async()=>{
 const browser=await require('../trna/browser.cjs').launch(pw);
 try {
  const page=await browser.newPage({viewport:{width:1600,height:1070}});
  const cues=JSON.parse(fs.readFileSync(path.join(root,'assets/atac/story-copy.json'),'utf8'));
  for(let i=0;i<cues.length;i+=4){
   const cells=cues.slice(i,i+4).map((c,k)=>{
    const png=fs.readFileSync(path.join(out,'screenshots',`ru-sans-black-${c.key}.png`)).toString('base64');
    return `<article><div>${i+k+1}. ${c.key}</div><img src="data:image/png;base64,${png}"></article>`;
   }).join('');
   await page.setContent(`<style>body{margin:0;background:#191c21;color:white;font:20px sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:8px}article{min-width:0}article div{height:26px;padding:2px 10px}img{width:100%;display:block}</style>${cells}`);
   await page.screenshot({path:path.join(out,`contact-${String(i/4+1).padStart(2,'0')}.png`)});
  }
  console.log(`${Math.ceil(cues.length/4)} contact sheets created from the ${cues.length} final Russian frames.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
