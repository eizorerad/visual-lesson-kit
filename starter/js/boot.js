(function () {
  'use strict';
  function start() { window.D.deck.boot(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
