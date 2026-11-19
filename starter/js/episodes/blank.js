(function () {
  'use strict';
  const id = 'blank', title = 'Первая сцена', chapter = 'Урок';
  D.i18n.pack('en', {
    strings: { [title]: 'First scene', ['1 · ' + chapter]: '1 · Lesson' },
    notes: { [id]: [F.note('Use this note to explain what to look for in your drawing.')] }
  });

  D.deck.register({
    id, title, chapter,
    notes: [F.note('В этой заметке поясните, на что обратить внимание на рисунке.')],
    build(ctx) {
      const scene = F.stage(ctx, title, '', '');
      // Add your drawing to scene.svg (x: 60–1220, y: 147–610).
      return scene.root;
    }
  });
})();
