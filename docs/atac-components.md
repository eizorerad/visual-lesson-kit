# Компоненты хроматина, структуры и чтения

Используйте отдельные акторы из фильма ATAC-seq в своём уроке. Это SVG-представления с постоянными объектами, общими цветами, двуязычными подписями и методом очистки ресурсов. Готовые молекулярные данные и численные примеры имеют явно заданные источники.

## Независимый пример

```sh
python3 create.py ../my-chromatin-scenes --template atac-components \
  --title "Хроматин и измерения" --lang ru --palette ocean
python3 ../my-chromatin-scenes/build/atac-film.py
```

Откройте `dist/lesson.html` созданного проекта. Здесь четыре обычные пошаговые сцены / 16 состояний: пять структурных видов, три состояния происхождения вставок, пять состояний чтения и три состояния накопления гистограммы. Полный фильм, его временная шкала и контроллер не загружаются. Редактируемый пример — `js/recipes/atac/components.js`; HTML показывает точный порядок подключений.

`python3 tools/build-atac.py` в библиотеке собирает автономные примеры `examples/atac-seq.html` и `examples/atac-components.html`. `--check` сравнивает их с новыми сборками побайтово.

## Карта компонентов

Общие зависимости для акторов: стандартные `D`, `L`, `F` и семантическая палитра `C`. Файлы данных подключаются до акторов. У всех перечисленных верхнеуровневых акторов есть `dispose()`; регистрируйте его в `ctx.onDispose`.

| API | Дополнительные зависимости | Состояния и результат |
|---|---|---|
| `AtacStructureViews.create(svg)` | `atac-structures.js`, `atac-histone-core-data.js`, `atac-histone-cartoon.js`, `atac-callouts.js` | `paint({visibility,stage,turn,zoom})`: 0 нуклеосома, 1 октамер, 2 участок обёрнутой ДНК, 3 Tn5, 4 загруженный конец ДНК. Возвращает источник, рамки, выделение и локатор. |
| `AtacFragmentOrigin.create(svg)` | Те же структурные данные и `atac-histone-cartoon.js` | `paint({visibility,stage,turn})`: 0 короткий пример, 1 пример с нуклеосомой, 2 сравнение после удаления белка. Длины центральных линий сохраняются. |
| `AtacReadViews.create(svg)` | `atac-data.js` | `paint({visibility,stage})`: 0 целая вставка, 1 R1, 2 R2, 3 оба чтения, 4 размещение на оси. Выделен растущий 3′-конец; раунды раздельны. |
| `AtacSignals.create(svg)` | `atac-data.js` | `paint({visibility,stage,lengthReveal})`: библиотека, чтения, координаты и статистика; для независимой гистограммы `stage:11`, `lengthReveal:0…1`. |
| `AtacChromatin.create(svg)` | Все структурные данные, `atac-histone-cartoon.js`, `atac-tn5-cartoon.js` | Полная схема хроматина, два локальных события и выделение F001. Параметры зафиксированы в полном каталоге `AtacStory`; геометрия возвращает якоря и препятствия для подписей. |
| `AtacExtras.create(svg)` | Общий runtime | `paint({chem,chemTags,visibility,stage})`: локальная химическая схема и отдельные QC/интерпретационные рисунки. `chem` показывает химическую схему, `chemTags` — адаптеры; `visibility` и `stage:0…6` управляют отдельными поясняющими рисунками. |
| `AtacCallouts.create(svg,{id})` | Общий runtime | Ближние подписи, короткие указатели, оценка препятствий и плавное скрытие. Не зависит от биологических данных. |

`visibility` обычно задаётся явно в диапазоне 0…1. Дробные `stage` дают авторские переходы. Эти диапазоны не являются секундами или вероятностями. Вызовы вычисляют изображение из текущего состояния; повтор и перемотка не накапливают преобразования. Нельзя интерполировать через пропущенные стадии и одновременно утверждать, что их не было: используйте полные отдельные виды и явную смену представления.

## Вставить одну сцену

В HTML обычного проекта подключите перечисленные ниже файлы после `film.js` и `layout.js`, перед рецептом, `player.js` и `boot.js`:

```html
<script src="js/atac-structures.js"></script>
<script src="js/atac-histone-core-data.js"></script>
<script src="js/atac-histone-cartoon.js"></script>
<script src="js/atac-callouts.js"></script>
<script src="js/atac-structure-views.js"></script>
<script src="js/recipes/my-nucleosome.js"></script>
```

Сохраните как `js/recipes/my-nucleosome.js`:

