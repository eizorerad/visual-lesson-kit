/* Author entry point. Empty configuration reproduces the reviewed ATAC film:
 * 46 cues / 240.6 seconds, the same source geometry, synthetic records and copy.
 * Load after atac-story.js and before atac-journey.js. Example:
 *
 * window.ATAC_FILM_CONFIG = {
 *   route: ['chromatin','nucleosome','nucleosome-real','histone-octamer',
 *     'wrapped-dna','linker','tn5','tn5-real','tn5-end-dna','dock',
 *     'stagger','tag-chemistry','two-events'],
 *   overrides: {
 *     'nucleosome-real': {motion:4,hold:5,text:{
 *       ru:{title:'Та же нуклеосома крупным планом'},
 *       en:{title:'A closer view of the same nucleosome'}
 *     }}
 *   }
 * };
 *
 * route entries may also be {key:'tn5-real',motion:4,hold:6,text:{...}}.
 * Text leaves: title, caption, note, approach, inside ru and en. Sources and
 * numerical records remain attached to their scenes. Timing is in seconds;
 * the first cue is immediate (motion=0); later motion>0, hold>=0.
 * Full cue catalog: ATAC_FILM.catalog; compiled route: ATAC_FILM.cues.
 * Each cue has a complete source pose. Original adjacent cues retain their
 * camera choreography; unrelated views dissolve without traversing omitted
 * stages or inventing a missing molecular context. Review continuity wording,
 * reading time and layout after edits; run qa/atac/remix.cjs as a smoke check.
 * This API remixes the existing scientific example, not arbitrary coordinates
 * or sequencing data. Independent actor APIs support new source compositions.
 */
window.ATAC_FILM_CONFIG = {};
