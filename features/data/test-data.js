import apiTestData from './api-test-data.json' with { type: 'json' };
import uiTestData from './ui-test-data.json' with { type: 'json' };

/**
 * @typedef {object} ScenarioTestData
 * @property {typeof uiTestData} ui Fresh UI test data for one scenario.
 * @property {typeof apiTestData} api Fresh API test data for one scenario.
 */

/**
 * Return independent mutable copies of the static JSON test data.
 *
 * @returns {ScenarioTestData} Scenario-local UI and API test data.
 */
export function createScenarioTestData() {
  return {
    ui: structuredClone(uiTestData),
    api: structuredClone(apiTestData),
  };
}
