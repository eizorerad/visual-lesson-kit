/* The viewer. A scene registers { id, chapter, title, notes, qa?, build }.
   build(ctx) returns the scene's root element and declares its builds with
   ctx.step(fn): pressing → plays the next build, and only when a scene has
   no builds left does → move to the next scene. Going back a build rebuilds
   the scene and replays the earlier builds instantly, so a scene can always
   be shown at any point of its story. */
(function (global) {
  'use strict';

  var h = global.D.dom.h;
  var A = global.A;

  var registry = [];
  function storageKey() { return 'lesson-notes:' + String((global.LESSON || {}).id || global.location.pathname); }
  var state = { index: 0, notesOpen: false, panel: 'notes', guideQuery: '', overviewOpen: false, helpOpen: false, moreOpen: false, jump: '', busy: false, labelsHidden: false };
  var labelsTimer = null;
  var mount = null;
  var buildVersion = 0;
  var CANVAS = { width: 1280, height: 720 };
  var currentScale = 1;
  /* Below this a readable column and the drawing need separate surfaces. */
  var NARROW_WIDTH = 1080;
  var SHORT_HEIGHT = 520;
  var insetProbe = null;
  /* Keys the deck itself handles; a held one must not race the deck, while
     any other repeated key (Tab, browser shortcuts) keeps its native effect. */
  var DECK_KEYS = /^(?:[0-9]|Enter|Arrow(?:Right|Down|Left|Up)| |Page(?:Up|Down)|Home|End|Escape|\?|[rRкКnNтТqQйЙgGпПlLдДoOщЩfFаА])$/;

  function viewport() {
    var width = window.innerWidth, height = window.innerHeight;
    return {
      width: width, height: height,
      narrow: width < NARROW_WIDTH || height < SHORT_HEIGHT,
      portrait: height > width && width < NARROW_WIDTH
    };
  }

  /* The home indicator's strip, straight from the browser rather than guessed. */
  function safeBottom() {
    if (!insetProbe) {
      insetProbe = h('div.inset-probe');
      insetProbe.style.cssText = 'position:fixed;left:-9999px;bottom:0;width:0;height:0;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px);';
      document.body.appendChild(insetProbe);
    }
    return parseFloat(window.getComputedStyle(insetProbe).paddingBottom) || 0;
  }

  function register(scene) { scene.chapter=(registry.length+1)+' · '+String(scene.chapter||'').replace(/^\d+\s*[·]\s*/,'');registry.push(scene); }
  function byId(id) { return document.getElementById(id); }

  function fit() {
    var frame = byId('frame');
    if (!frame) return;
    var view = viewport();
    document.body.classList.toggle('is-narrow', view.narrow);
    document.body.classList.toggle('is-portrait', view.portrait);
    document.body.classList.remove('bar-side');
    var stage = byId('stage');
    if (stage) stage.inert = view.narrow && state.notesOpen;
    /* Five fixed controls: layout never depends on localized labels, number
       of steps, font loading, or a measured/wrapped toolbar. */
    var notesWidth = state.notesOpen && !view.narrow ? 430 : 0;
    var stageWidth = Math.max(120, view.width - notesWidth);
    document.body.style.setProperty('--toolbar-side-space', '0px');
    document.body.style.setProperty('--toolbar-available-width', stageWidth + 'px');
    document.body.style.setProperty('--notes-shift', (notesWidth / 2) + 'px');
    var notes = byId('notes');
    if (notes) notes.style.width = view.narrow ? '' : '430px';
    var stageHeight = Math.max(120, view.height);
    var margin = stageWidth > 620 ? 32 : 8;
    var reserveTop = stageHeight > 460 ? 10 : 4;
    var cinemaReserve = parseFloat(window.getComputedStyle(document.body).getPropertyValue('--cinema-bottom-reserve'));
    cinemaReserve = Number.isFinite(cinemaReserve) ? Math.max(0, cinemaReserve) : 0;
    var reserveBottom = 72 + safeBottom() + cinemaReserve;
    document.body.style.setProperty('--toolbar-bottom-space', reserveBottom + 'px');
    var usable = Math.max(1, stageHeight - reserveTop - reserveBottom);
    var scale = Math.min((stageWidth - margin) / CANVAS.width, usable / CANVAS.height);
    currentScale = scale;
    var left = (stageWidth - CANVAS.width * scale) / 2;
    var top = reserveTop + (usable - CANVAS.height * scale) / 2;
    frame.style.transform = 'translate(' + left.toFixed(1) + 'px, ' + top.toFixed(1) + 'px) scale(' + scale.toFixed(4) + ')';
  }

  function errorBox(error, scene) {
    return h('div.scene-error', {}, [
      h('strong', 'Scene failed to build: ' + scene.title),
      h('code', String(error && error.stack ? error.stack : error))
    ]);
  }

  /* Build scene `index` and replay its first `upto` builds instantly. */
  function buildScene(index, upto) {
    var frame = byId('frame');
    if (global.F && global.F.motionBridge) global.F.motionBridge.cancel();
    /* A direct show/deep link cancels any prior entry effect immediately. */
    frame.classList.remove('scene-enter');
    var version = ++buildVersion;
    if (mount && mount.dispose) mount.dispose();
    global.D.dom.clear(frame);
    A.finishAll();
    /* A switch in the middle of a build: the old step's promise resolves later
       against a different mount and never clears these, so clear them here. */
    A.setInstant(false);
    state = Object.assign({}, state, { busy: false });
    var scene = registry[index];
    var steps = [];
    var cleanups = [], disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      cleanups.splice(0).forEach(function (fn) {
        try { fn(); } catch (error) { console.error(error); }
      });
    }
    var ctx = {
      step: function (fn) { steps.push(fn); },
      onDispose: function (fn) {
        if (typeof fn !== 'function') throw new TypeError('onDispose requires a function');
        if (disposed) fn(); else cleanups.push(fn);
      },
      index: index,
      scene: scene
    };
    var root;
    try {
      root = scene.build(ctx);
    } catch (error) {
      dispose();
      console.error(error);
      root = errorBox(error, scene);
      steps = [];
    }
    frame.appendChild(root);
    var target = upto === 'last' ? steps.length : Math.max(0, Math.min(steps.length, upto || 0));
    var next = { index: index, root: root, steps: steps, step: target, playing: null, dispose: dispose };
    mount = next;
    if (target > 0) {
      A.setInstant(true);
      state = Object.assign({}, state, { busy: true });
      var chain = Promise.resolve();
      for (var i = 0; i < target; i += 1) {
        (function (fn) {
          chain = chain.then(function () { if (version === buildVersion) return fn(); });
        })(steps[i]);
      }
      next.ready = chain.catch(function (error) { console.error(error); }).then(function () {
        if (version !== buildVersion) return;
        A.setInstant(false);
        mount = next;
        state = Object.assign({}, state, { busy: false });
        updateChrome();
      });
    } else {
      mount = next;
    }
    return mount;
  }

  function questions(scene) {
    var localized = global.D.i18n.qa(scene);
    return Array.isArray(localized) ? localized.filter(function (item) {
      return item && typeof item.q === 'string' && typeof item.a === 'string';
    }) : [];
  }

  function plainText(html) { return h('div', { html: html || '' }).textContent; }

  function sourceUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return '';
    try {
      var url = new URL(value.trim());
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (error) { return ''; }
  }

  function questionCard(item, open) {
    var label = typeof item.source === 'string' ? item.source : '';
    var url = sourceUrl(item.url);
    var source = url ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, label || 'Источник') : label;
    return h('details.qa-item', { open: open }, [
      h('summary', item.q), h('div.qa-answer', { html: item.a }),
      source ? h('p.qa-source', {}, source) : null
    ]);
  }

  function renderGuideResults(body) {
    var results = body.querySelector('.qa-guide-results');
    if (!results) return;
    global.D.dom.clear(results);
    var query = state.guideQuery.trim().toLocaleLowerCase();
    var total = 0;
    registry.forEach(function (scene, index) {
      var title = plainText(global.D.i18n.text(scene.title));
      var matches = questions(scene).filter(function (item) {
        return [title, item.q, plainText(item.a), item.source || ''].join(' ').toLocaleLowerCase().indexOf(query) >= 0;
      });
      if (!matches.length) return;
      total += matches.length;
      var group = h('section.qa-scene-group');
      group.appendChild(h('button.qa-scene-jump', {
        type: 'button', 'aria-current': index === mount.index ? 'step' : 'false',
        onClick: function () {
          state = Object.assign({}, state, { panel: 'questions' });
          show(index, 0); setNotes(true); body.focus();
        }
      }, (index + 1) + ' · ' + title));
      matches.forEach(function (item) { group.appendChild(questionCard(item, !!query)); });
      results.appendChild(group);
    });
    body.querySelector('.qa-result-count').textContent = 'Найдено вопросов: ' + total;
    if (!total) results.appendChild(h('p.notes-empty', 'Нет вопросов по этому запросу.'));
  }

  function renderQuestions(body, scene) {
    var samePanel = body.dataset.panel === state.panel;
    var sameScene = body.dataset.sceneIndex === String(mount.index);
    var sameLanguage = body.dataset.lang === global.D.i18n.lang();
    if (samePanel && sameScene && sameLanguage) return;
    var disclosures = samePanel && sameScene ? Array.from(body.querySelectorAll('.qa-item')).map(function(el){return el.open;}) : [];
    var readingTargets = '.qa-item summary, .qa-item a, .qa-guide-toggle';
    var readingFocus = Array.from(body.querySelectorAll(readingTargets)).indexOf(document.activeElement);
    if (state.panel === 'guide' && samePanel) {
      renderGuideResults(body);
    } else {
      global.D.dom.clear(body);
      if (state.panel === 'questions') {
        body.appendChild(h('p.qa-scene-title', plainText(global.D.i18n.text(scene.title))));
        questions(scene).forEach(function (item) { body.appendChild(questionCard(item, true)); });
        if (!questions(scene).length) body.appendChild(h('p.notes-empty', 'К этой сцене пока нет вопросов. Откройте пояснения или все вопросы урока.'));
        body.appendChild(h('button.qa-guide-toggle', { type: 'button', onClick: function () { togglePanel('guide'); } }, 'Все вопросы урока · поиск'));
      } else {
        var search = h('input.qa-search', {
          id: 'qaSearch', type: 'search', value: state.guideQuery, placeholder: 'Вопрос, ответ или источник',
          onInput: function () { state = Object.assign({}, state, { guideQuery: search.value }); renderGuideResults(body); }
        });
        body.appendChild(h('label.qa-search-label', { htmlFor: 'qaSearch' }, 'Поиск по всем сценам'));
        body.appendChild(search);
        body.appendChild(h('p.qa-result-count', { role: 'status', 'aria-live': 'polite' }));
        body.appendChild(h('div.qa-guide-results'));
        renderGuideResults(body);
      }
      body.scrollTop = 0;
    }
    body.dataset.panel = state.panel;
    body.dataset.sceneIndex = String(mount.index);
    body.dataset.lang = global.D.i18n.lang();
    if (!sameLanguage) Array.from(body.querySelectorAll('.qa-item')).forEach(function(el,i){if(i<disclosures.length)el.open=disclosures[i];});
    global.D.i18n.apply(body);
    if (!sameLanguage && readingFocus >= 0) {
      var restoredFocus = body.querySelectorAll(readingTargets)[readingFocus];
      if (restoredFocus) restoredFocus.focus();
    }
  }

  function renderNotes() {
    var body = byId('notesBody');
    if (!body || !mount) return;
    var scene = registry[mount.index];
    var heading = byId('notesHead');
    if (heading) heading.textContent = state.panel === 'questions' ? 'Вопросы и ответы · сцена ' + (mount.index + 1) :
      state.panel === 'guide' ? 'Все вопросы · поиск по уроку' : global.D.i18n.ui('notesHead');
    var panel = byId('notes');
    if (panel) panel.dataset.mode = state.panel;
    body.setAttribute('aria-labelledby', 'tab-' + state.panel);
    body.tabIndex = 0;
    if (state.panel !== 'notes') { renderQuestions(body, scene); return; }
    var notes = global.D.i18n.notes(scene);
    var sameNotes = body.dataset.panel === 'notes' && body.dataset.sceneIndex === String(mount.index) && body.dataset.lang === global.D.i18n.lang();
    var list = notes ? (Array.isArray(notes) ? notes : [notes]) : [];
    var perBuild = list.length === mount.steps.length && list.length > 1;
    var now = Math.min(perBuild ? Math.max(0, mount.step - 1) : mount.step, list.length - 1);
    var sourceOpen = !!(sameNotes && body.querySelector('.note-provenance[open]'));
    if (!sameNotes) {
      var previousSource = body.querySelector('.note-provenance');
      sourceOpen = previousSource ? previousSource.open : false;
      global.D.dom.clear(body);
      body.appendChild(h('h2.qa-scene-title', plainText(global.D.i18n.text(scene.title))));
      if (!notes) body.appendChild(h('p.notes-empty', global.D.i18n.ui('notesEmpty')));
      list.forEach(function (text, i) {
        var block = h('div.note-block', { html: text });
        if (list.length > 1) block.insertBefore(h('span.note-step', String(i + 1)), block.firstChild);
        body.appendChild(block);
      });
      var provenance = mount.root.querySelector('.film-source, .lesson-source');
      if (provenance && provenance.textContent.trim()) body.appendChild(h('details.note-provenance', { open: sourceOpen }, [h('summary', 'Сведения об источнике'), h('p', provenance.textContent)]));
      body.dataset.panel = 'notes';
      body.dataset.sceneIndex = String(mount.index);
      body.dataset.lang = global.D.i18n.lang();
      body.dataset.step = '';
      body.scrollTop = 0;
    }
    Array.from(body.querySelectorAll('.note-block')).forEach(function (block, i) {
      block.classList.toggle('is-now', i === now);
      block.classList.toggle('is-done', i < now);
    });
    var current = body.querySelector('.is-now');
    if (state.notesOpen && body.dataset.step !== String(now) && current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
    body.dataset.step = String(now);
    global.D.i18n.apply(body);
  }

  function updateChrome() {
    if (!mount) return;
    var index = mount.index;
    var counter = byId('counter');
    if (counter) counter.textContent = (index + 1) + ' / ' + registry.length;
    var stepCount = byId('stepCount');
    if (stepCount) stepCount.textContent = 'Шаг ' + (mount.step + 1) + ' / ' + (mount.steps.length + 1);
    var tag = byId('actTag');
    if (tag) tag.textContent = registry[index].chapter || '';
    var dots = byId('stepDots');
    if (dots) {
      global.D.dom.clear(dots);
      for (var i = 0; i <= mount.steps.length; i += 1) {
        dots.appendChild(h('i' + (i <= mount.step ? '.is-done' : '')));
      }
    }
    var bar = byId('progressBar');
    if (bar) bar.style.width = (((index + 1) / registry.length) * 100).toFixed(2) + '%';
    Array.prototype.forEach.call(document.querySelectorAll('.ov-card'), function (card) {
      card.classList.toggle('is-current', parseInt(card.dataset.index, 10) === index);
    });
    renderNotes();
    if (byId('chrome')) global.D.i18n.apply(byId('chrome'));
    if (global.history && global.history.replaceState) {
      global.history.replaceState(null, '', '#' + (index + 1) + (mount.step ? '.' + mount.step : ''));
    }
  }

  function show(index, step) {
    var next = Math.max(0, Math.min(registry.length - 1, index));
    buildScene(next, step === undefined ? 0 : step);
    state = Object.assign({}, state, { index: next });
    updateChrome();
  }

  /* An authored continuous film may move between registered cue notes without
     rebuilding its persistent actors. Only an attached active root may sync. */
  function syncPlaybackStep(step) {
    if (!mount || !mount.root.isConnected) return false;
    if (!Number.isInteger(step) || step < 0 || step > mount.steps.length) throw new RangeError('Playback step must name a registered cue');
    if (mount.step === step) return false;
    mount.step = step;
    updateChrome();
    return true;
  }

  function playStep() {
    if (global.F && global.F.motionBridge) global.F.motionBridge.cancel();
    var activeMount = mount;
    var fn = mount.steps[mount.step];
    mount.step += 1;
    state = Object.assign({}, state, { busy: true });
    updateChrome();
    var done = Promise.resolve().then(function () { if (mount === activeMount) return fn(); });
    mount.playing = done;
    done.catch(function (error) { console.error(error); }).then(function () {
      if (mount.playing === done) {
        mount.playing = null;
        A.setInstant(false);
        state = Object.assign({}, state, { busy: false });
      }
    });
  }

  /* Navigation-only entry: the old mount is disposed by show() before the
     new scene fades in. No deferred DOM swap, animation callback or timer can
     write to a later mount. Direct show() and hash replay remain synchronous. */
  function navigateScene(index, step) {
    var bridge = global.F && global.F.motionBridge;
    if (bridge) bridge.cancel();
    var continuity = bridge && mount ? bridge.capture(mount.root) : null;
    show(index, step);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var incoming = mount;
    function enter() {
      if (mount !== incoming) return;
      if (bridge && bridge.play(continuity, incoming.root)) return;
      var frame = byId('frame');
      if (frame) { void frame.offsetWidth; frame.classList.add('scene-enter'); }
    }
    if (bridge && incoming.ready) incoming.ready.then(enter); else enter();
  }

  function next() {
    if (!mount) return;
    if (state.busy) {
      /* Finish the build in flight, including whatever it chains next. */
      A.setInstant(true);
      A.finishAll();
      return;
    }
    if (mount.step < mount.steps.length) playStep();
    else if (mount.index + 1 < registry.length) navigateScene(mount.index + 1, 0);
  }

  function prev() {
    if (!mount) return;
    if (state.busy) { A.setInstant(true); A.finishAll(); return; }
    if (mount.step > 0) { buildScene(mount.index, mount.step - 1); updateChrome(); return; }
    if (mount.index > 0) navigateScene(mount.index - 1, 'last');
  }

  function nextScene() { if (mount && mount.index + 1 < registry.length) navigateScene(mount.index + 1, 0); }
  function prevScene() { if (mount && mount.index > 0) navigateScene(mount.index - 1, 0); }

  function jump(id) {
    var found = -1;
    registry.forEach(function (scene, index) { if (scene.id === id) found = index; });
    if (found >= 0) show(found, 0);
  }

  function setNotes(open) {
    state = Object.assign({}, state, { notesOpen: open });
    document.body.classList.toggle('notes-open', open);
    try { global.localStorage.setItem(storageKey(), open ? '1' : '0'); } catch (error) { /* storage may be unavailable */ }
    ['notes', 'questions', 'guide'].forEach(function (mode) {
      Array.from(document.querySelectorAll('[data-action="' + mode + '"]')).forEach(function (button) {
        var active = open && state.panel === mode;
        button.classList.toggle('is-on', active);
        button.setAttribute('aria-pressed', String(active));
        if (button.getAttribute('role') === 'tab') {
          button.setAttribute('aria-selected', String(state.panel === mode));
          button.tabIndex = state.panel === mode ? 0 : -1;
        } else {
          button.setAttribute('aria-expanded', String(active));
          button.setAttribute('aria-controls', 'notes');
        }
      });
    });
    var trigger = document.querySelector('[data-action="reading"]');
    if (trigger) {
      trigger.classList.toggle('is-on', open);
      trigger.setAttribute('aria-expanded', String(open));
    }
    var panel = byId('notes');
    if (panel) {
      if (!open && panel.contains(document.activeElement)) {
        if (trigger) trigger.focus();
        else {
          var legacyTrigger = document.querySelector('#chrome [data-action="' + state.panel + '"]');
          if (legacyTrigger) legacyTrigger.focus();
        }
      }
      panel.inert = !open;
    }

    fit();
  }

  function togglePanel(mode, keepOpen) {
    var close = !keepOpen && state.notesOpen && state.panel === mode;
    setMore(false);
    state = Object.assign({}, state, { panel: mode });
    setNotes(!close);
    renderNotes();
    if (!close && mode !== 'guide') {
      var activeTab = byId('tab-' + mode);
      if (activeTab) activeTab.focus();
    }
    if (!close && mode === 'guide') {
      var search = byId('qaSearch');
      if (search) search.focus();
    }
  }

  function setOverview(open) {
    state = Object.assign({}, state, { overviewOpen: open });
    var panel = byId('overview');
    if (panel) panel.classList.toggle('is-on', open);
    var button = document.querySelector('[data-action="overview"]');
    if (button) { button.classList.toggle('is-on', open); button.setAttribute('aria-expanded', String(open)); }
    if (open) { setMore(false); var first = panel && panel.querySelector('.ov-card.is-current, .ov-card'); if (first) first.focus(); }
    else if (panel && panel.contains(document.activeElement) && button) button.focus();
  }

  function setMore(open) {
    state = Object.assign({}, state, { moreOpen: open });
    var menu = byId('moreMenu'), button = document.querySelector('[data-action="more"]');
    if (menu) menu.hidden = !open;
    if (button) { button.setAttribute('aria-expanded', String(open)); button.classList.toggle('is-on', open); }
    if (open && menu) { var first = menu.querySelector('button:not([hidden])'); if (first) first.focus(); }
    else if (menu && menu.contains(document.activeElement) && button) button.focus();
  }

  function setHelp(open) {
    if (open) setMore(false);
    state = Object.assign({}, state, { helpOpen: open });
    var panel = byId('help');
    if (panel) panel.classList.toggle('is-on', open);
  }

  // Labels toggle (T / Е): every on-stage text, title and caption fades out and back,
  // so the drawing can be looked at alone. The state is not persisted.
  function syncLabelsButton() {
    var hidden = state.labelsHidden, text = hidden ? 'Показать надписи' : 'Скрыть надписи';
    Array.from(document.querySelectorAll('[data-action="labels"]')).forEach(function (button) {
      button.classList.toggle('is-on', hidden);
      button.setAttribute('aria-pressed', String(hidden));
      button.setAttribute('title', global.D.i18n.text(text + ' (T / Е)'));
      button.setAttribute('aria-label', global.D.i18n.text(text));
    });
  }

  function setLabels(hidden) {
    state = Object.assign({}, state, { labelsHidden: hidden });
    var body = document.body;
    body.classList.add('labels-fading');
    body.classList.toggle('labels-hidden', hidden);
    global.clearTimeout(labelsTimer);
    labelsTimer = global.setTimeout(function () { if (document.body) document.body.classList.remove('labels-fading'); }, 450);
    syncLabelsButton();
  }

  function applyLanguage() {
    var head = byId('notesHead');
    if (head) head.textContent = global.D.i18n.ui('notesHead');
    document.documentElement.setAttribute('data-lang', global.D.i18n.lang());
    syncLabelsButton();
    Array.from(document.querySelectorAll('[data-action="language"]')).forEach(function (button) {
      button.hidden = global.D.i18n.languages().length < 2;
      var value = button.querySelector('[data-language-value]');
      if (value) value.textContent = global.D.i18n.label(); else button.textContent = global.D.i18n.label();
      button.setAttribute('aria-label', 'Язык: ' + global.D.i18n.label());
    });
    global.D.i18n.apply(document.body);
  }

  function buildOverview() {
    var grid = byId('overviewGrid');
    if (!grid) return;
    var lastChapter = null;
    registry.forEach(function (scene, index) {
      if (scene.chapter !== lastChapter) {
        lastChapter = scene.chapter;
        grid.appendChild(h('h3.ov-chapter', scene.chapter || ''));
      }
      grid.appendChild(h('button.ov-card', {
        type: 'button', dataset: { index: index },
        onClick: function () { setOverview(false); show(index, 0); }
      }, [h('span.ov-num', String(index + 1)), h('span.ov-title', { html: scene.title })]));
    });
  }

  function toggleFullscreen() {
    var root = document.documentElement;
    if (!document.fullscreenElement) {
      if (root.requestFullscreen) root.requestFullscreen().catch(function () { document.body.classList.add('is-presenting'); });
      document.body.classList.add('is-presenting');
      return;
    }
    if (document.exitFullscreen) document.exitFullscreen().catch(function () { /* already out */ });
    document.body.classList.remove('is-presenting');
  }

  function flashJump() {
    var badge = byId('jumpBadge');
    if (!badge) return;
    badge.textContent = state.jump;
    badge.classList.toggle('is-on', state.jump.length > 0);
  }

  function handleKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    var typing = target && ((target.matches && target.matches('input, textarea, select')) || target.isContentEditable);
    if (typing && event.key !== 'Escape') return;
    var inNotes = target && target.closest && target.closest('#notes');
    var inMore = target && target.closest && target.closest('#moreMenu');
    if (inMore && !/^(?:Escape|[lLдД])$/.test(event.key)) return;
    var panelShortcut = /^(?:Escape|[nNтТqQйЙgGпПlLдД])$/.test(event.key);
    // Leave details activation and native/repeated scrolling to the panel.
    if (inNotes && !panelShortcut) return;
    if (event.repeat) { if (DECK_KEYS.test(event.key)) event.preventDefault(); return; }
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) {
      if (event.key !== 'Escape' && target.tagName !== 'BUTTON') return;
      if (target.tagName === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
    }
    if (event.key >= '0' && event.key <= '9') {
      state = Object.assign({}, state, { jump: (state.jump + event.key).slice(0, 3) });
      flashJump();
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && state.jump) {
      var to = parseInt(state.jump, 10) - 1;
      state = Object.assign({}, state, { jump: '' });
      flashJump();
      show(to, 0);
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        if (event.shiftKey) nextScene(); else next();
        event.preventDefault(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        if (event.shiftKey) prevScene(); else prev();
        event.preventDefault(); break;
      case 'Home': show(0, 0); event.preventDefault(); break;
      case 'End': show(registry.length - 1, 'last'); event.preventDefault(); break;
      case 'r': case 'R': case 'к': case 'К': if (mount) { buildScene(mount.index, 0); updateChrome(); } break;
      case 'n': case 'N': case 'т': case 'Т': togglePanel('notes'); break;
      case 'q': case 'Q': case 'й': case 'Й': togglePanel('questions'); break;
      case 'g': case 'G': case 'п': case 'П': togglePanel('guide'); break;
      case 'l': case 'L': case 'д': case 'Д': global.D.i18n.toggle(); break;
      case 't': case 'T': case 'е': case 'Е': setLabels(!state.labelsHidden); break;
      case 'o': case 'O': case 'щ': case 'Щ': setOverview(!state.overviewOpen); break;
      case 'f': case 'F': case 'а': case 'А': toggleFullscreen(); break;
      case '?': setHelp(!state.helpOpen); break;
      case 'Escape':
        if (state.moreOpen) setMore(false);
        else if (state.helpOpen) setHelp(false);
        else if (state.overviewOpen) setOverview(false);
        else if (state.notesOpen) setNotes(false);
        else if (document.fullscreenElement) toggleFullscreen();
        break;
      default:
        if (state.jump) { state = Object.assign({}, state, { jump: '' }); flashJump(); }
    }
  }

  function bindChrome() {
    var actions = {
      prev: prev, next: next,
      overview: function () { setOverview(!state.overviewOpen); },
      'close-overview': function () { setOverview(false); },
      reading: function () {
        setMore(false);
        if (state.notesOpen) setNotes(false); else togglePanel(state.panel, true);
      },
      'close-reading': function () { setNotes(false); },
      more: function () { setMore(!state.moreOpen); },
      notes: function (button) { togglePanel('notes', button.getAttribute('role') === 'tab'); },
      questions: function (button) { togglePanel('questions', button.getAttribute('role') === 'tab'); },
      guide: function (button) { togglePanel('guide', button.getAttribute('role') === 'tab'); },
      language: function () { global.D.i18n.toggle(); },
      labels: function () { setLabels(!state.labelsHidden); },
      fullscreen: function () { setMore(false); toggleFullscreen(); },
      help: function () { setHelp(!state.helpOpen); }
    };
    document.addEventListener('click', function (event) {
      var target = event.target;
      var button = target.closest && target.closest('[data-action]');
      if (button && button.closest('#chrome, #notes, #moreMenu, #overview')) {
        var run = actions[button.dataset.action];
        if (run) run(button);
      } else if (state.moreOpen && !(target.closest && target.closest('#moreMenu'))) setMore(false);
    });
    var tabs = document.querySelector('.reading-tabs');
    if (tabs) tabs.addEventListener('keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      var buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
      var index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = buttons.length - 1;
      else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); event.stopPropagation();
      togglePanel(buttons[index].dataset.action, true);
      buttons[index].focus();
    });
    var menu = byId('moreMenu');
    if (menu) menu.addEventListener('keydown', function (event) {
      if (event.target.matches('select, input, textarea')) return;
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      var buttons = Array.from(menu.querySelectorAll('button:not([hidden]), summary, details[open] select'));
      var index = buttons.indexOf(document.activeElement);
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = buttons.length - 1;
      else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); event.stopPropagation(); buttons[index].focus();
    });
    var help = byId('help');
    if (help) help.addEventListener('click', function () { setHelp(false); });
  }

  function boot() {
    if (!registry.length) return;
    global.D.i18n.start();
    if (global.D.appearance) global.D.appearance.bind();
    global.D.touch.start();
    global.D.i18n.onChange(function () {
      var body = byId('notesBody'), scroll = body ? body.scrollTop : 0;
      applyLanguage(); renderNotes();
      if (body) body.scrollTop = scroll;
      fit();
    });
    applyLanguage();
    buildOverview();
    bindChrome();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', function () { window.setTimeout(fit, 60); });
    document.addEventListener('fullscreenchange', function () {
      document.body.classList.toggle('is-presenting', !!document.fullscreenElement);
      fit();
    });
    var saved = null;
    try { saved = global.localStorage.getItem(storageKey()); } catch (error) { saved = null; }
    setNotes(saved === null ? false : saved !== '0');
    showFromHash();
    /* Typing #N into the address bar, or a link with a hash, moves the deck. */
    window.addEventListener('hashchange', function () {
      var target = parseHash();
      if (mount && target.index === mount.index && target.step === mount.step) return;
      show(target.index, target.step);
    });
    fit();
  }

  function parseHash() {
    var parts = String(global.location.hash || '').replace('#', '').split('.');
    var fromHash = parseInt(parts[0], 10);
    var stepHash = parseInt(parts[1], 10);
    return { index: isNaN(fromHash) ? 0 : fromHash - 1, step: isNaN(stepHash) ? 0 : stepHash };
  }

  function showFromHash() {
    var target = parseHash();
    show(target.index, target.step);
  }

  global.D.deck = {
    register: register, boot: boot, show: show, jump: jump, next: next, prev: prev, refit: fit, syncPlaybackStep: syncPlaybackStep,
    count: function () { return registry.length; },
    scale: function () { return currentScale; },
    labels: function (hidden) { if (hidden !== undefined) setLabels(!!hidden); return state.labelsHidden; },
    current: function () { return mount ? { index: mount.index, step: mount.step, steps: mount.steps.length, busy: state.busy } : null; },
    steps: function () { return mount ? mount.steps.slice() : []; },
    root: function () { return mount ? mount.root : null; },
    scenes: function () { return registry.map(function (s) { return { id: s.id, title: s.title, chapter: s.chapter, notes: Array.isArray(s.notes) ? s.notes.length : (s.notes ? 1 : 0) }; }); }
  };
})(window);
