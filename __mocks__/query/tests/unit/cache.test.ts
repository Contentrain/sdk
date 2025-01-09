import { beforeEach, describe, expect, it } from 'vitest';
import { mockData } from '../../__mocks__/data';
import { MemoryCache, StorageCache } from '../../src/cache/strategies';

describe('cache Strategies', () => {
  describe('memory Cache', () => {
    let cache: MemoryCache;

    beforeEach(() => {
      cache = MemoryCache.getInstance({ version: '1.0.0' });
      cache.clear();
    });

    it('should store and retrieve work items', () => {
      const data = mockData.faqitems;
      cache.set('faqitems', data, 1000);
      expect(cache.get('faqitems')).toEqual(data);
    });

    it('should handle expired data', async () => {
      const data = mockData.workcategories;
      cache.set('workcategories', data, 1);
      await new Promise(resolve => setTimeout(resolve, 2));
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should check if key exists', () => {
      const data = mockData.faqitems;
      cache.set('faqitems', data, 1000);
      expect(cache.has('faqitems')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete data', () => {
      const data = mockData.workcategories;
      cache.set('workcategories', data, 1000);
      cache.delete('workcategories');
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should clear all data', () => {
      cache.set('faqitems', mockData.faqitems, 1000);
      cache.set('workcategories', mockData.workcategories, 1000);
      cache.clear();
      expect(cache.get('faqitems')).toBeNull();
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should handle version changes', () => {
      cache.set('faqitems', mockData.faqitems, 1000);
      const newCache = MemoryCache.getInstance({ version: '2.0.0' });
      expect(newCache.get('faqitems')).toBeNull();
    });

    it('should handle localized data', () => {
      cache.set('faqitems:tr', mockData.localizedFaqItems.tr, 1000);
      expect(cache.get('faqitems:tr')).toEqual(mockData.localizedFaqItems.tr);
    });
  });

  describe('storage Cache', () => {
    let cache: StorageCache;

    beforeEach(() => {
      cache = new StorageCache({ version: '1.0.0' });
      cache.clear();
    });

    it('should store and retrieve work items', () => {
      const data = mockData.faqitems;
      cache.set('faqitems', data, 1000);
      expect(cache.get('faqitems')).toEqual(data);
    });

    it('should handle expired data', async () => {
      const data = mockData.workcategories;
      cache.set('workcategories', data, 1);
      await new Promise(resolve => setTimeout(resolve, 2));
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should check if key exists', () => {
      const data = mockData.faqitems;
      cache.set('faqitems', data, 1000);
      expect(cache.has('faqitems')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete data', () => {
      const data = mockData.workcategories;
      cache.set('workcategories', data, 1000);
      cache.delete('workcategories');
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should clear all data', () => {
      cache.set('faqitems', mockData.faqitems, 1000);
      cache.set('workcategories', mockData.workcategories, 1000);
      cache.clear();
      expect(cache.get('faqitems')).toBeNull();
      expect(cache.get('workcategories')).toBeNull();
    });

    it('should handle version changes', () => {
      cache.set('faqitems', mockData.faqitems, 1000);
      const newCache = new StorageCache({ version: '2.0.0' });
      expect(newCache.get('faqitems')).toBeNull();
    });

    it('should handle localized data', () => {
      cache.set('faqitems:tr', mockData.localizedFaqItems.tr, 1000);
      expect(cache.get('faqitems:tr')).toEqual(mockData.localizedFaqItems.tr);
    });
  });
});
