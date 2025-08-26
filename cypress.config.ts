import { defineConfig } from 'cypress';
import baseConfig from './base.config';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Call base setup first
      baseConfig.e2e!.setupNodeEvents!(on, config);

      config.env = {
        ...config.env,
        // Custom environment variables for this config
      };

      return config;
    },
  },
});