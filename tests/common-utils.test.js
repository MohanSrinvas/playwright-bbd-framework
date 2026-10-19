import assert from 'node:assert/strict';
import test from 'node:test';
import { createUniqueEmail } from '../utils/common-utils.js';

test('createUniqueEmail creates unique addresses with the requested prefix', () => {
  const firstEmail = createUniqueEmail('playwright.qa');
  const secondEmail = createUniqueEmail('playwright.qa');

  assert.match(firstEmail, /^playwright\.qa\.[0-9a-f-]{36}@example\.com$/);
  assert.match(secondEmail, /^playwright\.qa\.[0-9a-f-]{36}@example\.com$/);
  assert.notEqual(firstEmail, secondEmail);
});

test('createUniqueEmail uses a default prefix', () => {
  assert.match(createUniqueEmail(), /^playwright\.test\.[0-9a-f-]{36}@example\.com$/);
});
