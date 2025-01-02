import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
    'plugins': 'src/plugins/index.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'node20',
  outDir: 'dist',
  external: ['commander']
})