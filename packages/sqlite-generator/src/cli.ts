#!/usr/bin/env node

import { join } from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import ContentrainSQLiteGenerator from './index';

export const program = new Command();

// Version komutunu özel olarak işle
program.on('option:version', () => {
  console.log('1.0.0');
  process.exit(0);
});

program
  .name('contentrain-sqlite')
  .description('SQLite database generator for Contentrain CMS')
  .version('1.0.0', '-V, --version', 'output the version number')
  .helpOption('-h, --help', 'display help for command')
  .option('-m, --models <dir>', 'Models directory path', 'contentrain/models')
  .option('-c, --content <dir>', 'Content directory path', 'contentrain')
  .option('-o, --output <dir>', 'Output directory path', 'dist')
  .option('-d, --db-name <n>', 'Database file name', 'contentrain.db')
  .action(async (options) => {
    try {
      const cwd = process.cwd();
      console.log('Current working directory:', cwd);
      console.log('Options:', options);

      // Dizinleri kontrol et
      const modelsDir = join(cwd, options.models);
      const contentDir = join(cwd, options.content);
      const outputDir = join(cwd, options.output);

      console.log('Models directory:', modelsDir);
      console.log('Content directory:', contentDir);
      console.log('Output directory:', outputDir);

      const generator = new ContentrainSQLiteGenerator({
        modelsDir,
        contentDir,
        outputDir,
        dbName: options.dbName,
      });

      console.log('Generating SQLite database...');
      await generator.generate();
      console.log('Database generated successfully!');
      process.exit(0);
    }
    catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      }
      else {
        console.error('Error:', String(error));
      }
      process.exit(1);
    }
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ contentrain-sqlite');
    console.log('  $ contentrain-sqlite --models models --content content --output dist --db-name custom.db');
  });

program.parse();
