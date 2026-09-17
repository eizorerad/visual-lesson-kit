/* Original CITE-seq teaching assets. All molecular positions are schematic. */
(function(g){
'use strict';
const Bio3D=g.Bio3D={},s=D.dom.s;
Bio3D.str=(ru,en)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
Bio3D.text=(parent,x,y,w,h,ru,en,size=24,color=C.white,align='center')=>L.textBox(parent,{x,y,width:w,height:h,text:Bio3D.str(ru,en),size,color,align,padding:0,lineHeight:1.25});
Bio3D.rect=(parent,x,y,w,h,color=C.dim,fill=.08,r=14)=>{const n=s('rect',{x,y,width:w,height:h,rx:r,fill:color,'fill-opacity':fill,stroke:color,'stroke-opacity':.5,'stroke-width':1.4});parent.append(n);return n;};
Bio3D.path=(parent,d,color,width=3)=>{const n=s('path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});parent.append(n);return n;};
Bio3D.wave=(parent,x,y,color=C.blue,scale=1)=>{const n=Bio3D.path(parent,'M-23 0 C-15 -12 -8 -12 0 0 S15 12 23 0',color,3.5);n.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);return n;};
Bio3D.antibody=(parent,x,y,color=C.gold,scale=1,tag=true)=>{const n=F.group(parent);Bio3D.path(n,'M0 23 L0 0 M0 0 L-20 -23 M0 0 L20 -23',color,7);Bio3D.path(n,'M-7 20 L-7 3 L-26 -18 M7 20 L7 3 L26 -18',color,2.5);if(tag){Bio3D.path(n,'M3 22 C22 27 11 45 29 43',C.grey,2);Bio3D.rect(n,26,36,29,12,C.teal,.25,4);Bio3D.path(n,'M56 42 l4 -3 l4 6 l4 -6 l4 6 l4 -3',C.teal,2);}n.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);return n;};
Bio3D.cell=(parent,x,y,r=95,id='A')=>{const a=F.cell(parent,x,y,r,C.blue,id);a.g.dataset.actor='cell-'+id;const texture=F.group(a.g);for(let i=0;i<11;i++){const t=i*2.4,rr=r*(.3+.045*i);F.dot(texture,Math.cos(t)*rr,Math.sin(t)*rr,2,C.blue).setAttribute('opacity','.2');}return a;};
Bio3D.pill=(parent,x,y,w,label,color=C.gold)=>{const p=F.group(parent);Bio3D.rect(p,0,0,w,36,color,.14,7);Bio3D.text(p,5,2,w-10,32,label,label,19,color);F.at(p,x,y);return p;};
Bio3D.arrow=(parent,x1,y1,x2,y2,color=C.grey)=>{const a=F.arrow(parent,color,2.3);a.set(x1,y1,x2,y2);return a;};
Bio3D.scene=({id,title,chapter,notes,qa=[],build})=>{Bio3D.str(...title);Bio3D.str(...chapter);D.i18n.pack('en',{notes:{[id]:notes.map(n=>F.note(n[1]))},qa:{[id]:qa.map(q=>({q:q[1],a:'<p>'+q[3]+'</p>',source:q[5]||'Stoeckius et al. 2017; original teaching schematic'}))}});D.deck.register({id,title:title[0],chapter:chapter[0],notes:notes.map(n=>F.note(n[0])),qa:qa.map(q=>({q:q[0],a:'<p>'+q[2]+'</p>',source:q[4]||'Stoeckius et al. 2017; авторская учебная схема'})),build});};
Bio3D.stage=(ctx,ru,en)=>{Bio3D.str(ru,en);const view=F.stage(ctx,ru,Bio3D.str('3D-биология','3D biology'),Bio3D.str('Авторская учебная схема; не в масштабе','Original teaching schematic; not to scale'));view.root.classList.add('spatial-biology');return view;};
Bio3D.motion=(ctx,v,state,paint,captions,patches,durations=2400)=>{captions.forEach(c=>Bio3D.str(...c));const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);v.caption(captions[0][0]);patches.forEach((patch,i)=>ctx.step(()=>{v.caption(captions[i+1][0]);return driver.to(patch,{duration:Array.isArray(durations)?durations[i]:durations});}));return driver;};
Bio3D.control=(ctx,v,ru,en,min,max,value,onInput,x=770,y=540,w=390)=>{Bio3D.str(ru,en);const slider=T.control(v.root,ru,min,max,value,1,onInput,x,y,w);slider.el.dataset.noSwipe='';L.contract(slider.el,{id:'control.'+ru,box:{x,y,width:w,height:70},space:v.root});return slider;};
Bio3D.buttons=(ctx,v,labels,fn,x=770,y=550,w=410)=>{const row=T.buttons(v.root,labels.map(l=>Bio3D.str(...l)),fn,x,y);row.style.width=w+'px';row.style.maxWidth=w+'px';row.dataset.noSwipe='';L.contract(row,{id:'buttons.'+labels[0][0],box:{x,y,width:w,height:65},space:v.root});return row;};
Bio3D.source='https://doi.org/10.1038/nmeth.4380';
})(window);
