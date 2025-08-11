#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import inquirer from 'inquirer';
import { Command } from 'commander';
import chalk from 'chalk';

interface TestCaseInfo {
  file: string;
  version: number;
  describeName: string;
  caseNumber: string;
  node: ts.Node;
  itText: string;
  itStart: number;
  itEnd: number;
}

function getVersionFromFilename(filename: string): number {
  const m = filename.match(/v(\d+)\.cy\.ts$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Extract case number from test title string, e.g. "42 - [Module] Title"
function extractCaseNumber(testName: string): string | null {
  const m = testName.match(/^(\d+)\s*-/);
  return m ? m[1] : null;
}

function findDescribeIts(sourceFile: ts.SourceFile, file: string, version: number): TestCaseInfo[] {
  const results: TestCaseInfo[] = [];

  function visit(node: ts.Node, currentDescribe: string | null) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'describe' &&
      node.arguments.length >= 2
    ) {
      const arg0 = node.arguments[0];
      if (ts.isStringLiteral(arg0)) {
        const describeName = arg0.text;
        const callback = node.arguments[1];
        if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) {
          if (callback.body && ts.isBlock(callback.body)) {
            callback.body.statements.forEach(stmt => visit(stmt, describeName));
          }
        }
      }
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === 'it' || node.expression.text === 'it.only' || node.expression.text === 'it.skip') &&
      node.arguments.length >= 1
    ) {
      if (!currentDescribe) return;

      const arg0 = node.arguments[0];
      if (ts.isStringLiteral(arg0)) {
        const caseNumber = extractCaseNumber(arg0.text);
        if (caseNumber) {
          const start = node.getFullStart();
          const end = node.getEnd();
          const itText = sourceFile.text.substring(start, end);
          results.push({
            file,
            version,
            describeName: currentDescribe,
            caseNumber,
            node,
            itText,
            itStart: start,
            itEnd: end,
          });
        }
      }
    } else {
      ts.forEachChild(node, child => visit(child, currentDescribe));
    }
  }

  visit(sourceFile, null);
  return results;
}

function printHeader() {
  console.log(chalk.cyan.bold('\nTest Case Duplicate Detector'));
  console.log('━'.repeat(60));
}

function printStats(totalTests: number, duplicatesFound: number, filesScanned: number) {
  console.log(chalk.blue('\nScan Results:'));
  console.log(`   Files scanned: ${filesScanned}`);
  console.log(`   Total test cases: ${totalTests}`);
  console.log(chalk.yellowBright(`   Duplicates found: ${duplicatesFound}`));
  console.log();
}

