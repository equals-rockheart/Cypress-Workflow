import { defineConfig } from 'cypress';
import * as fs from 'fs';
import * as path from 'path';


const suite = [
  'client',
  'admin',
  'api'
]

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      
      // Get configuration file (defaults to 'staging' if not provided)
      const configFile: string = config.env.configFile || 'staging';
      const environmentConfig = getConfigurationByFile(`env/${configFile}`);
      const qatouchConfig = getConfigurationByFile("qatouch");
      
      // Handle testRunKey and testSuite validation
      const testRunKey: string  = config.env.testRunKey || '';
      const testSuite: string  = config.env.testSuite || '';

      // Handle sprint validation
      const sprint: string  = config.env.sprint || '';
      
      // If testRunKey is provided but testSuite is not, throw error
      if (testRunKey && !testSuite) {
        throw new Error('testSuite is required when testRunKey is provided (e.g., testSuite=admin)');
      }

      // If testSuite is not valid, throw error
      if (testSuite && !suite.includes(testSuite.toString())) {
        throw new Error('Invalid testSuite value. Use one of: admin | client | api');
      }
      
      // Set spec pattern based on testSuite (capitalize first letter)
      if (testSuite) {
        const capitalizedTestSuite = testSuite.charAt(0).toUpperCase() + testSuite.slice(1).toLowerCase();
        config.specPattern = [`cypress/e2e/tests/${capitalizedTestSuite}/**/*.cy.{js,jsx,ts,tsx}`,'cypress/e2e/tests/*.cy.ts'];
      }

      // No sprint provided — leave specPattern unchanged
      if (sprint) {
        if (sprint === 'all') {
          config.specPattern = 'cypress/e2e/tests/Sprint/*.cy.{js,jsx,ts,tsx}';
        } else {
          config.specPattern = `cypress/e2e/tests/Sprint/${sprint}.cy.{js,jsx,ts,tsx}`;
        }
      }
      
      // Merge environment variables
      config.env = {
        ...config.env,
        ...environmentConfig,
        ...qatouchConfig,
        testRunKey,
        testSuite,
        sprint
      };
      
      // Set baseUrl if provided
      if (environmentConfig.baseUrl) {
        config.baseUrl = environmentConfig.baseUrl;
      }
      
      return config;
    },
  },
});

function getConfigurationByFile(file: string): Record<string, any> {

  const pathToConfigFile = path.resolve('./cypress/config', `${file}.json`);
  
  if (!fs.existsSync(pathToConfigFile)) {
    console.error(`Could not find config file at ${pathToConfigFile}`);
    return {};
  }
  
  try {
    return JSON.parse(fs.readFileSync(pathToConfigFile, 'utf-8'));
  } catch (error) {
    console.error(`Error parsing config file ${pathToConfigFile}:`, error);
    return {};
  }
}