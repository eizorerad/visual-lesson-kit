#!/usr/bin/env python3
"""Rebuild the compact educational structural traces from the saved RCSB assemblies.
No network or third-party packages are needed.
"""
from pathlib import Path
import argparse,shlex,json,collections,math,hashlib
root=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check",action="store_true",help="Verify generated coordinates/provenance without writing")
args=parser.parse_args()
def cif_tokens(path):
 lines=iter(path.read_text().splitlines())
 for line in lines:
  if line.startswith(';'):
   block=[line[1:]]
   for line in lines:
    if line.startswith(';'):break
    block.append(line)
   yield '\n'.join(block)
  else:
   yield from shlex.split(line,comments=True,posix=True)
def cif_parse(path):
 t=list(cif_tokens(path));i=0;cats={}
 while i<len(t):
  if t[i]=='loop_':
   i+=1;cols=[]
   while i<len(t) and t[i].startswith('_'):cols.append(t[i]);i+=1
   rows=[]
   while i<len(t) and not(t[i].startswith('_') or t[i]=='loop_' or t[i].startswith('data_')):
    vals=t[i:i+len(cols)];i+=len(cols)
    assert len(vals)==len(cols)
    rows.append(dict(zip(cols,vals)))
   if cols:cats[cols[0].split('.')[0]]=rows
  elif t[i].startswith('_') and i+1<len(t):
   k=t[i];cat=k.split('.')[0];cats.setdefault(cat,[{}])[0][k]=t[i+1];i+=2
  else:i+=1
 return cats
