#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test');
const root=path.resolve(__dirname,'../..'),context={window:{}};
vm.createContext(context);
for(const name of ['graph-alignment.js','q-align-data.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),context,{filename:name});
const {GA,QAlignData:Z}=context.window;
const plain=x=>JSON.parse(JSON.stringify(x));

test('four-person teaching example really has 24 pairings, scores 0/2/3, and two best answers',()=>{
 const a=[[0,1,0,0],[1,0,1,0],[0,1,0,1],[0,0,1,0]],b=[[0,0,1,1],[0,0,0,1],[1,0,0,0],[1,1,0,0]];
 assert.deepEqual([[0,1,2,3],[0,2,1,3],[1,3,0,2]].map(p=>GA.conserved(a,b,p)),[0,2,3]);
 const seen=new Map(),queue=[[0,1,2,3]];
 while(queue.length){const p=queue.shift(),key=p.join(',');if(seen.has(key))continue;seen.set(key,GA.conserved(a,b,p));queue.push(...GA.neighbors(p));}
 assert.equal(seen.size,24);assert.equal(Math.max(...seen.values()),3);assert.equal([...seen.values()].filter(c=>c===3).length,2);
});

test('all 720 stored energies agree with the conserved-edge objective and binary QUBO',()=>{
 assert.equal(Z.permutations.length,720);assert.equal(new Set(Z.permutations.map(p=>p.join(','))).size,720);
 for(let i=0;i<720;i++){
  const p=Z.permutations[i];assert.equal(GA.energy(Z.adj1,Z.adj2,p),Z.energies[i]);
  assert.equal(GA.binaryEnergy(Z.adj1,Z.adj2,GA.oneHot(p)),Z.energies[i]);
 }
 assert.equal(Math.min(...Z.energies),-28);
});
test('local minima and global optimum multiplicity use the actual swap neighborhood',()=>{
 const minima=[];for(let i=0;i<720;i++)if(Z.neighbors[i].every(j=>Z.energies[j]>=Z.energies[i]))minima.push(i);
 assert.deepEqual(minima,[...Z.localMinima].sort((a,b)=>a-b));assert.equal(minima.length,60);
 assert.deepEqual(plain(Z.energies.flatMap((e,i)=>e===-28?[i]:[])),plain(Z.globalOptima));assert.equal(Z.globalOptima.length,4);
 const global=new Set(Z.globalOptima),all=Z.basinIds.filter(i=>global.has(i)).length,selected=Z.basinIds.filter(i=>i===Z.globalOptima[0]).length;
 assert.equal(all,272);assert.equal(selected,68);
});
test('escape path is made of legal swaps and has a genuine positive minimax barrier',()=>{
 const route=Z.barrier.path,source=route[0],limit=Z.energies[source];
 for(let i=1;i<route.length;i++)assert.ok(Z.neighbors[route[i-1]].includes(route[i]));
 assert.equal(Math.max(...route.map(i=>Z.energies[i]))-limit,Z.barrier.height);assert.equal(Z.barrier.height,2);
 const reached=new Set([source]),queue=[source];while(queue.length){const i=queue.shift();for(const j of Z.neighbors[i])if(Z.energies[j]<=limit&&!reached.has(j)){reached.add(j);queue.push(j);}}
 assert.ok(Z.globalOptima.every(i=>!reached.has(i)),'No zero-height escape to an optimum exists');
});
test('source SA traces preserve energies, legal accepted moves and the best-so-far convention',()=>{
 for(const run of Z.runs){assert.equal(run.history.length,151);let best=Infinity;
  for(let i=0;i<run.history.length;i++){const row=run.history[i];assert.equal(row.energy,Z.energies[row.id]);best=Math.min(best,row.energy);assert.equal(row.best,best);
   if(i){const previous=run.history[i-1];assert.ok(row.id===previous.id||Z.neighbors[previous.id].includes(row.id));assert.ok(row.temperature<=previous.temperature);assert.equal(row.delta,row.candidate-previous.energy);if(!row.accepted)assert.equal(row.id,previous.id);}
  }assert.equal(run.hit,best===Z.optimum);
 }assert.equal(Z.sa.hits,21);assert.equal(Z.sa.hitRate,.42);assert.equal(Z.sa.steps,150);
});
test('connected graphlet normalization has finite Shannon entropy with declared source scope',()=>{
 const counts=Object.values(Z.graphlets.counts);assert.equal(Object.keys(Z.graphlets.counts).length,8);
 assert.ok(Math.abs(GA.entropy(counts)-Z.graphlets.entropy)<1e-12);
 assert.equal(GA.entropy([10,0,0]),0);assert.equal(GA.entropy([1,1]),1);assert.equal(GA.entropy([0,0]),0);
 for(const occurrences of Object.values(Z.graphlets.occurrences))for(const nodes of occurrences){const seen=new Set([nodes[0]]),queue=[nodes[0]];while(queue.length){const i=queue.shift();for(const j of nodes)if(Z.adj1[i][j]&&!seen.has(j)){seen.add(j);queue.push(j);}}assert.equal(seen.size,nodes.length);}
});
test('default-penalty counterexample is reproducible independently of permutation-only search',()=>{
 const a=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>+(i!==j))),p=[0,1,2,3];
 assert.equal(GA.energy(a,a,p),-20);assert.equal(GA.binaryEnergy(a,a,Z.penaltyCounterexample.invalidAssignment),-24);
 assert.throws(()=>GA.energy(a,a,[0,0,2,3]),/bijection/);
 assert.throws(()=>GA.conserved([[0,1],[0,0]],[[0,1],[1,0]],[0,1]),/undirected/);
});

