(function (root) {
  'use strict';
  root.IgneousObservation = { createLab };

  function createLab(context) {
    const { els, rockTable, getConditions, resetResultText, onComplete, openPhotoModal, hideTip, showTip } = context;
    const core = root.IgneousObservationCore;
    const windowEl = els.coolingScene.closest('.cooling-window');
    const app = document.querySelector('.app');
    const pauseBtn = document.getElementById('pausePlayback');
    const replayBtn = document.getElementById('replayPlayback');
    const timeInput = document.getElementById('playbackTime');
    const timeText = document.getElementById('playbackPosition');
    const nextBtn = document.getElementById('nextExperiment');
    const predictionNote = document.getElementById('predictionRecord');
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    const compareHistoryBtn = document.getElementById('compareHistoryBtn');
    const historyModal = document.getElementById('historyModal');
    const historyGrid = document.getElementById('historyCompareGrid');
    const historySubtitle = document.getElementById('historyCompareSubtitle');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const labels = { deep: '지하 깊은 곳', surface: '지표 부근', same: '두 곳이 비슷함' };
    const storageKey = 'igneous-observations-v1';
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { /* In-memory records remain available. */ }
    const history = core.createHistory(12, stored);
    let selectedRecords = history.list().slice(-2).map(record => record.id);
    let number = Math.max(0, ...history.list().map(record => record.number));
    let prediction = null;
    let run = null;
    let timeline = null;
    let views = [];
    let geologyFlow = null;
    let raf = 0;
    let lastTime = null;
    let trigger = null;
    let historyTrigger = null;
    let recorded = false;
    let finishing = false;

    const locationName = place => place === 'deep' ? '지하 깊은 곳' : '지표 부근 · 분출 후';
    const categoryFor = bright => bright >= 65 ? 'bright' : bright <= 35 ? 'dark' : 'middle';
    const seedNow = () => Math.floor(Math.random() * 4294967296);
    function compositionMarkup(experiment) {
      return `<div class="composition-display" aria-label="밝은 성분 ${experiment.bright}%, 어두운 성분 ${experiment.dark}%">
        <div class="composition-numbers"><span class="composition-bright">밝은 성분 <strong>${experiment.bright}<small>%</small></strong></span><span class="composition-dark">어두운 성분 <strong>${experiment.dark}<small>%</small></strong></span></div>
        <div class="composition-band" aria-hidden="true"><span style="width:${experiment.bright}%"></span><span style="width:${experiment.dark}%"></span></div></div>`;
    }
    function hydrate(record) {
      const category = categoryFor(record.bright);
      return Object.freeze({ ...record, dark: 100 - record.bright,
        location: record.mode === 'fast' ? 'surface' : 'deep',
        rocks: Object.freeze({ deep: Object.freeze({ ...rockTable.deep[category] }), surface: Object.freeze({ ...rockTable.surface[category] }) }) });
    }

    // Both locations use the same color proportions, so the growth comparison changes only texture.
    function colorFor(value, bright) {
      const fraction = bright / 100;
      if (value < fraction * .42) return '#efeeeb';
      if (value < fraction * .73) return bright >= 65 ? '#e9bbc0' : '#c8c9c7';
      if (value < fraction) return '#a5b2b8';
      return value < fraction + (1 - fraction) * .5 ? '#1e2934' : '#4d5e65';
    }

    function makeSpecimen(place, experiment, staticView = false) {
      const mold = document.createElement('div');
      mold.className = 'rock-mold observation-rock cooling';
      mold.setAttribute('role', 'img');
      mold.dataset.label = '';
      const tone = experiment.bright >= 65 ? ['#d9d3cb', '#a9a19a'] : experiment.bright <= 35 ? ['#536168', '#252e36'] : ['#a0a5a5', '#5e6a71'];
      mold.style.setProperty('--rock-a', tone[0]);
      mold.style.setProperty('--rock-b', tone[1]);
      const data = core.grainsFor(place, experiment.seed);
      const grains = data.map(grain => {
        const element = document.createElement('span');
        element.className = 'observed-grain' + (grain.tracked ? ' tracked-grain' : '');
        element.style.cssText = `left:${grain.x}%;top:${grain.y}%;width:${grain.size}%;--rot:${grain.rotation}deg;background:${colorFor(grain.color, experiment.bright)}`;
        mold.appendChild(element);
        return { element, grain };
      });
      let lens = null;
      const marker = document.createElement('span');
      marker.className = 'grain-marker';
      marker.setAttribute('aria-hidden', 'true');
      if (!staticView) mold.appendChild(marker);
      const view = { place, mold, grains, lens, marker, previous: -1, caption: null };
      if (staticView) paintSpecimen(view, 1);
      return view;
    }

    function paintSpecimen(view, progress) {
      if (view.previous === progress) return;
      view.previous = progress;
      view.mold.style.setProperty('--cooling-progress', (1 - Math.pow(1 - progress, 1.4)).toFixed(4));
      for (const { element, grain } of view.grains) {
        const growth = core.growthAt(progress, grain.birth);
        element.style.transform = `scale(${growth.toFixed(4)}) rotate(${grain.rotation}deg)`;
        element.style.opacity = growth ? '1' : '0';
      }
      const tracked = view.grains.find(item => item.grain.tracked);
      const growth = core.growthAt(progress, tracked.grain.birth);
      if (view.lens) {
        view.lens.style.transform = `scale(${growth.toFixed(4)}) rotate(${tracked.grain.rotation}deg)`;
        view.lens.style.opacity = growth ? '1' : '0';
      }
      view.marker.style.opacity = growth ? '1' : '0';
    }

    function setupScene(experiment) {
      els.coolingScene.replaceChildren();
      const layout = document.createElement('div');
      layout.className = 'geology-layout';
      const map = document.createElement('section');
      map.className = 'geology-map';
      map.setAttribute('aria-label', '화산과 지하 깊은 곳의 단면');
      map.innerHTML = `<div class="geology-map-head"><div class="geology-composition-title"><strong>마그마 성분</strong><span>${experiment.mode === 'compare' ? '두 장소에 같은 성분' : '이번 실험의 성분'}</span></div>${compositionMarkup(experiment)}</div>
        <div class="geology-canvas"><div class="geology-ground"></div><div class="geology-depth"><span>깊어짐</span></div>
          <span class="geology-layer surface-layer">지표</span><span class="geology-layer deep-layer">지하 깊은 곳</span>
          <div class="geology-volcano"><div class="smoke"></div><div class="cone-back"></div><div class="cone-front"></div><div class="crater"></div><span class="geology-volcano-label">화산</span></div>
          <div class="geology-conduit"></div>
          <svg class="geology-lava" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M40 16 C46 20 55 28 63 35 S72 41 79 41" /></svg>
        </div>`;
      const canvas = map.querySelector('.geology-canvas');
      if (experiment.mode === 'fast') {
        const origin = document.createElement('div');
        origin.className = 'geology-origin';
        origin.setAttribute('role', 'img');
        origin.setAttribute('aria-label', '지하 깊은 곳의 마그마에서 용암이 분출합니다');
        origin.innerHTML = '<div class="geology-site-label"><strong>지하 깊은 곳</strong><span class="geology-site-state">마그마</span></div>';
        canvas.appendChild(origin);
      }
      geologyFlow = experiment.mode === 'slow' ? null : map.querySelector('.geology-lava path');
      map.querySelector('.geology-lava').toggleAttribute('hidden', experiment.mode === 'slow');
      const grid = document.createElement('div');
      grid.className = 'observation-grid geology-details' + (experiment.mode !== 'compare' ? ' single-observation' : '');
      views = core.placesFor(experiment.mode).map(place => {
        const card = document.createElement('article');
        card.className = 'observation-card';
        card.innerHTML = `<div class="observation-card-head"><div><span class="location-caption">결정 확대 관찰</span><h3>${locationName(place)}</h3></div></div>
          <div class="observation-sample-area"><span class="sample-label">같은 크기로 확대한 모형</span></div>
          <div class="observation-card-foot"><strong class="growth-state">냉각 시작</strong><button type="button" class="sample-photo" hidden>실제 암석 사진</button></div>`;
        const view = makeSpecimen(place, experiment);
        view.mold.id = place + 'DetailMold';
        card.querySelector('.observation-sample-area').prepend(view.mold);
        const site = document.createElement('div');
        site.className = 'geology-site ' + place;
        const siteView = makeSpecimen(place, experiment);
        siteView.mold.classList.add('geology-rock');
        siteView.mold.id = place + 'Mold';
        site.innerHTML = `<div class="geology-site-label"><strong>${place === 'deep' ? '지하 깊은 곳' : '지표 부근'}</strong><span class="geology-site-state">${place === 'deep' ? '마그마' : '분출한 용암'}</span></div>`;
        site.prepend(siteView.mold);
        canvas.appendChild(site);
        view.site = siteView;
        view.siteCaption = site.querySelector('.geology-site-state');
        view.caption = card.querySelector('.growth-state');
        view.photo = card.querySelector('.sample-photo');
        view.photo.addEventListener('click', () => {
          timeline.pause(); stopFrame(); renderPlayback();
          openPhotoModal(experiment.rocks[place].name);
        });
        grid.appendChild(card);
        paintSpecimen(view, 0);
        paintSpecimen(siteView, 0);
        return view;
      });
      layout.append(map, grid);
      els.coolingScene.appendChild(layout);
    }

    function stopFrame() { cancelAnimationFrame(raf); raf = 0; lastTime = null; }
    function scheduleFrame() {
      if (!raf && timeline?.state().playing) raf = requestAnimationFrame(frame);
    }
    function frame(time) {
      raf = 0;
      if (!timeline || !els.coolingOverlay.classList.contains('show')) return;
      if (lastTime !== null) timeline.advance(Math.min(200, Math.max(0, time - lastTime)));
      lastTime = time;
      renderPlayback();
      if (timeline.state().playing) scheduleFrame();
      else lastTime = null;
    }

    function renderPlayback() {
      if (!run || !timeline) return;
      const state = timeline.state();
      const position = Math.round(state.elapsed / state.duration * 100);
      windowEl.dataset.playing = String(state.playing);
      timeInput.value = String(state.elapsed / state.duration * 1000);
      timeInput.setAttribute('aria-valuetext', `재생 위치 ${position}%`);
      timeText.textContent = position + '%';
      pauseBtn.textContent = state.playing ? '일시정지' : state.complete ? '다시 재생' : '재생';
      pauseBtn.setAttribute('aria-label', state.playing ? '냉각 관찰 일시정지' : '냉각 관찰 재생');
      pauseBtn.setAttribute('aria-pressed', String(!state.playing));
      els.coolingStatus.textContent = state.complete ? '관찰 완료' : state.playing ? '관찰 중' : '일시정지';
      for (const view of views) {
        const progress = core.progressAt(view.place, state.elapsed);
        paintSpecimen(view, progress);
        paintSpecimen(view.site, progress);
        const done = progress === 1;
        const rock = run.rocks[view.place];
        view.caption.textContent = done ? `${rock.name} · ${rock.texture}` : progress < .03 ? '녹은 상태' : view.place === 'deep' ? '결정이 자라는 중' : '빠르게 굳는 중';
        view.photo.hidden = !done;
        view.mold.setAttribute('aria-label', `${locationName(view.place)} 결정 확대: ${view.caption.textContent}`);
        view.site.mold.setAttribute('aria-label', `${locationName(view.place)}: ${view.caption.textContent}`);
        view.siteCaption.textContent = done ? rock.name : view.place === 'deep' ? '마그마가 식는 중' : '분출한 용암이 식는 중';
      }
      if (geologyFlow) {
        geologyFlow.style.strokeDashoffset = String(1 - Math.min(1, state.elapsed / 600));
        geologyFlow.style.opacity = String(1 - core.progressAt('surface', state.elapsed) * .45);
      }
      const firstPlace = run.mode === 'fast' ? 'surface' : 'deep';
      const firstProgress = core.progressAt(firstPlace, state.elapsed);
      els.bar1Fill.style.width = Math.round(firstProgress * 100) + '%';
      els.bar1Text.textContent = Math.round(firstProgress * 100) + '%';
      const surfaceProgress = core.progressAt('surface', state.elapsed);
      els.bar2Fill.style.width = Math.round(surfaceProgress * 100) + '%';
      els.bar2Text.textContent = Math.round(surfaceProgress * 100) + '%';
      nextBtn.hidden = !state.complete;
      predictionNote.hidden = run.mode !== 'compare' || !run.prediction;
      predictionNote.textContent = run.prediction ? `내 예상: ${labels[run.prediction]}${state.complete ? ' · 관찰: 지하 쪽 결정이 더 큼' : ''}` : '';
      if (run.mode === 'compare' && surfaceProgress === 1 && firstProgress < 1) {
        els.coolingNote.textContent = '지표 쪽은 냉각이 끝났습니다. 지하 마그마와 오른쪽 확대 모형에서 결정이 계속 자라는지 관찰하세요.';
      } else if (state.complete) {
        els.coolingNote.textContent = run.mode === 'compare'
          ? '같은 성분에서 냉각 조건에 따라 결정 크기가 달라졌습니다. 재생 위치를 옮겨 성장 과정을 다시 확인하세요.'
          : '재생 위치를 옮기거나 다시 재생해 결정이 생기고 자라는 과정을 살펴보세요.';
      } else {
        els.coolingNote.textContent = '화산과 지하 단면에서 생성 장소를 확인하고, 확대 모형에서 결정을 관찰하세요. 원하는 순간에 멈출 수 있습니다.';
      }
      if (state.complete && !finishing) finish();
    }

    function finish() {
      finishing = true;
      onComplete(run);
      if (!recorded) {
        if (history.add(run)) {
          number = Math.max(number, run.number);
          selectedRecords = history.list().slice(-2).map(record => record.id);
          try { localStorage.setItem(storageKey, JSON.stringify(history.list())); } catch (_) { /* Keep this session's records. */ }
          renderHistory();
        }
        recorded = true;
      }
    }

    function start(mode, savedRecord = null) {
      stopFrame();
      hideTip();
      trigger = document.activeElement;
      const conditions = getConditions();
      const seed = savedRecord ? savedRecord.seed : seedNow();
      run = hydrate(savedRecord || { id: Date.now().toString(36) + '-' + seed.toString(36), number: number + 1,
        mode, bright: conditions.bright, seed, prediction: mode === 'compare' ? prediction : null });
      recorded = Boolean(savedRecord);
      finishing = false;
      timeline = core.createTimeline(run.mode);
      resetResultText();
      els.coolingTitle.textContent = savedRecord ? `실험 ${run.number} · 냉각 다시 보기` : mode === 'compare' ? '같은 마그마 · 두 장소 관찰' : '냉각 관찰 · ' + locationName(run.location);
      els.coolingSubtitle.textContent = `밝은 ${run.bright}% · 어두운 ${run.dark}%${run.mode === 'compare' ? ' | 두 장소에 같은 성분 적용' : ''}`;
      els.bar1Label.textContent = run.mode === 'fast' ? '지표 냉각' : '지하 냉각';
      els.bar2Label.textContent = '지표 냉각';
      els.bar2Row.hidden = run.mode !== 'compare';
      els.bar2Row.style.display = run.mode === 'compare' ? 'grid' : 'none';
      windowEl.classList.add('observation-window');
      document.getElementById('coolingModelNote').textContent = '시간과 결정 크기를 이해하기 위한 모형입니다. 실제 냉각 시간·배율을 나타내지 않습니다.';
      els.coolingOverlay.classList.add('show');
      els.coolingOverlay.setAttribute('aria-hidden', 'false');
      app.inert = true;
      setupScene(run);
      timeline.play();
      renderPlayback();
      scheduleFrame();
      pauseBtn.focus({ preventScroll: true });
    }

    function close() {
      stopFrame();
      timeline?.pause();
      els.coolingOverlay.classList.remove('show');
      els.coolingOverlay.setAttribute('aria-hidden', 'true');
      app.inert = false;
      if (trigger?.isConnected && !trigger.closest('#historyModal')) trigger.focus({ preventScroll: true });
      else document.getElementById('compareHistoryBtn').focus({ preventScroll: true });
    }

    pauseBtn.addEventListener('click', () => {
      if (!timeline) return;
      if (timeline.state().playing) { timeline.pause(); stopFrame(); }
      else if (timeline.state().complete) { timeline.restart(); finishing = false; }
      else timeline.play();
      renderPlayback(); scheduleFrame();
    });
    replayBtn.addEventListener('click', () => {
      if (!timeline) return;
      stopFrame(); timeline.restart(); finishing = false;
      renderPlayback(); scheduleFrame();
    });
    timeInput.addEventListener('input', () => {
      if (!timeline) return;
      stopFrame(); timeline.pause(); timeline.seek(Number(timeInput.value) / 1000 * timeline.state().duration);
      finishing = false;
      renderPlayback();
    });
    nextBtn.addEventListener('click', close);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timeline?.state().playing) { timeline.pause(); stopFrame(); renderPlayback(); }
    });

    function resetPrediction() {
      prediction = null;
      document.querySelectorAll('[data-prediction]').forEach(button => button.setAttribute('aria-pressed', 'false'));
    }
    document.querySelectorAll('[data-prediction]').forEach(button => button.addEventListener('click', () => {
      prediction = prediction === button.dataset.prediction ? null : button.dataset.prediction;
      document.querySelectorAll('[data-prediction]').forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.prediction === prediction)));
    }));

    function renderHistory() {
      const records = history.list();
      historyCount.textContent = records.length ? `${records.length}회 · 최근 12회 보관` : '0회';
      selectedRecords = selectedRecords.filter(id => records.some(record => record.id === id));
      compareHistoryBtn.disabled = selectedRecords.length === 0;
      compareHistoryBtn.textContent = selectedRecords.length ? `선택한 기록 비교 (${selectedRecords.length})` : '기록 비교';
      historyList.replaceChildren();
      if (!records.length) {
        historyList.innerHTML = '<p class="history-empty">냉각을 마친 실험이 여기에 남습니다. 성분과 장소를 바꿔 여러 결과를 비교해 보세요.</p>';
        return;
      }
      for (const record of records.slice().reverse()) {
        const experiment = hydrate(record);
        const card = document.createElement('article');
        card.className = 'history-card';
        card.innerHTML = `<div class="history-card-top"><strong>실험 ${record.number}</strong><label><input type="checkbox" ${selectedRecords.includes(record.id) ? 'checked' : ''} aria-label="실험 ${record.number} 비교 선택"> 비교 선택</label></div>
          <p>밝은 ${experiment.bright}% · 어두운 ${experiment.dark}%</p>
          <div class="record-rocks">${core.placesFor(record.mode).map(place => `<span><small>${place === 'deep' ? '지하' : '지표'}</small> ${experiment.rocks[place].name}</span>`).join('')}</div>
          <button type="button" class="record-replay" aria-label="실험 ${record.number} 냉각 다시 보기">냉각 다시 보기</button>`;
        card.querySelector('input').addEventListener('change', event => {
          if (event.target.checked && selectedRecords.length === 2) {
            event.target.checked = false;
            showTip('비교할 실험은 두 개까지 선택할 수 있습니다. 선택한 기록 하나를 해제해 주세요.', 3000);
            return;
          }
          selectedRecords = event.target.checked ? [...selectedRecords, record.id] : selectedRecords.filter(id => id !== record.id);
          compareHistoryBtn.disabled = selectedRecords.length === 0;
          compareHistoryBtn.textContent = selectedRecords.length ? `선택한 기록 비교 (${selectedRecords.length})` : '기록 비교';
        });
        card.querySelector('.record-replay').addEventListener('click', () => start(record.mode, record));
        historyList.appendChild(card);
      }
    }

    function openHistory() {
      const records = history.list().filter(record => selectedRecords.includes(record.id));
      if (!records.length) return;
      historyTrigger = document.activeElement;
      historyGrid.replaceChildren();
      historyGrid.classList.toggle('one-record', records.length === 1);
      historySubtitle.textContent = records.length === 1 ? '선택한 실험의 결과를 관찰합니다.' : records[0].bright === records[1].bright
        ? '두 실험의 성분 비율이 같습니다. 생성 장소와 결정 크기를 비교해 보세요.'
        : '성분 비율이 다른 두 실험입니다. 같은 장소에서 생성된 암석끼리 비교해 보세요.';
      for (const { record, place, available } of core.comparisonEntries(records)) {
          const experiment = hydrate(record);
          const card = document.createElement('article');
          card.className = 'history-compare-card' + (available ? '' : ' missing-result');
          const rock = experiment.rocks[place];
          card.innerHTML = `<div class="history-compare-card-head"><small>실험 ${record.number}</small><h3>${locationName(place)}${available ? ' · ' + rock.name : ''}</h3>${compositionMarkup(experiment)}</div><div class="history-model"></div>`;
          if (available) {
            const view = makeSpecimen(place, experiment, true);
            view.mold.setAttribute('aria-label', `${locationName(place)}: ${rock.name}, ${rock.texture}`);
            card.querySelector('.history-model').appendChild(view.mold);
            const foot = document.createElement('div');
            foot.className = 'history-compare-card-foot';
            foot.innerHTML = `<span>${rock.type} · ${rock.texture}</span><button class="sample-photo" type="button">실제 암석 사진</button>`;
            foot.querySelector('button').addEventListener('click', () => openPhotoModal(rock.name));
            card.appendChild(foot);
          } else card.querySelector('.history-model').textContent = '이 장소에서 냉각한 결과가 없습니다.';
          historyGrid.appendChild(card);
      }
      hideTip();
      historyModal.classList.add('show');
      historyModal.setAttribute('aria-hidden', 'false');
      app.inert = true;
      closeHistoryBtn.focus({ preventScroll: true });
    }

    function closeHistory() {
      historyModal.classList.remove('show');
      historyModal.setAttribute('aria-hidden', 'true');
      app.inert = false;
      historyTrigger?.focus({ preventScroll: true });
    }
    compareHistoryBtn.addEventListener('click', openHistory);
    closeHistoryBtn.addEventListener('click', closeHistory);
    historyModal.addEventListener('click', event => { if (event.target === historyModal) closeHistory(); });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && historyModal.classList.contains('show') && !els.photoModal.classList.contains('show')) closeHistory();
    });
    renderHistory();
    return { start, close, resetPrediction };
  }
})(typeof globalThis === 'object' ? globalThis : this);