```js
(function () {
  const id = 'my-nucleosome';
  const tr = (ru, en) => {
    D.i18n.pack('en', {strings: {[ru]: en}});
    return ru;
  };
  const caption = [
    tr('ДНК огибает восемь гистоновых цепей.', 'DNA wraps around eight histone chains.'),
    tr('Приблизим те же белковые координаты.', 'Zoom into the same protein coordinates.')
  ];
  const source = 'https://www.rcsb.org/structure/1KX5';
  D.i18n.pack('en', {notes: {[id]: [
    F.note('1KX5 is an experimental nucleosome model. Linkers and molecular dynamics are not inferred.', 'PDB 1KX5', source),
    F.note('Only the camera and emphasis change; coordinates remain fixed.', 'PDB 1KX5', source)
  ]}});
  D.deck.register({
    id, title: tr('ДНК и гистоны', 'DNA and histones'),
    notes: [
      F.note('1KX5 — экспериментальная модель нуклеосомы. Линкеры и динамика из неё не вычисляются.', 'PDB 1KX5', source),
      F.note('Меняются камера и выделение; координаты сохраняются.', 'PDB 1KX5', source)
    ],
    build(ctx) {
      const v = F.stage(ctx, tr('ДНК и гистоны', 'DNA and histones'), '', 'PDB 1KX5');
      const model = AtacStructureViews.create(v.svg);
      const state = {visibility: 1, stage: 0, turn: 0};
      const paint = () => model.paint(state);
      const driver = F.driver(state, paint);
      ctx.onDispose(driver.dispose);
      ctx.onDispose(model.dispose);
      v.caption(caption[0]); paint();
      ctx.step(() => {
        v.caption(caption[1]);
        return driver.to({stage: 1, turn: 24}, {duration: 2400});
      });
      return v.root;
    }
  });
})();
```

Для своего чтения или распределения замените фабрику и подключите `atac-data.js`, как в независимом примере. Включённые акторы чтения и количественных дорожек рассчитаны на F001, заданный локус и фиксированные поясняющие числа; это не универсальный визуализатор произвольного BAM. При смене данных согласуйте подписи, шкалы, QA и оба языка.

## Подпись возле движущегося объекта

```js
const labels = AtacCallouts.create(v.svg, {id: 'my-nearby-labels'});
ctx.onDispose(labels.dispose);
labels.add('detail', 'Деталь', 'Detail', {width: 140, height: 44});
// Выберите смещение один раз для конечной позы, затем сохраняйте его в движении.
labels.begin([[740, 350, 18]]); // x, y, радиус препятствия
const offset = labels.suggest('detail', {anchor: [640, 365], offset: [-70, 60]});
function paintLabels(anchor, obstacles) {
  labels.begin(obstacles);
  labels.place('detail', {anchor, offset, opacity: 1});
}
```

Препятствия — массив кругов `[x,y,r]` и/или прямоугольников `{x,y,width,height}` в той же системе SVG. Не вызывайте `suggest` на каждом кадре: выбор стороны тогда может перескакивать. `place` гасит подпись при недостаточном зазоре или слишком длинном указателе; геометрию молекулы он не перемещает. У каждой подписи уникальный ключ; после `dispose` создавайте новый экземпляр. Поле размещения рассчитано на стандартный 1280×720 холст.

## Научные и графические границы

- `1KX5` и `1MUH` — фиксированные источники. Локаторы и крупные планы сохраняют их геометрию. Гладкой оболочки вместо белка нет; штрихи не являются поверхностью Ван-дер-Ваальса.
- Гистоновые хвосты имеют конкретную депонированную укладку; нулевая заполненность отмечена пунктиром. Он не обозначает разрыв полипептида.
- Условные фланги и распрямление объясняют длину пути, не рассчитанную кинетику. Из длины одного фрагмента нельзя доказать нуклеосому.
- Чтение — педагогическая схема антипараллельных цепей и последовательных раундов. Реальная геометрия прибора и полная библиотечная химия не моделируются.
- Поиск минимумов энергии, молекулярная динамика и обработка FASTQ не входят в эти компоненты.

## Проверка компонентов

`node qa/atac/components.cjs` проверяет фактическую сборку `atac-components` в браузере: все состояния, промежуточную геометрию, RU/EN, оба шрифта и фона, сохранение узлов и очистку при смене сцен. Исходные структуры проверяет `node qa/atac/science.cjs`. Полный фильм дополнительно имеет [свою систему проверки](atac-seq.md#проверить-после-изменений). Контуры, подписи и смысл переходов просматривайте в экспортированном HTML после правок.
