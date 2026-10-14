const test = require('node:test');
const assert = require('node:assert/strict');
const { createFlow } = require('./inquiry-core.js');

test('a comparison snapshots the composition and accepts every prediction without grading', () => {
  for (const prediction of ['deep', 'surface', 'same']) {
    const flow = createFlow();
    flow.begin(66);
    assert.equal(flow.start(), false);
    assert.equal(flow.predict(prediction), true);
    assert.equal(flow.start(), true);
    assert.deepEqual(flow.state().experiment, { bright: 66, dark: 34 });
    assert.equal(Object.isFrozen(flow.state().experiment), true);
    assert.equal(flow.state().prediction, prediction);
    assert.equal(flow.state().phase, 'cooling');
  }
});

test('observation must precede explanation; an incorrect prediction remains in the record', () => {
  const flow = createFlow();
  flow.begin(30);
  flow.predict('surface');
  flow.start();
  assert.equal(flow.explain('time'), false);
  assert.equal(flow.observe('deep'), false);
  flow.finish();
  assert.equal(flow.observe('same'), false);
  assert.equal(flow.state().phase, 'observation');
  assert.equal(flow.observe('deep'), true);
  assert.equal(flow.explain('composition'), false);
  assert.equal(flow.state().phase, 'explanation');
  assert.equal(flow.explain('time'), true);
  assert.equal(flow.state().prediction, 'surface');
  assert.equal(flow.state().observation, 'deep');
  assert.equal(flow.state().completed, true);
});

test('closing an unfinished experiment permits retry; reset after completion keeps free experimentation', () => {
  const flow = createFlow();
  flow.begin(50); flow.predict('same'); flow.start(); flow.cancel();
  assert.equal(flow.state().completed, false);
  assert.equal(flow.finish(), false);
  flow.begin(80); flow.predict('deep'); flow.start(); flow.finish(); flow.observe('deep'); flow.explain('time');
  flow.cancel();
  assert.equal(flow.begin(10), null);
  assert.equal(flow.state().completed, true);
});

test('invalid composition and out-of-order answers cannot advance the inquiry', () => {
  const flow = createFlow();
  assert.throws(() => flow.begin(101), RangeError);
  assert.equal(flow.predict('deep'), false);
  flow.begin(10);
  assert.equal(flow.predict('invalid'), false);
  assert.equal(flow.finish(), false);
  assert.equal(flow.state().phase, 'prediction');
});
