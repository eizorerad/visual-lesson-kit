/* Revised foundation scenes 3–4. Progress is an explanation, never physical time. */
(function (global) {
  'use strict';
  const scenes = global.CHEMISTRY_FOUNDATIONS;
  if (!Array.isArray(scenes)) throw new Error('CHEMISTRY_FOUNDATIONS must be initialized first');
  const WATER_ANGLE = 104.5;
  const HALF_ANGLE = WATER_ANGLE * Math.PI / 360;
  const MINIMUM = 2 ** (1 / 6);
  const phase = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  const mix = (a, b, t) => a + (b - a) * t;
  function storyProgress(p) {
    for (const at of [0, .2, .4, .6, .8]) if (Math.abs(p - at) <= 1e-8) return at;
    return p;
  }
  const cue = (at, ru, en) => ({at, ru, en});
  function waterPositions(length, direction) {
    return {
      O: [0, 0],
      H1: [length * Math.cos(direction - HALF_ANGLE), length * Math.sin(direction - HALF_ANGLE)],
      H2: [length * Math.cos(direction + HALF_ANGLE), length * Math.sin(direction + HALF_ANGLE)]
    };
  }
  function water(g, x, y, length, direction, scale = 1) {
    const positions = waterPositions(length, direction);
    return CH.molecule(g, {
      x, y, scale,
      atoms: [
        {id: 'O', element: 'O', x: 0, y: 0, partial: -.8, lonePairs: 2},
        {id: 'H1', element: 'H', x: positions.H1[0], y: positions.H1[1], partial: .4},
        {id: 'H2', element: 'H', x: positions.H2[0], y: positions.H2[1], partial: .4}
      ],
      bonds: [{id: 'O-H1', a: 'O', b: 'H1'}, {id: 'O-H2', a: 'O', b: 'H2'}],
      showPartials: true, showLonePairs: true
    });
  }

  function annotateWater(a,direction) {
    for (const id of ['O','H1','H2']) {
      const node=a.atoms[id], text=node.querySelector('[data-partial-charge]');
      const outwardO=id==='O' && a.g.dataset.waterRole?.startsWith('solvent-') && Math.cos(direction)>.3;
      const x=id==='O'?(outwardO?38:0):(a.state.atoms.find(s=>s.id===id).x<0?-42:42), y=id==='O'?(outwardO?0:-43):0;
      text.setAttribute('x',x);text.setAttribute('y',y);
      L.contract(text,{space:node,box:{x:x-26,y:y-14,width:52,height:28}});
    }
    [...a.atoms.O.querySelectorAll('[data-lone-pair]')].slice(0,2).forEach((pair,i)=>{
      const t=direction+Math.PI+(i?1:-1)*.55;
      [...pair.children].forEach((dot,k)=>{const d=k?3:-3;dot.setAttribute('cx',29*Math.cos(t)-d*Math.sin(t));dot.setAttribute('cy',29*Math.sin(t)+d*Math.cos(t));});
    });
  }

  scenes.push({
    id: 'hydration', title: 'Вода ориентируется вокруг иона', enTitle: 'Water orients around an ion',
    question: 'Почему к Na⁺ обращён кислород воды?', enQuestion: 'Why does water face Na⁺ with its oxygen?',
    control: 'Шаг объяснения', enControl: 'Explanation progress', duration: 48000,
    source: 'OpenStax · Electrolytes', url: 'https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes',
    answer: 'O несёт δ−, а H — δ+. К Na⁺ обращён отрицательный конец нейтральной молекулы воды. Пунктир показывает ион–дипольное притяжение.',
    enAnswer: 'O carries δ− and H carries δ+. The negative end of neutral water faces Na⁺. A dashed contact shows ion–dipole attraction.',
    note: 'Угол H–O–H фиксирован: 104.5°. Две связи O–H ковалентные; четыре точки обозначают две неподелённые пары O. Геометрия и полярность: <a href="https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity" target="_blank" rel="noopener">OpenStax §7.6</a>. δ обозначает частичный, зависящий от метода заряд, а не целое число электронов. Внутренние значения −0.8/+0.4 e иллюстративны; показаны только знаки. Заряд Na⁺ равен +1 e. Три воды выбраны для читаемости, не задают координационное число. Пунктир Na⁺⋯O — ион–дипольный контакт, не ковалентная связь. Поворот и появление иона заданы автором; движение растворителя и энергию не рассчитываем. Левая вода — отдельная увеличенная справочная схема, не четвёртая вода в окружении Na⁺.',
    enNote: 'The H–O–H angle is fixed at 104.5°. Two O–H bonds are covalent; four dots denote two O lone pairs. Geometry and polarity: <a href="https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity" target="_blank" rel="noopener">OpenStax §7.6</a>. δ denotes a method-dependent partial charge, not a whole electron count. Internal values −0.8/+0.4 e are illustrative; only signs are displayed. Na⁺ has charge +1 e. Three waters are selected for readability and do not specify a coordination number. Dashed Na⁺⋯O is an ion–dipole contact, not a covalent bond. Orientation and ion placement are authored; solvent motion and energy are not calculated. The left water is a separate enlarged reference, not a fourth water in the Na⁺ environment.',
    captions: [
      'Начнём с одной H₂O: две ковалентные связи O–H и угол 104.5°.',
      'У O четыре электронные области: две связи и две неподелённые пары. Их взаимное отталкивание влияет на изогнутую форму H₂O.',
      'Добавим Na⁺: его +1 — целый заряд иона. Сначала рядом одна вода.',
      'Та же вода поворачивается кислородом к Na⁺. Связи O–H сохраняются.',
      'Покажем ещё две воды. Пунктир Na⁺⋯O обозначает ион–дипольное притяжение.'
    ],
    enCaptions: [
      'Begin with one H₂O: two covalent O–H bonds and a 104.5° angle.',
      'O has four electron regions: two bonds and two lone pairs. Their mutual repulsion helps determine the bent shape of H₂O.',
      'Add Na⁺: its +1 is the whole ionic charge. First show one nearby water.',
      'The same water turns its oxygen toward Na⁺. Its O–H bonds remain intact.',
      'Reveal two more waters. Dashed Na⁺⋯O contacts denote ion–dipole attraction.'
    ],
    stages: [
      {at: 0, label: 'Связи и угол', enLabel: 'Bonds and angle'},
      {at: .2, label: 'Полярность', enLabel: 'Polarity'},
      {at: .4, label: 'Добавить Na⁺', enLabel: 'Add Na⁺'},
      {at: .6, label: 'Ориентация', enLabel: 'Orientation'},
      {at: .8, label: 'Гидратация', enLabel: 'Hydration'}
    ],
    narration: [
      cue(0, 'Рассмотрим строение одной воды. Слева остаётся увеличенная схема для сравнения.', 'Examine one water molecule. The enlarged drawing on the left stays as a reference.'),
      cue(.07, 'Каждая линия O–H означает общую электронную пару: обе связи ковалентные.', 'Each O–H line represents a shared electron pair: both bonds are covalent.'),
      cue(.15, 'Между связями 104.5°. При повороте воды этот угол сохранится.', 'The bonds form a 104.5° angle. Turning the water will preserve that angle.'),
      cue(.22, 'У кислорода есть ещё две неподелённые пары: это четыре точки возле O.', 'Oxygen also has two lone pairs: four dots beside O.'),
      cue(.31, 'Плотность смещена к O: у него δ−, а у H — δ+. Сама вода нейтральна.', 'Density is shifted toward O: it has δ−, while H has δ+. The water itself is neutral.'),
      cue(.40, 'Поместим рядом Na⁺. Его заряд +1 e — целый заряд иона, в отличие от δ.', 'Place Na⁺ nearby. Its +1 e is a whole ionic charge, unlike δ.'),
      cue(.49, 'Отрицательный конец воды благоприятно обращён к положительному иону. Повернём ту же молекулу.', 'The negative end of water is favorably directed toward the positive ion. Turn that same molecule.'),
      cue(.61, 'Оба H отходят в сторону от Na⁺. Связи O–H и две неподелённые пары сохраняются.', 'Both H atoms turn away from Na⁺. The O–H bonds and both lone pairs remain intact.'),
      cue(.70, 'Пунктир отмечает ион–дипольный контакт. Новая ковалентная связь здесь не образуется.', 'The dashed line marks an ion–dipole contact. No new covalent bond forms here.'),
      cue(.81, 'Добавим две воды с другими исходными ориентациями: каждая поворачивает O к иону.', 'Add two waters with different initial orientations: each turns its O toward the ion.'),
      cue(.95, 'Получилась схема гидратации. Три воды выбраны для читаемости, а не как точное координационное число.', 'This gives a hydration diagram. Three waters were chosen for readability, not as an exact coordination number.')
    ],
    draw(g, H) {
      const {label, line, path, show} = H;
      const main = water(g, 250, 356, 95, 0, 1);
      main.g.dataset.waterRole = 'enlarged-reference';
      label(g, 85, 218, 515, 35, 'H₂O · увеличенная схема', 'H₂O · enlarged reference', 24, C.grey);
      label(g, 342, 336, 150, 39, '104.5°', '104.5°', 27, C.gold);
      const arcX = 250 + 65 * Math.cos(HALF_ANGLE), arcDy = 65 * Math.sin(HALF_ANGLE);
      const angleArc = path(g, `M${arcX} ${356 - arcDy} A65 65 0 0 1 ${arcX} ${356 + arcDy}`, C.gold, 1.25);
      angleArc.dataset.hydrationAngle = '104.5';
      label(g, 82, 462, 518, 34, 'O—H: ковалентные связи', 'O—H: covalent bonds', 22, C.grey);

      const intro = H.group(g);
      label(intro, 650, 257, 520, 75, 'O—H: общая пара\nТочки: неподелённые пары', 'O—H: a shared pair\nDots: lone pairs', 27, C.white);
      const polarityExplanation = H.group(intro);
      label(polarityExplanation, 650, 345, 520, 54, 'O: δ−       H: δ+', 'O: δ−       H: δ+', 32, C.teal);
      label(polarityExplanation, 650, 408, 520, 42, 'δ — частичный заряд', 'δ means a partial charge', 25, C.grey);

      const solvent = H.group(g);
      label(solvent, 650, 218, 525, 35, 'Вода рядом с Na⁺', 'Water near Na⁺', 24, C.grey);
      const contactLayer = H.group(solvent);
      const ion = CH.molecule(solvent, {x: 922, y: 352, atoms: [{id: 'Na', element: 'Na', charge: 1, x: 0, y: 0}], bonds: []});
      const ionCharge = label(solvent, 846, 385, 152, 31, 'q = +1 e', 'q = +1 e', 22, C.gold);
      const locations = [
        {x: 764, y: 352, length: 73, direction: Math.PI},
        {x: 1043, y: 290, length: 78, direction: Math.atan2(-62, 121)},
        {x: 1043, y: 414, length: 78, direction: Math.atan2(62, 121)}
      ];
      const waters = locations.map((o, i) => {
        const a = water(solvent, o.x, o.y, o.length, o.direction, i === 0 ? 1 : .8);
        a.g.dataset.waterRole = 'solvent-' + (i + 1);
        return a;
      });
      const contactPoses = locations.map(o => {
        const dx = o.x - 922, dy = o.y - 352, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
        return {x1: 922 + ux * 43, y1: 352 + uy * 43, x2: o.x - ux * 37, y2: o.y - uy * 37, color: C.teal};
      });
      const contacts = contactPoses.map(pose => CH.contact(contactLayer, pose));
      const legend = H.group(solvent);
      line(legend, 641, 481, 680, 481, C.teal, '5 5');
      label(legend, 691, 466, 332, 30, 'Na⁺ ⋯ O : ион–диполь', 'Na⁺ ⋯ O : ion–dipole', 21, C.teal);

      return {paint(p) {
        p = storyProgress(p);
        const step = Math.min(4, Math.floor(p * 5));
        main.set({showPartials: step >= 1, showLonePairs: step >= 1});annotateWater(main,0);
        H.trace(main.g.querySelector('[data-bond-id="O-H1"]'), phase(p, .02, .08));
        H.trace(main.g.querySelector('[data-bond-id="O-H2"]'), phase(p, .08, .14));
        H.trace(angleArc, phase(p, .10, .19));
        [...main.atoms.O.querySelectorAll('[data-lone-pair]')].slice(0, 2).forEach((pair, i) => show(pair, phase(p, .20 + i * .04, .25 + i * .04)));
        for (const atom of Object.values(main.atoms)) show(atom.querySelector('[data-partial-charge]'), phase(p, .27, .34));
        show(intro, 1 - phase(p, .34, .39));
        show(polarityExplanation, phase(p, .26, .33));
        show(solvent, phase(p, .37, .42));
        const ionPlacement = phase(p, .37, .46);
        H.move(ion, mix(1090, 922, ionPlacement), 352);
        show(ionCharge.el, phase(p, .43, .47));
        show(waters[0].g, phase(p, .40, .46));
        // Change atom coordinates, never rotate a text-bearing molecule group.
        const orient = phase(p, .46, .68);
        waters[0].set({positions: waterPositions(locations[0].length, Math.PI - 1.12 * (1 - orient))});annotateWater(waters[0],Math.PI-1.12*(1-orient));
        waters.slice(1).forEach((a, j) => {
          const loc = locations[j + 1];
          const reveal = phase(p, .76 + j * .015, .8);
          show(a.g, reveal);
          const direction=loc.direction + (j ? -.28 : .28) * (1 - phase(p, .8, .96));a.set({positions: waterPositions(loc.length,direction)});annotateWater(a,direction);
        });
        contacts.forEach((c, i) => {
          const amount = i === 0 ? phase(p, .63, .73) : phase(p, .84 + i * .02, .97);
          const pose = contactPoses[i];
          c.set({x2: mix(pose.x1, pose.x2, amount), y2: mix(pose.y1, pose.y2, amount)});
          // Grow the endpoint while keeping its dashed contact notation at every frame.
          show(c, amount > 0 ? 1 : 0);
        });
        show(legend, phase(p, .63, .7));
        ion.focus(step >= 2 ? ['Na'] : null);
        return {
          stage: step, waterAngleDegrees: WATER_ANGLE, waterCount: waters.filter(a => Number(a.g.style.opacity) > 0).length,
          enlargedReferenceCount: 1, cationCharge: 1, waterFormalCharge: 0, oxygenLonePairs: 2,
          partialChargesVisible: p > .27, partialChargesIllustrative: true,
          orientation: orient, covalentBondsPerWater: 2, contactType: 'ion-dipole',
          ionPlacement, referenceIsSeparateView: true,
          simulation: false, labelsUpright: true,
          positions: waters.map(a => a.anchors)
        };
      }};
    }
  });

  function separation(p) {
    p = storyProgress(p);
    if (p <= .2) return mix(2.7, 1.6, phase(p, 0, .2));
    if (p <= .4) return mix(1.6, 1.3, phase(p, .2, .4));
    if (p < .6) return mix(1.3, MINIMUM, phase(p, .4, .6));
    if (p <= .8) return MINIMUM;
    return mix(MINIMUM, 1, phase(p, .8, 1));
  }

  scenes.push({
    id: 'potential', title: 'Межмолекулярная энергия и сила', enTitle: 'Intermolecular energy and force',
    question: 'Как наклон энергии задаёт притяжение и отталкивание?', enQuestion: 'How does the energy slope set attraction and repulsion?',
    control: 'Шаг объяснения', enControl: 'Explanation progress', duration: 48000,
    value: p => 'r/σ = ' + separation(p).toFixed(3),
    source: 'PhET · Atomic interactions', url: 'https://phet.colorado.edu/sims/html/atomic-interactions/latest/atomic-interactions_en.html',
    answer: 'Для этой нейтральной пары Fᵣ = −dU/dr. В минимуме r = 2^(1/6)σ силы притяжения и отталкивания равны; суммарная сила нулевая.',
    enAnswer: 'For this neutral pair, Fᵣ = −dU/dr. At the minimum r = 2^(1/6)σ, attractive and repulsive forces balance; net force is zero.',
    note: 'Модель нековалентного взаимодействия нейтральной пары: U/ε = 4[(σ/r)^12 − (σ/r)^6], без обрезания; U(∞)=0. Формула: <a href="https://docs.lammps.org/pair_lj.html" target="_blank" rel="noopener">LAMMPS · Lennard–Jones</a>. Все силы направлены на правую частицу B; F>0 увеличивает расстояние. Единицы: r/σ, U/ε и Fσ/ε. Стрелки имеют единый линейный масштаб 2.2 единицы SVG на единицу Fσ/ε, без ограничения длины. Минимум выбран точно; машинная погрешность силы около нуля нормализована к 0. Две составляющие силы в минимуме остаются ненулевыми. Частицы условные; рисунок не описывает ковалентную связь. Сближение и сжатие заданы автором, не получены интегрированием движения.',
    enNote: 'A model of noncovalent interaction between a neutral pair: U/ε = 4[(σ/r)^12 − (σ/r)^6], without a cutoff; U(∞)=0. Formula: <a href="https://docs.lammps.org/pair_lj.html" target="_blank" rel="noopener">LAMMPS · Lennard–Jones</a>. All forces act on the right particle B; F>0 increases separation. Units are r/σ, U/ε and Fσ/ε. Arrows use one linear scale, 2.2 SVG units per unit Fσ/ε, with no length cap. The exact minimum is selected; floating-point force roundoff there is normalized to 0. Both force components remain nonzero at the minimum. Particles are illustrative; this diagram does not describe a covalent bond. Approach and compression are authored, not integrated motion.',
    captions: [
      'Начинаем далеко: r/σ = 2.7. Между нейтральными частицами слабое притяжение.',
      'Сближение понижает U. Суммарная сила на B направлена к A: Fᵣ < 0.',
      'Fᵣ = −dU/dr: положительный наклон U означает отрицательную силу.',
      'Точный минимум: r/σ = 2^(1/6), U/ε = −1, Fᵣ = 0. Две силы уравновешены.',
      'В минимуме Fᵣ = 0. Дальнейшее сжатие усиливает отталкивание: Fᵣ > 0.'
    ],
    enCaptions: [
      'Start far apart: r/σ = 2.7. The neutral particles attract weakly.',
      'Approach lowers U. The net force on B points toward A: Fᵣ < 0.',
      'Fᵣ = −dU/dr: a positive energy slope means a negative force.',
      'Exact minimum: r/σ = 2^(1/6), U/ε = −1, Fᵣ = 0. The two forces balance.',
      'At the minimum, Fᵣ = 0. Further compression makes repulsion dominate: Fᵣ > 0.'
    ],
    stages: [
      {at: 0, seek: 0, label: 'Далеко', enLabel: 'Far apart'},
      {at: .2, label: 'Притяжение', enLabel: 'Attraction'},
      {at: .4, label: 'Наклон U', enLabel: 'Slope of U'},
      {at: .6, seek: .70, label: 'Минимум', enLabel: 'Minimum'},
      {at: .8, label: 'Сжатие', enLabel: 'Compression'}
    ],
    narration: [
      cue(0, 'Две нейтральные частицы далеко друг от друга. Их нековалентное притяжение пока слабо.', 'Two neutral particles are far apart. Their noncovalent attraction is weak.'),
      cue(.09, 'Задаём меньшее расстояние r. Частица B и точка энергии перемещаются согласованно.', 'Impose a smaller separation r. Particle B and the energy point move together.'),
      cue(.20, 'При сближении энергия понижается. Сила на B направлена влево, к A.', 'Approach lowers the energy. The force on B points left, toward A.'),
      cue(.31, 'Показаны притягивающая и отталкивающая составляющие. Их сумма задаёт результирующую силу.', 'Attractive and repulsive components are shown. Their sum gives the net force.'),
      cue(.41, 'Наклон касательной положителен. Из Fᵣ = −dU/dr следует отрицательная сила.', 'The tangent has a positive slope. Fᵣ = −dU/dr therefore gives a negative force.'),
      cue(.51, 'Приближаясь к минимуму, уменьшаем наклон и результирующую силу.', 'Approaching the minimum reduces the slope and the net force.'),
      cue(.60, 'Достигли точного минимума: r = 2^(1/6)σ, а U = −ε. Остановим изменение r.', 'We have reached the exact minimum: r = 2^(1/6)σ and U = −ε. Hold r here.'),
      cue(.68, 'Составляющие не исчезли: они равны по величине и противоположны. Поэтому сумма ноль.', 'The components have not vanished: they are equal and opposite. Their sum is zero.'),
      cue(.77, 'Нулевая сила здесь относится к этому расстоянию; ковалентная связь в модели не появилась.', 'Zero force applies at this separation; the model has not created a covalent bond.'),
      cue(.82, 'Сожмём пару дальше. Энергия растёт, и отталкивающая составляющая становится больше.', 'Compress the pair further. Energy rises and the repulsive component becomes larger.'),
      cue(.92, 'Теперь сила на B направлена вправо: она противодействует заданному сжатию.', 'The force on B now points right: it opposes the imposed compression.')
    ],
    draw(g, H) {
      const {label, circle, line, path, show, fmt} = H;
      label(g, 75, 218, 580, 32, 'Нейтральная пара · нековалентное взаимодействие', 'Neutral pair · noncovalent interaction', 21, C.grey);
      label(g, 91, 251, 547, 45, 'Fᵣ = −dU/dr', 'Fᵣ = −dU/dr', 30, C.white);
      const fixedX = 170, particleY = 324, distanceScale = 123;
      const fixed = circle(g, fixedX, particleY, 26, C.purple, .06);
      fixed.dataset.ljParticle = 'A';
      label(g, fixedX - 22, particleY - 19, 44, 38, 'A', 'A', 23, C.purple);
      const mobile = circle(g, 500, particleY, 26, C.blue, .06);
      mobile.dataset.ljParticle = 'B';
      const mobileLabel = label(g, 478, particleY - 19, 44, 38, 'B', 'B', 23, C.blue);
      const ruler = line(g, fixedX, 365, 500, 365, C.grey);
      line(g, fixedX, 360, fixedX, 370, C.grey);
      const rulerEnd = line(g, 500, 360, 500, 370, C.grey);
      const distance = label(g, 95, 371, 540, 29, '', '', 21, C.grey);
      const particleForce = line(g, 500, particleY, 500, particleY, C.gold);
      particleForce.dataset.ljParticleForce = '';
      const particleForceHead = path(g, '', C.gold, 1.25);

      const forceScale = 2.2, vectorX = 450;
      const terms = [
        ['Притяжение', 'Attraction', C.blue, 414],
        ['Отталкивание', 'Repulsion', C.red, 446],
        ['Сумма', 'Net', C.gold, 478]
      ];
      const forceRows = terms.map(([ru, en, color, y], i) => {
        label(g, 77, y - 14, 165, 28, ru, en, 20, color);
        const number = label(g, 247, y - 14, 148, 28, '', '', 20, color);
        const shaft = line(g, vectorX, y, vectorX + 1, y, color);
        const head = path(g, '', color, 1.25);
        const origin = circle(g, vectorX, y, 2.3, color, .9);
        shaft.dataset.forceComponent = ['attractive', 'repulsive', 'net'][i];
        return {number, shaft, head, origin, y};
      });
      label(g, 573, 409, 122, 78, 'Fσ/ε\nна B', 'Fσ/ε\non B', 18, C.grey);

      const plot = H.plot(g, {x: 797, y: 270, w: 362, h: 118, xmin: .98, xmax: 2.8, ymin: -1.2, ymax: 1,
        xt: [1, 1.5, 2, 2.5], yt: [-1, 0, 1], title: 'U / ε · Леннард–Джонс', enTitle: 'U / ε · Lennard–Jones', xlabel: 'r / σ'});
      const energyGuide = plot.curve(r => PH.lennardJones(r).energy, C.blue);
      energyGuide.el.setAttribute('opacity', '.25');
      const energyTrail = path(g, '', C.blue, 2);
      energyTrail.dataset.ljEnergyTrail = '';
      const minimumGuide = line(g, plot.x(MINIMUM), plot.y(-1), plot.x(MINIMUM), plot.y(-1.2), C.gold, '3 4');
      minimumGuide.dataset.exactMinimum = String(MINIMUM);
      const minimumRing = circle(g, plot.x(MINIMUM), plot.y(-1), 9, C.gold, 0);
      const cursor = line(g, plot.x(2.7), plot.y(-1.2), plot.x(2.7), plot.y(0), C.grey, '3 4');
      const tangent = line(g, 0, 0, 1, 0, C.gold);
      tangent.dataset.ljTangent = '';
      const dot = plot.point(C.gold);
      dot.el.dataset.ljEnergyMarker = '';
      const stateReadout = label(g, 708, 468, 491, 28, '', '', 21, C.gold);

      function drawVector(row, value) {
        const dx = forceScale * value, tip = vectorX + dx, sign = Math.sign(dx), size = Math.min(6, Math.abs(dx) * .45);
        row.number.setText((value > 0 ? '+' : '') + fmt(value, 2));
        F.seg(row.shaft, vectorX, row.y, tip, row.y);
        row.shaft.dataset.physicalValue = String(value);
        row.shaft.dataset.vectorScale = String(forceScale);
        row.head.setAttribute('d', value === 0 ? '' : `M${tip - sign * size} ${row.y - size * .55} L${tip} ${row.y} L${tip - sign * size} ${row.y + size * .55}`);
        show(row.shaft, value === 0 ? 0 : 1);
        show(row.head, value === 0 ? 0 : 1);
        show(row.origin, value === 0 ? 1 : .28);
      }
      return {paint(p) {
        p = storyProgress(p);
        const r = separation(p), model = PH.lennardJones(r);
        const atMinimum = r === MINIMUM;
        const energy = atMinimum ? -1 : model.energy, force = atMinimum ? 0 : model.force;
        const attractive = -24 / r ** 7, repulsive = atMinimum ? -attractive : 48 / r ** 13;
        const x = fixedX + distanceScale * r;
        mobile.setAttribute('cx', x);
        mobileLabel.setBox({x: x - 22, y: particleY - 19, width: 44, height: 38});
        const forceStart = x + Math.sign(force) * 30, forceTip = forceStart + forceScale * force;
        const forceHeadSize = Math.min(6, Math.abs(forceScale * force) * .45);
        F.seg(particleForce, forceStart, particleY, forceTip, particleY);
        particleForce.dataset.physicalValue = String(force);
        particleForce.dataset.vectorScale = String(forceScale);
        particleForceHead.setAttribute('d', force === 0 ? '' : `M${forceTip - Math.sign(force) * forceHeadSize} ${particleY - forceHeadSize * .55} L${forceTip} ${particleY} L${forceTip - Math.sign(force) * forceHeadSize} ${particleY + forceHeadSize * .55}`);
        show(particleForce, force === 0 ? 0 : 1);
        show(particleForceHead, force === 0 ? 0 : 1);
        F.seg(ruler, fixedX, 365, x, 365);
        F.seg(rulerEnd, x, 360, x, 370);
        distance.setText((atMinimum ? 'r/σ = 2^(1/6) ≈ ' + fmt(r, 3) : 'r/σ = ' + fmt(r, 3)) + H.tr(' · r задан', ' · imposed r'));
        [attractive, repulsive, force].forEach((v, i) => drawVector(forceRows[i], v));
        dot.set(r, energy);
        energyTrail.setAttribute('d', Array.from({length: 161}, (_, i) => {
          const at = mix(2.7, r, i / 160), value = at === MINIMUM ? -1 : PH.lennardJones(at).energy;
          return (i ? 'L' : 'M') + plot.x(at) + ',' + plot.y(value);
        }).join(' '));
        F.seg(cursor, plot.x(r), plot.y(-1.2), plot.x(r), plot.y(energy));
        // A tangent shows the actual derivative; only its displayed interval changes.
        const half = Math.min(.14, .18 / Math.max(1, Math.abs(force)), r - .98, 2.8 - r);
        F.seg(tangent, plot.x(r - half), plot.y(energy + force * half), plot.x(r + half), plot.y(energy - force * half));
        show(tangent, p >= .4 ? 1 : 0);
        show(minimumRing, atMinimum ? 1 : .18);
        stateReadout.setText('U/ε = ' + fmt(energy, 3) + '     Fσ/ε = ' + fmt(force, 3));
        return {
          stage: Math.min(4, Math.floor(p * 5)), r, energy, force,
          attractiveForce: attractive, repulsiveForce: repulsive, atMinimum,
          minimumDistance: MINIMUM, rawModelForce: model.force,
          vectorScale: forceScale, vectorClamped: false,
          interaction: 'neutral-pair-noncovalent', units: 'reduced', simulation: false,
          particleSeparationPixels: x - fixedX
        };
      }};
    }
  });
})(window);
