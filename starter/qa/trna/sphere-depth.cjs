/* Independent ray/sphere oracle: intersecting atom silhouettes cannot be sorted as discs. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../../js/trna-sphere-renderer.js');
function load(){const context={window:{},Float32Array,Uint8ClampedArray,Math};vm.runInNewContext(fs.readFileSync(file,'utf8'),context);return context.window.TrnaSphereRenderer;}
const sphere=(x,z,color)=>({center:[x,32,z],radius:20,color});
test('intersecting spheres retain both exposed caps as center depths cross',()=>{
 assert.ok(fs.existsSync(file),'A depth-resolving sphere renderer is required; sorted discs cannot represent intersecting surfaces');
 const R=load(),viewport={x:0,y:0,width:64,height:64};
 for(const delta of [-.0001,0,.0001]){
  const spheres=[sphere(24,delta,[1,0,0]),sphere(40,-delta,[0,0,1])],pixels=R.rasterize(spheres,viewport,64,64).pixels;
  for(const x of [26,38]){const i=(32*64+x)*4;assert.equal(pixels[i+3],255);assert.ok(x<32?pixels[i]>pixels[i+2]+30:pixels[i+2]>pixels[i]+30,`Both caps must survive crossing: delta=${delta}, x=${x}`);}
 }
});
test('software sphere depth agrees with an independent ray intersection for every non-edge sample',()=>{
 const R=load(),spheres=[sphere(24,-2,[1,0,0]),sphere(40,2,[0,0,1])],image=R.rasterize(spheres,{x:0,y:0,width:64,height:64},64,64);
 for(let y=13;y<51;y++)for(let x=6;x<58;x++){
  const distances=spheres.map(s=>{const q=s.radius**2-(x+.5-s.center[0])**2-(y+.5-s.center[1])**2;return q<0?-Infinity:s.center[2]+Math.sqrt(q);}),i=(y*64+x)*4;
  if(distances.every(d=>d===-Infinity))assert.equal(image.pixels[i+3],0);
  else if(Math.abs(distances[0]-distances[1])>.001)assert.ok(distances[0]>distances[1]?image.pixels[i]>image.pixels[i+2]:image.pixels[i+2]>image.pixels[i],`Nearest surface wins at ${x},${y}`);
 }
});
