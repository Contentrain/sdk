import type { RuntimeAdapter, RuntimeOptions } from './types';
import process from 'node:process';
import { BrowserRuntime } from './browser';
import { NodeRuntime } from './node';

export function createRuntime(options: RuntimeOptions): RuntimeAdapter {
  const runtime = typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null
    ? new NodeRuntime()
    : new BrowserRuntime();

  // Runtime'ı başlat
  void runtime.initialize(options);

  return runtime;
}

export * from './browser';
export * from './node';
export * from './types';
