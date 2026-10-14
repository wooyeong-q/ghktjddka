const test = require('node:test');
const assert = require('node:assert/strict');
const { DURATIONS, createTimeline, progressAt, grainsFor, growthAt, createHistory, comparisonEntries } = require('./observation-core.js');

test('pause freezes all cooling progress, seeking and replay return to the same time', () => {
  const timeline = createTimeline('compare');
  timeline.play(); timeline.advance(1600); timeline.pause(); timeline.advance(8000);
  assert.equal(timeline.state().elapsed, 1600);
  assert.equal(timeline.state().playing, false);
  assert.equal(progressAt('surface', timeline.state().elapsed), 2 / 3);
  timeline.seek(4000);
  assert.equal(progressAt('surface', 4000), 1);
  assert.equal(progressAt('deep', 4000), 1 / 3);
  timeline.play(); timeline.advance(20000);
  assert.equal(timeline.state().complete, true);
  assert.equal(timeline.state().playing, false);
  timeline.restart();
  assert.equal(timeline.state().elapsed, 0);
  assert.equal(timeline.state().playing, true);
  assert.equal(DURATIONS.deep, timeline.state().duration);
});

test('each location solidifies once; surface stops growing while deep continues', () => {
  assert.equal(createTimeline('fast').state().duration, DURATIONS.surface);
  assert.equal(progressAt('surface', 2400), progressAt('surface', 12000));
  assert.ok(growthAt(progressAt('deep', 8000), .01) > growthAt(progressAt('deep', 2400), .01));
  assert.equal(progressAt('deep', -20), 0);
  assert.equal(growthAt(0, .03), 0);
  assert.equal(growthAt(1, .03), 1);
});

test('a saved experiment replays the identical crystal arrangement', () => {
  for (const place of ['deep', 'surface']) {
    assert.deepEqual(grainsFor(place, 3194), grainsFor(place, 3194));
    assert.notDeepEqual(grainsFor(place, 3194), grainsFor(place, 3195));
  }
  assert.ok(grainsFor('deep', 50).find(item => item.tracked).size > grainsFor('surface', 50).find(item => item.tracked).size);
});

test('history snapshots stay immutable, replays do not duplicate them, and recent results are capped', () => {
  const history = createHistory(2);
  const record = { id: 'run-1', number: 1, bright: 66, mode: 'compare', seed: 401, prediction: 'surface' };
  assert.equal(history.add(record), true);
  record.bright = 30;
  assert.equal(history.list()[0].bright, 66);
  assert.equal(history.list()[0].prediction, 'surface');
  assert.equal(history.add(record), false);
  assert.equal(history.add({ ...record, id: 'run-2', number: 2 }), true);
  assert.equal(history.add({ ...record, id: 'run-3', number: 3 }), true);
  assert.deepEqual(history.list().map(item => item.number), [2, 3]);
  history.list().pop();
  assert.equal(history.list().length, 2);
});

test('restored records reject corrupt data and unsafe text; no prediction is required', () => {
  const good = { id: 'run-1', number: 1, bright: 50, mode: 'slow', seed: 44 };
  const history = createHistory(12, [null, { ...good, id: '<img>' }, { ...good, bright: '50' }, good, good]);
  assert.equal(history.list().length, 1);
  assert.equal(history.list()[0].prediction, null);
  assert.equal(history.add({ ...good, id: 'run-2', mode: 'invalid' }), false);
  assert.throws(() => createTimeline('invalid'), RangeError);
  assert.throws(() => createTimeline('slow').seek(NaN), RangeError);
});

test('two single experiments compare actual results side by side; paired experiments align by location', () => {
  const singles = comparisonEntries([{ mode: 'fast', bright: 50 }, { mode: 'slow', bright: 50 }]);
  assert.equal(singles.length, 2);
  assert.deepEqual(singles.map(entry => entry.place), ['surface', 'deep']);
  assert.ok(singles.every(entry => entry.available));
  const pairs = comparisonEntries([{ mode: 'compare', bright: 50 }, { mode: 'compare', bright: 66 }]);
  assert.deepEqual(pairs.map(entry => [entry.place, entry.record.bright]), [['deep',50],['deep',66],['surface',50],['surface',66]]);
});
