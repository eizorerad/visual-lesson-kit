/* A runnable menu recipe, intentionally outside the default gallery.
   Six invented records; every feature is supplied, never inferred by animation. */
(function () {
  'use strict';
  const DATA = Object.freeze([
    ['A', .3, .5, .2], ['B', .6, 1.1, 1.2], ['C', 1, .3, .6],
    ['D', 1.3, 1.3, 1.4], ['E', 1.7, .6, .3], ['F', 2, 1, 1.6]
  ].map(([id, ...xyz]) => Object.freeze({ id, xyz: Object.freeze(xyz) })));
  const COLORS = [C.blue, C.teal, C.gold, C.red, C.purple, C.grey], strings = {};
  const SOURCE = 'representation-journey-fixture-v1';
  function tr(ru, en) { if (!Object.hasOwn(strings, ru)) { strings[ru] = en; D.i18n.pack('en', { strings: { [ru]: en } }); } return ru; }
  function words(parent, id, x, y, width, height, ru, en, size = 26, color = C.white) {
    return L.textBox(parent, { id, x, y, width, height, text: tr(ru, en), size, color, padding: 5, align: 'center', valign: 'middle' });
  }
  function poses(fn) { return Object.fromEntries(DATA.map((d, i) => [d.id, fn(d, i)])); }
  const ROW = poses((d, i) => ({ x: 160 + 190 * i, y: 355 }));
  const MATRIX = poses((d, i) => ({ x: 350, y: 245 + 60 * i }));
  const NEXT_MATRIX = poses((d, i) => ({ x: 205, y: 245 + 60 * i }));
  function records(parent) {
    const actors = DATA.map((d, i) => {
      const node = F.group(parent), ring = F.dot(node, 0, 0, 20, 'var(--color-bg)'); ring.setAttribute('stroke', COLORS[i]); ring.setAttribute('stroke-width', 2);
      const symbol = F.label(node, 0, 0, d.id, 24, COLORS[i]); symbol.dataset.recordSymbol = '';
      L.contract(symbol, { id: 'record-' + d.id, space: node, box: { x: -21, y: -21, width: 42, height: 42 } });
      node.dataset.features = JSON.stringify(d.xyz);
      const features = F.group(node), bars = [], numbers = [];
      d.xyz.forEach((value, k) => {
        const x = 60 + k * 80;
        features.append(D.dom.s('rect', { x, y: -17, width: 66, height: 34, fill: 'none', stroke: C.dim, 'stroke-width': 1 }));
        const bar = D.dom.s('rect', { x: x + 5, y: -12, width: 0, height: 24, fill: COLORS[i], 'fill-opacity': .28 }); features.append(bar); bars.push(bar);
        const number = F.label(features, x + 33, 0, value.toFixed(1), 21, C.white);
        L.contract(number, { id: 'feature-' + d.id + '-' + k, space: features, box: { x, y: -17, width: 66, height: 34 } }); numbers.push(number);
      });
      F.shared(node, { id: d.id, kind: 'record', label: 'Record ' + d.id, source: SOURCE, value: d.xyz.join(',') });
      return { node, ring, features, bars, numbers, data: d };
    });
    const track = F.motionTrack(actors.map(a => ({ id: a.data.id, node: a.node })));
    function reveal(value) { actors.forEach(a => { F.opacity(a.features, value); a.bars.forEach((bar, i) => bar.setAttribute('width', 56 * a.data.xyz[i] / 2 * value)); a.numbers.forEach(n => F.opacity(n, F.phase(value, .6, 1))); }); }
    return { actors, track, reveal };
  }
  function register(id, title, notes, question, answer, build) {
    D.i18n.pack('en', { notes: { [id]: notes.map(n => F.note(n[1])) }, qa: { [id]: [{ q: question[1], a: answer[1], source: 'Explicit teaching fixture: six records, three features.' }] } });
    D.deck.register({ id, title: tr(...title), chapter: tr('Путь представления', 'A representation journey'), notes: notes.map(n => F.note(n[0])), qa: [{ q: question[0], a: answer[0], source: 'Явный учебный набор: шесть записей, три признака.' }], build });
  }
  const provenance = () => tr('Учебный набор A–F · три явно заданных признака · условные единицы', 'Teaching records A–F · three explicitly supplied features · arbitrary units');
  register('journey-features', ['Одна запись — одна строка', 'One record, one row'], [
    ['Шесть учебных записей A–F имеют постоянные имена. Данные придуманы для примера; буквы обозначают записи, а не нуклеотиды или классы.', 'Six teaching records A–F have stable names. The data are invented for this example; letters identify records, not nucleotides or classes.'],
    ['Те же шесть групп SVG переходят из горизонтального ряда в строки матрицы. Ни одна запись не копируется и не исчезает. Имя и цвет помогают проследить каждую строку.', 'The same six SVG groups move from a horizontal sequence into matrix rows. No record is copied or removed. Its name and color let you follow each row.'],
    ['Теперь раскрываем три заранее заданных значения каждой записи. Ширина внутренней полосы использует одну шкалу 0–2, а число показывает точное значение. Это раскрытие данных, не обучение модели.', 'We now disclose the three supplied values of each record. Inner bar widths use one 0–2 scale, and numbers give exact values. This discloses data; it does not train a model.']
  ], ['Почему число строк осталось равным шести?', 'Why are there still six rows?'], ['Каждая строка соответствует одной исходной записи. Перестройка раскладки не добавляет наблюдений.', 'Each row represents one original record. Rearranging the layout adds no observations.'], ctx => {
    const v = F.stage(ctx, tr('Одна запись — одна строка', 'One record, one row'), '', provenance()), stage = K.viewport(v.svg);
    const state = { arrange: 0, reveal: 0 }, items = records(stage);
    const lead = words(stage, 'journey-sequence-label', 230, 165, 820, 60, 'Проследите за именами A–F', 'Follow the names A–F', 30);
    const header = words(stage, 'journey-feature-header', 400, 178, 280, 55, 'Три признака', 'Three features');
    const legend = words(stage, 'journey-feature-legend', 830, 282, 330, 180, 'Каждая строка хранит одну запись. Шкала полос: 0–2.', 'Each row retains one record. Bar scale: 0–2.', 28);
    function paint() {
      items.track.between(ROW, MATRIX, state.arrange); items.reveal(state.reveal);
      F.opacity(lead.el, 1 - F.phase(state.arrange, 0, .4)); F.opacity(header.el, state.reveal); F.opacity(legend.el, state.reveal);
      v.root.dataset.motionPhase = JSON.stringify(state);
    }
    const driver = F.driver(state, paint); ctx.onDispose(driver.dispose); paint();
    v.caption(tr('Начнём с шести именованных записей.', 'Start with six named records.'));
    ctx.step(() => { v.caption(tr('Те же объекты становятся строками. Имена сохраняются.', 'The same objects become rows. Their names stay with them.')); return driver.to({ arrange: 1 }, { duration: 2200 }); });
    ctx.step(() => { v.caption(tr('Раскрываем заданные признаки каждой строки на общей шкале.', 'Disclose each row’s supplied features on one shared scale.')); return driver.to({ reveal: 1 }, { duration: 1600 }); });
    return v.root;
  });

  const PLANE_CAMERA = Object.freeze({ cx: 510, cy: 530, scale: 150, yaw: 0, pitch: 0 });
  register('journey-projection', ['Та же запись на двух осях', 'The same record on two axes'], [
    ['Матрица переходит из предыдущей сцены с сохранёнными именами, источником и значениями. Совпадение ID само по себе недостаточно: мост сцены проверяет всю явно заданную идентичность.', 'The matrix continues from the previous scene with the same names, source and values. A matching ID alone is insufficient: the scene bridge checks the entire declared identity.'],
    ['Каждая запись перемещается на координаты своих первых двух признаков. Полосы убираются, но имена и сами группы SVG остаются. Это обычное отображение двух заданных координат, не UMAP и не обученная проекция.', 'Each record moves to the coordinates of its first two features. Bars retract, while names and SVG groups persist. This displays two supplied coordinates; it is neither UMAP nor a learned projection.'],
    ['Для F направляющие показывают x=2.0 и y=1.0. Третье значение z=1.6 хранится в исходном наборе, но ещё не влияет на положение. По одной этой картинке нельзя восстановить отсутствующее значение.', 'For F, guides show x=2.0 and y=1.0. The third value z=1.6 remains in the source data but does not yet affect position. A missing value cannot be recovered from this picture alone.']
  ], ['Была ли третья координата вычислена из картинки?', 'Was the third coordinate calculated from the picture?'], ['Нет. Все три значения заранее заданы в DATA. Отображение использует только первые два; анимация не вычисляет скрытые признаки.', 'No. All three values are supplied in DATA. This view uses only the first two; animation does not calculate hidden features.'], ctx => {
    const v = F.stage(ctx, tr('Та же запись на двух осях', 'The same record on two axes'), '', provenance()), stage = K.viewport(v.svg), axes = F.group(stage);
    F.line(axes, 510, 530, 860, 530, C.grey, 1.6); F.line(axes, 510, 530, 510, 275, C.grey, 1.6);
    [[880, 530, 'x', 27, C.blue], [510, 257, 'y', 27, C.teal], [494, 550, '0', 20, C.grey]].forEach(([x, y, label, size, color]) => {
      const node = F.label(axes, x, y, label, size, color); L.contract(node, { id: 'projection-axis-' + label, space: axes, box: { x: x - 24, y: y - 24, width: 48, height: 48 } });
    });
    const items = records(stage), state = { move: 0, inspect: 0 };
    const target = poses(d => { const p = K.project3D([d.xyz[0], d.xyz[1], 0], PLANE_CAMERA); return { x: p.x, y: p.y }; });
    const via = poses((d, i) => ({ x: 300 + 60 * i, y: .75 * NEXT_MATRIX[d.id].y + .25 * target[d.id].y }));
    const heading = words(stage, 'journey-projection-heading', 100, 163, 1070, 60, 'Имя сохраняется при смене представления', 'Identity survives a change of representation', 29);
    const readout = words(stage, 'journey-coordinate-readout', 905, 322, 260, 165, 'F: x = 2.0, y = 1.0. Значение z = 1.6 пока не показано.', 'F: x = 2.0, y = 1.0. The supplied z = 1.6 is not shown yet.', 25);
    const guideX = F.line(stage, 810, 530, 810, 380, C.grey, 1.5, '5 5'), guideY = F.line(stage, 510, 380, 810, 380, C.grey, 1.5, '5 5');
    function paint() {
      // Retract the row details, then move through separated curved lanes.
      items.track.between(NEXT_MATRIX, target, F.phase(state.move, .2, 1), { via }); items.reveal(1 - F.phase(state.move, 0, .18)); F.opacity(axes, F.phase(state.move, .75, 1));
      F.opacity(readout.el, state.inspect); F.revealStroke(guideX, state.inspect); F.revealStroke(guideY, state.inspect); items.actors[5].ring.setAttribute('stroke-width', 2 + state.inspect * 2);
      v.root.dataset.motionPhase = JSON.stringify(state);
    }
    const driver = F.driver(state, paint); ctx.onDispose(driver.dispose); paint();
    v.caption(tr('Те же строки продолжают историю в новой сцене.', 'The same rows continue the story in the next scene.'));
    ctx.step(() => { v.caption(tr('Каждая запись переходит на свои заданные координаты x и y.', 'Each record moves to its supplied x and y coordinates.')); return driver.to({ move: 1 }, { duration: 2400 }); });
    ctx.step(() => { v.caption(tr('Две оси показывают два значения. Третье хранится в данных.', 'Two axes display two values. A third remains in the data.')); return driver.to({ inspect: 1 }, { duration: 1500 }); });
    return v.root;
  });

  register('journey-camera', ['Сначала ракурс, затем значение', 'First the view, then the value'], [
    ['Шесть прежних записей остаются на плоскости xy. Их третьи координаты заданы в DATA с самого начала. В этой сцене мы разделяем изменение камеры и раскрытие значения.', 'The same six records remain on the xy plane. Their third coordinates have been supplied in DATA from the start. This scene separates changing the camera from disclosing a value.'],
    ['Камера наклоняется вокруг прежней плоскости. Отображаемые точки всё ещё имеют z=0: меняется только ракурс. Имена остаются вертикальными, а масштаб камеры постоянен.', 'The camera tilts around the existing plane. Displayed points still have z=0: only the view changes. Labels stay upright and camera scale stays fixed.'],
    ['Камера остановилась. Сначала вводим ось z, затем поднимаем записи к их заранее заданным третьим значениям. Тени и пунктир сохраняют связь с прежними x,y. Это раскрытие представления, не траектория во времени и не восстановление глубины из изображения.', 'The camera has stopped. First introduce the z axis, then lift records to their supplied third values. Shadows and guides preserve the link to the former x,y. This discloses a representation; it is neither a time trajectory nor depth recovered from an image.']
  ], ['Что изменилось при одном повороте камеры?', 'What changed during the camera turn alone?'], ['Только экранные положения и видимые перекрытия. Значения исходного набора и координаты отображаемых точек на плоскости не менялись.', 'Only screen positions and visible overlaps changed. Source values and the displayed points’ coordinates on the plane did not change.'], ctx => {
    const v = F.stage(ctx, tr('Сначала ракурс, затем значение', 'First the view, then the value'), '', provenance()), stage = K.viewport(v.svg);
    const state = { tilt: 0, disclose: 0 }, segments = [];
    for (let i = 0; i <= 4; i++) segments.push({ id: 'gx' + i, from: [i * .55, 0, 0], to: [i * .55, 1.5, 0], color: C.dim, width: 1 });
    for (let i = 0; i <= 3; i++) segments.push({ id: 'gy' + i, from: [0, i * .5, 0], to: [2.2, i * .5, 0], color: C.dim, width: 1 });
    segments.push({ id: 'x-axis', from: [0, 0, 0], to: [2.35, 0, 0], color: C.blue, width: 2, arrow: true }, { id: 'y-axis', from: [0, 0, 0], to: [0, 1.65, 0], color: C.teal, width: 2, arrow: true }, { id: 'z-axis', from: [0, 0, 0], to: [0, 0, 0], color: C.gold, width: 2, arrow: true, opacity: 0 });
    DATA.forEach(d => segments.push({ id: 'height-' + d.id, from: [d.xyz[0], d.xyz[1], 0], to: [d.xyz[0], d.xyz[1], 0], color: C.grey, width: 1.3, dash: '4 5', opacity: 0 }));
    const space = K.spatialScene(stage, { camera: { cx: 420, cy: 480, scale: 150 }, segments,
      points: DATA.map(d => ({ id: 'shadow-' + d.id, xyz: [d.xyz[0], d.xyz[1], 0], color: C.grey, r: 4, opacity: 0 })),
      polygons: [{ id: 'floor', vertices: [[0, 0, 0], [2.2, 0, 0], [2.2, 1.5, 0], [0, 1.5, 0]], color: C.blue, opacity: .06 }],
      labels: [{ id: 'x-label', xyz: [2.35, 0, 0], text: 'x', color: C.blue, dx: 18, size: 26 }, { id: 'y-label', xyz: [0, 1.65, 0], text: 'y', color: C.teal, dy: -18, size: 26 }, { id: 'z-label', xyz: [0, 0, 1.8], text: 'z', color: C.gold, dx: -20, size: 26, opacity: 0 }] });
    for (const [id, node] of space.labels) L.contract(node, { id: 'camera-' + id, space: node.parentNode, box: () => ({ x: +node.getAttribute('x') - 24, y: +node.getAttribute('y') - 24, width: 48, height: 48 }) });
    const items = records(stage); items.reveal(0);
    const explanation = words(stage, 'journey-camera-explanation', 875, 265, 320, 210, 'Камера меняет вид. Значения сохраняются.', 'The camera changes the view. Values remain fixed.', 29);
    words(stage, 'journey-camera-caption', 830, 155, 365, 105, 'Сохраните плоскость как ориентир', 'Keep the original plane as a reference', 29);
    let driver, cameraDriver;
    const control = T.control(v.root, tr('Ракурс', 'View angle'), 0, 1, 0, .01, value => cameraDriver.set({ tilt: value }), 880, 515, 280);
    function paint() {
      const axis = F.phase(state.disclose, 0, .3), lift = F.phase(state.disclose, .35, 1);
      const camera = { cx: 420, cy: 480, scale: 150, yaw: -18 * state.tilt, pitch: -54 * state.tilt };
      space.setCamera(camera).setSegment('z-axis', [0, 0, 0], [0, 0, 1.8 * axis]).setOpacity('z-axis', axis).setOpacity('z-label', axis);
      items.track.set(poses(d => { const p = K.project3D([d.xyz[0], d.xyz[1], d.xyz[2] * lift], camera); return { x: p.x, y: p.y }; }));
      DATA.forEach(d => { const base = [d.xyz[0], d.xyz[1], 0], tip = [d.xyz[0], d.xyz[1], d.xyz[2] * lift]; space.setSegment('height-' + d.id, base, tip).setOpacity('height-' + d.id, lift).setOpacity('shadow-' + d.id, lift); });
      explanation.setText(lift > 0 ? tr('Раскрываем известное z. Тень сохраняет прежние x,y.', 'Disclose the supplied z. The shadow retains the former x,y.') : tr('Камера меняет вид. Значения сохраняются.', 'The camera changes the view. Values remain fixed.'));
      control.input.value = state.tilt; control.output.textContent = Math.round(state.tilt * 100) + '%';
      Object.assign(v.root.dataset, { motionPhase: JSON.stringify(state), coordinateMode: 'supplied-feature-disclosure', lift: String(lift) });
    }
    driver = F.driver(state, paint); cameraDriver = F.driver(state, paint); ctx.onDispose(() => { driver.dispose(); cameraDriver.dispose(); }); paint();
    v.caption(tr('Сначала видны прежние x,y. Третьи значения уже заданы в данных.', 'Begin with the same x,y. Third values are already supplied in the data.'));
    ctx.step(() => { v.caption(tr('Поворачиваем только камеру. Точки пока остаются на плоскости.', 'Turn only the camera. Points remain on the plane for now.')); return cameraDriver.to({ tilt: 1 }, { duration: 2200 }); });
    ctx.step(() => { v.caption(tr('После остановки камеры вводим z и раскрываем известные значения.', 'Once the camera stops, introduce z and disclose its supplied values.')); return driver.to({ disclose: 1 }, { duration: 2600 }); });
    return v.root;
  });
  window.REPRESENTATION_JOURNEY = Object.freeze({ data: DATA, source: SOURCE });
})();
