#!/usr/bin/env node

import process from 'node:process';
import { Command } from 'commander';
import { ContentrainGenerator } from '.';

const program = new Command();

program
  .name('contentrain-generator')
  .description('CLI to generate TypeScript types from Contentrain models')
  .version('1.0.0')
  .option('-m, --models <path>', 'Path to models directory')
  .option('-o, --output <path>', 'Path to output directory')
  .option('-c, --content <path>', 'Path to content directory')
  .parse(process.argv);

const options = program.opts();

const generator = new ContentrainGenerator({
  modelsDir: options.models,
  outputDir: options.output,
  contentDir: options.content,
});

try {
  generator.generate();
  console.log('✨ Type definitions generated successfully');
}
catch (error: unknown) {
  console.error('❌ Error generating type definitions:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
