const DB_NAME = 'contentrain-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache-store';

interface CacheEntry {
  key: string
  data: any
  timestamp: number
  namespace?: string
  ttl?: number
}

export class IndexedDBCache {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db)
      return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error('Failed to read from IndexedDB'));
      };

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (!entry || this.isExpired(entry)) {
          resolve(null);
          return;
        }
        resolve(entry.data);
      };
    });
  }

  async set<T>(key: string, data: T, options?: { ttl?: number, namespace?: string }): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl: options?.ttl,
        namespace: options?.namespace,
      };
      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error('Failed to write to IndexedDB'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error('Failed to delete from IndexedDB'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async clear(namespace?: string): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    if (!namespace) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
          reject(new Error('Failed to clear IndexedDB'));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    }

    // Belirli bir namespace için temizleme
    return this.clearByNamespace(namespace);
  }

  private async clearByNamespace(namespace: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const deletePromises: Promise<void>[] = [];

      request.onerror = () => {
        reject(new Error('Failed to clear namespace from IndexedDB'));
      };

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          if (entry.namespace === namespace) {
            deletePromises.push(this.delete(entry.key));
          }
          cursor.continue();
        }
        else {
          Promise.all(deletePromises)
            .then(() => resolve())
            .catch(reject);
        }
      };
    });
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl)
      return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
