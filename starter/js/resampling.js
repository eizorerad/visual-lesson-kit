/* Supplied resamples: copies retain source IDs; means are new summary objects. */
(function () {
  'use strict';
  const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;};
  const fraction=(value,name)=>Math.max(0,Math.min(1,finite(value,name)));
  function dense(input,name){if(!Array.isArray(input)||!input.length)throw new TypeError(name+' must be a nonempty array');const a=Array.from(input);if(a.some(v=>v===undefined))throw new TypeError(name+' must not contain holes or undefined');return a;}
  function id(value,name){if(typeof value!=='string'||!value.length)throw new TypeError(name+' must be a nonempty string');return value;}
  function resampleMean(parent,options){
    const o=Object.assign({radius:10,labelSize:21},options);
    ['x','y','width','drawY','meanY','radius','labelSize'].forEach(key=>finite(o[key],key));
    if(o.width<=0||o.radius<=0||o.labelSize<=0)throw new RangeError('Width, radius and label size must be positive');
    if(o.drawY-o.y<8*o.radius||o.meanY-o.drawY<6*o.radius)throw new RangeError('Separated source, drawing and mean lanes required');
    const domain=dense(o.domain,'domain');if(domain.length!==2||!domain.every(Number.isFinite)||domain[1]<=domain[0])throw new RangeError('Finite increasing domain required');
    finite(domain[1]-domain[0],'domain span');finite(o.x+o.width,'right edge');
    const population=dense(o.population,'population').map(p=>{if(!p||typeof p!=='object')throw new TypeError('Invalid source observation');const value=finite(p.value,'source value');if(value<domain[0]||value>domain[1])throw new RangeError('Source value outside fixed domain');return Object.freeze({id:id(p.id,'source ID'),value});});
    const bySource=new Map(population.map((p,i)=>[p.id,i]));if(bySource.size!==population.length)throw new RangeError('Source IDs must be unique');
    const sourcePosition=i=>({x:o.x+(i+.5)*o.width/population.length,y:o.y});
    const xScale=K.linearScale(domain,[o.x,o.x+o.width]);
    const samples=dense(o.samples,'samples').map(sample=>{
      if(!sample||typeof sample!=='object')throw new TypeError('Invalid supplied sample');
      const sourceIds=dense(sample.sourceIds,'sourceIds').map(sourceId=>{if(!bySource.has(sourceId))throw new RangeError('Unknown source ID: '+sourceId);return sourceId;});
      const values=sourceIds.map(sourceId=>population[bySource.get(sourceId)].value);
      // Divide first to avoid overflowing a finite same-sign sum unnecessarily.
      const mean=finite(values.reduce((sum,value)=>sum+value/values.length,0),'sample mean');
      return {id:id(sample.id,'sample ID'),sourceIds:Object.freeze(sourceIds),values:Object.freeze(values),mean};
    });
    const bySample=new Map(samples.map((sample,i)=>[sample.id,i]));if(bySample.size!==samples.length)throw new RangeError('Sample IDs must be unique');
    const meanPositions=[];
    samples.forEach(sample=>{
      const x=xScale(sample.mean);let level=0;
      while(meanPositions.some(p=>p.level===level&&Math.abs(p.x-x)<2*o.radius+8))level++;
      meanPositions.push({x,y:o.meanY-level*(2*o.radius+8),level});
    });
    const lane=(o.y+o.drawY)/2;
    population.forEach((_,i)=>{const p=sourcePosition(i);finite(p.x,'source x');finite(p.y,'source y');});
    meanPositions.forEach(p=>{finite(p.x,'mean x');finite(p.y,'mean y');if(p.y<=o.drawY+3*o.radius)throw new RangeError('Mean stack exceeds available lane height');});
    // All input/derived-data checks precede the first DOM mutation.
    const g=F.group(parent);g.dataset.component='resample-mean';
    const originals=population.map((p,i)=>{
      const q=F.group(g);q.dataset.resampleActor='source';q.dataset.sourceId=p.id;q.dataset.value=String(p.value);
      const dot=F.dot(q,0,0,o.radius,C.white),label=F.label(q,0,-32,p.id+' · '+p.value,o.labelSize,C.white);
      const position=sourcePosition(i);F.at(q,position.x,position.y);return {g:q,dot,label,id:p.id,value:p.value};
    });
    samples.forEach((sample,si)=>{
      sample.copies=sample.sourceIds.map((sourceId,slot)=>{
        const q=F.group(g);q.dataset.resampleActor='copy';q.dataset.sourceId=sourceId;q.dataset.sampleId=sample.id;q.dataset.copyId=sample.id+':'+slot;q.dataset.value=String(sample.values[slot]);
        const dot=F.dot(q,0,0,o.radius,C.blue),label=F.label(q,0,32,sourceId+' · '+sample.values[slot],o.labelSize,C.blue);
        return {g:q,dot,label,sourceId,slot,value:sample.values[slot]};
      });
      sample.meanPoint=F.dot(g,meanPositions[si].x,meanPositions[si].y,o.radius*.8,C.gold);
      sample.meanPoint.dataset.resampleMean=sample.id;sample.meanPoint.dataset.value=String(sample.mean);sample.meanPoint.dataset.sourceIds=sample.sourceIds.join(',');
      sample.meanPoint.setAttribute('role','img');sample.meanPoint.setAttribute('aria-label','Среднее '+sample.id+': '+sample.mean);
      sample.copies.forEach(Object.freeze);Object.freeze(sample.copies);Object.freeze(sample);
    });
    function setSample(sampleId,state){
      if(!bySample.has(sampleId))throw new RangeError('Unknown sample ID: '+sampleId);
      const draw=fraction(state.draw,'draw'),collapse=fraction(state.collapse,'collapse');
      if(collapse>0&&draw<1)throw new RangeError('Finish drawing before collapsing to a mean');
      const si=bySample.get(sampleId),sample=samples[si],mean=meanPositions[si];
      // Aggregate above the collected points, then lower only the summary point.
      const aggregate=F.clamp((collapse-.2)/.5),gatherY=(o.drawY+mean.y)/2;
      sample.copies.forEach(copy=>{
        const start=sourcePosition(bySource.get(copy.sourceId)),target={x:o.x+(copy.slot+.5)*o.width/sample.copies.length,y:o.drawY};
        const q=F.clamp(draw*sample.copies.length-copy.slot);
        // One copy moves at a time: down, across a free lane, then down to its slot.
        const x=F.lerp(start.x,target.x,F.clamp((q-.3)/.5));
        const y=q<.3?F.lerp(start.y,lane,q/.3):F.lerp(lane,target.y,F.clamp((q-.8)/.2));
        F.at(copy.g,F.lerp(x,mean.x,aggregate),F.lerp(y,gatherY,aggregate));
        F.opacity(copy.g,F.clamp((q-.18)/.12)*(1-F.clamp((collapse-.65)/.1)));
        F.opacity(copy.label,F.clamp((q-.92)/.08)*(1-F.clamp(collapse/.15)));
      });
      F.pos(sample.meanPoint,mean.x,F.lerp(gatherY,mean.y,F.clamp((collapse-.75)/.25)));
      F.opacity(sample.meanPoint,F.clamp((collapse-.7)/.05));
    }
    samples.forEach(sample=>setSample(sample.id,{draw:0,collapse:0}));
    return {g,population:Object.freeze(population),domain:Object.freeze(domain),originals,samples:Object.freeze(samples),xScale,setSample};
  }
  K.resampleMean=resampleMean;
})();
