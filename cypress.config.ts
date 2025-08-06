const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      // 'file' will be the name of the config file we want to use.
      // We'll set a default if it's not provided.
      const file = config.env.configFile || 'staging';

      // Get the configuration from the specified file
      const environmentConfig = getConfigurationByFile(file);

      // Merge the environment-specific config into the main Cypress config
      config.env = { ...config.env, ...environmentConfig };
      config.baseUrl = environmentConfig.baseUrl;

      return config;
    },
  },
});

// Function to get configuration from a JSON file
function getConfigurationByFile(file) {
  const pathToConfigFile = path.resolve('./cypress/config', `${file}.json`);

  if (!fs.existsSync(pathToConfigFile)) {
    console.error(`Could not find config file at ${pathToConfigFile}`);
    return {};
  }

  return JSON.parse(fs.readFileSync(pathToConfigFile, 'utf-8'));
}