import assert from 'node:assert/strict';
import test from 'node:test';
import { createScenarioTestData } from '../features/data/test-data.js';

test('scenario test data is copied from the static UI and API JSON', () => {
  const scenarioData = createScenarioTestData();

  assert.equal(scenarioData.ui.products.searchTerm, 'Blue Top');
  assert.equal(scenarioData.api.search.matchingTerm, 'top');
});

test('scenario test data copies are independent, including nested records', () => {
  const firstScenarioData = createScenarioTestData();
  const secondScenarioData = createScenarioTestData();

  firstScenarioData.ui.products.searchTerm = 'Changed in one scenario';
  firstScenarioData.api.account.details.name = 'Changed API account';

  assert.equal(secondScenarioData.ui.products.searchTerm, 'Blue Top');
  assert.equal(secondScenarioData.api.account.details.name, 'Playwright API User');
  assert.notStrictEqual(firstScenarioData.ui, secondScenarioData.ui);
  assert.notStrictEqual(
    firstScenarioData.api.account.details,
    secondScenarioData.api.account.details,
  );
});
