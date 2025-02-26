import process from 'node:process';
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    treeshake: true,
    splitting: false,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    keepNames: true,
    outDir: 'dist',
    // Production optimizasyonları
    esbuildOptions(options) {
        if (process.env.NODE_ENV === 'production') {
            options.drop = ['console', 'debugger'];
            options.pure = ['debug'];
        }
    },
});
