import { Then } from '@cucumber/cucumber';

let attempts = 0;

Then('the simulated temporary condition is available', function () {
  attempts += 1;

  if (attempts === 1) {
    throw new Error('Intentional retry demonstration: simulated transient failure.');
  }
});
