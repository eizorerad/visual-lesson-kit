/* Illustrative independent observations; exact calculations, persistent operations. */
(function () {
  'use strict';
  const VALUES = [2, 3, 4, 7, 8, 9], OBS = VALUES.map((value, i) => ({ id: 'D' + (i + 1), value }));
  const STRINGS = {};
  function tr(ru, en) { if (!Object.hasOwn(STRINGS, ru)) { STRINGS[ru] = en; D.i18n.pack('en', { strings: { [ru]: en } }); } return ru; }
  function words(parent, id, x, y, width, height, ru, en, size = 25, color = C.white) { return L.textBox(parent, { id, x, y, width, height, text: tr(ru, en), size, color, padding: 5, align: 'center', valign: 'middle' }); }
  function register(id, title, notes, question, answer, source, build) {
    tr(((window.LESSON && LESSON.source && LESSON.source.label) || 'Источник') + ' · ' + source[0], 'Source · ' + source[0]);
    D.i18n.pack('en', { notes: { [id]: notes.map(n => F.note(n[1], source[0], source[1])) }, qa: { [id]: [{ q: question[1], a: answer[1], source: source[0], url: source[1] }] } });
    D.deck.register({ id, title: tr(...title), chapter: tr('Статистические операции', 'Statistical operations'), notes: notes.map(n => F.note(n[0], source[0], source[1])), qa: [{ q: question[0], a: answer[0], source: source[0], url: source[1] }], build });
  }
  const SOURCE_SD = ['NIST: SD, standard-error and interval plots', 'https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/i_plot.htm'];
  const SOURCE_PERM = ['SciPy: permutation_test', 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html'];
  const SOURCE_BH = ['R: p.adjust', 'https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html'];
  const provenance = () => tr('Иллюстративные данные · независимые единицы · условные единицы', 'Illustrative data · independent units · arbitrary units');
  register('stats-spread', ['Разброс и точность среднего', 'Spread and precision of the mean'], [
    ['Шесть придуманных независимых наблюдений: 2, 3, 4, 7, 8, 9. Их среднее равно 5.5. Имена D1–D6 сохраняются. Вертикальная шкала фиксирована: 0–11 условных единиц.', 'Six invented independent observations: 2, 3, 4, 7, 8, 9. Their mean is 5.5. IDs D1–D6 persist. The vertical scale stays fixed at 0–11 arbitrary units.'],
    ['От линии среднего к каждой точке растёт отрезок отклонения x−mean. Сумма знаковых отклонений равна нулю; это не означает отсутствие разброса.', 'A residual segment grows from the mean to each observation: x−mean. Signed residuals sum to zero; that does not imply no spread.'],
    ['Сторона каждого квадрата равна модулю отклонения на общей шкале. Сумма квадратов 41.5; делим на n−1=5 и извлекаем корень: SD≈2.881. SEM=SD/√6≈1.176. SD описывает разброс наблюдений. SEM оценивает стандартное отклонение среднего при независимых одинаково распределённых единицах и конечной дисперсии. Полосы ±1 SD и ±1 SEM не являются 95% интервалами. Ползунок меняет иллюстративный разброс при постоянном среднем.', 'Each square’s side is the absolute residual on the shared scale. The squared residuals sum to 41.5; divide by n−1=5 and take the square root: SD≈2.881. SEM=SD/√6≈1.176. SD describes observation spread. SEM estimates the sampling SD of the mean for independent identically distributed units with finite variance. Bars ±1 SD and ±1 SEM are not 95% intervals. The slider changes illustrative spread while the mean remains fixed.']
  ], ['Можно ли заменить число независимых проб числом клеток?', 'Can the number of cells replace the number of independent samples?'], ['Нет. Формула SEM относится к независимым единицам анализа. Коррелированные клетки одного донора не увеличивают число независимых доноров. Для бутстрепа единиц используйте уже имеющийся K.resampleMean с явно обозначенными копиями.', 'No. The SEM formula concerns independent analysis units. Correlated cells from one donor do not increase the number of independent donors. For bootstrapping units, reuse K.resampleMean with explicitly labeled copies.'], SOURCE_SD, ctx => {
    const v = F.stage(ctx, tr('Разброс и точность среднего', 'Spread and precision of the mean'), '', provenance()), stage = K.viewport(v.svg);
    const chart = K.sampleSpread(stage, { observations: OBS, domain: [0, 11], x: 115, y: 265, width: 650, height: 150 });
    words(stage, 'stats-spread-data', 105, 153, 1070, 50, 'Иллюстрация · n = 6 независимых наблюдений', 'Illustration · n = 6 independent observations', 27);
    words(stage, 'stats-spread-unit', 145, 197, 595, 38, 'Значение по вертикали · условные единицы', 'Value on the vertical axis · arbitrary units', 21, C.grey);
    const readout = words(stage, 'stats-spread-readout', 870, 213, 305, 226, '', '', 23);
    words(stage, 'stats-spread-horizontal-axis', 125, 568, 665, 44, 'Полосы: та же величина по горизонтали, 0–11', 'Bars: the same quantity horizontally, 0–11', 20, C.grey);
    const definition = words(stage, 'stats-spread-definition', 875, 446, 300, 86, 'SD: разброс данных\nSEM: точность среднего', 'SD: data spread\nSEM: precision of the mean', 23);
    let driver;
    const state = { operation: 0, spread: 1 };
    const control = T.control(v.root, tr('Разброс данных', 'Data spread'), .2, 1.3, 1, .01, value => driver.set({ spread: value }), 880, 548, 295);
    function paint() {
      chart.setValues(VALUES.map(value => 5.5 + (value - 5.5) * state.spread)).setProgress(state.operation);
      const s = chart.snapshot().summary;
      if (state.operation < .5) readout.setText(tr('Среднее = ' + s.mean.toFixed(2) + '\nr = x − mean\nΣr = 0', 'Mean = ' + s.mean.toFixed(2) + '\nr = x − mean\nΣr = 0'));
      else { const tail = '\nΣr² = ' + s.sumSquares.toFixed(2) + '\nSD = √(Σr²/5)\nSD = ' + s.sd.toFixed(3) + '\nSEM = SD/√6\nSEM = ' + s.sem.toFixed(3); readout.setText(tr('Среднее = ' + s.mean.toFixed(2) + tail, 'Mean = ' + s.mean.toFixed(2) + tail)); }
      F.opacity(definition.el, state.operation > .5 ? 1 : 0); control.input.value = state.spread; control.output.textContent = state.spread.toFixed(2) + '×';
      v.root.dataset.motionPhase = JSON.stringify(state);
    }
    driver = F.driver(state, paint); ctx.onDispose(driver.dispose); paint();
    v.caption(tr('Шесть наблюдений и их среднее. Все значения учебные.', 'Six observations and their mean. All values are illustrative.'));
    ctx.step(() => { v.caption(tr('Отклонения растут от среднего к наблюдениям.', 'Residuals grow from the mean to the observations.')); return driver.to({ operation: .5 }, { duration: 1800 }); });
    ctx.step(() => { v.caption(tr('Квадраты дают SD. Деление на √n даёт SEM; это не 95% интервал.', 'Squares yield SD. Dividing by √n yields SEM; this is not a 95% interval.')); return driver.to({ operation: 1 }, { duration: 2200 }); });
    return v.root;
  });
  register('stats-permutation', ['Переставляем группы, сохраняя данные', 'Reassign groups, preserve the data'], [
    ['Иллюстративные группы A={2,3,4} и B={7,8,9}, по три независимых наблюдения. T=mean(A)−mean(B)=−5. Перестановка допустима при обменности меток под нулевой гипотезой; один лишь факт равных средних этого не гарантирует. Парные, блочные и кластерные дизайны требуют другого пространства перестановок.', 'Illustrative groups A={2,3,4} and B={7,8,9}, with three independent observations each. T=mean(A)−mean(B)=−5. Label permutation requires exchangeability under the null; equal means alone do not guarantee it. Paired, blocked and clustered designs need another permutation space.'],
    ['Наблюдения переходят между дорожками A и B. Их ID, значения и горизонтальная шкала сохраняются. Каждое исходное наблюдение используется ровно один раз; это не бутстреп с возвращением.', 'Observations move between lanes A and B. IDs, values and the horizontal scale persist. Every source observation is used exactly once; this is not bootstrap resampling with replacement.'],
    ['Перебираем все C(6,3)=20 назначений, включая исходное. В распределении каждый кружок соответствует одному назначению. Ровно два дают |T|≥5; точное двустороннее p=2/20=0.1. Здесь двусторонность определена через |T|, а не через удвоение меньшего хвоста; при асимметричном распределении определения могут различаться. Показанный p относится к полному перебору, а не к текущему числу раскрытых кружков.', 'Enumerate all C(6,3)=20 assignments, including the observed one. Each dot in the distribution represents one assignment. Exactly two have |T|≥5; the exact two-sided p is 2/20=0.1. Two-sided here means absolute T, rather than twice the smaller tail; those definitions can differ for asymmetric distributions. The displayed p concerns full enumeration, not the number of dots disclosed so far.']
  ], ['Почему точное p не равно нулю?', 'Why can the exact p not be zero?'], ['Исходное назначение входит в полный перебор и удовлетворяет сравнению с равенством. Перестановочное p — вероятность столь же или более крайней статистики при принятой нулевой модели, а не вероятность истинности нулевой гипотезы.', 'The observed assignment is included in the exhaustive enumeration and qualifies under the inclusive comparison. The permutation p value is a probability of a statistic this extreme or more extreme under the chosen null model, not the probability that the null hypothesis is true.'], SOURCE_PERM, ctx => {
    const v = F.stage(ctx, tr('Переставляем группы, сохраняя данные', 'Reassign groups, preserve the data'), '', provenance()), stage = K.viewport(v.svg);
    words(stage, 'stats-perm-data', 120, 153, 1050, 50, 'Иллюстрация · обменность меток под H₀', 'Illustration · labels exchangeable under H₀', 27);
    words(stage, 'stats-perm-axis', 140, 197, 620, 42, 'Значение наблюдения · условные единицы', 'Observation value · arbitrary units', 21, C.grey);
    const chart = K.permutationView(stage, { observations: OBS, groupSize: 3, domain: [0, 10], x: 115, y: 267, width: 650, height: 230 });
    words(stage, 'stats-perm-null-axis', 150, 522, 620, 42, 'Распределение T = mean(A) − mean(B)', 'Distribution of T = mean(A) − mean(B)', 21, C.grey);
    const readout = words(stage, 'stats-perm-readout', 864, 255, 325, 208, '', '', 26);
    let driver; const state = { progress: 0 };
    const control = T.control(v.root, tr('Назначение групп', 'Group assignment'), 0, 19, 0, 1, value => driver.set({ progress: value / 19 }), 865, 544, 310);
    function paint() {
      chart.setProgress(state.progress); const s = chart.snapshot(), a = s.model.assignments[s.assignment];
      const ru = (s.transition.moving ? 'Переход → ' : 'Назначение ') + (s.assignment + 1) + (s.transition.moving ? '/20\nЦель: T = ' : '/20\nT = ') + a.statistic.toFixed(2) + '\nПолный перебор:\n|T| ≥ 5: 2/20\np = 0.100';
      const en = (s.transition.moving ? 'Moving → ' : 'Assignment ') + (s.assignment + 1) + (s.transition.moving ? '/20\nTarget: T = ' : '/20\nT = ') + a.statistic.toFixed(2) + '\nFull enumeration:\n|T| ≥ 5: 2/20\np = 0.100';
      readout.setText(tr(ru, en)); control.input.value = s.assignment; control.output.textContent = (s.assignment + 1) + '/20'; v.root.dataset.motionPhase = JSON.stringify(state);
    }
    driver = F.driver(state, paint); ctx.onDispose(driver.dispose); paint();
    v.caption(tr('Исходное назначение: средние 3 и 8; разность −5.', 'Observed assignment: means 3 and 8; difference −5.'));
    ctx.step(() => { v.caption(tr('Меняем принадлежность к группе. Значения и имена сохраняются.', 'Change group membership. Values and IDs persist.')); return driver.to({ progress: 1 / 19 }, { duration: 2000 }); });
    ctx.step(() => { v.caption(tr('Все 20 назначений: два столь же крайних. Точное p = 0.1.', 'All 20 assignments: two are as extreme. Exact p = 0.1.')); return driver.to({ progress: 1 }, { duration: 6500 }); });
    return v.root;
  });
  register('stats-bh', ['BH: сортировка и общий порог', 'BH: ranking and a shared cutoff'], [
    ['Шесть иллюстративных p-значений принадлежат заранее определённому семейству гипотез. Их исходные имена H1–H6 не меняются. Ползунок задаёт целевой уровень FDR q, а не вероятность ошибки отдельной гипотезы.', 'Six illustrative p values belong to a prespecified family of hypotheses. Their original IDs H1–H6 persist. The slider sets the target FDR level q, not the error probability of one hypothesis.'],
    ['Именованные гипотезы физически переходят в порядок возрастания p. Во время движения компактные ID используют отдельные дорожки; затем возвращаются числовые столбцы. Перестановка строк не меняет ни одно p-значение.', 'Named hypotheses physically move into ascending p order. During movement compact IDs use separate lanes; the numerical columns then return. Reordering rows changes no p value.'],
    ['BH находит максимальный ранг k с p(k)≤qk/m и отвергает весь префикс 1…k. При q=.05 здесь k=3. Скорректированные p вычисляются обратным накопленным минимумом min(1,min[j≥i] m p(j)/j), затем возвращаются к исходным ID. Для этих данных: .006,.036,.038,.0615,.24,.65 в порядке H1…H6. Контроль FDR относится к ожидаемой доле ложных открытий среди отвергнутых гипотез (ноль при отсутствии отвержений). Классический BH обоснован для независимых тестов и при определённых видах положительной зависимости; произвольная зависимость требует иных условий/поправок.', 'BH finds the largest rank k with p(k)≤qk/m and rejects the entire prefix 1…k. At q=.05, k=3 here. Adjusted p values use a reverse cumulative minimum min(1,min[j≥i] m p(j)/j), then return to original IDs. These data give .006,.036,.038,.0615,.24,.65 in H1…H6 order. FDR control concerns the expected proportion of false discoveries among rejected hypotheses (zero when nothing is rejected). Classical BH is justified for independent tests and certain forms of positive dependence; arbitrary dependence needs other conditions or corrections.']
  ], ['Каждая отвергнутая строка обязана пройти собственный порог?', 'Must every rejected row pass its own threshold?'], ['Нет. BH использует максимальный прошедший ранг и отвергает весь префикс. Например, p=(.001,.021,.029,.2,.5), q=.05: ранг 2 не проходит .02, но ранг 3 проходит .03, поэтому отвергаются все первые три.', 'No. BH uses the largest passing rank and rejects the entire prefix. For example, p=(.001,.021,.029,.2,.5), q=.05: rank 2 fails .02, but rank 3 passes .03, so all first three are rejected.'], SOURCE_BH, ctx => {
    const v = F.stage(ctx, tr('BH: сортировка и общий порог', 'BH: ranking and a shared cutoff'), '', tr('Иллюстративные p-значения · фиксированное семейство m = 6', 'Illustrative p values · fixed family m = 6')), stage = K.viewport(v.svg);
    words(stage, 'stats-bh-data', 130, 153, 1040, 48, 'Иллюстрация · m = 6 гипотез · независимые тесты', 'Illustration · m = 6 hypotheses · independent tests', 24);
    const hypotheses = [{ id: 'H5', p: .2 }, { id: 'H2', p: .012 }, { id: 'H6', p: .65 }, { id: 'H1', p: .001 }, { id: 'H4', p: .041 }, { id: 'H3', p: .019 }];
    const chart = K.bhView(stage, { hypotheses, q: .05, x: 145, y: 277, width: 975, height: 270 });
    const readout = words(stage, 'stats-bh-result', 140, 558, 620, 42, '', '', 24);
    let driver; const state = { progress: 0, q: .05 };
    const control = T.control(v.root, tr('Уровень FDR q', 'FDR level q'), .005, .15, .05, .005, value => driver.set({ q: value }), 820, 550, 310);
    function paint() {
      chart.setQ(state.q).setProgress(state.progress); const m = chart.snapshot().model;
      readout.setText(tr('q = ' + state.q.toFixed(3) + ' · максимальный ранг k = ' + m.k, 'q = ' + state.q.toFixed(3) + ' · largest passing rank k = ' + m.k)); F.opacity(readout.el, state.progress > .5 ? 1 : 0);
      control.input.value = state.q; control.output.textContent = state.q.toFixed(3); v.root.dataset.motionPhase = JSON.stringify(state);
    }
    driver = F.driver(state, paint); ctx.onDispose(driver.dispose); paint();
    v.caption(tr('Шесть p-значений в исходном порядке. Семейство задано заранее.', 'Six p values in original order. The family is specified in advance.'));
    ctx.step(() => { v.caption(tr('Имена переходят в порядок p. Ни одно значение не меняется.', 'IDs move into p order. No value changes.')); return driver.to({ progress: .5 }, { duration: 3000 }); });
    ctx.step(() => { v.caption(tr('Найдите максимальный прошедший ранг и возьмите весь префикс.', 'Find the largest passing rank and take the entire prefix.')); return driver.to({ progress: 1 }, { duration: 1800 }); });
    return v.root;
  });
})();
