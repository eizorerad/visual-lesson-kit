const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../starter');
function setup(){const dom=new JSDOM('<main id="frame"></main>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/'}),w=dom.window,scenes=[],jobs=[];
 for(const f of ['lib/dom.js','lib/i18n.js','lesson.js','interaction-regions.js','film.js','layout.js','molecular.js','molecular-regulation.js','molecular-inspect.js','chemistry.js','physical-chemistry.js'])w.eval(fs.readFileSync(path.join(root,'js',f),'utf8'));
 w.D.deck={register(c){scenes.push(c);},count(){return 16;}};w.A={run(fn){let resolve;const promise=new Promise(r=>resolve=r);jobs.push({fn,resolve});return promise;}};
 for(const f of ['chemistry-foundations-bonds.js','chemistry-foundations-environment.js','chemistry-foundations-transfer.js','chemistry-context-binding.js','chemistry-context-reactions.js','chemistry-context-transport.js','chemistry-context-energy.js','chemistry-bridge.js','chemistry-physics-scenes.js'])w.eval(fs.readFileSync(path.join(root,'js/recipes',f),'utf8'));
 const draw=id=>{const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');w.document.querySelector('main').append(svg);return w.CHEMISTRY_BRIDGE.createSpecimen({svg},w.CHEMISTRY_BRIDGE.specimens.find(s=>s.id===id));};return {w,scenes,jobs,draw};}
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
function xy(atom){return atom.getAttribute('transform').match(/translate\(([^)]+)\)/)[1].split(/[ ,]+/).map(Number);}
function angle(o,a,b){const u=[a[0]-o[0],a[1]-o[1]],v=[b[0]-o[0],b[1]-o[1]];return Math.acos((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))*180/Math.PI;}
const atom=(g,id)=>g.querySelector(`[data-atom-id="${id}"]`);
function waterAngle(g,h1='H1',h2='H2'){return angle(xy(atom(g,'O')),xy(atom(g,h1)),xy(atom(g,h2)));}

module.exports={setup,xy,atom,angle,waterAngle,near};
