/* Teaching order and explicit motion/reading windows for the same source poses.
 * The old numeric keys identify authored content, never its new playback time. */
(function(g){
'use strict';
// key, original content key, incoming motion seconds, settled reading seconds
const route=[
 ['sequence',0,0,8],['sequence-anticodon',7,5,4],['sequence-whole',13,4,3],
 ['cloverleaf',21,6,4],['pairs',28,4,5],['simplify',34,4,4],
 ['anticodon',40,4,4],['cca',46,4,4],['spatial',55,7,5],['rotation',63,6,4],
 ['anticodon-close',70,5,4],['anticodon-return',76,4,3],['cca-close',83,5,4],['arms',89,4,5],
 ['stem',140,5,4],['stem-camera',149,7,4],['nucleotide',157,6,6],['backbone',165,6,5],
 ['pair',171,4,5],['pair-contacts',180,7,6],['neighbors',187,5,5],['stacking',196,7,6],
 ['stem-return',203,5,3],['trace-return',210,4,3],['whole-return',218,5,4],
 ['elbow',97,6,4],['elbow-pair',106,7,6],['elbow-second',115,6,6],['elbow-stack',124,7,6],['elbow-result',133,4,4],
 ['mg-charge','mg:141',6,4],['mg-atmosphere','mg:150',4,4],['mg-select','mg:158',4,4],
 ['mg-water','mg:169',8,6],['mg-bridge','mg:183',10,7],['mg-return','mg:192',7,4],
 ['summary',225,4,4],['volume',237,9,6],['finale',249,8,8]
];
const introductions={
 'nucleotide':['В каждом нуклеотиде основание связано с рибозой, а фосфатные группы соединяют соседние сахара.','In each nucleotide, a base attaches to ribose, while phosphate groups connect neighboring sugars.'],
 'pair-contacts':['Основания G3 и C70 взаимодействуют через донорные и акцепторные группы. Их взаимное положение определяет контакты пары.','G3 and C70 interact through donor and acceptor groups. Their relative positions define the contacts within the pair.'],
 'elbow-pair':['Знакомое спаривание оснований встречается и между петлями. Здесь рассмотрим G19 из D-петли и C56 из T-петли.','Base pairing also occurs between loops. Here we examine D-loop G19 and T-loop C56.'],
 'elbow-second':['Другой контакт образуют G18 и модифицированное основание Ψ55. Их геометрия отличается от обычной пары G–U.','Another contact involves G18 and the modified base Ψ55. Its geometry differs from an ordinary G–U pair.'],
 'elbow-stack':['Как и в стебле, основания петель могут участвовать в стэкинге. Здесь соседями становятся остатки разных участков цепи.','As in a stem, loop bases can participate in stacking. Here, residues from different sequence regions become neighbors.'],
 'mg-charge':['Устойчивость тРНК зависит также от среды. Сахарофосфатный остов взаимодействует с водой и растворёнными ионами.','tRNA stability also depends on its environment. The sugar–phosphate backbone interacts with water and dissolved ions.'],
 'mg-water':['Ближайшее окружение выбранного иона включает воду. Её кислороды координируют Mg²⁺.','Water forms the immediate environment of this ion. Its oxygen atoms coordinate Mg²⁺.'],
 'mg-bridge':['Гидратная оболочка связывает ион с окружением РНК. Рассмотрим фосфатные группы рядом с ней.','The hydration shell connects the ion to its RNA environment. We examine the phosphate groups beside it.']
};
function catalog(original,magnesium,baseline){
 const poses=new Map();let state={...baseline};
 for(const row of original){state={...state,...row[1]};poses.set(row[0],{row,target:{...state},sourceKind:'original',sourceTime:row[0]});}
 state={...poses.get(133).target};
 for(const row of magnesium){state={...state,...row[1]};poses.set('mg:'+row[0],{row,target:{...state},sourceKind:'magnesium',sourceTime:row[0]});}
 return route.map(([key,id,motion,hold])=>{
  const pose=poses.get(id);if(!pose)throw new Error('Missing source pose '+id);
  const target={...pose.target};if(key==='mg-return')target.landmarks=2;
  const [approachRu='',approachEn='']=introductions[key]||[];
  return {key,hold,motion:motion||4,target,sourceKind:pose.sourceKind,sourceTime:pose.sourceTime,
   titleRu:pose.row[2],titleEn:pose.row[3],captionRu:pose.row[4],captionEn:pose.row[5],noteRu:pose.row[6],noteEn:pose.row[7],approachRu,approachEn};
 });
}
function build(original,magnesium,baseline,config={}){
 if(config===null||typeof config!=='object'||Array.isArray(config))throw new TypeError('TRNA_FILM_CONFIG must be an object');
 for(const key of Object.keys(config))if(!['route','overrides'].includes(key))throw new TypeError('Unknown TRNA_FILM_CONFIG field '+key);
 return g.CinemaTimeline.compile({baseline,catalog:catalog(original,magnesium,baseline),...config});
}
g.TrnaFilmStory=Object.freeze({build,catalog,sample:(...args)=>g.CinemaTimeline.sample(...args),defaultRoute:Object.freeze(route.map(row=>row[0]))});
})(window);
