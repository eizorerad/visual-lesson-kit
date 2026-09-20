/* Author entry point of the film template. The empty configuration plays the
 * complete seven-cue PCR film (70 s). Load after js/cinema-timeline.js and before
 * js/recipes/film/pcr-film.js, which reads it once. Example:
 *
 * window.PCR_FILM_CONFIG = {
 *   route: ['start', 'melt', 'anneal', 'extend', {key: 'copies', hold: 8}],
 *   overrides: {
 *     'extend': {motion: 4, text: {
 *       ru: {title: 'Полимераза достраивает цепи'},
 *       en: {title: 'The polymerase builds the strands'}
 *     }}
 *   }
 * };
 *
 * Route entries are keys or {key, motion, hold, text}; text leaves are title,
 * caption and note inside ru and en. Every cue keeps its complete pose, so any
 * order starts from a finished state. Unknown keys, duplicates and negative
 * timings throw at load. Check the result with node qa/film/review.cjs. */
window.PCR_FILM_CONFIG = {};
