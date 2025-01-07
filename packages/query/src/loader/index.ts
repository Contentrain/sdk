import type { DataLoader } from './types';

export async function createLoader(path: string): Promise<DataLoader> {
  if (typeof window === 'undefined') {
    const { FileSystemLoader } = await import('./node');
    return new FileSystemLoader(path);
  }
  else {
    const { FetchLoader } = await import('./browser');
    return new FetchLoader(path);
  }
}
