/* Orthographic opaque spheres: each fragment has its actual spherical depth.
 * Screen x/y/z and radii share pixel units; positive z points toward the viewer.
 * This is a representation of deposited atoms, not a solvent surface or dynamics. */
(function(g){
'use strict';
const VS=`#version 300 es
in vec2 corner;
in vec4 sphere;
in vec3 color;
uniform vec4 viewport;
out vec2 uv;
flat out vec4 ball;
flat out vec3 tint;
void main(){
 vec2 p=sphere.xy+corner*sphere.w;
 gl_Position=vec4(2.0*(p.x-viewport.x)/viewport.z-1.0,1.0-2.0*(p.y-viewport.y)/viewport.w,0.0,1.0);
 uv=corner;ball=sphere;tint=color;
}`;
const FS=`#version 300 es
precision highp float;
in vec2 uv;
flat in vec4 ball;
flat in vec3 tint;
out vec4 pixel;
void main(){
 float rr=dot(uv,uv);if(rr>1.0)discard;
 vec3 n=vec3(uv,sqrt(1.0-rr));
 // Quad depth is deliberately replaced by the ray/sphere intersection.
 gl_FragDepth=0.5-(ball.z+ball.w*n.z)/16384.0;
 vec3 light=normalize(vec3(-0.38,-0.5,0.78));
 vec3 halfLight=normalize(light+vec3(0.0,0.0,1.0));
 float diffuse=max(0.0,dot(n,light));
 float shine=0.13*pow(max(0.0,dot(n,halfLight)),28.0);
 pixel=vec4(tint*(0.32+0.68*diffuse)+vec3(shine),1.0);
}`;
const lightLength=Math.hypot(-.38,-.5,.78),LIGHT=[-.38,-.5,.78].map(x=>x/lightLength);
const half=[LIGHT[0],LIGHT[1],LIGHT[2]+1],halfLength=Math.hypot(...half),HALF=half.map(x=>x/halfLength);
function rasterize(spheres,viewport,width,height,reuse){
 const pixels=reuse?.pixels||new Uint8ClampedArray(width*height*4),depth=reuse?.depth||new Float32Array(width*height);
 pixels.fill(0);depth.fill(-Infinity);
 const sx=width/viewport.width,sy=height/viewport.height;
 for(const s of spheres){
  const [cx,cy,cz]=s.center,r=s.radius;if(!(r>0))continue;
  const x0=Math.max(0,Math.floor((cx-r-viewport.x)*sx)),x1=Math.min(width-1,Math.ceil((cx+r-viewport.x)*sx));
  const y0=Math.max(0,Math.floor((cy-r-viewport.y)*sy)),y1=Math.min(height-1,Math.ceil((cy+r-viewport.y)*sy));
  for(let y=y0;y<=y1;y++){
   const ny=(viewport.y+(y+.5)/sy-cy)/r;
   for(let x=x0;x<=x1;x++){
    const nx=(viewport.x+(x+.5)/sx-cx)/r,rr=nx*nx+ny*ny;if(rr>1)continue;
    const nz=Math.sqrt(1-rr),z=cz+r*nz,k=y*width+x;if(z<=depth[k])continue;
    depth[k]=z;const diffuse=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]);
    const shine=.13*Math.pow(Math.max(0,nx*HALF[0]+ny*HALF[1]+nz*HALF[2]),28),i=k*4;
    for(let c=0;c<3;c++)pixels[i+c]=255*(s.color[c]*(.32+.68*diffuse)+shine);
    pixels[i+3]=255;
   }
  }
 }
 return {pixels,depth};
}
function gpu(canvas,viewport){
 const gl=canvas.getContext('webgl2',{alpha:true,depth:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 if(!gl)return null;
 const shaders=[],buffers=[],program=gl.createProgram();let disposed=false,geometry=null,colors=null;
 function dispose(){if(disposed)return;disposed=true;gl.useProgram(null);gl.bindBuffer(gl.ARRAY_BUFFER,null);buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);if(!gl.isContextLost())gl.getExtension('WEBGL_lose_context')?.loseContext();}
 try{
  for(const [type,source] of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,FS]]){
   const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(program,s);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  function attribute(name,size,divisor,data){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data||0,gl.DYNAMIC_DRAW);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(loc,divisor);return b;}
  attribute('corner',2,0,new Float32Array([-1,-1,1,-1,-1,1,1,1]));
  const positions=attribute('sphere',4,1),tints=attribute('color',3,1);
  gl.uniform4f(gl.getUniformLocation(program,'viewport'),viewport.x,viewport.y,viewport.width,viewport.height);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);
  return {type:'webgl2',dispose,draw(spheres){
   if(disposed)return;
   if(geometry?.length!==spheres.length*4){geometry=new Float32Array(spheres.length*4);colors=new Float32Array(spheres.length*3);}
   spheres.forEach((s,i)=>{geometry.set([...s.center,s.radius],i*4);colors.set(s.color,i*3);});
   gl.bindBuffer(gl.ARRAY_BUFFER,positions);gl.bufferData(gl.ARRAY_BUFFER,geometry,gl.DYNAMIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER,tints);gl.bufferData(gl.ARRAY_BUFFER,colors,gl.DYNAMIC_DRAW);
   gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,spheres.length);
  }};
 }catch(e){dispose();return null;}
}
function software(canvas,viewport){
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return null;
 const image=ctx.createImageData(canvas.width,canvas.height),reuse={pixels:image.data,depth:new Float32Array(canvas.width*canvas.height)};
 return {type:'canvas-depth',draw(spheres){rasterize(spheres,viewport,canvas.width,canvas.height,reuse);ctx.putImageData(image,0,0);},dispose(){canvas.width=0;canvas.height=0;}};
}
function create(host,viewport,options={}){
 let canvas=document.createElementNS('http://www.w3.org/1999/xhtml','canvas'),renderer=null,last=null,disposed=false,frames=0;
 const density=Math.min(2,Math.max(1.5,g.devicePixelRatio||1));
 canvas.width=Math.round(viewport.width*density);canvas.height=Math.round(viewport.height*density);
 canvas.style.cssText='width:100%;height:100%;display:block;pointer-events:none;';canvas.setAttribute('aria-hidden','true');host.append(canvas);
 // DOM-only geometry audits do not claim to render canvas pixels.
 const domOnly=/jsdom/i.test(g.navigator?.userAgent||'');
 function replace(){const next=canvas.cloneNode(false);canvas.replaceWith(next);canvas=next;return canvas;}
 if(!domOnly){if(!options.software)renderer=gpu(canvas,viewport);if(!renderer)renderer=software(replace(),viewport);}
 function draw(spheres){if(disposed)return;last=spheres;renderer?.draw(spheres);frames++;host.dataset.sphereRenderer=renderer?.type||'geometry-only';}
 function lost(event){event.preventDefault();if(disposed)return;canvas.removeEventListener('webglcontextlost',lost);renderer?.dispose();renderer=software(replace(),viewport);if(last)draw(last);}
 canvas.addEventListener('webglcontextlost',lost);
 return {draw,get canvas(){return canvas;},get type(){return renderer?.type||'geometry-only';},get frames(){return frames;},dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);renderer?.dispose();last=null;}};
}
g.TrnaSphereRenderer=Object.freeze({create,rasterize});
})(window);
