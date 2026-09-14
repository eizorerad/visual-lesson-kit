(function () {
  'use strict';
  // Explicit synthetic fixture. ORDER is supplied by the author, not computed clustering.
  const VALUES = [[2, -2, 1, -1], [-2, 2, -1, 1], [1, 1, -2, -2]];
  const ORDER = [2, 0, 1], DOMAIN = [-2, 2];
  D.deck.register({ id: 'matrix-identity', chapter: 'Матрица без подмены данных', title: 'Переставляем строки, сохраняем значения',
    qa: [
      { q: 'Изменилось ли значение R3, C2 после перестановки?', a: 'Нет. Оно по-прежнему равно +1. Переместилась та же ячейка; её число и правило цвета не менялись.', source: 'Учебная матрица VALUES в эпизоде 7; постоянные индексы K.heatmap.' },
      { q: 'Эта перестановка доказывает сходство или кластеризацию строк?', a: 'Нет. Порядок [R3, R1, R2] задан автором. Компонент отображает перестановку и не вычисляет расстояния или кластеры.', source: 'Явная константа ORDER и контракт K.heatmap.setOrder.' }
    ],
    notes: [
      F.note('Это учебная матрица из трёх строк и четырёх столбцов. Все двенадцать значений заданы явно в VALUES и не являются результатом научной статьи. Число и цвет внутри каждой ячейки относятся к одной паре исходных индексов, например R3 и C2. Общая цветовая шкала фиксирована от −2 до +2, середина равна нулю. Приём сохранения ячеек и подписей взят из матричных сцен CBIO7102; исходные экспрессионные данные, нормировки и результаты кластеризации сюда не переносились.'),
      F.note('Выделена строка R3. Она немного сдвигается вправо, чтобы за ней можно было проследить. Тусклые соседние строки не поменяли свои численные значения или функцию цвета: прозрачность здесь только обозначает внимание. Клетка матрицы R3,C2 хранит +1, как и раньше. Важно различать выделение объекта, изменение его экранной позиции и численное преобразование данных. На этом шаге ни нормировка, ни вычисление z-score не выполняются; мы лишь выбираем строку для следующего перемещения.'),
      F.note('Строка R3 становится первой. Сначала она целиком выходит вправо в свободную полосу. Затем R1 и R2 сдвигаются вниз, пока R3 поднимается на новую высоту; после этого R3 возвращается к общей сетке. Её ячейки и подпись не пересоздаются. Порядок [R3,R1,R2] задан константой ORDER. Это демонстрация перестановки, а не рассчитанная кластеризация: у компонента нет метода расстояния, дерева или научного вывода о сходстве этих строк. Все двенадцать исходных чисел остаются прежними.'),
      F.note('Теперь рамка сужается до исходной пары R3,C2 в её новом месте. Значение всё ещё +1, а функция цветовой шкалы та же. Перестановка помогает увидеть структуру или сопоставить строки, но сама по себе не создаёт новую величину и не подтверждает закономерность. Если автор настоящего урока хочет перейти к другой нормировке или другой цветовой шкале, это отдельная операция с отдельным объяснением. Этот пример показывает только сохранение идентичности, значений и фиксированного цветового смысла при перестановке.')
    ],
    build(ctx) {
      const v = F.stage(ctx, 'Переставляем строки, сохраняем значения', 'Шаблон 7 · матрица и заданный порядок', 'Учебная матрица 3 × 4 · шкала −2…+2 фиксирована');
      const stage = K.viewport(v.svg), state = { focus: 0, reorder: 0, inspect: 0 };
      const matrix = K.heatmap(stage, { values: VALUES, rowLabels: ['R1', 'R2', 'R3'], columnLabels: ['C1', 'C2', 'C3', 'C4'], domain: DOMAIN, x: 320, y: 300, cellWidth: 64, cellHeight: 46, gap: 10, labelSize: 24 });
      VALUES.forEach((row, r) => row.forEach((value, c) => F.label(matrix.rowGroups[r], c * 74 + 32, 23, (value > 0 ? '+' : '') + value, 22, Math.abs(value) === 2 ? 'var(--color-bg)' : C.white)));
      F.label(stage, 640, 192, 'Каждая ячейка хранит одно число', 29, C.white);
      const frame = D.dom.s('rect', { x: 316, y: 408, width: 294, height: 54, fill: 'none', stroke: C.gold, 'stroke-width': 2 }); stage.append(frame);
      const readout = F.group(stage);
      F.label(readout, 975, 322, 'R3 · C2', 29, C.white);
      F.label(readout, 975, 377, '+1', 48, C.gold);
      F.label(readout, 975, 434, 'то же значение', 26, C.grey);
      const legend = F.group(stage), legendX = 350, legendY = 540, legendWidth = 240;
      for (let i = 0; i < 40; i++) legend.append(D.dom.s('rect', { x: legendX + i * legendWidth / 40, y: legendY, width: legendWidth / 40 + .1, height: 12, fill: matrix.colorScale(-2 + 4 * i / 39) }));
      [-2, 0, 2].forEach((value, i) => F.label(legend, legendX + i * legendWidth / 2, 581, (value > 0 ? '+' : '') + value, 22, C.grey));
      function paint() {
        const middle = F.clamp((state.reorder - .25) / .5);
        matrix.setOrder({ rows: ORDER, columns: [0, 1, 2, 3] }, middle);
        const outward = F.clamp(state.reorder / .25), inward = F.clamp((state.reorder - .75) / .25);
        const offset = state.reorder === 0 ? 20 * state.focus : F.lerp(20, 360, outward) * (1 - inward);
        matrix.setRowOffset(2, offset, 0);
        matrix.setSelection(state.focus === 0 ? {} : state.inspect > .5 ? { row: 2, column: 1 } : { row: 2 });
        const origin = matrix.position(2, 0), selected = matrix.position(2, 1);
        frame.setAttribute('x', F.lerp(origin.x - 4, selected.x - 4, state.inspect));
        frame.setAttribute('y', origin.y - 4); frame.setAttribute('width', F.lerp(294, 72, state.inspect));
        F.opacity(frame, state.focus); F.opacity(readout, state.inspect); F.at(readout, 40 * (1 - state.inspect), 0);
        v.root.dataset.selectedValue = String(VALUES[2][1]);
      }
      v.caption('Положение и цвет помогают читать матрицу. Начнём с самих значений.'); paint();
      F.step(ctx, v, state, { focus: 1 }, paint, 'Следим за строкой R3: четыре прежних значения.', 1400);
      F.step(ctx, v, state, { reorder: 1 }, paint, 'R3 выходит в свободную полосу, меняет высоту и возвращается первой.', 2800);
      F.step(ctx, v, state, { inspect: 1 }, paint, 'R3,C2 по-прежнему равна +1. Перестановка не является нормировкой.', 1700);
      return v.root;
    }
  });
})();
