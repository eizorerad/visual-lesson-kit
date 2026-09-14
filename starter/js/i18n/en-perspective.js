/* Full English text for the viewpoint and dimension-reveal examples.
   Camera motion, visual disclosure and source coordinates remain distinct. */
(function () {
  'use strict';
  const p = text => '<p>' + text + '</p>';
  const strings = {
      'Ракурс и проекция': 'Viewpoint and projection',
      'Сменился ракурс, не данные': 'New viewpoint, same data',
      'Шаблон 12 · один объект, другой взгляд': 'Template 12 · one object, another view',
      '34 синтетические точки · ортографическая схема · не алгоритм UMAP': '34 synthetic points · orthographic illustration · not the UMAP algorithm',
      'Одно облако · две группы': 'One cloud · two groups',
      'Те же точки': 'Same points',
      'Те же координаты': 'Same coordinates',
      'Проекция ≠ UMAP': 'Projection ≠ UMAP',
      'Ракурс': 'Viewpoint',
      'Вид спереди': 'Front view',
      'Вид сбоку': 'Side view',
      'Глубина становится видна': 'Depth comes into view',
      'Вернулись к первому виду. Точки и расстояния в пространстве не изменились.': 'Back to the first view. The points and distances in space are unchanged.',
      'P и Q наложились на экране. По этой картинке глубина не видна.': 'P and Q overlap on screen. This view does not show their depth.',
      'Сбоку различие видно. Оно было в данных с самого начала.': 'The side view shows a difference that was in the data all along.',
      'Меняется направление взгляда. Координаты самих точек остаются прежними.': 'The viewing direction changes. The points keep their original coordinates.',

      'От плоскости к пространству': 'From the plane into space',
      'Плоскость становится опорой': 'The plane becomes a reference',
      'Шаблон 13 · наклон → ось → координата': 'Template 13 · tilt → axis → coordinate',
      'Учебная точка (1.5, 1.1, 1.35) · третья координата задана заранее': 'Illustrative point (1.5, 1.1, 1.35) · third coordinate specified in advance',
      'Сначала видны только x и y': 'Initially, only x and y are visible',
      'Наклон плоскости': 'Plane tilt',
      'Знакомая плоскость': 'The familiar plane',
      'Новое направление': 'A new direction',
      'Точка над плоскостью': 'A point above the plane',
      'Координаты не меняются': 'Coordinates stay the same',
      'То же начало координат': 'The same origin',
      'Внизу осталась проекция': 'Its projection remains below',
      'Меняется только вид': 'Only the view changes',
      'Третья ось — z': 'The third axis is z',
      'Связь видна по пунктиру': 'The dashed line connects them',
      'Останавливаем камеру. Вводим ось z.': 'Stop the camera. Introduce the z-axis.',
      'Раскрываем заданную координату z': 'Reveal the specified z-coordinate',
      'Две координаты задают точку на плоскости. Начнём с этого знакомого вида.': 'Two coordinates locate a point in the plane. Start with this familiar view.',
      'Наклоняем ту же плоскость. Стрелка и точка пока остаются на ней.': 'Tilt the same plane. The arrow and point remain in it for now.',
      'От общего начала вырастает ось z. Это отдельное направление.': 'The z-axis grows from the same origin. It is a separate direction.',
      'Сверху точка и её проекция совпали на экране. Координата z сохранилась.': 'From above, the point overlaps its projection. Its z-coordinate is unchanged.',
      'Точка поднимается над своей проекцией. Мы раскрываем заранее заданное значение.': 'The point rises above its projection, revealing a value specified in advance.'
  };
  // The player adds scene numbers to these exact authored labels.
  const numbered = [
    'Ракурс и проекция', 'Сменился ракурс, не данные',
    'Шаблон 12 · один объект, другой взгляд',
    'От плоскости к пространству', 'Плоскость становится опорой',
    'Шаблон 13 · наклон → ось → координата'
  ];
  const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  D.i18n.pack('en', {
    strings,
    patterns: numbered.map(source => ({
      match: new RegExp('^(\\d+(?:\\s*/\\s*\\d+)?\\s*·\\s*)' + escaped(source) + '$'),
      replace: '$1' + strings[source]
    })),
    notes: {
      'viewpoint-cloud': [
        p('These are 34 invented points: two groups of 17. Their colors and IDs are specified in advance. Each pair has the same x and y but different z values; centers P and Q have coordinates (0, 0, −1.15) and (0, 0, 1.15). Depth is hidden in the front view, so the points overlap in pairs. The two colored marks have different sizes so that both colors remain visible; size does not encode a quantity. The wireframe provides a spatial reference. This is a linear projection of an illustrative cloud, not real cells or a computed UMAP embedding.'),
        p('The camera smoothly changes its viewing direction. The original coordinates, pairs, colors and distances in three-dimensional space stay the same; only the screen coordinates change. Depth becomes visible, so the groups separate in the drawing. We are not moving the groups apart or refitting the representation. The frame moves with the cloud while the labels remain readable. The projection is orthographic: nearer marks do not grow larger, and the overall scale is fixed.'),
        p('The side view exposes the difference in z that was hidden in the first frame. Centers P and Q have remained 2.3 arbitrary units apart throughout; their distance on screen depends on the viewing direction. The slider lets you examine intermediate viewpoints of the same cloud. This is a useful analogy for information lost in a flat picture, but UMAP constructs a new representation nonlinearly rather than simply dropping one axis. Rotating an existing two-dimensional UMAP plot cannot recover the original measurements. An actual 3D UMAP view requires three coordinates computed in advance.'),
        p('We return to the front view, and the groups overlap again. Neither the points nor the distances in space have changed. This reversible transition separates properties of the data from properties of the image. A compelling picture alone should not be used to establish class separability or the existence of a mechanism. For UMAP, the parameters, stability of the result and validation in the original space also matter. The next example distinguishes two further operations: tilting the view of a known plane and revealing a third coordinate specified in advance.')
      ],
      'plane-to-space': [
        p('We begin with a familiar coordinate plane. The x-axis and y-axis define two directions; the vector arrow points to (1.5, 1.1) in arbitrary units. This is the projection of the forthcoming three-dimensional point onto the plane z=0. The third value is already specified in the illustrative data: 1.35. It has not yet been drawn. We are not calculating it from x and y or taking it from a two-dimensional figure in a paper. The grid provides a stable reference, not a complicated calculation.'),
        p('First, we tilt only the view of the same plane. The x-axis slopes downward in the drawing, while the y-axis recedes into depth. The point and its two coordinates remain in the plane z=0; the third axis has not yet been shown. The system is rotated before orthographic projection, without changing the data scale. Screen angles and lengths change with the viewpoint, so the original vector length cannot be measured in pixels. The camera stops before the next conceptual step.'),
        p('Now the third axis, z, grows from the same origin. It represents a separate direction defined in advance; the x–y plane has become a reference. The point remains at its base for now. Growing the axis introduces a new concept in sequence; it does not change any measurements. In three-dimensional space, the z-axis is perpendicular to the plane, although on a flat screen it need not form a right angle with both drawn axes.'),
        p('Finally, we reveal the specified coordinate z=1.35: the vector point rises above its projection, and the arrow extends from the common origin to the full point (1.5, 1.1, 1.35). A thin arrow and a circle in the plane preserve the previous projection. The dashed line connects the projection to the full point and runs parallel to z. This animation reveals a third value; it is not physical motion, a cell trajectory or the recovery of lost information. The slider changes only the viewpoint. Returning to the view from above makes the full point overlap its projection again, although the third coordinate remains specified.')
      ]
    },
    qa: {
      'viewpoint-cloud': [
        {
          q: 'Did the points actually move apart when the view rotated?',
          a: 'Their projections on the screen moved apart. From the start, P and Q had the same x and y and different z values. All original three-dimensional coordinates and distances are preserved; only the viewing direction changes.',
          source: 'Synthetic POINTS in episode 12; orthographic projection in K.project3D.'
        },
        {
          q: 'Can we rotate a two-dimensional UMAP plot this way to recover depth?',
          a: 'No. UMAP constructs a nonlinear representation. An unknown third coordinate cannot be recovered by rotating two published coordinates. If UMAP has already been fitted with n_components=3, its resulting three-dimensional representation can be rotated, but that representation is still not identical to the original feature space.',
          source: 'UMAP: Basic UMAP Parameters, n_components.',
          url: 'https://umap-learn.readthedocs.io/en/latest/parameters.html'
        }
      ],
      'plane-to-space': [
        {
          q: 'Where did the third coordinate come from?',
          a: 'It is explicitly specified in TARGET: [1.5, 1.1, 1.35]. The camera does not calculate it. A scientific lesson needs a measured feature or a third coordinate of a representation computed in advance; it cannot be obtained from a flat image alone.',
          source: 'Author-defined illustrative TARGET in episode 13; not data from a paper.'
        },
        {
          q: 'Why do the axes not look mutually perpendicular on screen?',
          a: 'The directions are perpendicular in three-dimensional space. Their two-dimensional projections generally do not preserve all angles and lengths. The same projection function is used for the grid, axes, point, shadow and guide line. Numerical quantities should be calculated from the original coordinates.',
          source: 'Geometry of orthographic projection; K.project3D.'
        }
      ]
    }
  });
})();
