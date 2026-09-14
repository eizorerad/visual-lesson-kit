(function () {
  'use strict';
  // EDIT: each entry is a separately measured replicate; these are synthetic.
  const GROUPS = [{ label: 'A', values: [4, 5, 6], color: 'var(--color-text)' }, { label: 'B', values: [1, 5, 9], color: 'var(--color-text)' }];
  const DOMAIN = [0, 10];
  D.deck.register({ id: 'replicates-and-means', chapter: 'Показываем повторные измерения', title: 'Одинаковое среднее, разный разброс', qa: [
    {q:'Отрезок диапазона — доверительный интервал?',a:'<p>Он показывает минимум и максимум наблюдаемых значений. Это диапазон, а не доверительный интервал, стандартное отклонение или стандартная ошибка.</p>',source:'Определение показателя в этом примере'},
    {q:'Почему недостаточно показать два средних?',a:'<p>У групп одинаковое среднее 5, но наборы 4, 5, 6 и 1, 5, 9 заметно различаются. Отдельные точки позволяют увидеть различие, которое среднее скрывает.</p>',source:'Придуманные значения галереи'}
  ], notes: [
    F.note('Здесь две группы по три придуманных повторных измерения. В A заданы 4, 5 и 6, в B — 1, 5 и 9 условных единиц. Первоначально они лежат в строках для чтения списка; высота строк ещё не обозначает значение. Это демонстрация компонента, а не результат эксперимента. При настоящем анализе нужно указать, что означает повтор: независимый образец, культура, животное или повтор измерения того же материала. Эти уровни нельзя автоматически считать взаимозаменяемыми.'),
    F.note('Каждый кружок занимает высоту по одной и той же шкале от нуля до десяти. Горизонтальные смещения внутри группы только разделяют отдельные повторы и ничего не измеряют. Кружки не исчезают при переходе к сводным показателям. Масштаб фиксирован для обеих групп: нельзя независимо растянуть каждую, чтобы сделать различия выразительнее. Компонент проверяет, что все значения входят в заданный диапазон, и сообщает об ошибке вместо молчаливого обрезания наблюдений.'),
    F.note('Отрезок среднего появляется на арифметическом среднем каждой группы: (4+5+6)/3 = 5 и (1+5+9)/3 = 5. Он растёт на фиксированной правильной высоте, а не перемещается через ложные промежуточные значения. Все шесть наблюдений сохраняются. Среднее одинаково, однако индивидуальные значения уже показывают различный разброс. Эти три учебных повтора не позволяют сами по себе сделать вывод о статистической значимости, устойчивости эффекта или распределении всей популяции.'),
    F.note('Рядом с каждой группой раскрывается отрезок от её минимального до максимального наблюдения. В A это диапазон 4–6, в B — 1–9. Это наблюдаемый диапазон, а не стандартное отклонение, стандартная ошибка или доверительный интервал. Название показателя на сцене предотвращает смешение этих величин. Сводный показатель должен дополнять отдельные измерения, а не скрывать их. Для другого типа интервала автор обязан вычислить и подписать именно его, сохраняя общий числовой масштаб.')
  ], build(ctx) {
    const v = F.stage(ctx, 'Одинаковое среднее, разный разброс', 'Шаблон 3 · точки, средние и наблюдаемый диапазон', 'A: 4, 5, 6 · B: 1, 5, 9 · все числа учебные');
    const stage = K.viewport(v.svg), state = { measured: 0, means: 0, spread: 0 };
    const chart = K.replicates(stage, { groups: GROUPS, domain: DOMAIN, x: 260, y: 236, width: 760, height: 280 });
    const positions = chart.points.map(node => ({ x: +node.getAttribute('cx'), y: +node.getAttribute('cy') }));
    const numbers = chart.points.map((node, i) => F.label(stage, positions[i].x, 479, node.dataset.value, 22, C.grey));
    const axis = F.group(stage); F.line(axis, 210, 516, 210, 236, C.grey, 2);
    [0, 5, 10].forEach(n => { F.line(axis, 204, chart.yScale(n), 216, chart.yScale(n), C.grey, 1.5); F.label(axis, 185, chart.yScale(n), String(n), 23, C.grey, 'end'); });
    F.label(axis, 149, 198, 'Усл. ед.', 24, C.grey);
    const means = [], ranges = [];
    GROUPS.forEach((group, i) => {
      const x = chart.xScale(i + .5);
      F.label(stage, x, 562, 'Группа ' + group.label, 27, C.white);
      const mean = chart.meanValues[i];
      means.push(F.label(stage, x + 100, chart.yScale(mean), 'Среднее ' + String(mean).replace('.', ','), 24, C.gold));
      const line = F.line(stage, x - 105, chart.yScale(mean), x - 105, chart.yScale(mean), C.teal, 3);
      const caps = [F.line(stage, x - 112, 0, x - 98, 0, C.teal, 2), F.line(stage, x - 112, 0, x - 98, 0, C.teal, 2)];
      ranges.push({ line, caps, x });
    });
    const rangeLabel = F.label(stage, 640, 189, 'От минимума до максимума · не доверительный интервал', 25, C.teal);
    function paint() {
      const move = F.clamp((state.measured - .2) / .8);
      chart.points.forEach((node, i) => F.pos(node, positions[i].x, F.lerp(442, positions[i].y, move)));
      numbers.forEach(node => F.opacity(node, 1 - F.clamp(state.measured / .2)));
      F.opacity(axis, F.clamp((state.measured - .2) / .4));
      chart.setProgress(state.means); means.forEach(node => F.opacity(node, state.means));
      ranges.forEach((range, i) => {
        const low = chart.yScale(Math.min(...GROUPS[i].values)), high = chart.yScale(Math.max(...GROUPS[i].values)), middle = chart.yScale(chart.meanValues[i]);
        const a = F.lerp(middle, low, state.spread), b = F.lerp(middle, high, state.spread);
        F.seg(range.line, range.x - 105, a, range.x - 105, b);
        range.caps.forEach((cap, j) => { F.seg(cap, range.x - 112, j ? b : a, range.x - 98, j ? b : a); F.opacity(cap, state.spread); });
        F.opacity(range.line, state.spread);
      });
      F.opacity(rangeLabel, state.spread);
    }
    v.caption('Две группы повторов. Сначала читаем сами значения.'); paint();
    F.step(ctx, v, state, { measured: 1 }, paint, 'Все повторы занимают высоту по одной общей шкале.', 2200);
    F.step(ctx, v, state, { means: 1 }, paint, 'Среднее в обеих группах равно 5. Отдельные измерения остаются видимы.', 1600);
    F.step(ctx, v, state, { spread: 1 }, paint, 'Наблюдаемый диапазон различается: 4–6 и 1–9.', 1700);
    return v.root;
  } });
})();
