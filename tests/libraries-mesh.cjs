/* Portable geometry/identity checks for the optional paired-library props. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

test('LibrariesMesh loads without a DOM, retains cached identities, and exposes finite bounded meshes',()=>{
 const scope={window:{},Float32Array,Uint16Array};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../starter/js/three/libraries-mesh.js'),'utf8'),scope);
 const api=scope.window.V3.LibrariesMesh,model=api.create();
 assert.equal(api.create(),model,'Repeated calls reuse the mesh cache');
 assert.equal(model.schematic,true);
 assert.equal(scope.window.CiteLibrariesMesh,undefined,'The reusable module exports only its V3 namespace');
 assert.deepEqual(Array.from(model.molecules,m=>m.id),['library-rna','library-adt','data-rna','data-adt']);
 assert.deepEqual(Array.from(model.markers,m=>m.id),['read-rna','read-adt']);
 assert.equal(model.libraries[0],model.molecules[0]);assert.equal(model.tiles[1],model.molecules[3]);
 const actors=[...model.molecules,...model.markers];
 assert.equal(new Set(actors.map(m=>m.id)).size,actors.length);
 let vertices=0,triangles=0,parts=0;
 for(const actor of actors){
  assert.equal(actor.space,'environment');
  assert.deepEqual(Array.from(actor.center),[0,0,0]);
  assert.equal(model.anchors[actor.id],actor.anchors);
  for(const anchor of Object.values(actor.anchors))assert.ok(anchor.length===3&&Array.from(anchor).every(Number.isFinite));
  const bounds=model.bounds[actor.id];
  for(let axis=0;axis<3;axis++)assert.ok(Number.isFinite(bounds.min[axis])&&bounds.max[axis]>bounds.min[axis]);
  for(const part of actor.parts){
   const v=part.vertices,ix=part.indices;parts++;
   assert.ok(v instanceof Float32Array&&ix instanceof Uint16Array);
   assert.equal(v.length%8,0);assert.equal(ix.length%3,0);
   assert.ok(v.length>0&&ix.length>0&&v.length/8<65536);
   assert.ok(Array.from(v).every(Number.isFinite));
   for(let i=0;i<v.length;i+=8){
    for(let axis=0;axis<3;axis++)assert.ok(v[i+axis]>=bounds.min[axis]&&v[i+axis]<=bounds.max[axis]);
    assert.ok(Math.abs(Math.hypot(v[i+3],v[i+4],v[i+5])-1)<1e-5,'Surface normals have unit length');
   }
   for(let i=0;i<ix.length;i+=3){
    const [a,b,c]=Array.from(ix.slice(i,i+3));
    assert.ok(a<v.length/8&&b<v.length/8&&c<v.length/8);
    const ab=[0,1,2].map(j=>v[b*8+j]-v[a*8+j]),ac=[0,1,2].map(j=>v[c*8+j]-v[a*8+j]);
    assert.ok(Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])>1e-10,'Each face has positive area');
   }
   vertices+=v.length/8;triangles+=ix.length/3;
  }
 }
 assert.equal(model.stats.molecules,model.molecules.length);assert.equal(model.stats.markers,model.markers.length);
 assert.equal(model.stats.parts,parts);assert.equal(model.stats.vertices,vertices);assert.equal(model.stats.triangles,triangles);
 assert.ok(triangles<1000,'Shared library props have a small rendering budget');
});