function correlation(x,y){const n=x.length,mx=x.reduce((a,b)=>a+b)/n,my=y.reduce((a,b)=>a+b)/n;let xy=0,xx=0,yy=0;for(let i=0;i<n;i++){xy+=(x[i]-mx)*(y[i]-my);xx+=(x[i]-mx)**2;yy+=(y[i]-my)**2;}return xy/Math.sqrt(xx*yy);}
function kendall(p,q){const mapped=p.map(v=>q.indexOf(v));let inversions=0;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)inversions+=+(mapped[i]>mapped[j]);return inversions;}
test('both FDC references use declared Kendall distances, not arbitrary-swap distances',()=>{
 const m=Z.details.fdc,p=Z.permutations[m.referenceId];
 for(let i=0;i<720;i++){assert.equal(m.kendallDistances[i],kendall(Z.permutations[i],p));assert.equal(m.nearestDistances[i],Math.min(...Z.globalOptima.map(j=>kendall(Z.permutations[i],Z.permutations[j]))));}
 assert.ok(Math.abs(correlation(Z.energies,m.kendallDistances)-m.value)<1e-12);
 assert.ok(Math.abs(correlation(Z.energies,m.nearestDistances)-m.nearestValue)<1e-12);
 assert.equal(kendall([5,4,3,2,1,0],[0,1,2,3,4,5]),15);
});
test('random-walk estimator and correlation length are reconstructed from all 801 energies',()=>{
 const m=Z.details.walk,a=m.energies;assert.equal(a.length,801);assert.equal(m.steps,800);
 const mean=a.reduce((x,y)=>x+y)/a.length,variance=a.reduce((x,y)=>x+(y-mean)**2,0)/a.length;
 let lag=0;for(let i=0;i<800;i++)lag+=(a[i]-mean)*(a[i+1]-mean);
 assert.ok(Math.abs(lag/(800*variance)-m.rho)<1e-12);assert.ok(Math.abs(-1/Math.log(m.rho)-m.correlationLength)<1e-12);
 assert.ok(a.every(e=>Z.energies.includes(e)));
});
test('all six reported survey R squared values reproduce the actual 225 rows',()=>{
 const rows=Z.details.surveyRows;assert.equal(rows.length,225);
 const unique=new Set(rows.map(r=>[r.model,r.n,r.noise,r.seed].join('|')));assert.equal(unique.size,225);
 for(const key of Object.keys(Z.survey.r2_log_minima)){
  assert.ok(Math.abs(correlation(rows.map(r=>r[key]),rows.map(r=>Math.log(r.n_minima)))**2-Z.survey.r2_log_minima[key])<1e-12);
  assert.ok(Math.abs(correlation(rows.map(r=>r[key]),rows.map(r=>r.sa_hit_rate))**2-Z.survey.r2_sa_hit_rate[key])<1e-12);
 }
});
test('noise changes edges rather than geometry, and original labels need not be optimal',()=>{
 assert.equal(GA.conserved(Z.adj1,Z.noiseFreeAdj2,Z.truth),8);assert.equal(GA.conserved(Z.adj1,Z.adj2,Z.truth),7);
 assert.equal(Z.changedEdges.length,2);assert.equal(GA.conserved(Z.adj1,Z.adj2,Z.permutations[Z.globalOptima[0]]),8);
 const saddle=Math.max(...Z.barrier.energies);assert.equal(saddle-Z.barrier.energies[0],2);assert.equal(saddle-Z.barrier.energies.at(-1),4);
});
