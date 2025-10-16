import { defineConfig } from 'cypress';
import baseConfig from './cypress-workflow/cypress-base/base/base.config';

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Call base setup first
      baseConfig.e2e!.setupNodeEvents!(on, config);

      // Rest of your custom setup can go here

      config.env = {
        ...config.env,
        // Custom environment variables for this config
      };

      return config;
    },
  },
}); // rename to cypress.config.ts