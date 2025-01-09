import { beforeEach, vi } from 'vitest';

// Mock fetch API
globalThis.fetch = vi.fn();

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

const IDBKeyRange = {
  bound: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
  only: vi.fn(),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: IDBKeyRange,
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  indexedDB.open.mockReset();
  indexedDB.deleteDatabase.mockReset();
  (globalThis.fetch as any).mockReset();
});
