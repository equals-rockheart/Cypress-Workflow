import { defineConfig } from 'cypress';
import { google } from "googleapis";
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    setupNodeEvents(on, config) {
      // Get configuration file (defaults to 'staging' if not provided)
      const configFile: string = config.env.baseConfig || config.env.configFile || 'staging';
      const environmentConfig = getConfigurationByFile(`env/${configFile}`);
      const qatouchConfig = getConfigurationByFile("qatouch");

      // Handle testRunKey and testSuite validation
      const testRunKey: string = config.env.testRunKey || '';
      const testSuite: string = config.env.testSuite || '';

      // Handle sprint validation
      const sprint: string = config.env.sprint || '';

      // Handle sheets validation
      const regressionSheetConfig = getConfigurationByFile("regression-sheet");
      const regression: boolean = config.env.regression === true || config.env.regression === "true";

      // If testRunKey is provided but testSuite is not, throw error
      if (testRunKey && !testSuite) {
        throw new Error('testSuite is required when testRunKey is provided (e.g., testSuite=admin)');
      }

      // Set spec patterns based on testSuite
      if (testSuite) {
        config.specPattern = [
          `cypress/e2e/${testSuite}/**/*.cy.{js,jsx,ts,tsx}`, 
          'cypress/e2e/*.cy.ts'];
      }

      // Handle sprint spec patterns
      if (sprint) {
        if (sprint === 'all') {
          config.specPattern = 'cypress/e2e/sprint/*.cy.{js,jsx,ts,tsx}';
        } else {
          config.specPattern = `cypress/e2e/sprint/${sprint}.cy.{js,jsx,ts,tsx}`;
        }
      }

      // Merge environment variables
      config.env = {
        ...config.env,
        ...environmentConfig,
        ...qatouchConfig,
        ...regressionSheetConfig,
        testRunKey,
        testSuite,
        sprint,
        regression,
      };

      // Set baseUrl if provided
      if (environmentConfig.baseUrl) {
        config.baseUrl = environmentConfig.baseUrl;
      }

      // Google API task
      on("task", {
        updateGoogleSheet,
      });

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

async function updateGoogleSheet({
  spreadsheetId,
  sheetName,
  cellRef,
  value,
}: {
  spreadsheetId: string;
  sheetName: string;
  cellRef: string;
  value: string;
}): Promise<number> {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.cwd(), "secrets/service-account.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${cellRef}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });

  return res.status; // 200 means success
}