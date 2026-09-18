/* Author entry point for the 1EHZ tRNA film. Empty configuration reproduces
 * the approved 39-cue / 398-second route. Keep this file before trna-journey.js.
 *
 * Build another explanation of the SAME source molecule with stable cue keys:
 * window.TRNA_FILM_CONFIG = {
 *   route: ['sequence', 'cloverleaf', 'pairs', 'spatial', 'arms',
 *     'stem', 'nucleotide', 'backbone', 'pair', 'pair-contacts',
 *     'neighbors', 'stacking', 'whole-return', 'volume', 'finale'],
 *   overrides: {
 *     'pair-contacts': {motion: 9, hold: 8, text: {
 *       ru: {title: 'Три контакта пары G3–C70'},
 *       en: {title: 'Three contacts in the G3–C70 pair'}
 *     }}
 *   }
 * };
 *
 * route entries can also be {key:'pair-contacts',motion:9,hold:8,text:{...}}.
 * Text leaves: title, caption, note, approach, inside ru and en.
 * First cue is displayed immediately (motion=0); later motion must be >0.
 * hold is a nonnegative number of seconds. Every cue uses its full source
 * pose: reordering cannot retain a preceding scene's hidden molecular layers.
 * Review transition geometry and revise continuity wording after reordering.
 * Sources stay attached to source scenes. New molecules require new validated
 * coordinate/topology data and are outside this route configuration API.
 * Full catalog after loading: TrnaJourney.catalog; active: TrnaJourney.cues.
 */
window.TRNA_FILM_CONFIG = {};
