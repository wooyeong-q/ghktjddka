(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IgneousInquiry = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  function createFlow() {
    let phase = 'idle';
    let completed = false;
    let experiment = null;
    let prediction = null;
    let observation = null;
    let explanation = null;
    const choices = ['deep', 'surface', 'same'];
    const state = () => ({ phase, completed, experiment, prediction, observation, explanation });
    return {
      state,
      begin(bright) {
        if (completed) return null;
        if (!Number.isInteger(bright) || bright < 10 || bright > 90) throw new RangeError('Invalid composition');
        experiment = Object.freeze({ bright, dark: 100 - bright });
        prediction = observation = explanation = null;
        phase = 'prediction';
        return state();
      },
      predict(value) {
        if (phase !== 'prediction' || !choices.includes(value)) return false;
        prediction = value;
        return true;
      },
      start() {
        if (phase !== 'prediction' || !prediction) return false;
        phase = 'cooling';
        return true;
      },
      finish() {
        if (phase !== 'cooling') return false;
        phase = 'observation';
        return true;
      },
      observe(value) {
        if (phase !== 'observation' || !choices.includes(value)) return false;
        observation = value;
        if (value !== 'deep') return false;
        phase = 'explanation';
        return true;
      },
      explain(value) {
        if (phase !== 'explanation' || !['time', 'composition', 'amount'].includes(value)) return false;
        explanation = value;
        if (value !== 'time') return false;
        completed = true;
        phase = 'complete';
        return true;
      },
      cancel() {
        if (completed) return state();
        phase = 'idle';
        experiment = prediction = observation = explanation = null;
        return state();
      }
    };
  }
  return { createFlow };
});
