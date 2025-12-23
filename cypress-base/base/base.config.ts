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
      const regressionSheetConfig: Record<string, any> = getConfigurationByFile("regression-sheet");

      // Determine test mode and integrations
      const sprint: string = config.env.sprint || '';
      const regression: boolean = config.env.regression === true || config.env.regression === "true";
      const disable: string = config.env.disable || 'none';

      let specPattern: string | string[] = '';

      // Handle spec patterns
      if (sprint) {
        specPattern = sprint === 'all' 
          ? 'cypress/e2e/sprint/*.cy.{js,jsx,ts,tsx}'
          : `cypress/e2e/sprint/${sprint}.cy.{js,jsx,ts,tsx}`;
      }
      else if (regression) {
        specPattern = [
          'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
          '!cypress/e2e/sprint/**/*.cy.{js,jsx,ts,tsx}' // Exclude sprint folder
        ];
      }

      if (specPattern) {
        config.specPattern = specPattern;
      }

      const allowedDisables = ['none', 'gsheets', 'qatouch', 'all'] as const;
      if (!allowedDisables.includes(disable as any)) {
        throw new Error(
          `Invalid --env disable=${disable}. Expected one of: ${allowedDisables.join(', ')}`
        );
      }

      // Merge environment variables
      config.env = {
        ...config.env,
        ...environmentConfig,
        ...qatouchConfig,
        ...regressionSheetConfig,
        sprint,
        regression,
        disable,
      };

      // Set baseUrl if provided
      if (environmentConfig.baseUrl) {
        config.baseUrl = environmentConfig.baseUrl;
      }
      // TODO: Write logs in file
      on("task", {
        updateGoogleSheet,
        readGoogleSheetCell,
        integrationLog: ({ source, message }: { source: string; message: string }) => {
          console.log(`\x1b[0m[\x1b[36mCW\x1b[0m → ${source}] ${message}`);
          return null; // tasks must return something
        },
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
  cellValue,
}: {
  spreadsheetId: string;
  sheetName: string;
  cellRef: string;
  cellValue: string;
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
    requestBody: { values: [[cellValue]] },
  });

  return res.status; // 200 means success
}

async function readGoogleSheetCell({
  spreadsheetId,
  sheetName,
  cellRef,
}: {
  spreadsheetId: string;
  sheetName: string;
  cellRef: string;
}): Promise<string | null> {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.cwd(), "secrets/service-account.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${cellRef}`,
  });

  // values is a 2D array: [[value]]
  return res.data.values?.[0]?.[0] ?? null;
}