def dist(a,b):return math.sqrt(sum((x-y)**2 for x,y in zip(a,b)))
def avg(pts):return [round(sum(p[k] for p in pts)/len(pts),3) for k in range(3)]
def xyz(a):return [float(a['_atom_site.Cartn_'+k]) for k in 'xyz']
base_atom_names=set('C2 C4 C5 C6 C8 N1 N2 N3 N4 N6 N7 N9 O2 O4 O6'.split())
structures={};provenance={'retrieved':'2026-09-19','extraction':'C4-prime per DNA nucleotide; C-alpha per protein residue; base centroid from deposited base heavy atoms. No missing coordinates filled. Biological assembly 1 downloaded from RCSB, not independently modelled.','structures':[]}
for pdb,key,doi in [('1KX5','nucleosome','10.1016/S0022-2836(02)00386-8'),('1MUH','transposome','10.1126/science.289.5476.77')]:
 cats=cif_parse(root/'assets/atac/structures'/f'{pdb}-assembly1.cif');entities={e['_entity.id']:e for e in cats['_entity']};polys={e['_entity_poly.entity_id']:e for e in cats['_entity_poly']};groups=collections.OrderedDict()
 for a in cats['_atom_site']:
  if a['_atom_site.group_PDB']!='ATOM' or a['_atom_site.pdbx_PDB_model_num']!='1':continue
  if a['_atom_site.label_alt_id'] not in ('.','A'):continue
  ch=a['_atom_site.label_asym_id'];seq=int(a['_atom_site.label_seq_id']);groups.setdefault(ch,collections.OrderedDict()).setdefault(seq,{})[a['_atom_site.label_atom_id']]=a
 chains=[]
 for ch,rr in groups.items():
  first=next(iter(next(iter(rr.values())).values()));eid=first['_atom_site.label_entity_id'];kind='dna' if polys[eid]['_entity_poly.type']=='polydeoxyribonucleotide' else 'protein'
  entity=entities[eid]['_entity.pdbx_description'];role=entity
  if kind=='dna':role=('nucleosomal DNA strand '+('1' if eid=='1' else '2')) if pdb=='1KX5' else ('transferred' if eid=='1' else 'non-transferred')+' strand of end '+('2' if ch.endswith('-2') else '1')
  if kind=='protein' and pdb=='1MUH':role='Tn5 subunit '+('2' if ch.endswith('-2') else '1')
  chain={'id':ch,'authorId':first['_atom_site.auth_asym_id'],'entityId':eid,'kind':kind,'role':role,'entity':entity,'traceAtom':"C4'" if kind=='dna' else 'CA','points':[],'residues':[],'breaks':[]}
  if kind=='dna':chain['basePoints']=[];chain['sugarPoints']=[];chain['endGroup']=('2' if ch.endswith('-2') else '1') if pdb=='1MUH' else 'nucleosomal'
  for seq,aa in rr.items():
   a=aa.get(chain['traceAtom']);
   if not a:continue
   chain['points'].append(xyz(a));chain['residues'].append({'seqId':seq,'authSeqId':a['_atom_site.auth_seq_id'],'name':a['_atom_site.label_comp_id']})
   if kind=='dna':chain['basePoints'].append(avg([xyz(v) for k,v in aa.items() if k in base_atom_names]));chain['sugarPoints'].append(xyz(aa["C1'"]))
  for i in range(1,len(chain['points'])):
   if chain['residues'][i]['seqId']!=chain['residues'][i-1]['seqId']+1 or dist(chain['points'][i],chain['points'][i-1])>(4.7 if kind=='protein' else 9):chain['breaks'].append(i)
  chains.append(chain)
 by={c['id']:c for c in chains};pairs=[];duplexes=[]
 for ca,cb in ([('A','B')] if pdb=='1KX5' else [('A','B'),('A-2','B-2')]):
  a,b=by[ca],by[cb];N=len(a['points']);assert N==len(b['points']);ds=[];bds=[]
  for i in range(N):
   j=N-1-i;ra=a['residues'][i]['name'][-1];rb=b['residues'][j]['name'][-1];assert {'A':'T','T':'A','G':'C','C':'G'}[ra]==rb,(pdb,i,ra,rb)
   ds.append(dist(a['sugarPoints'][i],b['sugarPoints'][j]));bds.append(dist(a['basePoints'][i],b['basePoints'][j]));
   if 9.5 <= ds[-1] <= 11.5 and 4.5 <= bds[-1] <= 7.5:pairs.append({'chainA':ca,'indexA':i,'chainB':cb,'indexB':j})
  print(pdb,ca,cb,'C1-C1 pair distance',min(ds),max(ds),'baseCentroid',min(bds),max(bds))
  duplexes.append({'id':a.get('endGroup'),'chainA':ca,'chainB':cb,'sequenceLength':N,'pairCount':sum(p['chainA']==ca and p['chainB']==cb for p in pairs),'sequenceCorrespondence':'antiparallel reverse complement; terminal distorted positions omitted from visual pairing if sugar/base geometry is incompatible','c1PairDistanceRangeAngstrom':[round(min(ds),3),round(max(ds),3)]})
 raw=root/'assets/atac/structures'/f'{pdb}-assembly1.cif';entry=json.loads((root/'assets/atac/structures'/f'{pdb}-entry.json').read_text());pts=[p for c in chains for p in c['points']];lo=[min(p[k] for p in pts) for k in range(3)];hi=[max(p[k] for p in pts) for k in range(3)]
 limitations=(['147-bp reconstituted nucleosome core; no linker DNA or neighboring nucleosomes.','The 8 histone chains and 2 DNA strands are deposited coordinates. The trace omits solvent, ions, hydrogens and most atoms.','No breathing, sliding, unwrapping trajectory or in vivo Tn5 accessibility map is measured by this structure.'] if pdb=='1KX5' else ['Protein-DNA synaptic complex with two short transposon-end duplexes. No target DNA is present.','These are transposon-end DNA strands, not full ATAC-seq adapter constructs; ATAC-seq uses adapted oligonucleotide ends.','The deposited assembly has two Tn5 subunits and four DNA strands; the asymmetric unit has only one subunit and two DNA strands.','Experimental metal ions (Mn/Mg), waters and disordered residues are omitted. This view makes no claim about ATAC reaction metal positions.','Rotation changes view only: it is not a captured time sequence or strand-transfer simulation.'])
 structures[key]={'pdb':pdb,'assembly':'1','source':'https://www.rcsb.org/structure/'+pdb,'coordinatesSource':'https://files.rcsb.org/download/'+pdb+'-assembly1.cif','article':'https://doi.org/'+doi,'title':entry['struct']['title'],'description':('Experimental nucleosome core: 147 bp DNA around an octamer containing two copies each of H2A, H2B, H3, H4.' if pdb=='1KX5' else 'Experimental Tn5 synaptic complex: two transposase subunits and two short transposon-end DNA duplexes, without target DNA.'),'method':'X-ray diffraction','resolutionAngstrom':entry['rcsb_entry_info']['resolution_combined'][0],'coordinateUnits':'angstrom','center':[(a+b)/2 for a,b in zip(lo,hi)],'bounds':{'min':lo,'max':hi},'containsTargetDNA':False if pdb=='1MUH' else None,'limitations':limitations,'chains':chains,'basePairs':pairs,'duplexGroups':duplexes}
 provenance['structures'].append({'key':key,'pdb':pdb,'assembly':'1','coordinateFile':'assets/atac/structures/'+raw.name,'downloadUrl':structures[key]['coordinatesSource'],'sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'primaryArticle':structures[key]['article'],'polymerChains':[{'id':c['id'],'authorId':c['authorId'],'entityId':c['entityId'],'role':c['role'],'traceAtom':c['traceAtom'],'pointCount':len(c['points']),'breaks':c['breaks']} for c in chains],'excluded':'waters, ions, all non-polymer ligands; unmodeled residues are not interpolated','basePairNote':'Antiparallel reverse-complement sequence correspondence; visual rungs retained only when C1-prime distances are 9.5–11.5 Å and base-centroid distances 4.5–7.5 Å. This omits the two terminal distorted positions per Tn5 DNA end. Rungs represent paired bases, not individual hydrogen bonds; no DSSR assignment is claimed.'})
outputs={root/'js/atac-structures.js':'/* Derived only from experimental RCSB biological assembly 1 coordinates. See assets/atac/ATAC-3D-SOURCES.md. */\nwindow.AtacStructures = '+json.dumps(structures,separators=(',',':'))+';\n',root/'assets/atac/structures/provenance.json':json.dumps(provenance,indent=2)+'\n'}
for path,content in outputs.items():
 if args.check:
  assert path.read_text()==content, f'{path.name} is stale; run python3 assets/atac/structures/extract.py'
 else:
  path.parent.mkdir(parents=True,exist_ok=True)
  path.write_text(content)
 print('Verified' if args.check else 'Wrote',path,len(content.encode('utf-8')),'bytes')
