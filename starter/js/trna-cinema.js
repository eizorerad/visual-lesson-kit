/* A bounded film clock on the lesson's cancellable F.driver. Scene actors stay
   owned by the author; update() is called at the end of the scene's paint. */
(function (global) {
  'use strict';
  function mount(ctx, options) {
    const {root, state, driver, duration, onCue, narrativeIndex} = options;
    const cues = (options.cues || []).map(cue => Object.freeze({...cue}));
    if (!root || !state || !Number.isFinite(state.time) || !driver ||
        !Number.isFinite(duration) || duration <= 0 || !cues.length ||
        cues[0].time !== 0 || cues.some((cue, i) => !Number.isFinite(cue.time) ||
          cue.time < 0 || cue.time > duration || (i && cue.time <= cues[i - 1].time))) {
      throw new TypeError('Cinema requires a root, numeric time, driver, duration and increasing cues starting at zero');
    }
    if(narrativeIndex!==undefined && typeof narrativeIndex!=='function') throw new TypeError('narrativeIndex must be a function');
    const deck = global.D.deck, h = global.D.dom.h;
    const chrome = document.getElementById('chrome');
    const previous = chrome.querySelector('[data-action="prev"]');
    const toggle = chrome.querySelector('[data-action="overview"]');
    const next = chrome.querySelector('[data-action="next"]');
    const speedButton = document.getElementById('speedToggle');
    const controls = [previous, toggle, next];
    const restoreAttributes = controls.map(button => ({button, attributes:
      ['title','aria-label','aria-controls','aria-expanded','aria-pressed','data-i18n-ignore']
        .map(name => [name, button.getAttribute(name)])}));
    controls.forEach(button => button.setAttribute('data-i18n-ignore',''));
    toggle.removeAttribute('aria-expanded');
    toggle.setAttribute('aria-controls','trnaTimeline');
    const glyph = h('span.trna-play-glyph', {'aria-hidden':'true'});
    const playWord = h('span.trna-play-word');
    toggle.append(glyph, playWord);

    const title = h('span.trna-cue-title');
    const clock = h('span.trna-clock');
    const status = h('span.trna-status', {role:'status','aria-live':'polite','aria-atomic':'true'});
    const slider = h('input.trna-seek', {type:'range',min:0,max:duration,step:0.01,value:state.time});
    const marks = h('div.trna-cue-marks', {'aria-hidden':'true'});
    const markers = cues.map(cue => {
      const marker = h('i', {style:{left:(100 * cue.time / duration)+'%'}});
      marks.append(marker); return marker;
    });
    const timeline = h('div.trna-timeline', {id:'trnaTimeline','data-no-swipe':'','data-i18n-ignore':''}, [
      h('div.trna-timeline-heading', {}, [title, clock]),
      h('div.trna-timeline-track', {}, [marks, slider]), status
    ]);
    document.body.append(timeline);
    document.body.classList.add('trna-cinema-active');

    let disposed = false, playing = false, transitioning = false, version = 0;
    let cueIndex = -1, language = '', timer = null, lastStatus = '';
    const reduce = global.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = value => Math.max(0, Math.min(duration, value));
    const phrase = (ru, en) => global.D.i18n.lang() === 'en' ? en : ru;
    const stamp = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2,'0');
    function endpointIndexAt(time) {
      let index = 0;
      for (let i = 1; i < cues.length && cues[i].time <= time + 1e-7; i++) index = i;
      return index;
    }
    function indexAt(time) {
      const index = narrativeIndex ? narrativeIndex(clamp(time)) : endpointIndexAt(time);
      if(!Number.isInteger(index) || index<0 || index>=cues.length) throw new RangeError('narrativeIndex must return a registered cue index');
      return index;
    }
    function current() { return {time:state.time,index:indexAt(state.time),playing,transitioning,duration}; }
    function update() {
      if (disposed) return;
      const time = clamp(state.time), index = indexAt(time), lang = global.D.i18n.lang();
      const changed = cueIndex !== index;
      if (changed || language !== lang) {
        cueIndex = index; language = lang;
        title.textContent = lang === 'en' ? cues[index].titleEn : cues[index].titleRu;
        markers.forEach((marker, i) => marker.classList.toggle('is-past', i <= index));
        previous.setAttribute('aria-label',phrase('Предыдущий эпизод','Previous cue'));
        previous.title = phrase('Предыдущий эпизод (←)','Previous cue (←)');
        next.setAttribute('aria-label',phrase('Следующий эпизод','Next cue'));
        next.title = phrase('Следующий эпизод (→)','Next cue (→)');
        slider.setAttribute('aria-label',phrase('Время фильма','Film time'));
        timeline.setAttribute('aria-label',phrase('Ход фильма','Film progress'));
      }
      slider.value = String(time);
      slider.style.setProperty('--trna-progress',(100 * time / duration)+'%');
      const timeText = stamp(time) + ' / ' + stamp(duration);
      if (clock.textContent !== timeText) clock.textContent = timeText;
      const controlWord = playing ? phrase('Пауза','Pause') :
        time >= duration ? phrase('Повторить','Replay') : phrase('Смотреть','Play');
      if (playWord.textContent !== controlWord) playWord.textContent = controlWord;
      const symbol = playing ? 'Ⅱ' : '▶';
      if (glyph.textContent !== symbol) glyph.textContent = symbol;
      toggle.setAttribute('aria-label',controlWord);
      toggle.title = controlWord + phrase(' (пробел)',' (Space)');
      toggle.setAttribute('aria-pressed',String(playing));
      toggle.classList.toggle('is-on',playing);
      timeline.classList.toggle('is-playing',playing);
      slider.setAttribute('aria-valuetext',stamp(time) + ' · ' + title.textContent);
      const statusText = (playing ? phrase('Воспроизведение','Playing') : phrase('Пауза','Paused')) + ' · ' + title.textContent;
      if (statusText !== lastStatus) { status.textContent = statusText; lastStatus = statusText; }
      // During build, deck.root() still belongs to the preceding mount. Never
      // synchronize that mount, nor rebuild actors to advance a note/hash.
      if (deck.root() === root && deck.syncPlaybackStep) deck.syncPlaybackStep(index);
      if (changed && typeof onCue === 'function') onCue(index, cues[index]);
    }
    function stop() {
      version++;
      if (timer !== null) { global.clearTimeout(timer); timer = null; }
      driver.cancel();
      playing = false; transitioning = false;
    }
    function pause() { if (!disposed) { stop(); update(); } }
    function seek(time) {
      if (!Number.isFinite(time)) throw new TypeError('Film time must be finite');
      if (disposed) return;
      stop(); driver.set({time:clamp(time)}); update();
    }
    function go(index, animate = false) {
      if (!Number.isFinite(index)) throw new TypeError('Cue index must be finite');
      if (disposed) return Promise.resolve({completed:false});
      index = Math.max(0, Math.min(cues.length - 1, Math.round(index)));
      const time = cues[index].time;
      stop();
      if (!animate || reduce.matches || Math.abs(time-state.time)<1e-7) {
        driver.set({time}); update(); return Promise.resolve({completed:true});
      }
      const run = version;
      transitioning = true;
      update();
      return driver.to({time},{duration:Math.abs(time-state.time)*1000,ease:'linear'})
        .then(result => {if(!disposed && version===run){transitioning=false;update();}return result;});
    }
    function holdNext(run) {
      if (disposed || version !== run || !playing) return;
      const target = cues.find(cue => cue.time > state.time + 1e-7);
      const time = target ? target.time : duration;
      if (time <= state.time) { playing = false; update(); return; }
      // Reduced motion retains reading time and uses discrete cue poses. A
      // full driver.to would otherwise finish the whole film synchronously.
      timer = global.setTimeout(() => {
        timer = null;
        if (disposed || version !== run || !playing) return;
        driver.set({time});
        if (time >= duration) playing = false;
        update();
        if (playing) holdNext(run);
      }, (time-state.time)*1000/speed());
    }
    function play() {
      if (disposed || playing) return;
      stop();
      if (state.time >= duration) driver.set({time:0});
      playing = true;
      const run = version;
      update();
      if (reduce.matches) { holdNext(run); return; }
      return driver.to({time:duration},{duration:(duration-state.time)*1000,ease:'linear'})
        .then(result => {
          if(!disposed && version===run){playing=false;update();}
          return result;
        });
    }
    function speed() {
      const label = document.getElementById('speedValue');
      const value = label ? parseFloat(label.textContent) : 1;
      return Number.isFinite(value) && value>0 ? value : 1;
    }
    function speedChanged() {
      // player.js updates A's speed first. Existing tweens retain their old
      // duration, so resume the same exact frame on a freshly timed driver.
      if(playing) { pause(); play(); }
    }
    function playPause() { return playing || transitioning ? pause() : play(); }
    function previousCue() { return go(indexAt(state.time)-1); }
    // A narrative can announce a pose before its endpoint is reached. Next
    // completes that incoming pose; Previous returns to the prior episode.
    function nextCue() { return go(endpointIndexAt(state.time)+1); }
    function click(event) {
      const button = event.target.closest && event.target.closest('#chrome [data-action]');
      if (!button) return;
      const action = button.dataset.action;
      if (!['prev','next','overview'].includes(action)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (action==='prev') previousCue();
      else if (action==='next') nextCue();
      else playPause();
    }
    function key(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
      const target = event.target;
      if (target.closest && target.closest('input,textarea,select,[contenteditable],#notes,#moreMenu,.help.is-on,.overview.is-on,.evidence-layer')) return;
      if (target.tagName==='BUTTON' && [' ','Enter'].includes(event.key)) return;
      let action;
      if ([' ','k','K'].includes(event.key)) action = playPause;
      else if (['ArrowRight','ArrowDown','PageDown'].includes(event.key)) action = nextCue;
      else if (['ArrowLeft','ArrowUp','PageUp'].includes(event.key)) action = previousCue;
      else if (['Home','r','R','к','К'].includes(event.key)) action = () => seek(0);
      else if (event.key==='End') action = () => seek(duration);
      if (!action) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) action();
    }
    function input() { seek(Number(slider.value)); }
    function seekKey(event) {
      if(event.metaKey || event.ctrlKey || event.altKey) return;
      let time;
      const increment = event.shiftKey ? 5 : 1;
      if(['ArrowRight','ArrowUp'].includes(event.key)) time = state.time + increment;
      else if(['ArrowLeft','ArrowDown'].includes(event.key)) time = state.time - increment;
      else if(event.key==='PageUp') time = state.time + 10;
      else if(event.key==='PageDown') time = state.time - 10;
      else if(event.key==='Home') time = 0;
      else if(event.key==='End') time = duration;
      if(time===undefined) return;
      event.preventDefault(); event.stopPropagation(); seek(time);
    }
    function visibility() { if(document.hidden) pause(); }
    function reduceChanged() { if(playing){pause();play();} }
    slider.addEventListener('input',input);
    slider.addEventListener('keydown',seekKey);
    if(speedButton) speedButton.addEventListener('click',speedChanged);
    document.addEventListener('click',click,true);
    global.addEventListener('keydown',key,true);
    document.addEventListener('visibilitychange',visibility);
    reduce.addEventListener('change',reduceChanged);
    const stopLanguage = global.D.i18n.onChange(update);
    // The native swipe adapter calls these public methods. Route those cue
    // changes through this clock, just like the shell and keyboard controls.
    const oldNext = deck.next, oldPrev = deck.prev;
    deck.next = nextCue; deck.prev = previousCue;
    const controller = {update,go,seek,play,pause,dispose,current,cues:Object.freeze(cues),duration};
    global.CINEMA = controller;
    global.TRNA_FILM = controller; // Compatibility alias for the original tRNA film.
    function dispose() {
      if(disposed) return;
      stop(); disposed = true;
      stopLanguage();
      slider.removeEventListener('input',input);
      slider.removeEventListener('keydown',seekKey);
      if(speedButton) speedButton.removeEventListener('click',speedChanged);
      document.removeEventListener('click',click,true);
      global.removeEventListener('keydown',key,true);
      document.removeEventListener('visibilitychange',visibility);
      reduce.removeEventListener('change',reduceChanged);
      if(deck.next===nextCue) deck.next=oldNext;
      if(deck.prev===previousCue) deck.prev=oldPrev;
      glyph.remove(); playWord.remove(); timeline.remove();
      toggle.classList.remove('is-on');
      restoreAttributes.forEach(({button,attributes}) => attributes.forEach(([name,value]) =>
        value===null ? button.removeAttribute(name) : button.setAttribute(name,value)));
      if(global.CINEMA===controller) delete global.CINEMA;
      if(global.TRNA_FILM===controller) {
        delete global.TRNA_FILM;
        document.body.classList.remove('trna-cinema-active');
      }
    }
    ctx.onDispose(dispose);
    update();
    // The deck attaches this root immediately after build() returns. Defer the
    // first sync so an opening cue also receives its correct note and hash.
    Promise.resolve().then(() => {if(!disposed){update();deck.refit();}});
    return controller;
  }
  global.Cinema = {mount};
})(window);
