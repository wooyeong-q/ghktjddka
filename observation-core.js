(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IgneousObservationCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const DURATIONS = Object.freeze({ deep: 12000, surface: 2400 });
  const MODES = ['slow', 'fast', 'compare'];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const placesFor = mode => mode === 'compare' ? ['deep', 'surface'] : [mode === 'slow' ? 'deep' : 'surface'];

  function comparisonEntries(records) {
    if (records.every(record => record.mode !== 'compare')) {
      return records.map(record => ({ record, place: placesFor(record.mode)[0], available: true }));
    }
    const entries = [];
    for (const place of ['deep', 'surface']) {
      if (!records.some(record => placesFor(record.mode).includes(place))) continue;
      for (const record of records) entries.push({ record, place, available: placesFor(record.mode).includes(place) });
    }
    return entries;
  }

  function createTimeline(mode) {
    if (!MODES.includes(mode)) throw new RangeError('Invalid cooling mode');
    const duration = mode === 'fast' ? DURATIONS.surface : DURATIONS.deep;
    let elapsed = 0;
    let playing = false;
    const state = () => Object.freeze({ elapsed, duration, playing, complete: elapsed >= duration });
    return {
      state,
      play() { if (elapsed < duration) playing = true; return state(); },
      pause() { playing = false; return state(); },
      restart() { elapsed = 0; playing = true; return state(); },
      seek(value) {
        if (!Number.isFinite(value)) throw new RangeError('Invalid playback time');
        elapsed = clamp(value, 0, duration);
        if (elapsed >= duration) playing = false;
        return state();
      },
      advance(delta) {
        if (!Number.isFinite(delta) || delta < 0) throw new RangeError('Invalid elapsed time');
        if (playing) elapsed = clamp(elapsed + delta, 0, duration);
        if (elapsed >= duration) playing = false;
        return state();
      }
    };
  }

  function progressAt(place, elapsed) {
    if (!(place in DURATIONS) || !Number.isFinite(elapsed)) throw new RangeError('Invalid progress');
    return clamp(elapsed / DURATIONS[place], 0, 1);
  }

  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function grainsFor(place, seed) {
    if (!(place in DURATIONS)) throw new RangeError('Invalid location');
    const random = randomFrom(seed ^ (place === 'deep' ? 731 : 1973));
    const deep = place === 'deep';
    const columns = deep ? 9 : 20;
    const rows = deep ? 6 : 12;
    const grains = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = 12 + (column + .15 + random() * .6) / columns * 75;
        const y = 13 + (row + .15 + random() * .6) / rows * 70;
        grains.push(Object.freeze({ x, y, size: deep ? 5 + random() * 3.4 : .9 + random() * 1.05,
          birth: random() * .18, rotation: random() * 120 - 60, color: random() }));
      }
    }
    // The center grain is tracked in the magnifier throughout the same experiment.
    grains.push(Object.freeze({ x: 48, y: 43, size: deep ? 8 : 1.65, birth: .015, rotation: 12, color: .18, tracked: true }));
    return Object.freeze(grains);
  }

  function growthAt(progress, birth) {
    const age = clamp((progress - birth) / (1 - birth), 0, 1);
    return age ? .12 + .88 * age : 0;
  }

  function normalizeRecord(value) {
    if (!value || !MODES.includes(value.mode) || !Number.isInteger(value.bright) || value.bright < 10 || value.bright > 90
      || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 4294967295
      || typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(value.id)
      || !Number.isSafeInteger(value.number) || value.number < 1) return null;
    return Object.freeze({ id: value.id, number: value.number, mode: value.mode, bright: value.bright,
      seed: value.seed });
  }

  function createHistory(limit = 12, initial = []) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Invalid history limit');
    let records = [];
    for (const item of Array.isArray(initial) ? initial : []) {
      const record = normalizeRecord(item);
      if (record && !records.some(item => item.id === record.id)) records.push(record);
    }
    records = records.slice(-limit);
    return {
      list: () => records.slice(),
      add(value) {
        const record = normalizeRecord(value);
        if (!record || records.some(item => item.id === record.id)) return false;
        records = [...records, record].slice(-limit);
        return true;
      }
    };
  }
  return { DURATIONS, createTimeline, progressAt, grainsFor, growthAt, createHistory, placesFor, comparisonEntries };
});
