export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'contentrain-cache';
  private readonly STORE_NAME = 'cache-store';

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async get<T>(key: string): Promise<{ data: T[], buildInfo: any } | null> {
    if (!this.db)
      return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result || !result.data || !Array.isArray(result.data)) {
          resolve(null);
          return;
        }
        resolve(result as { data: T[], buildInfo: any });
      };
    });
  }

  async set<T>(key: string, value: { data: T[], buildInfo: any }): Promise<void> {
    if (!this.db)
      return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(prefix?: string): Promise<void> {
    if (!this.db)
      return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      if (prefix) {
        // Belirli bir önek ile başlayan tüm kayıtları sil
        const request = store.openCursor();
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            if (cursor.key.toString().startsWith(prefix)) {
              cursor.delete();
            }
            cursor.continue();
          }
          else {
            resolve();
          }
        };
      }
      else {
        // Tüm kayıtları sil
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
