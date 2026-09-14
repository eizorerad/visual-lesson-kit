(function () {
  'use strict';
  // Scalar toy measurements, in arbitrary units; no paper or fitted model.
  const ITEMS = [2, 4, 6, 8].map((value, i) => ({ id: 'S' + (i + 1), observed: value, predicted: value }));
  D.deck.register({ id: 'prediction-amplitude', chapter: 'Метрики и значения', title: 'Корреляция ещё не означает точность',
    qa: [
      { q: 'Почему Pearson равен 1, когда предсказания в полтора раза больше наблюдений?', a: 'Pearson сравнивает отклонения от среднего после деления на их длины. Положительный общий множитель сокращается. Здесь наблюдения [2, 4, 6, 8], а предсказания [3, 6, 9, 12]: связь линейная, но отдельные значения не совпадают.', source: 'Учебные числа ITEMS в эпизоде 9; формула центрированного Pearson в K.predictionComparison.' },
      { q: 'Что означает L2 и почему при нулевой амплитуде Pearson не определён?', a: 'L2 — корень из суммы квадратов четырёх разностей «предсказание − наблюдение». При амплитуде 1.5 это √30 ≈ 5.48, при нуле — √120 ≈ 10.95. У постоянного предсказания разброс равен нулю: знаменатель Pearson нулевой. Поэтому показываем «не определён», а не 0.', source: 'Те же четыре учебных наблюдения; прямой расчёт остаточных разностей, без статистического вывода.' }
    ],
    notes: [
      F.note('Четыре вымышленных скалярных измерения S1–S4: 2, 4, 6 и 8 условных единиц. Кружок показывает наблюдение, квадрат — предсказание для того же ID. Они разделены по высоте, чтобы оба оставались видимыми; численное значение задаёт только горизонтальная координата. Начальные предсказания точно совпадают с наблюдениями, поэтому Pearson равен 1, а L2 равен 0. Все четыре строки используют единую шкалу 0…12. Здесь нет данных статьи, обучения модели, контроля или скрытой нормировки.'),
      F.note('Каждое исходное предсказание умножено на 1.5: получились 3, 6, 9 и 12. Наблюдения остались на прежних местах; ID и горизонтальная шкала не изменились. Pearson по-прежнему равен 1, хотя все предсказания завышены. Это свойство центрированного Pearson при положительном масштабировании непостоянного ряда. L2 уже составляет √30, примерно 5.48 условных единиц. Метрики пересчитываются в каждом кадре по тем же текущим числам, которые задают положение квадратов, а не заранее по конечной цели движения.'),
      F.note('Отрезки остатков показывают четыре остатка: предсказание минус наблюдение. При амплитуде 1.5 остатки равны +1, +2, +3 и +4 условным единицам. Их квадраты дают 1 + 4 + 9 + 16 = 30, поэтому L2 равен √30. Это длина общего вектора ошибок, а не средняя ошибка и не RMSE: деления на число наблюдений нет. Для сравнения разных наборов важны одинаковые единицы и число наблюдений. Цвет и отрезки объясняют уже вычисленную метрику; они не добавляют новые данные.'),
      F.note('При амплитуде 0 все четыре предсказания равны нулю. Pearson не определён, поскольку у предсказаний нет разброса; показанное состояние нельзя называть корреляцией 0. L2 равен √120, примерно 10.95 условных единиц. Ползунок позволяет снова задать амплитуду от 0 до 1.5: при 1 совпадают отдельные значения и L2 становится нулём, а при любом положительном значении Pearson остаётся 1. Ползунок изменяет текущий авторский множитель, не оценивает параметры модели и не доказывает её способность обобщать.')
    ],
    build(ctx) {
      const v = F.stage(ctx, 'Корреляция ещё не означает точность', 'Шаблон 9 · одна шкала, две метрики', '4 учебных измерения · условные единицы · без модели и источника статьи');
      const stage = K.viewport(v.svg), state = { amplitude: 1, residuals: 0, controls: 0 };
      const chart = K.predictionComparison(stage, { items: ITEMS, domain: [0, 12], x: 180, y: 250, width: 500, height: 240 });
      F.dot(stage, 200, 182, 6, C.white); F.label(stage, 220, 182, 'наблюдение', 23, C.white, 'start');
      stage.append(D.dom.s('rect', { x: 419, y: 176, width: 12, height: 12, fill: C.blue }));
      F.label(stage, 449, 182, 'предсказание', 23, C.blue, 'start');
      F.label(stage, 744, 225, 'набл. / пред.', 19, C.grey);
      F.line(stage, 180, 521, 680, 521, C.grey, 1.3);
      [0, 3, 6, 9, 12].forEach(value => { const x = chart.xScale(value); F.line(stage, x, 515, x, 527, C.grey, 1.3); F.label(stage, x, 550, String(value), 22, C.grey); });
      F.label(stage, 430, 591, 'Значение · условные единицы', 23, C.grey);
      const amplitude = F.label(stage, 1020, 185, '', 26, C.blue);
      F.label(stage, 1020, 260, 'Pearson', 25, C.teal);
      const pearson = F.label(stage, 1020, 309, '', 39, C.teal); pearson.dataset.metric = 'pearson';
      F.label(stage, 1020, 387, 'L2 · усл. ед.', 25, C.gold);
      const l2 = F.label(stage, 1020, 435, '', 39, C.gold); l2.dataset.metric = 'l2';
      const formula = F.label(stage, 1020, 477, '√Σ(пред. − набл.)²', 22, C.gold);
      let driver;
      const slider = T.control(v.root, 'Амплитуда предсказаний', 0, 1.5, 1, .05, value => driver.set({ amplitude: value }), 870, 526, 304);
      function paint() {
        chart.setAmplitude(state.amplitude).showResiduals(state.residuals);
        const metrics = chart.metrics();
        amplitude.textContent = 'Амплитуда × ' + state.amplitude.toFixed(2);
        pearson.textContent = metrics.pearson === null ? 'не определён' : metrics.pearson.toFixed(2);
        pearson.setAttribute('font-size', metrics.pearson === null ? 29 : 39);
        pearson.dataset.value = String(metrics.pearson);
        l2.textContent = metrics.l2.toFixed(2); l2.dataset.value = String(metrics.l2);
        F.opacity(formula, state.residuals);
        F.opacity(slider.el, state.controls); slider.el.style.pointerEvents = state.controls > .99 ? 'auto' : 'none'; slider.input.disabled = state.controls < .99;
        slider.input.value = state.amplitude; slider.output.textContent = state.amplitude.toFixed(2);
        if (state.amplitude === 0) v.caption('Постоянное предсказание: Pearson не определён, ошибка остаётся измеримой.');
        else if (state.amplitude === 1) v.caption('Четыре пары значений совпадают. Pearson = 1, L2 = 0.');
        else if (state.controls > .99) v.caption('Верните амплитуду к 1, чтобы отдельные значения совпали.');
        else if (state.residuals > 0) v.caption('Отрезки остатков — разности. L2 собирает их квадраты в одно число.');
        else if (state.amplitude !== 1) v.caption('Предсказания меняются, Pearson остаётся равен 1. L2 замечает ошибку.');
        else v.caption('Четыре пары значений совпадают. Pearson = 1, L2 = 0.');
      }
      driver = F.driver(state, paint); if (ctx.onDispose) ctx.onDispose(driver.dispose); paint();
      ctx.step(() => driver.to({ amplitude: 1.5 }, { duration: 2100 }));
      ctx.step(() => driver.to({ residuals: 1 }, { duration: 1000 }));
      ctx.step(() => driver.to({ amplitude: 0, controls: 1 }, { duration: 2200 }));
      return v.root;
    }
  });
})();
