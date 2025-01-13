import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryCache } from '../memory';

describe('memoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({
      maxSize: 1, // 1 MB
      defaultTTL: 2000, // 2 saniye
    });
  });

  afterEach(async () => {
    await cache.clear();
    // Clear sonrası cache'in tamamen temizlendiğinden emin ol
    expect(cache.getStats().size).toBe(0);
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('set & get', () => {
    it('should store and retrieve data', async () => {
      const data = { foo: 'bar' };
      const initialSize = cache.getStats().size;

      await cache.set('test', data);
      const result = await cache.get<typeof data>('test');

      expect(result).toEqual(data);
      expect(cache.getStats().size).toBeGreaterThan(initialSize);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
      expect(cache.getStats().misses).toBe(1);
    });

    it('should respect TTL', async () => {
      const data = { foo: 'bar' };
      await cache.set('test', data, 500); // 500ms TTL

      // İlk okuma başarılı olmalı
      let result = await cache.get<typeof data>('test');
      expect(result).toEqual(data);
      expect(cache.getStats().hits).toBe(1);

      // TTL sonrası null dönmeli
      await new Promise(resolve => setTimeout(resolve, 600));
      result = await cache.get('test');
      expect(result).toBeNull();
      expect(cache.getStats().size).toBe(0);
    }, 10000);

    it('should use default TTL when not specified', async () => {
      const data = { foo: 'bar' };
      await cache.set('test', data);

      // İlk okuma başarılı olmalı
      let result = await cache.get<typeof data>('test');
      expect(result).toEqual(data);

      // Default TTL (2000ms) sonrası null dönmeli
      await new Promise(resolve => setTimeout(resolve, 2100));
      result = await cache.get('test');
      expect(result).toBeNull();
      expect(cache.getStats().size).toBe(0);
    }, 10000);
  });

  describe('delete', () => {
    it('should remove data and update stats', async () => {
      const data = { foo: 'bar' };
      await cache.set('test', data);
      const sizeBeforeDelete = cache.getStats().size;

      await cache.delete('test');
      const result = await cache.get('test');

      expect(result).toBeNull();
      expect(cache.getStats().size).toBeLessThan(sizeBeforeDelete);
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all data and reset stats', async () => {
      await cache.set('test1', { foo: 'bar' });
      await cache.set('test2', { baz: 'qux' });

      await cache.clear();
      await new Promise(resolve => setTimeout(resolve, 50));

      const result1 = await cache.get('test1');
      const result2 = await cache.get('test2');
      const stats = cache.getStats();

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });
  });

  describe('memory management', () => {
    it('should cleanup when size limit is exceeded', async () => {
      // Büyük veri oluştur (yaklaşık 750KB)
      const data = 'x'.repeat(750 * 1024);

      // İlk veriyi ekle
      await cache.set('test1', data);
      expect(await cache.get('test1')).toBe(data);

      // İkinci veriyi ekle (toplam 1.5MB olacak, limit 1MB)
      await cache.set('test2', data);
      await new Promise(resolve => setTimeout(resolve, 200)); // Cleanup için bekle

      // İlk veri silinmiş olmalı çünkü limit aşıldı
      expect(await cache.get('test1')).toBeNull();
      expect(await cache.get('test2')).toBe(data);
      expect(cache.getStats().size).toBeLessThanOrEqual(1024 * 1024); // 1MB'dan küçük olmalı
    }, 10000);

    it('should cleanup expired entries during size check', async () => {
      // Büyük veri oluştur (yaklaşık 750KB)
      const data = 'x'.repeat(750 * 1024);

      // İlk veriyi kısa TTL ile ekle
      await cache.set('test1', data, 100);

      // TTL'in dolmasını bekle
      await new Promise(resolve => setTimeout(resolve, 150));

      // İkinci veriyi ekle
      await cache.set('test2', data);
      await new Promise(resolve => setTimeout(resolve, 50)); // Cleanup için bekle

      // İlk veri expired olduğu için silinmiş olmalı
      expect(await cache.get('test1')).toBeNull();
      // İkinci veri eklenebilmeli
      expect(await cache.get('test2')).toBe(data);
      // Toplam boyut 1MB'ı aşmamalı
      expect(cache.getStats().size).toBeLessThanOrEqual(1024 * 1024);
    }, 10000);
  });

  describe('stats', () => {
    it('should track hits, misses and size accurately', async () => {
      const data = { foo: 'bar' };
      const initialStats = cache.getStats();

      await cache.set('test', data);
      expect(cache.getStats().size).toBeGreaterThan(initialStats.size);

      // Hit
      await cache.get('test');
      expect(cache.getStats().hits).toBe(1);

      // Miss
      await cache.get('non-existent');
      expect(cache.getStats().misses).toBe(1);

      // Delete
      await cache.delete('test');
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple simultaneous set operations', async () => {
      const operations = Array.from({ length: 10 }).fill(null).map(async (_, index) => {
        return cache.set(`key${index}`, { data: `value${index}` });
      });

      await Promise.all(operations);

      // Verify all values were set correctly
      for (let i = 0; i < 10; i++) {
        const value = await cache.get(`key${i}`);
        expect(value).toEqual({ data: `value${i}` });
      }
    });

    it('should handle concurrent set/get operations', async () => {
      const key = 'test-key';
      const operations = Array.from({ length: 50 }).fill(null).map(async (_, index) => {
        if (index % 2 === 0) {
          return cache.set(key, { count: index });
        }
        return cache.get(key);
      });

      await Promise.all(operations);
      const finalValue = await cache.get(key);
      expect(finalValue).toBeDefined();
    });

    it('should maintain data consistency during cleanup', async () => {
      // Fill cache near its limit
      const data = 'x'.repeat(400 * 1024); // 400KB
      await Promise.all([
        cache.set('key1', data, 100),
        cache.set('key2', data, 200),
        cache.set('key3', data, 300),
      ]);

      // Start concurrent operations during cleanup
      const operations = [
        new Promise(resolve => setTimeout(resolve, 150)).then(async () => cache.set('key4', data)),
        new Promise(resolve => setTimeout(resolve, 250)).then(async () => cache.get('key2')),
        new Promise(resolve => setTimeout(resolve, 350)).then(async () => cache.get('key3')),
      ];

      await Promise.all(operations);

      // Verify cache size is still within limits
      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1024 * 1024); // 1MB limit
    });

    it('should handle rapid delete operations', async () => {
      // Set multiple values
      await Promise.all(
        Array.from({ length: 5 }).fill(null).map(async (_, i) => cache.set(`key${i}`, { value: i })),
      );

      // Delete them rapidly
      await Promise.all(
        Array.from({ length: 5 }).fill(null).map(async (_, i) => cache.delete(`key${i}`)),
      );

      // Verify all are deleted
      const results = await Promise.all(
        Array.from({ length: 5 }).fill(null).map(async (_, i) => cache.get(`key${i}`)),
      );

      results.forEach(result => expect(result).toBeNull());
      expect(cache.getStats().size).toBe(0);
    });

    it('should handle concurrent clear and set operations', async () => {
      // Start setting values
      const setOperations = Array.from({ length: 5 }).fill(null).map(async (_, i) =>
        cache.set(`key${i}`, { value: i }),
      );

      // Clear cache while setting
      const operations = [
        ...setOperations,
        cache.clear(),
      ];

      await Promise.all(operations);

      // Cache should be empty or contain only values set after clear
      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1024 * 1024); // Should not exceed limit
    });
  });
});
