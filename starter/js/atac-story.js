/* Full numeric poses: seek and replay do not accumulate transforms. */
(function(g){
'use strict';
const baseline=Object.freeze({"chrom":1,"focus":0.65,"turn":0,"flat":0,"tn5":0,"dock":0,"tag":0,"secondCut":0,"release":0,"chem":0,"chemTags":0,"signal":0,"signalStage":0,"extra":0,"extraStage":0,"structure":0,"structureStage":0,"structureTurn":0,"structureZoom":1,"origin":0,"originStage":0,"originTurn":0,"reads":0,"readStage":0});
const route=[
 [
  "question",
  2.0,
  3.2,
  {}
 ],
 [
  "chromatin",
  2.0,
  2.8,
  {
   "focus": 1
  }
 ],
 [
  "nucleosome",
  2.4,
  2.8,
  {
   "turn": 32
  }
 ],
 [
  "nucleosome-real",
  3.2,
  1.8,
  {
   "chrom": 0,
   "structure": 1,
   "structureStage": 0,
   "structureTurn": 0,
   "structureZoom": 1
  }
 ],
 [
  "histone-octamer",
  2,
  3,
  {
   "structureStage": 1,
   "structureTurn": 22,
   "structureZoom": 1
  }
 ],
 [
  "wrapped-dna",
  2,
  3,
  {
   "structureStage": 2,
   "structureTurn": 68,
   "structureZoom": 1
  }
 ],
 [
  "linker",
  3.2,
  2.4,
  {
   "turn": 32,
   "chrom": 1,
   "structure": 0,
   "structureStage": 0,
   "structureTurn": 0
  }
 ],
 [
  "protected",
  2.8,
  2.8,
  {
   "turn": 65
  }
 ],
 [
  "tn5",
  2.4,
  3.2,
  {
   "turn": 12,
   "tn5": 1
  }
 ],
 [
  "tn5-real",
  3,
  2,
  {
   "chrom": 0,
   "structure": 1,
   "structureStage": 3,
   "structureTurn": 0,
   "structureZoom": 1
  }
 ],
 [
  "tn5-end-dna",
  2,
  3,
  {
   "structureStage": 4,
   "structureTurn": 25,
   "structureZoom": 1
  }
 ],
 [
  "dock",
  3.6,
  2,
  {
   "dock": 1,
   "chrom": 1,
   "structure": 0,
   "structureStage": 3,
   "structureTurn": 0
  }
 ],
 [
  "stagger",
  2.8,
  3.2,
  {
   "chrom": 0,
   "chem": 1
  }
 ],
 [
  "tag-chemistry",
  2.0,
  3.2,
  {
   "chemTags": 1
  }
 ],
 [
  "two-events",
  3.2,
  2.8,
  {
   "chem": 0,
   "chrom": 1,
   "tag": 1,
   "secondCut": 1
  }
 ],
 [
  "coordinate-map",
  3.2,
  3.2,
  {
   "flat": 1
  }
 ],
 [
  "release",
  2.8,
  3.2,
  {
   "release": 1
  }
 ],
 [
  "library",
  1.6,
  2.8,
  {
   "chrom": 0,
   "signal": 1
  }
 ],
 [
  "handles",
  2.0,
  3.2,
  {
   "signalStage": 1
  }
 ],
 [
  "copies",
  2.0,
  3.2,
  {
   "signalStage": 2
  }
 ],
 [
  "read-orientation",
  1.4,
  1.6,
  {
   "signal": 0,
   "signalStage": 3,
   "reads": 1,
   "readStage": 0
  }
 ],
 [
  "read-one",
  2.6,
  1.4,
  {
   "readStage": 1
  }
 ],
 [
  "read-two",
  2.6,
  1.4,
  {
   "readStage": 2
  }
 ],
 [
  "paired-reads",
  1.2,
  0.8,
  {
   "readStage": 3
  }
 ],
 [
  "mapping",
  3.2,
  2.8,
  {
   "signalStage": 4,
   "reads": 0,
   "readStage": 4,
   "signal": 1
  }
 ],
 [
  "insert-span",
  2.0,
  3.2,
  {
   "signalStage": 5
  }
 ],
 [
  "pileup",
  2.8,
  3.2,
  {
   "signalStage": 6
  }
 ],
 [
  "duplicates",
  1.2,
  3.2,
  {}
 ],
 [
  "endpoints",
  2.4,
  3.2,
  {
   "signalStage": 7
  }
 ],
 [
  "count-track",
  2.8,
  3.2,
  {
   "signalStage": 8
  }
 ],
 [
  "two-tracks",
  2.4,
  3.6,
  {
   "signalStage": 9
  }
 ],
 [
  "peaks",
  2.0,
  3.2,
  {
   "signalStage": 10
  }
 ],
 [
  "peak-evidence",
  1.2,
  3.2,
  {}
 ],
 [
  "short-origin",
  2,
  3,
  {
   "signal": 0,
   "origin": 1,
   "originStage": 0,
   "originTurn": -15
  }
 ],
 [
  "nucleosomal-origin",
  2,
  3,
  {
   "originStage": 1,
   "originTurn": 20
  }
 ],
 [
  "contour-length",
  2,
  3,
  {
   "originStage": 2,
   "originTurn": 0
  }
 ],
 [
  "lengths",
  2.8,
  3.2,
  {
   "signalStage": 11,
   "signal": 1,
   "origin": 0
  }
 ],
 [
  "frip",
  2.4,
  3.2,
  {
   "signalStage": 12
  }
 ],
 [
  "tss",
  2.4,
  3.2,
  {
   "signal": 0,
   "extra": 1,
   "extraStage": 0
  }
 ],
 [
  "quality",
  2.0,
  3.6,
  {
   "extraStage": 1
  }
 ],
 [
  "footprint",
  2.4,
  3.6,
  {
   "extraStage": 2
  }
 ],
 [
  "replicates",
  2.4,
  3.2,
  {
   "extraStage": 3
  }
 ],
 [
  "mixture",
  2.8,
  3.6,
  {
   "extraStage": 4
  }
 ],
 [
  "interpretation",
  2.4,
  3.6,
  {
   "extraStage": 5
  }
 ],
 [
  "journey",
  2.8,
  3.6,
  {
   "extraStage": 6
  }
 ],
 [
  "finale",
  1.6,
  4.0,
  {}
 ]
];
function catalog(){const copy=new Map(g.ATAC_COPY.map(c=>[c.key,c]));let target={...baseline};return route.map(([key,motion,hold,patch])=>{target={...target,...patch};if(!copy.has(key))throw new Error('Missing ATAC copy '+key);return {...copy.get(key),motion,hold,target:{...target}};});}
const defaultRoute=Object.freeze(route.map(row=>row[0]));
const authoredIndex=new Map(defaultRoute.map((key,index)=>[key,index]));
function authoredEdge(previous,next){return !!previous&&authoredIndex.get(next.key)===authoredIndex.get(previous.key)+1;}
function build(config={}){
 if(config===null||typeof config!=='object'||Array.isArray(config))throw new TypeError('ATAC_FILM_CONFIG must be an object');
 for(const key of Object.keys(config))if(!['route','overrides'].includes(key))throw new TypeError('Unknown ATAC_FILM_CONFIG field '+key);
 return g.CinemaTimeline.compile({baseline,catalog:catalog(),...config});
}
// Hidden stages belong to their own source poses. A new route must not show
// omitted scenes while a hidden actor fades in, or imply a continuous camera
// move between two unrelated molecular representations. Authored neighbours
// retain their original choreography; other edges dissolve complete views.
const layers=[
 ['chrom',['focus','turn','flat','tn5','dock','tag','secondCut','release']],
 ['structure',['structureStage','structureTurn','structureZoom']],
 ['signal',['signalStage']],['origin',['originStage','originTurn']],
 ['reads',['readStage']],['extra',['extraStage']],['chem',['chemTags']]
];
function renderFrame(cues,frame,time){
 const next=cues[frame.cue],previous=cues[frame.cue-1];
 if(!previous||authoredEdge(previous,next)||time>=next.time)return frame;
 const p=g.CinemaTimeline.smooth(Math.max(0,Math.min(1,(time-next.arrive)/next.motion)));
 const values={...frame.values};
 for(const [visibility,keys] of layers){
  const a=previous.target,b=next.target,av=a[visibility],bv=b[visibility];
  let pose=null;
  if(av===0)pose=b;
  else if(bv===0)pose=a;
  else if(keys.some(key=>a[key]!==b[key])){
   pose=p<.5?a:b;
   values[visibility]*=Math.abs(2*p-1);
  }
  if(pose)for(const key of keys)values[key]=pose[key];
 }
 return {...frame,values,representationTransition:'complete-view-dissolve'};
}
g.AtacStory=Object.freeze({baseline,catalog,build,defaultRoute,authoredEdge,renderFrame});
})(window);
