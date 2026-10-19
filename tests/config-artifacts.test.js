import assert from 'node:assert/strict';
import test from 'node:test';
import config, { validateConfig } from '../config/config.js';

test('video recording is disabled by default', () => {
  assert.equal(config.artifacts.video, 'off');
});

test('video recording accepts supported policies', () => {
  for (const mode of ['off', 'on', 'retain-on-failure']) {
    const candidate = structuredClone(config);
    candidate.artifacts.video = mode;

    assert.equal(validateConfig(candidate), candidate);
  }
});

test('video recording rejects unsupported policies', () => {
  const candidate = structuredClone(config);
  candidate.artifacts.video = 'sometimes';

  assert.throws(() => validateConfig(candidate), /artifacts\.video must be/);
});
