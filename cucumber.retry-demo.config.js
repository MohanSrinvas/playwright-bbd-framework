import cucumberConfig from './cucumber.config.js';

export default {
  ...cucumberConfig,
  paths: ['examples/retry-demo.feature'],
};
