/* Authored example extracted from the library standalone lesson; current runtime is supplied by create.py. */
(function () {
  'use strict';
  const GROUPS = [
    { label: 'A', values: [3, 4, 5], color: C.blue },
    { label: 'B', values: [1, 4, 7], color: C.teal }
  ];
  D.deck.register({
    id: 'mean-and-spread',
    chapter: 'Что скрывает одно число',
    title: 'Почему среднего недостаточно?',
    qa: [
  {
    "q": "Почему средние совпадают, если группы различаются?",
    "a": "В каждой группе сумма трёх значений равна 12, поэтому среднее равно 4. Среднее задаёт центр и не определяет разброс значений.",
    "source": "Явные учебные наборы A = [3, 4, 5] и B = [1, 4, 7]."
  },
  {
    "q": "Являются ли отрезки доверительными интервалами?",
    "a": "Нет. Отрезки соединяют наблюдаемые минимум и максимум. Их длины равны 2 и 6 условным единицам; это размахи данных, а не оценка неопределённости среднего.",
    "source": "Определение размаха: максимум минус минимум учебного набора."
  }
],
    notes: [
      F.note('Каждая точка — одно отдельное учебное наблюдение, а не среднее. В группе A заданы значения 3, 4 и 5, в группе B — 1, 4 и 7 условных единиц. Данные придуманы для этого урока. Вертикальная шкала от 0 до 8 общая и остаётся неизменной; небольшие горизонтальные смещения лишь разделяют точки. Посмотрите, насколько близко друг к другу лежат значения каждой группы.'),
      F.note('Сложим значения внутри каждой группы: в обоих случаях получаем 12. Разделим на три наблюдения: (3 + 4 + 5) / 3 = 4 и (1 + 4 + 7) / 3 = 4. Лавандовая отметка показывает это общее арифметическое среднее. Точки остаются на местах: одно число сообщает о центре данных, но не перечисляет сами наблюдения.'),
      F.note('В группе A минимальное и максимальное значения равны 3 и 5: размах 5 − 3 = 2 условные единицы. В группе B это 1 и 7: размах 7 − 1 = 6 условных единиц. Размах B втрое больше, хотя средние совпадают. Вертикальные отрезки показывают только наблюдаемый диапазон min…max; это не стандартное отклонение и не доверительный интервал. Для этих учебных наборов вывод прост: чтобы увидеть разброс, нужно смотреть на отдельные значения или подходящий показатель разброса вместе со средним.')
    ],
    build(ctx) {
      const v = F.stage(ctx, 'Почему среднего недостаточно?', 'Один центр · два разных набора', 'Придуманные наблюдения · условные единицы · внешнего источника нет');
      const stage = K.viewport(v.svg);
      const state = { means: 0, spread: 0 };
      const chart = K.replicates(stage, {
        groups: GROUPS, domain: [0, 8], x: 260, y: 236, width: 760, height: 280
      });
      const axis = F.group(stage);
      F.line(axis, 210, chart.yScale(0), 210, chart.yScale(8), C.grey, 2);
      [0, 2, 4, 6, 8].forEach(value => {
        F.line(axis, 203, chart.yScale(value), 216, chart.yScale(value), C.grey, 1.5);
        F.label(axis, 184, chart.yScale(value), String(value), 23, C.grey, 'end');
      });
      F.label(stage, 160, 193, 'Усл. ед.', 24, C.grey);
      chart.points.forEach(point => {
        const label = F.label(stage, +point.getAttribute('cx') + 14, +point.getAttribute('cy') - 14, point.dataset.value, 25, C.white, 'start');
        label.dataset.observationValue = point.dataset.value;
      });
      const meanLabels = [], ranges = [];
      GROUPS.forEach((group, i) => {
        const x = chart.xScale(i + 0.5), mean = chart.meanValues[i];
        const low = Math.min(...group.values), high = Math.max(...group.values);
        F.label(stage, x, 558, 'Группа ' + group.label, 28, group.color);
        const meanLabel = F.label(stage, x + 95, chart.yScale(mean) + 29, 'Среднее ' + mean, 24, C.gold);
        meanLabel.dataset.displayedMean = String(mean); meanLabels.push(meanLabel);
        const range = F.line(stage, x - 105, chart.yScale(mean), x - 105, chart.yScale(mean), group.color, 3);
        range.setAttribute('stroke-linecap', 'butt');
        range.dataset.rangeMin = String(low); range.dataset.rangeMax = String(high);
        const caps = [0, 1].map(() => F.line(stage, x - 112, chart.yScale(mean), x - 98, chart.yScale(mean), group.color, 2));
        const label = F.label(stage, x, 593, 'Размах: ' + high + ' − ' + low + ' = ' + (high - low), 24, group.color);
        label.dataset.displayedRange = String(high - low);
        ranges.push({ x, range, caps, label, low, high, mean });
      });
      const rangeTitle = F.label(stage, 680, 185, 'Диапазон от минимума до максимума', 26, C.white);
      function paint() {
        chart.setProgress(state.means);
        meanLabels.forEach(label => F.opacity(label, state.means));
        ranges.forEach(item => {
          const lowY = F.lerp(chart.yScale(item.mean), chart.yScale(item.low), state.spread);
          const highY = F.lerp(chart.yScale(item.mean), chart.yScale(item.high), state.spread);
          F.seg(item.range, item.x - 105, lowY, item.x - 105, highY);
          item.caps.forEach((cap, i) => {
            const y = i ? highY : lowY;
            F.seg(cap, item.x - 112, y, item.x - 98, y); F.opacity(cap, state.spread);
          });
          F.opacity(item.range, state.spread); F.opacity(item.label, state.spread);
        });
        F.opacity(rangeTitle, state.spread);
      }
      T.evidence(v.root, {
        title: 'Учебные данные', buttonLabel: 'О данных', url: '',
        html: '<p>Придуманные наборы: A = [3, 4, 5], B = [1, 4, 7]. Каждая точка — отдельное наблюдение в условных единицах.</p><p>Средние: 12 / 3 = 4. Наблюдаемый размах: A = 2, B = 6. Урок не использует статью или внешние данные.</p>'
      });
      v.caption('Каждая точка — отдельное наблюдение. Сравните две группы на общей шкале.');
      paint();
      F.step(ctx, v, state, { means: 1 }, paint, 'Сумма 12, наблюдений 3: среднее равно 4 в обеих группах.', 1500);
      F.step(ctx, v, state, { spread: 1 }, paint, 'Среднее совпадает, но размах в B втрое больше: 6 против 2.', 1700);
      return v.root;
    }
  });
})();
