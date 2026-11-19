#!/usr/bin/env node
/* Independent font review and static SVG export of scenes.cjs frames.
 * Uses Skia/font metrics, not a browser: native UI/CSS are not validated. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const [frameFile,canvasModule,outDir]=process.argv.slice(2);
if(!frameFile||!canvasModule||!outDir)throw new Error('Usage: static-review.cjs frames.json @napi-rs/canvas-module output-directory');
const {createCanvas,GlobalFonts,loadImage}=require(canvasModule),root=path.resolve(__dirname,'../..');
for(const [name,file] of [['LessonSans','SourceSans3-Regular.otf.woff2'],['LessonSerif','SourceSerif4-Regular.otf.woff2']])if(!GlobalFonts.registerFromPath(path.join(root,'assets/fonts',file),name))throw new Error('Font registration failed: '+file);
const metrics=createCanvas(1,1).getContext('2d'),frames=JSON.parse(fs.readFileSync(frameFile)).frames,issues=[];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function roles(light){const a=light?['#18658E','#176B58','#826000','#A33261','#644AA0']:['#73BFEA','#63CDB5','#EAC878','#EC92B3','#B4A7EC'];return Object.fromEntries(['primary','secondary','focus','contrast','auxiliary'].map((k,i)=>['var(--color-'+k+')',a[i]]).concat([['var(--color-bg)',light?'#FFFFFF':'#000000'],['var(--color-text)',light?'#211C26':'#F0ECE6'],['var(--color-muted)',light?'#655D6B':'#AAA3AD'],['var(--color-dim)',light?'#938A99':'#716A76']]));}
function textSvg(t,font,color,info){const size=t.size||27,pad=t.padding===undefined?4:t.padding,width=t.width-2*pad,height=t.height-2*pad,lines=[];metrics.font=size+'px '+font;
 for(const para of t.text.split('\n')){let line='';for(const word of para.trim().split(/\s+/)){const trial=line?line+' '+word:word;if(line&&metrics.measureText(trial).width>width){lines.push(line);line=word;}else line=trial;}lines.push(line);}
 const mm=lines.map(line=>metrics.measureText(line)),ascent=Math.max(0,...mm.map(m=>m.actualBoundingBoxAscent)),descent=Math.max(0,...mm.map(m=>m.actualBoundingBoxDescent)),stride=Math.max(size*(t.lineHeight||1.25),ascent+descent+size*.08),used=ascent+descent+(lines.length-1)*stride,largest=Math.max(0,...mm.map(m=>m.width));
 if((largest>width+.5||used>height+.5)&&t.text.trim())issues.push({...info,id:t.id,text:t.text,content:[width,height],measured:[largest,used],lines});
 const align=t.align||'center',x=align==='left'?t.x+pad:align==='right'?t.x+t.width-pad:t.x+t.width/2,anchor={left:'start',right:'end',center:'middle'}[align],y=t.y+pad+(height-used)/2+ascent;
 return '<text font-family="'+font+'" font-size="'+size+'" text-anchor="'+anchor+'" fill="'+color+'">'+lines.map((line,i)=>'<tspan x="'+x+'" y="'+(y+i*stride)+'">'+esc(line)+'</tspan>').join('')+'</text>';
}
function svgFrame(frame,font,light){const colors=roles(light),texts=new Map(frame.texts.map(t=>[t.id,t])),info={scene:frame.scene,step:frame.step,language:frame.language,font};
 function node(n){if(n.tag==='text'){const t=texts.get(n.attrs['data-layout-id']);return t?textSvg(t,font,colors[t.color]||t.color||colors['var(--color-text)'],info):'';}const attrs=Object.entries(n.attrs).filter(([k])=>k!=='xmlns').map(([k,v])=>k+'="'+esc(colors[v]||v)+'"').join(' ');return '<'+n.tag+' '+attrs+'>'+n.children.map(node).join('')+'</'+n.tag+'>';}
 return '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="'+colors['var(--color-bg)']+'"/>'+node(frame.svg)+textSvg({id:'title',x:60,y:44,width:1160,height:100,text:frame.title,size:39,padding:4,lineHeight:1.17,align:'left'},font,colors['var(--color-text)'],info)+textSvg({id:'caption',x:90,y:620,width:1100,height:70,text:frame.caption,size:25,padding:4},font,colors['var(--color-text)'],info)+'</svg>';
}
async function main(){fs.mkdirSync(outDir,{recursive:true});for(const font of ['LessonSans','LessonSerif'])for(const frame of frames)svgFrame(frame,font,false);
 const pictures=[];for(let scene=14;scene<=25;scene++){const frame=frames.find(f=>f.scene===scene&&f.step===3&&f.language==='ru'),svg=svgFrame(frame,'LessonSans',false),filename=path.join(outDir,'scene-'+scene);fs.writeFileSync(filename+'.svg',svg);const im=await loadImage(Buffer.from(svg)),canvas=createCanvas(1280,720);canvas.getContext('2d').drawImage(im,0,0);fs.writeFileSync(filename+'.png',canvas.toBuffer('image/png'));pictures.push(canvas);}
 const sheet=createCanvas(1280,1080),paint=sheet.getContext('2d');paint.fillStyle='#000';paint.fillRect(0,0,1280,1080);pictures.forEach((pic,i)=>paint.drawImage(pic,i%3*426,Math.floor(i/3)*270,426,240));fs.writeFileSync(path.join(outDir,'contact-sheet.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(outDir,'font-review.json'),JSON.stringify({coverage:'Skia font metrics and static authored SVG; browser CSS and native controls untested',frames:frames.length,fonts:2,issues},null,2));console.log(JSON.stringify({frames:frames.length,fontConfigurations:2,issues:issues.length,output:outDir}));if(issues.length)console.log(JSON.stringify(issues.slice(0,15),null,2));}
main().catch(error=>{console.error(error);process.exitCode=1;});
