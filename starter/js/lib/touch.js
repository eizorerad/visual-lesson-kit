/* Canvas-only, one-finger navigation. Native scrolling and pinch are browser
   gestures: this observer never prevents their default events. */
(function (global) {
  'use strict';
  var SWIPE_MIN_X = 46, SWIPE_MAX_Y = 70, SWIPE_MAX_MS = 800, AXIS_RATIO = 1.5;
  var CHROME_LIT_MS = 3200;
  var CANVAS = '.film-viz, [data-swipe-canvas]';
  var CONTROLS = 'input, button, select, textarea, label, a, details, summary, [contenteditable]:not([contenteditable="false"]), [data-drag], [data-no-swipe], [role="button"], [role="slider"], [role="textbox"], [role="switch"], [role="checkbox"], [role="radio"], [role="scrollbar"], .notes, .overview, .evidence-layer, .help, .rotate';
  var active = new Set(), chordBlocked = false, gesture = null, hovered = [];
  var started = false, hinted = false, hint = null, hintTimers = [], litTimer = null;
  var visualViewport = null;
  var observe = { capture: true, passive: true };

  function byId(id) { return document.getElementById(id); }
  function isFinger(event) { return event.pointerType === 'touch'; }
  function markTouch() {
    if (document.body.classList.contains('is-touch')) return;
    document.body.classList.add('is-touch');
    if (global.D.deck && global.D.deck.refit) global.D.deck.refit();
    if (hinted) return;
    hinted = true;
    hint = document.createElement('div'); hint.className = 'touch-hint';
    hint.textContent = global.D.i18n.ui('swipeHint'); document.body.appendChild(hint);
    hintTimers.push(global.setTimeout(function () { if (hint) hint.classList.add('is-out'); }, 3600));
    hintTimers.push(global.setTimeout(function () { if (hint) hint.remove(); hint = null; }, 4400));
  }
  function lightChrome() {
    document.body.classList.add('chrome-lit');
    if (litTimer) global.clearTimeout(litTimer);
    litTimer = global.setTimeout(function () { document.body.classList.remove('chrome-lit'); }, CHROME_LIT_MS);
  }

  // Retain the source deck's touch-to-tooltip adaptation, only on the canvas.
  function fire(node, type, event) {
    node.dispatchEvent(new MouseEvent(type, { bubbles: false, cancelable: true, view: global,
      clientX: event.clientX, clientY: event.clientY }));
  }
  function leaveAll(event) {
    var last = hovered; hovered = [];
    last.forEach(function (node) { fire(node, 'mouseleave', event || { clientX: 0, clientY: 0 }); });
  }
  function enterAt(target, root, event) {
    if (!hovered.length || hovered[0] !== target) {
      leaveAll(event);
      for (var node = target; node && node !== root && node.nodeType === 1; node = node.parentNode) hovered.push(node);
    }
    hovered.forEach(function (node) { fire(node, 'mouseenter', event); });
  }
  function tipShowing() { var frame = byId('frame'); return !!(frame && frame.querySelector('.tip.is-on')); }

  function releaseCapture(move) {
    if (!move || !move.captured) return;
    move.captured = false;
    try {
      if (!move.canvas.hasPointerCapture || move.canvas.hasPointerCapture(move.id)) move.canvas.releasePointerCapture(move.id);
    } catch (_) { /* The browser may already have cancelled or released it. */ }
  }
  function clearGesture() {
    var old = gesture; gesture = null; // lostpointercapture can fire during release.
    releaseCapture(old);
  }
  function reset() { clearGesture(); active.clear(); chordBlocked = false; leaveAll(); }
  function isZoomed() { return !!(global.visualViewport && global.visualViewport.scale > 1.01); }
  function syncZoom() {
    var zoomed = isZoomed(); document.body.classList.toggle('is-zoomed', zoomed);
    if (zoomed) { clearGesture(); leaveAll(); }
  }
  function blockedStart(target, canvas) {
    if (target.closest(CONTROLS)) return true;
    var selection = global.getSelection && global.getSelection();
    if (selection && !selection.isCollapsed) return true;
    // An author may embed a scrolling reading pane inside a custom canvas.
    for (var node = target; node && node.nodeType === 1; node = node.parentElement) {
      var style = global.getComputedStyle(node);
      if ((/(auto|scroll|overlay)/.test(style.overflowY || style.overflow) && node.scrollHeight > node.clientHeight) ||
          (/(auto|scroll|overlay)/.test(style.overflowX || style.overflow) && node.scrollWidth > node.clientWidth)) return true;
      if (node === canvas) break;
    }
    return false;
  }
  function horizontal(move, event) {
    var dx = Math.abs(event.clientX - move.x), dy = Math.abs(event.clientY - move.y);
    return dx >= SWIPE_MIN_X && dy <= SWIPE_MAX_Y && dx >= AXIS_RATIO * dy && Date.now() - move.at <= SWIPE_MAX_MS;
  }
  function onDown(event) {
    if (!isFinger(event) || active.has(event.pointerId)) return;
    markTouch(); lightChrome(); active.add(event.pointerId);
    // Count contacts anywhere in the document, including controls and panels.
    if (active.size > 1 || event.isPrimary === false) { chordBlocked = true; clearGesture(); leaveAll(event); return; }
    if (chordBlocked) return;
    syncZoom();
    var target = event.target, frame = byId('frame');
    var canvas = target && target.closest && target.closest(CANVAS);
    if (isZoomed() || !frame || !canvas || !frame.contains(canvas) || blockedStart(target, canvas)) { leaveAll(event); return; }
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, at: Date.now(), canvas: canvas, blocked: false, captured: false };
    enterAt(target, frame, event);
    if (tipShowing()) gesture.blocked = true;
  }
  function onMove(event) {
    var move = gesture;
    if (!move || event.pointerId !== move.id) return;
    if (isZoomed()) { syncZoom(); return; }
    if (!move.canvas.isConnected) { clearGesture(); leaveAll(event); return; }
    var dx = Math.abs(event.clientX - move.x), dy = Math.abs(event.clientY - move.y);
    // Once a gesture declares vertical reading intent it never becomes a swipe.
    if (dy > SWIPE_MAX_Y || (dy >= 12 && dy > dx) || Date.now() - move.at > SWIPE_MAX_MS) {
      move.blocked = true; releaseCapture(move); leaveAll(event); return;
    }
    var target = document.elementFromPoint ? document.elementFromPoint(event.clientX, event.clientY) : event.target;
    if (target && move.canvas.contains(target)) enterAt(target, byId('frame'), event); else leaveAll(event);
    if (tipShowing()) { move.blocked = true; releaseCapture(move); return; }
    // Capture only a recognized swipe, never taps or a control's pointer stream.
    if (!move.blocked && !move.captured && horizontal(move, event) && move.canvas.setPointerCapture) {
      try { move.canvas.setPointerCapture(move.id); move.captured = true; } catch (_) { /* Document listeners still observe the release. */ }
    }
  }
  function finishContact(event) {
    active.delete(event.pointerId);
    if (!active.size) chordBlocked = false;
  }
  function onUp(event) {
    if (!isFinger(event) || !active.has(event.pointerId)) return;
    var move = gesture && gesture.id === event.pointerId ? gesture : null;
    var maySwipe = move && !move.blocked && !chordBlocked && active.size === 1 && move.canvas.isConnected && !isZoomed();
    if (move) clearGesture();
    finishContact(event);
    if (!maySwipe || !horizontal(move, event)) return;
    leaveAll(event);
    if (event.clientX < move.x) global.D.deck.next(); else global.D.deck.prev();
  }
  function onCancel(event) {
    if (!isFinger(event) || !active.has(event.pointerId)) return;
    if (gesture && gesture.id === event.pointerId) clearGesture();
    finishContact(event); leaveAll(event);
  }
  function onLostCapture(event) {
    // Lost capture is not a finger lift; keep its ID until up/cancel.
    // Explicit capture transfers the browser's initial implicit capture from
    // the touched mark to our canvas; that old mark's loss is expected.
    if (gesture && gesture.captured && event.target !== gesture.canvas) return;
    if (gesture && gesture.id === event.pointerId) { clearGesture(); leaveAll(event); }
  }
  function onVisibility() { if (document.hidden) reset(); }
  function dismissRotate() { document.body.classList.add('rotate-dismissed'); }

  function start() {
    if (started || !byId('stage')) return;
    started = true; visualViewport = global.visualViewport || null;
    if (global.navigator && global.navigator.maxTouchPoints > 0 && !global.matchMedia('(pointer: fine)').matches) markTouch();
    document.addEventListener('pointerdown', onDown, observe);
    document.addEventListener('pointermove', onMove, observe);
    document.addEventListener('pointerup', onUp, observe);
    document.addEventListener('pointercancel', onCancel, observe);
    document.addEventListener('lostpointercapture', onLostCapture, observe);
    document.addEventListener('visibilitychange', onVisibility);
    global.addEventListener('blur', reset);
    if (visualViewport) visualViewport.addEventListener('resize', syncZoom, { passive: true });
    var button = byId('rotateDismiss'); if (button) button.addEventListener('click', dismissRotate);
    syncZoom();
  }
  function stop() {
    if (!started) return;
    started = false; reset();
    document.removeEventListener('pointerdown', onDown, observe);
    document.removeEventListener('pointermove', onMove, observe);
    document.removeEventListener('pointerup', onUp, observe);
    document.removeEventListener('pointercancel', onCancel, observe);
    document.removeEventListener('lostpointercapture', onLostCapture, observe);
    document.removeEventListener('visibilitychange', onVisibility);
    global.removeEventListener('blur', reset);
    if (visualViewport) visualViewport.removeEventListener('resize', syncZoom);
    visualViewport = null;
    var button = byId('rotateDismiss'); if (button) button.removeEventListener('click', dismissRotate);
    hintTimers.forEach(global.clearTimeout); hintTimers = [];
    if (hint) hint.remove(); hint = null;
    if (litTimer) global.clearTimeout(litTimer); litTimer = null;
    document.body.classList.remove('chrome-lit');
  }
  global.D = global.D || {};
  global.D.touch = { start: start, stop: stop, isOn: function () { return document.body.classList.contains('is-touch'); } };
})(window);
