import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  minify: true,
  external: [
    '@contentrain/types',
    'react',
    'vue',
    'node:fs',
    'node:path',
    'node:process',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});
