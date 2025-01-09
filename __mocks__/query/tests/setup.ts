import { vi } from 'vitest';

const mockStorage = {
  store: new Map<string, string>(),
  clear() {
    this.store.clear();
  },
  getItem(key: string) {
    return this.store.get(key) || null;
  },
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  },
  removeItem(key: string) {
    this.store.delete(key);
  },
  key(index: number) {
    return Array.from(this.store.keys())[index] || null;
  },
  get length() {
    return this.store.size;
  },
};

vi.stubGlobal('localStorage', mockStorage);

export {};
