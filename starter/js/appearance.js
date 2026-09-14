/* Appearance is applied synchronously in the head. Color roles are CSS values:
   existing nodes and later animation frames inherit each change without replay. */
(function (global) {
  'use strict';
  var D = global.D = global.D || {}, root = document.documentElement;
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var record = function (o) { return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
  var config = record(record(global.LESSON).appearance), storageKey = 'visual-lesson-kit.appearance.v1';
  var backgrounds = {
    black: { label: { ru: 'Чёрный', en: 'Black' }, bg: '#000000', text: '#F0ECE6', muted: '#AAA3AD', dim: '#716A76' },
    white: { label: { ru: 'Белый', en: 'White' }, bg: '#FFFFFF', text: '#211C26', muted: '#655D6B', dim: '#938A99' }
  };
  var palettes = {
    warm: { label: { ru: 'Тёплая', en: 'Warm' }, black: ['#F29F87', '#ACB978', '#BDA9E2', '#E07D92', '#82ABC4'], white: ['#9D452D', '#566322', '#725397', '#A33253', '#396780'] },
    ocean: { label: { ru: 'Океан', en: 'Ocean' }, black: ['#73BFEA', '#63CDB5', '#EAC878', '#EC92B3', '#B4A7EC'], white: ['#18658E', '#176B58', '#826000', '#A33261', '#644AA0'] },
    botanical: { label: { ru: 'Сад', en: 'Botanical' }, black: ['#B8C77B', '#76C6B2', '#E6B777', '#D79ED0', '#A5B7EB'], white: ['#526426', '#1E6956', '#885500', '#8D3F86', '#465F9B'] }
  };
  var fonts = {
    sans: { label: { ru: 'Без засечек', en: 'Sans' }, family: 'Source Sans 3', fallback: 'sans-serif' },
    serif: { label: { ru: 'С засечками', en: 'Serif' }, family: 'Source Serif 4', fallback: 'serif' }
  };
  var roles = ['primary', 'secondary', 'focus', 'contrast', 'auxiliary'];
  function luminance(hex) {
    return hex.slice(1).match(/../g).map(function (x) { var n = parseInt(x, 16) / 255; return n <= .04045 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4); })
      .reduce(function (sum, n, i) { return sum + n * [.2126, .7152, .0722][i]; }, 0);
  }
  function validColors(colors, background) {
    if (!Array.isArray(colors) || colors.length !== 5 || new Set(colors.map(function (color) { return String(color).toUpperCase(); })).size !== 5) return false;
    return colors.every(function (color) {
      if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return false;
      var l = luminance(color), b = background === 'black' ? 0 : 1;
      return (Math.max(l, b) + .05) / (Math.min(l, b) + .05) >= 4.5;
    });
  }
  function label(value, id) {
    value = record(value);
    return { ru: typeof value.ru === 'string' && value.ru.trim() ? value.ru.slice(0, 50) : id,
      en: typeof value.en === 'string' && value.en.trim() ? value.en.slice(0, 50) : id };
  }
  function addPresets(input, destination, normalize) {
    Object.keys(record(input)).forEach(function (id) {
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(id) || own(destination, id) || id in Object.prototype) return;
      var result = normalize(record(input[id]), id); if (result) destination[id] = result;
    });
  }
  addPresets(config.palettes, palettes, function (p, id) {
    if (!validColors(p.black, 'black') || !validColors(p.white, 'white')) return null;
    return { label: label(p.label, id), black: p.black.map(function (c) { return c.toUpperCase(); }), white: p.white.map(function (c) { return c.toUpperCase(); }) };
  });
  addPresets(config.fonts, fonts, function (f, id) {
    if (typeof f.family !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N} -]{0,79}$/u.test(f.family) || !['serif', 'sans-serif'].includes(f.fallback)) return null;
    return { label: label(f.label, id), family: f.family, fallback: f.fallback };
  });
  function freeze(value) { Object.keys(value).forEach(function (k) { if (value[k] && typeof value[k] === 'object') freeze(value[k]); }); return Object.freeze(value); }
  var presets = freeze({ backgrounds: backgrounds, palettes: palettes, fonts: fonts });
  var choices = { background: backgrounds, palette: palettes, font: fonts };
  function validate(patch, previous) {
    patch = record(patch); var next = Object.assign({}, previous);
    Object.keys(choices).forEach(function (key) { if (typeof patch[key] === 'string' && own(choices[key], patch[key])) next[key] = patch[key]; });
    return next;
  }
  var state = validate(config, { background: 'black', palette: 'warm', font: 'sans' });
  try { state = validate(JSON.parse(global.localStorage.getItem(storageKey)), state); } catch (_) { /* file URLs and privacy settings may disable storage. */ }
  var bound = false, translateCurrent = function () {};
  function get() { return Object.assign({}, state); }
  function apply() {
    root.dataset.background = state.background; root.dataset.palette = state.palette; root.dataset.font = state.font;
    var theme = backgrounds[state.background], colors = palettes[state.palette][state.background];
    ['bg', 'text', 'muted', 'dim'].forEach(function (role) { root.style.setProperty('--color-' + role, theme[role]); });
    roles.forEach(function (role, i) { root.style.setProperty('--color-' + role, colors[i]); });
    root.style.colorScheme = state.background === 'black' ? 'dark' : 'light';
    var font = fonts[state.font];
    ['text', 'math', 'sans', 'ui'].forEach(function (role) {
      if (state.font === 'sans' || state.font === 'serif') root.style.removeProperty('--f-' + role);
      else root.style.setProperty('--f-' + role, '"' + font.family + '", "DejaVu Sans", ' + font.fallback);
    });
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = theme.bg;
    document.querySelectorAll('[data-appearance]').forEach(function (select) { select.value = state[select.dataset.appearance]; });
  }
  function set(patch) {
    state = validate(patch, state); apply();
    try { global.localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { /* The in-memory setting remains usable. */ }
    return get();
  }
  function bind() {
    if (bound) { translateCurrent(); apply(); return; }
    var panel = document.getElementById('appearanceSettings'); if (!panel || !D.i18n) return;
    bound = true;
    var strings = { ru: { appearance: 'Оформление', background: 'Фон', palette: 'Палитра', font: 'Шрифт' }, en: { appearance: 'Appearance', background: 'Background', palette: 'Palette', font: 'Typeface' } };
    function translate() {
      var lang = D.i18n.lang() === 'en' ? 'en' : 'ru';
      panel.querySelectorAll('[data-appearance-label]').forEach(function (node) { node.textContent = strings[lang][node.dataset.appearanceLabel]; });
      panel.querySelectorAll('select').forEach(function (select) {
        var options = choices[select.dataset.appearance];
        Array.from(select.options).forEach(function (option) { option.textContent = options[option.value].label[lang]; });
      });
    }
    panel.querySelectorAll('select[data-appearance]').forEach(function (select) {
      Object.keys(choices[select.dataset.appearance]).forEach(function (id) { var option = document.createElement('option'); option.value = id; select.append(option); });
      select.addEventListener('change', function () { var patch = {}; patch[select.dataset.appearance] = select.value; set(patch); });
    });
    translateCurrent = translate; D.i18n.onChange(translate); translate(); apply();
  }
  D.appearance = Object.freeze({ get: get, set: set, presets: presets, bind: bind });
  apply();
  document.addEventListener('DOMContentLoaded', bind, { once: true });
})(window);
