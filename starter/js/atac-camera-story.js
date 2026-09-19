/* Pure-time camera choreography. Source geometry is unchanged: a view moves
   into a selected object, changes representation, then returns to context. */
(function(global){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>global.CinemaTimeline.smooth(clamp(x));
const phase=(u,a,b)=>smooth((u-a)/(b-a));
const blend=(a,b,u)=>a.map((n,i)=>mix(n,b[i],u));
const mixPose=(a,b,u)=>Object.fromEntries(Object.keys(b).map(k=>[k,mix(a[k]??b[k],b[k],u)]));
function create({cues,sample,chromatin,structure,extras}){
 const nucleosomeDestination=structure.paint({visibility:1,stage:0,turn:0,zoom:1}).registration;
 const tn5Overview=structure.paint({visibility:1,stage:3,turn:0,zoom:1});
 const tn5Destination=tn5Overview.proteinRegistration;
 structure.paint({visibility:0});
 function chromInput(s,visibility=s.chrom){return{visibility,focus:s.focus,turn:s.turn,flat:s.flat,tn5:s.tn5,dock:s.dock,tag:s.tag,secondCut:s.secondCut,release:s.release};}
 function structureInput(s,visibility=s.structure){return{visibility,stage:s.structureStage,turn:s.structureTurn,zoom:s.structureZoom};}
 function transformOutput(out,view){
  const move=p=>view.to.map((v,i)=>v+(p[i]-view.from[i])*view.scale);
  Object.keys(out.anchors).forEach(k=>{out.anchors[k]=move(out.anchors[k]);});
  const obs=out.geometry.labelObstacles;
  if(obs){
   obs.rects=obs.rects.map(r=>{const p=move([r.x,r.y]);return{...r,x:p[0],y:p[1],width:r.width*view.scale,height:r.height*view.scale};});
   obs.points=obs.points.map(p=>{const q=move([p.x,p.y]);return{...p,x:q[0],y:q[1],radius:p.radius*view.scale};});
  }
 }
 function registeredView(out,a,b,progress,focus,detail,context){
  const ratio=b.diagonal/a.diagonal,scale=Math.exp(Math.log(ratio)*progress),center=blend(a.center,b.center,progress);
  const chromatinView={scale,from:a.center,to:center,context,focus};
  const structureView={scale:scale/ratio,from:b.center,to:center,detail};
  chromatin.setView(chromatinView);structure.setView(structureView);transformOutput(out,chromatinView);
  // Identity is checked at corresponding deposited vertices, not merely at
  // matching silhouettes. Both Tn5 views now use one source and one pose.
  let sourceIdentity=null;
  if(a.source==='1MUH'&&b.source==='1MUH'&&a.landmarks&&b.landmarks){
   const destination=new Map(b.landmarks.map(p=>[p.chain+':'+p.index,p.point]));
   const errors=a.landmarks.map(p=>{const q=destination.get(p.chain+':'+p.index);return q?Math.hypot(...p.point.map((v,i)=>(v-a.center[i])*scale-(q[i]-b.center[i])*scale/ratio)):Infinity;});
   sourceIdentity={pdb:'1MUH',matchedPoints:errors.length,maxRenderedError:Math.max(...errors),transform:'uniform scale and translation of the same source pose'};
  }
  return{source:a,destination:b,center,scale,structureScale:scale/ratio,chromatinView,structureView,sourceIdentity};
 }
 function paint(frame,time){
  const cue=cues[frame.cue],prev=cues[Math.max(0,frame.cue-1)],s=frame.values;
  const u=cue.motion>0?clamp((time-cue.arrive)/cue.motion):1;
  let ci=chromInput(s),si=structureInput(s),ei={chem:s.chem,chemTags:s.chemTags,visibility:s.extra,stage:s.extraStage};
  let zoomBridge=null,cameraStory=null,annotationVisibility=1,view=null,detail=1;
  const incoming=frame.cue>0;
  const entry=incoming&&cue.key==='nucleosome-real'&&prev.key==='nucleosome',nucReturn=incoming&&cue.key==='linker'&&prev.key==='wrapped-dna';
  const tn5Entry=incoming&&cue.key==='tn5-real'&&prev.key==='tn5',tn5Return=incoming&&cue.key==='dock'&&prev.key==='tn5-end-dna';
  const eventEntry=incoming&&cue.key==='stagger'&&prev.key==='dock',eventReturn=incoming&&cue.key==='two-events'&&prev.key==='tag-chemistry';
  if(entry){
   const replacement=phase(u,.48,.88);
   ci.visibility=1-replacement;si.visibility=replacement;
   annotationVisibility=1-phase(u,0,.28);
   view={kind:'nucleosome-entry',replacement};
  }else if(nucReturn){
   const retreat=phase(u,0,.4),handoff=phase(u,.4,1),replacement=phase(handoff,.24,.83);
   const pose=mixPose(prev.target,cue.target,handoff);
   ci=chromInput(pose,replacement);
   si={visibility:1-replacement,stage:mix(prev.target.structureStage,0,retreat),turn:mix(prev.target.structureTurn,0,retreat),zoom:1};
   detail=1-phase(u,0,.12);annotationVisibility=phase(u,.88,1);
   view={kind:'nucleosome-return',retreat,handoff,replacement,phase:u<.4?'detail-to-whole':'whole-to-context'};
  }else if(tn5Entry){
   if(!tn5Destination)throw new Error('AtacCameraStory requires structure.proteinRegistration for Tn5');
   const replacement=phase(u,.48,.88);
   ci=chromInput(prev.target,1-replacement);
   si={visibility:replacement,stage:3,turn:0,zoom:1};
   annotationVisibility=1-phase(u,0,.24);
   view={kind:'tn5-entry',replacement};
  }else if(tn5Return){
   const retreat=phase(u,0,.28),handoff=phase(u,.28,.72),replacement=phase(handoff,.22,.84),dock=phase(u,.74,1);
   ci=chromInput({...cue.target,dock},replacement);
   si={visibility:1-replacement,stage:mix(prev.target.structureStage,3,retreat),turn:mix(prev.target.structureTurn,0,retreat),zoom:1};
   detail=1-phase(u,0,.11);annotationVisibility=phase(u,.86,1);
   view={kind:'tn5-return',retreat,handoff,replacement,dock,phase:u<.28?'detail-to-whole':u<.74?'whole-to-context':'docking'};
  }else if(eventEntry){
   const approach=phase(u,0,.66),replacement=phase(u,.58,.82);
   ci=chromInput(prev.target,1-replacement);si.visibility=0;ei.chem=replacement;
   annotationVisibility=1-phase(u,0,.17);
   view={kind:'event-explanation-entry',approach,replacement,phase:u<.58?'approach-event':'explain-strands'};
  }else if(eventReturn){
   const replacement=phase(u,0,.24),retreat=phase(u,.3,.73),secondEvent=phase(u,.76,1);
   ci=chromInput({...cue.target,secondCut:secondEvent},replacement);si.visibility=0;ei.chem=1-replacement;ei.chemTags=1;
   annotationVisibility=phase(u,.87,1);
   view={kind:'event-explanation-return',replacement,retreat,secondEvent,phase:u<.3?'explanation-to-event':u<.76?'event-to-context':'second-event'};
  }
  // Prepare the same hidden source pose before its first visible dissolve
  // frame, including backward/random seeks after a structural close-up.
  if(tn5Entry||tn5Return)si.prepareHidden=true;
  const out=chromatin.paint(ci),st=structure.paint(si),eo=extras.paint(ei);
  chromatin.setView();structure.setView();
  if(entry){
   const p=phase(u,0,1),a=out.registration,b=nucleosomeDestination,detail=phase(u,.78,1);
   const shared=registeredView(out,a,b,p,'nucleosome',detail,1-.88*phase(u,.12,.67));
   zoomBridge={progress:u,selectedBp:a.bp,source:a,destination:b,center:shared.center,scale:shared.scale,structureScale:shared.structureScale,replacement:view.replacement,detail,sourceOpacity:1-view.replacement,destinationOpacity:view.replacement};
   cameraStory={...view,...shared,progress:u,focus:'nucleosome',structureStage:si.stage};
  }else if(nucReturn){
   // During the first phase the detailed PDB view itself returns to overview.
   // Only then does the registered whole-object handoff begin.
   let shared=null;
   if(u>=.4)shared=registeredView(out,out.registration,nucleosomeDestination,1-view.handoff,'nucleosome',0,1-.88*(1-view.handoff));
   else structure.setView({detail});
   cameraStory={...view,...shared,progress:u,focus:'nucleosome',structureStage:si.stage};
  }else if(tn5Entry){
   const shared=registeredView(out,out.enzymeRegistration,tn5Destination,phase(u,0,1),'enzyme',phase(u,.78,1),1-.9*phase(u,.12,.67));
   cameraStory={...view,...shared,progress:u,focus:'enzyme',structureStage:si.stage};
  }else if(tn5Return){
   let shared=null;
   if(u>=.28&&u<.74)shared=registeredView(out,out.enzymeRegistration,tn5Destination,1-view.handoff,'enzyme',0,1-.9*(1-view.handoff));
   else if(u<.28)structure.setView({detail});
   else structure.setView({detail:0});
   cameraStory={...view,...shared,progress:u,focus:'enzyme',structureStage:si.stage};
  }else if(eventEntry||eventReturn){
   const p=eventEntry?view.approach:1-view.retreat,anchor=out.anchors.cutA.slice();
   const local={scale:Math.exp(Math.log(2.7)*p),from:anchor,to:blend(anchor,[640,374],p),context:mix(1,.24,p),focus:'event',interval:[455,525]};
   chromatin.setView(local);transformOutput(out,local);
   cameraStory={...view,progress:u,focus:'event-A',chromatinView:local,representationChange:'3d-event-and-2d-strand-explanation',coordinatesMapped:false};
  }
  return{out,st,eo,zoomBridge,cameraStory,annotationVisibility};
 }
 return{paint};
}
global.AtacCameraStory=Object.freeze({create});
})(window);
