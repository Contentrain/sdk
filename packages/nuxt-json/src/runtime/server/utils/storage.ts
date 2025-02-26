import { useStorage } from '#imports';

export const STORAGE_PREFIX = 'contentrain';

export function createStorageKey(key: string): string {
    return `${STORAGE_PREFIX}:${key}`;
}

export const STORAGE_KEYS = {
    STATUS: createStorageKey('status'),
    CACHE_TIME: createStorageKey('cache_time'),
    MODEL_LIST: createStorageKey('models:list'),
    MODEL_DATA: (modelId: string) => createStorageKey(`model:${modelId}:data`),
} as const;

export const STORAGE_STATUS = {
    READY: 'ready',
    LOADING: 'loading',
    ERROR: 'error',
} as const;

// Cache süresi: 5 dakika
export const CACHE_TTL = 5 * 60 * 1000;

export const StorageManager = {
    // Storage durumunu kontrol et
    async isReady() {
        const storage = useStorage('data');
        const status = await storage.getItem<string>(STORAGE_KEYS.STATUS);
        return status === STORAGE_STATUS.READY;
    },

    // Cache durumunu kontrol et
    async isCacheValid() {
        const storage = useStorage('data');
        const cacheTime = await storage.getItem<number>(STORAGE_KEYS.CACHE_TIME);

        if (!cacheTime)
            return false;

        return Date.now() - cacheTime < CACHE_TTL;
    },

    // Storage'ı hazırla
    async prepare() {
        const storage = useStorage('data');
        await storage.setItem(STORAGE_KEYS.STATUS, STORAGE_STATUS.LOADING);
        await storage.setItem(STORAGE_KEYS.CACHE_TIME, Date.now());
    },

    // Storage'ı tamamla
    async complete() {
        const storage = useStorage('data');
        await storage.setItem(STORAGE_KEYS.STATUS, STORAGE_STATUS.READY);
    },

    // Hata durumunu kaydet
    async setError() {
        const storage = useStorage('data');
        await storage.setItem(STORAGE_KEYS.STATUS, STORAGE_STATUS.ERROR);
    },
};
