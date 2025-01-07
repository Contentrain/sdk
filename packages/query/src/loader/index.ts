import type { DataLoader } from './types';

export type { DataLoader };

export async function createLoader(type: 'node' | 'browser', basePath: string): Promise<DataLoader> {
  switch (type) {
    case 'node': {
      const { FileSystemLoader } = await import('./node');
      return new FileSystemLoader(basePath);
    }
    case 'browser': {
      const { FetchLoader } = await import('./browser');
      return new FetchLoader(basePath);
    }
    default:
      throw new Error('Unsupported loader type');
  }
}