function printDuplicateInfo(dup: TestCaseInfo, latest: TestCaseInfo) {
  const title = `Duplicate case "${dup.caseNumber}" on "${dup.describeName}"`;
  
  console.log(chalk.magentaBright.bold(`\n${title}`));
  
  // Extract the full test title from the it() call
  const extractTestTitle = (testText: string) => {
    const match = testText.match(/it(?:\.only|\.skip)?\(\s*["']([^"']+)["']/);
    return match ? match[1] : 'Unknown test title';
  };
  
  // Current (older) version
  const dupTitle = extractTestTitle(dup.itText);
  console.log(chalk.white(`-- Sprint v${dup.version} `) + chalk.yellowBright(`(duplicate)`));
  console.log('     ' + chalk.dim.underline(`${dupTitle}`));
  
  // Latest version
  const latestTitle = extractTestTitle(latest.itText);
  console.log(chalk.white(`-- Sprint v${latest.version} `) + chalk.greenBright('[latest version]'));
  console.log('     ' + chalk.dim.underline(`${latestTitle}`));

  console.log("")
}

async function main() {
  const program = new Command();
  program
    .name('test-duplicate-detector')
    .description('Detect and manage duplicate test cases across sprint versions')
    .version('1.0.0')
    .option('-d, --dir <path>', 'Sprint directory path')
    .parse(process.argv);

  const options = program.opts();

  printHeader();

  if (!options.dir) {
    console.error(chalk.red('Error: --dir argument is required'));
    console.log('Usage: npx ts-node script.ts --dir /path/to/sprint/directory');
    process.exit(1);
  }

  const sprintDir = path.resolve(options.dir);

  if (!fs.existsSync(sprintDir)) {
    console.error(chalk.red(`Sprint directory does not exist: ${sprintDir}`));
    process.exit(1);
  }

  console.log(chalk.blue(`Scanning directory: ${sprintDir}`));

  const files = fs.readdirSync(sprintDir).filter(f => f.endsWith('.cy.ts') && !f.startsWith('base'));

  if (files.length === 0) {
    console.log('No test files found.');
    return;
  }

  console.log(chalk.gray(`Found ${files.length} test file(s): ${files.join(', ')}`));

  const allTests: TestCaseInfo[] = [];
  const latestTests: Record<string, Record<string, TestCaseInfo>> = {};

  // Process files with progress indication
  for (const file of files) {
    const version = getVersionFromFilename(file);
    const fullPath = path.join(sprintDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    const tests = findDescribeIts(sourceFile, file, version);
    allTests.push(...tests);

    for (const t of tests) {
      if (!latestTests[t.describeName]) latestTests[t.describeName] = {};
      const existing = latestTests[t.describeName][t.caseNumber];
      if (!existing || existing.version < t.version) {
        latestTests[t.describeName][t.caseNumber] = t;
      }
    }
  }

  const duplicates = allTests.filter(test => {
    const latest = latestTests[test.describeName][test.caseNumber];
    return latest.file !== test.file;
  });

  printStats(allTests.length, duplicates.length, files.length);

  if (duplicates.length === 0) {
    console.log(chalk.green.bold('No duplicates found. Your test suite is clean!'));
    return;
  }

  console.log(chalk(`\nFound ${duplicates.length} duplicate test case(s) to process:`));
  console.log(chalk.redBright('Note: Latest version files will not be modified'));

  console.log('━'.repeat(60));

  const editsByFile: Record<string, {start: number; end: number; newText: string; action: string; caseNumber: string}[]> = {};
  let processedCount = 0;

  for (const dup of duplicates) {
    const latest = latestTests[dup.describeName][dup.caseNumber];
    processedCount++;

    printDuplicateInfo(dup, latest);

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.white('What do you want to do with this duplicate?'),
        choices: [
          { 
            name: 'Add .skip to this test', 
            value: 'skip'
          },
          { 
            name: 'Delete this test entirely', 
            value: 'delete'
          },
          { 
            name: 'Leave it as is', 
            value: 'leave'
          },
        ],
      },
    ]);

    let newText = dup.itText;

    if (answer.action === 'skip') {
      if (/it\.skip\(/.test(dup.itText)) {
        console.log('Already skipped, no changes needed.');
        continue;
      }
      newText = dup.itText.replace(/it(\.only|\.skip)?\(/, 'it.skip(');
    } else if (answer.action === 'delete') {
      newText = '';
    } else {
      console.log('Leaving test as is.');
      continue;
    }

    if (!editsByFile[dup.file]) editsByFile[dup.file] = [];
    editsByFile[dup.file].push({
      start: dup.itStart,
      end: dup.itEnd,
      newText,
      action: answer.action,
      caseNumber: dup.caseNumber,
    });
  }
  console.clear()
  // Apply changes
  const modifiedFiles = Object.keys(editsByFile);
  if (modifiedFiles.length > 0) {
    console.log(chalk.blue.bold('\nApplying changes...'));
    
    for (const file in editsByFile) {
      const fullPath = path.join(sprintDir, file);
      let content = fs.readFileSync(fullPath, 'utf-8');
      const edits = editsByFile[file].sort((a, b) => b.start - a.start);

      for (const edit of edits) {
        content = content.slice(0, edit.start) + edit.newText + content.slice(edit.end);
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      
      // Show detailed modifications
      console.log(chalk.magentaBright(`${file} updated (${edits.length} modification(s))`));
      edits.forEach(edit => {
        const actionText = edit.action === 'skip' ? 'added skip' : 'deleted';
        const actionColor = edit.action === 'skip' ? chalk.yellowBright : chalk.red;
        console.log(chalk.white(`- Case ${edit.caseNumber} `) + actionColor(`[${actionText}]`));
      });
    }

    console.log(chalk.greenBright.bold(`\nSuccessfully processed ${modifiedFiles.length} file(s)!`));
  } else {
    console.log('\nNo changes were made.');
  }

  console.log(chalk.cyan.bold('\nAll Done!'));
}

main().catch(err => {
  console.error(chalk.red('Error occurred:'));
  console.error(err.message);
  if (err.stack) {
    console.error(chalk.dim('\nStack trace:'));
    console.error(chalk.dim(err.stack));
  }
  process.exit(1);
});