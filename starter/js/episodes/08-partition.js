(function () {
  'use strict';
  // The same twelve synthetic observations; roles change, identities do not.
  const ITEMS = Array.from({ length: 12 }, (_, i) => ({ id: 'S' + (i + 1), label: 'S' + (i + 1) }));
  const ALL = ITEMS.map(item => item.id), RESERVED = ALL.slice(8), BUILD = ALL.slice(0, 4), UNUSED = ALL.slice(4, 8);
  const INITIAL = { all: ALL }, HELD = { all: ALL.slice(0, 8), reserve: RESERVED };
  const SPLIT = { build: BUILD, unused: UNUSED, reserve: RESERVED }, TESTING = { build: BUILD, unused: UNUSED, test: RESERVED };
  D.deck.register({ id: 'partition-observations', chapter: 'Разделение и проверка', title: 'Резерв не участвует в построении',
    qa: [
      { q: 'Какие наблюдения используются для проверки и были ли они в рабочей группе?', a: 'S9–S12. В этой явной схеме они отложены заранее и не входят в группу построения S1–S4.', source: 'Учебные списки RESERVED, BUILD и TESTING в эпизоде 8.' },
      { q: 'Непересекающиеся списки автоматически означают статистическую независимость?', a: 'Нет. Компонент проверяет только идентификаторы и роли. Независимость зависит от устройства эксперимента и связей между наблюдениями.', source: 'Контракт K.partitionActors: проверка состава, а не модели вероятностей.' }
    ],
    notes: [
      F.note('Перед нами двенадцать учебных наблюдений S1–S12. Кружок обозначает ровно одно наблюдение; скрытых весов или округления количества здесь нет. Это схема планирования работы с данными, а не данные статьи, новые клетки или результаты модели. Приём отделения резерва от построения заимствован из курсовой презентации CBIO7102. В универсальном компоненте каждой исходной записи соответствует постоянный SVG-объект, а её роль определяется явным списком идентификаторов. Все дальнейшие шаги сохраняют исходный набор из двенадцати записей.'),
      F.note('Четыре наблюдения S9–S12 заранее уходят в резерв. Остальные восемь остаются доступными. Резервная группа отделена по идентификаторам, а не выбрана по красивому результату на экране. Это визуальная схема: она не утверждает, что наблюдения получены независимо или от разных биологических образцов. Такой вопрос зависит от экспериментального дизайна. Компонент проверяет более узкое условие: каждый исходный идентификатор записан ровно в одной группе, никто не потерян и не посчитан дважды.'),
      F.note('Для построения выбран набор S1–S4. S5–S8 в этом примере не используются; они остаются видимыми, чтобы общий счёт сходился. S9–S12 остаются в резерве. Получились три непересекающиеся группы по четыре наблюдения. Перемещение меняет роль и экранное расположение тех же объектов, но не их идентичность. Здесь не обучается модель и не вычисляется качество. Автор настоящего урока должен отдельно определить, что строится по рабочей группе, как выбран размер и почему такой способ разделения подходит к задаче.'),
      F.note('Теперь резерв S9–S12 перемещается в область проверки. Это те же четыре записи, а не новая случайная выборка. Рабочие S1–S4 остаются отдельно; S5–S8 по-прежнему не используются. Схема показывает соблюдение объявленной границы между построением и проверкой, но не гарантирует отсутствие всех утечек данных: общие доноры, связанные образцы, предварительная настройка или повторное использование теста требуют отдельного рассмотрения. Слово «проверка» обозначает роль данных; этот компонент не выдаёт метрику и не доказывает независимость.')
    ],
    build(ctx) {
      const v = F.stage(ctx, 'Резерв не участвует в построении', 'Шаблон 8 · постоянные наблюдения и явные роли', '12 учебных наблюдений · по одному кружку на запись · без случайной выборки');
      const stage = K.viewport(v.svg), state = { reserve: 0, build: 0, test: 0 };
      const chart = K.partitionActors(stage, { items: ITEMS, initialGroup: 'all', radius: 11, labelSize: 19, groups: {
        all: { x: 280, y: 278, columns: 4, dx: 75, dy: 72, color: C.white },
        reserve: { x: 230, y: 526, columns: 4, dx: 75, dy: 72, color: C.gold },
        build: { x: 790, y: 278, columns: 4, dx: 75, dy: 72, color: C.teal },
        unused: { x: 790, y: 470, columns: 4, dx: 75, dy: 72, color: C.grey },
        test: { x: 230, y: 350, columns: 4, dx: 75, dy: 72, color: C.gold }
      } });
      const allLabel = F.label(stage, 392, 218, '12 наблюдений', 28, C.white);
      const reserveLabel = F.label(stage, 342, 480, 'Резерв · 4', 28, C.gold);
      const reserveFrame = D.dom.s('rect', { x: 204, y: 503, width: 278, height: 68, fill: 'none', stroke: C.gold, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }); stage.prepend(reserveFrame);
      const buildLabel = F.label(stage, 902, 218, 'Построение · 4', 28, C.teal);
      const unusedLabel = F.label(stage, 902, 421, 'Не используем · 4', 27, C.grey);
      const total = F.label(stage, 640, 595, 'Всего 12 · каждый ID ровно в одной группе', 23, C.grey);
      function paint() {
        if (state.test > 0) chart.setPartition(TESTING, state.test, { from: SPLIT });
        else if (state.build > 0) chart.setPartition(SPLIT, state.build, { from: HELD });
        else if (state.reserve > 0) chart.setPartition(HELD, state.reserve, { from: INITIAL });
        else chart.setPartition(INITIAL);
        allLabel.textContent = state.reserve > .8 ? 'Осталось 8' : '12 наблюдений';
        F.opacity(allLabel, 1 - F.clamp(state.build * 2));
        // Destination labels enter after the travelling observations clear them.
        const reserveArrival = F.clamp((state.reserve - .85) / .15);
        F.opacity(reserveLabel, reserveArrival); F.opacity(reserveFrame, reserveArrival);
        const yy = F.lerp(526, 350, state.test);
        reserveFrame.setAttribute('y', yy - 23); reserveLabel.setAttribute('y', yy - 46);
        reserveLabel.textContent = state.test > .55 ? 'Проверка · 4' : 'Резерв · 4';
        F.opacity(buildLabel, F.clamp((state.build - .85) / .15)); F.opacity(unusedLabel, F.clamp((state.build - .85) / .15));
        v.root.dataset.partitionCount = String(Object.values(chart.counts).reduce((a, b) => a + b, 0));
      }
      v.caption('Все двенадцать наблюдений видны до разделения.'); paint();
      F.step(ctx, v, state, { reserve: 1 }, paint, 'S9–S12 уходят в резерв. Их не берём для построения.', 2200);
      F.step(ctx, v, state, { build: 1 }, paint, 'Четыре для построения, четыре не используем, четыре остаются в резерве.', 2400);
      F.step(ctx, v, state, { test: 1 }, paint, 'Проверяем на прежнем резерве. Разделение ID само по себе не доказывает независимость.', 1900);
      return v.root;
    }
  });
})();
