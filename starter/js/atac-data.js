/* One deterministic synthetic locus for the whole ATAC explanation.
   Coordinates are integer base boundaries; intervals are zero-based, half-open.
   Endpoint marks are fragment-boundary proxies, NOT strand-shifted Tn5 sites. */
(function (global) {
'use strict';
const length=1200, readLength=30, seed=7105, highlightId='F001';
let state=seed;
function random(){state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;}
function integer(lo,hi){return lo+Math.floor(random()*(hi-lo+1));}
const fragments=[], used=new Set();
function append(start,end,origin){
 if(used.has(start+':'+end))return false;
 used.add(start+':'+end);
 const id='F'+String(fragments.length+1).padStart(3,'0'), size=end-start;
 const reads=[{id:id+'/1',fragmentId:id,mate:1,start,end:start+readLength,strand:'+'},{id:id+'/2',fragmentId:id,mate:2,start:end-readLength,end,strand:'-'}];
 fragments.push({id,start,end,length:size,insertLength:size,reads,origin,duplicate:false,row:(fragments.length*7+8)%20});return true;
}
append(490,578,'highlight');
function generate(n,make,origin){for(let made=0;made<n;){const [a,b]=make();if(append(a,b,origin))made++;}}
generate(45,()=>{const a=integer(482,537);return [a,a+integer(62,112)];},'central-short');
generate(38,()=>{const a=integer(20,65);return [a,a+integer(62,112)];},'left-short');
generate(32,()=>{const b=integer(506,597);return [b-integer(172,236),b];},'central-medium');
generate(16,()=>{const b=integer(510,598);return [b-integer(362,444),b];},'central-long');
generate(18,()=>{const a=integer(698,908),max=Math.min(282,length-a);return [a,a+integer(62,max)];},'background');
// These records explicitly represent amplification copies of known molecules.
// Identical coordinate pairs alone do not establish this provenance in real data.
const duplicateSources=[0,0,0,0,1,2,4,8,12,20,35,61];
const duplicates=duplicateSources.map((source,i)=>{const f=fragments[source],id='PCR'+String(i+1).padStart(2,'0');return {id,originalId:f.id,start:f.start,end:f.end,length:f.length,insertLength:f.length,duplicate:true,reads:f.reads.map(r=>({...r,id:id+'/'+r.mate,fragmentId:id,originalId:f.id}))};});
const records=fragments.concat(duplicates);
const peaks=[{id:'P1',start:10,end:185},{id:'P2',start:470,end:650}];
function overlap(a,b){return a.start<b.end&&b.start<a.end;}
function mergedWindows(windows){
 const sorted=windows.map(p=>({start:p.start,end:p.end})).sort((a,b)=>a.start-b.start),out=[];
 sorted.forEach(p=>{if(!Number.isInteger(p.start)||!Number.isInteger(p.end)||p.start<0||p.end>length||p.start>=p.end)throw new RangeError('Invalid half-open peak window');const last=out[out.length-1];if(last&&p.start<=last.end)last.end=Math.max(last.end,p.end);else out.push({...p});});return out;
}
function overlapsPeaks(fragment,windows=peaks){return mergedWindows(windows).some(p=>overlap(fragment,p));}
const coverage=Array(length).fill(0), endpointBoundaries=Array(length+1).fill(0);
fragments.forEach(f=>{for(let p=f.start;p<f.end;p++)coverage[p]++;endpointBoundaries[f.start]++;endpointBoundaries[f.end]++;});
function computeBins(width=20,input=fragments){
 if(!Number.isInteger(width)||width<=0)throw new RangeError('Bin width must be a positive integer');
 const result=Array.from({length:Math.ceil(length/width)},(_,i)=>({start:i*width,end:Math.min(length,(i+1)*width),endpointCount:0,coverageSum:0,meanCoverage:0}));
 input.forEach(f=>{[f.start,f.end].forEach(p=>result[Math.min(result.length-1,Math.floor(p/width))].endpointCount++);result.forEach(bin=>{bin.coverageSum+=Math.max(0,Math.min(f.end,bin.end)-Math.max(f.start,bin.start));});});
 result.forEach(b=>b.meanCoverage=b.coverageSum/(b.end-b.start));
 return {width,records:result,endpoints:result.map(b=>b.endpointCount),coverage:result.map(b=>b.meanCoverage),coverageSums:result.map(b=>b.coverageSum),endpointTotal:result.reduce((n,b)=>n+b.endpointCount,0),coverageIntegral:result.reduce((n,b)=>n+b.coverageSum,0)};
}
function histogram(width=25,input=fragments,max=500){
 if(!Number.isInteger(width)||width<=0||!Number.isInteger(max)||max<=0)throw new RangeError('Histogram dimensions must be positive integers');
 const bins=Array.from({length:Math.ceil(max/width)},(_,i)=>({start:i*width,end:Math.min(max,(i+1)*width),count:0,ids:[]}));
 input.forEach(f=>{if(f.length>=max)throw new RangeError('Histogram range does not contain every fragment');const b=bins[Math.floor(f.length/width)];b.count++;b.ids.push(f.id);});return bins;
}
const bins=computeBins(), inPeakFragments=fragments.filter(f=>overlapsPeaks(f)), sumLengths=fragments.reduce((n,f)=>n+f.length,0);
const stats={uniqueFragments:fragments.length,duplicateRecords:duplicates.length,totalRecords:records.length,readRecords:records.length*2,uniqueReadRecords:fragments.length*2,endpointCount:fragments.length*2,coverageIntegral:sumLengths,inPeaks:inPeakFragments.length,outsidePeaks:fragments.length-inPeakFragments.length,frip:inPeakFragments.length/fragments.length,binWidth:bins.width,maxEndpointBin:Math.max(...bins.endpoints),maxMeanCoverage:Math.max(...bins.coverage)};
const pairs=records.map(f=>({id:f.id,originalId:f.originalId||f.id,duplicate:f.duplicate,start:f.start,end:f.end,insertLength:f.length,reads:f.reads}));
function markCoordinateDuplicates(input=records){const seen=new Map();return input.map(f=>{const key=f.start+':'+f.end,originalId=seen.get(key);if(!originalId)seen.set(key,f.id);return {id:f.id,key,duplicate:!!originalId,originalId:originalId||f.id};});}
function verify(){
 const f=fragments.find(p=>p.id===highlightId),checks={uniqueCount:fragments.length===150,uniqueCoordinatePairs:used.size===fragments.length,validIntervals:fragments.every(p=>Number.isInteger(p.start)&&Number.isInteger(p.end)&&p.start>=0&&p.end<=length&&p.length===p.end-p.start),highlight:f.start===490&&f.end===578&&f.length===88,highlightReads:f.reads[0].start===490&&f.reads[0].end===520&&f.reads[1].start===548&&f.reads[1].end===578&&f.reads[0].strand==='+'&&f.reads[1].strand==='-',pcrLinks:duplicates.length===12&&duplicates.every(d=>fragments.some(o=>o.id===d.originalId&&o.start===d.start&&o.end===d.end)),endpointCount:bins.endpointTotal===2*fragments.length&&endpointBoundaries.reduce((a,b)=>a+b,0)===2*fragments.length,coverageIntegral:coverage.reduce((a,b)=>a+b,0)===sumLengths&&bins.coverageIntegral===sumLengths,frip:stats.frip>=0&&stats.frip<=1&&new Set(inPeakFragments.map(p=>p.id)).size===stats.inPeaks,histogram:histogram().reduce((n,b)=>n+b.count,0)===fragments.length,duplicateMarking:markCoordinateDuplicates().filter(r=>r.duplicate).length===12};
 return {ok:Object.values(checks).every(Boolean),checks,stats:{...stats}};
}
// The right boundary at 1200 is assigned to the last display bin if present.
// Both boundary counts and coverage are independent of drawing row assignments.
global.AtacData={length,readLength,seed,highlightId,synthetic:true,coordinateConvention:'0-based half-open [start,end)',endpointConvention:'Unshifted fragment-boundary proxy; no numerical Tn5 correction',peakConvention:'Didactic candidate windows; not a statistical peak caller',duplicateConvention:'Known toy PCR provenance; coordinate-only marking is illustrative',fragments,duplicates,records,pairs,peaks,bins,stats,coverage,endpointBoundaries,inPeakFragments,overlap,overlapsPeaks,mergedWindows,computeBins,histogram,markCoordinateDuplicates,verify,fragment:id=>fragments.find(f=>f.id===id)};
})(window);
