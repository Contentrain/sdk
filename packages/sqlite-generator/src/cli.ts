#!/usr/bin/env node

import { join } from 'node:path';
import { cwd, exit } from 'node:process';
import { Command } from 'commander';
import { ContentrainSQL } from './index';
import { ContentrainError } from './types/errors';

const program = new Command();

program
  .name('contentrain-sql')
  .description('Contentrain SQL Generator CLI')
  .version('1.0.0');

program
  .command('generate')
  .description('Converts JSON content to SQLite database')
  .option('-m, --models <dir>', 'Directory containing model definitions', 'contentrain/models')
  .option('-c, --content <dir>', 'Directory containing content files', 'contentrain')
  .option('-o, --output <dir>', 'Directory where database will be created', 'db')
  .option('-n, --name <name>', 'Database file name', 'contentrain.db')
  .action(async (options) => {
    try {
      const generator = new ContentrainSQL({
        modelsDir: join(cwd(), options.models),
        contentDir: join(cwd(), options.content),
        outputPath: join(cwd(), options.output),
        dbName: options.name,
      });

      await generator.generate();
      console.info(`Database created: ${join(cwd(), options.output, options.name)}`);
    }
    catch (error) {
      if (error instanceof ContentrainError) {
        console.error('Error:', error.message);
        console.error('Details:', JSON.stringify(error.details, null, 2));
        if (error.cause) {
          console.error('Cause:', error.cause.message);
        }
      }
      else {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }
      exit(1);
    }
  });

program.parse();
