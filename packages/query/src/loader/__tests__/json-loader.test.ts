import type { IBaseJSONRecord } from '../types/json';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JSONLoader } from '../json/json.loader';

interface TestJSONRecord extends IBaseJSONRecord {
    title?: string
    description?: string
    order?: number
    category?: string | string[]
    reference?: string
    icon?: string
    link?: string
    _relations?: {
        category?: TestJSONRecord | TestJSONRecord[]
        reference?: TestJSONRecord
    }
}

describe('jSONLoader', () => {
    let loader: JSONLoader<TestJSONRecord>;
    const contentDir = join(__dirname, '../../../../../playground/contentrain');

    beforeEach(() => {
        loader = new JSONLoader({
            contentDir,
            cache: true,
            maxCacheSize: 100,
            defaultLocale: 'en',
        });
    });

    afterEach(async () => {
        await loader.clearCache();
    });

    describe('temel İçerik İşlemleri', () => {
        it('jSON içeriği yükleyebilmeli', async () => {
            const result = await loader.load('workitems');
            expect(result.model.metadata.modelId).toBe('workitems');
            expect(result.content.en).toBeDefined();
            expect(Array.isArray(result.content.en)).toBe(true);
        });

        it('içerik cache\'lenebilmeli', async () => {
            await loader.load('workitems');
            const stats1 = loader.getCacheStats();

            await loader.load('workitems');
            const stats2 = loader.getCacheStats();

            expect(stats2.cache?.hits).toBeGreaterThan(stats1.cache?.hits || 0);
        });

        it('farklı dillerdeki içerikleri yükleyebilmeli', async () => {
            const result = await loader.load('workitems');
            expect(result.content.en).toBeDefined();
            expect(result.content.tr).toBeDefined();
        });

        it('model metadata\'sını doğru yükleyebilmeli', async () => {
            const result = await loader.load('workitems');
            expect(result.model.metadata).toMatchObject({
                modelId: 'workitems',
                type: 'JSON',
                localization: true,
            });
        });

        it('model alanlarını doğru yükleyebilmeli', async () => {
            const result = await loader.load('workitems');
            expect(result.model.fields).toBeDefined();
            expect(Array.isArray(result.model.fields)).toBe(true);

            const titleField = result.model.fields.find(f => f.name === 'title');
            expect(titleField).toBeDefined();
            expect(titleField?.fieldType).toBe('string');
        });
    });

    describe('i̇lişki İşlemleri', () => {
        it('bire-bir ilişkileri çözebilmeli', async () => {
            const result = await loader.load('workitems');
            const firstItem = result.content.en[0];

            const relations = await loader.resolveRelations<TestJSONRecord>(
                'workitems',
                'category',
                [firstItem],
            );

            expect(relations).toBeDefined();
            expect(Array.isArray(relations)).toBe(true);
            expect(relations[0]).toHaveProperty('ID');
        });

        it('bire-çok ilişkileri çözebilmeli', async () => {
            const result = await loader.load('tabitems');
            const firstItem = result.content.en[0];

            const relations = await loader.resolveRelations<TestJSONRecord>(
                'tabitems',
                'category',
                [firstItem],
            );

            expect(relations).toBeDefined();
            expect(Array.isArray(relations)).toBe(true);
            expect(relations.length).toBeGreaterThan(0);
        });

        it('iç içe ilişkileri çözebilmeli', async () => {
            const result = await loader.load('workitems');
            const firstItem = result.content.en[0];

            // İlk seviye ilişkiyi çöz
            const categories = await loader.resolveRelations<TestJSONRecord>(
                'workitems',
                'category',
                [firstItem],
            );

            expect(categories[0]).toHaveProperty('ID');

            // İkinci seviye ilişkiyi çöz (eğer varsa)
            if (categories[0].reference) {
                const references = await loader.resolveRelations<TestJSONRecord>(
                    'categories',
                    'reference',
                    categories,
                );
                expect(references[0]).toHaveProperty('ID');
            }
        });
    });

    describe('cache Yönetimi', () => {
        it('cache temizlenebilmeli', async () => {
            await loader.load('workitems');
            const stats1 = loader.getCacheStats();

            await loader.clearCache();
            const stats2 = loader.getCacheStats();

            expect(stats2.cache?.size).toBe(0);
            expect(stats2.cache?.size).toBeLessThan(stats1.cache?.size || 0);
        });

        it('belirli bir model için cache yenilenebilmeli', async () => {
            await loader.load('workitems');
            const stats1 = loader.getCacheStats();

            await loader.refreshCache('workitems');
            const stats2 = loader.getCacheStats();

            expect(stats2.cache?.hits || 0).toBeLessThan((stats1.cache?.hits || 0) + 1);
        });

        it('tTL ayarına göre cache temizlenebilmeli', async () => {
            const shortTTLLoader = new JSONLoader({
                contentDir,
                cache: true,
                maxCacheSize: 100,
                defaultLocale: 'en',
                ttl: 100, // 100ms TTL
            });

            await shortTTLLoader.load('workitems');
            await new Promise(resolve => setTimeout(resolve, 150));

            const result = await shortTTLLoader.load('workitems');
            const stats = shortTTLLoader.getCacheStats();

            expect(stats.cache?.misses || 0).toBeGreaterThan(0);
            expect(result).toBeDefined();
        });
    });

    describe('hata Yönetimi', () => {
        it('olmayan model hatası yönetebilmeli', async () => {
            await expect(loader.load('non-existent')).rejects.toThrow();
        });

        it('geçersiz ilişki hatası yönetebilmeli', async () => {
            const result = await loader.load('workitems');
            const firstItem = result.content.en[0];

            await expect(
                loader.resolveRelations(
                    'workitems',
                    'non-existent' as keyof TestJSONRecord,
                    [firstItem],
                ),
            ).rejects.toThrow();
        });

        it('geçersiz dosya formatı hatası yönetebilmeli', async () => {
            const invalidLoader = new JSONLoader({
                contentDir: join(__dirname, 'invalid-dir'),
                cache: true,
            });

            await expect(invalidLoader.load('workitems')).rejects.toThrow();
        });

        it('eksik metadata hatası yönetebilmeli', async () => {
            const invalidLoader = new JSONLoader({
                contentDir: join(__dirname, 'test-data'),
                cache: true,
            });

            await expect(invalidLoader.load('invalid-model')).rejects.toThrow();
        });
    });

    describe('performans Testleri', () => {
        it('çoklu yükleme işlemlerini yönetebilmeli', async () => {
            const start = Date.now();
            const promises = Array.from({ length: 5 }).map(async () => loader.load('workitems'));
            const results = await Promise.all(promises);
            const duration = Date.now() - start;

            expect(results).toHaveLength(5);
            expect(duration).toBeLessThan(1000); // 1 saniyeden az sürmeli
        });

        it('büyük veri kümelerini işleyebilmeli', async () => {
            const result = await loader.load('workitems');
            const items = result.content.en;

            const relations = await loader.resolveRelations<TestJSONRecord>(
                'workitems',
                'category',
                items,
            );

            expect(relations.length).toBeGreaterThan(0);
            expect(Array.isArray(relations)).toBe(true);
        });
    });

    describe('veri Bütünlüğü Testleri', () => {
        it('iD alanlarının benzersiz olduğunu kontrol edebilmeli', async () => {
            const result = await loader.load('workitems');
            const ids = result.content.en.map(item => item.ID);
            const uniqueIds = new Set(ids);
            expect(ids.length).toBe(uniqueIds.size);
        });

        it('zorunlu alanların dolu olduğunu kontrol edebilmeli', async () => {
            const result = await loader.load('workitems');
            result.content.en.forEach((item) => {
                expect(item.ID).toBeDefined();
                expect(item.createdAt).toBeDefined();
                expect(item.updatedAt).toBeDefined();
                expect(item.status).toBeDefined();
            });
        });

        it('ilişki bütünlüğünü kontrol edebilmeli', async () => {
            const result = await loader.load('workitems');
            const itemsWithCategory = result.content.en.filter(item => item.category);

            for (const item of itemsWithCategory) {
                const relations = await loader.resolveRelations<TestJSONRecord>(
                    'workitems',
                    'category',
                    [item],
                );
                expect(relations.length).toBeGreaterThan(0);
                if (typeof item.category === 'string') {
                    expect(relations[0].ID).toBe(item.category);
                }
                else {
                    expect(item.category).toContain(relations[0].ID);
                }
            }
        });

        it('çeviri bütünlüğünü kontrol edebilmeli', async () => {
            const result = await loader.load('workitems');
            const enItems = result.content.en;
            const trItems = result.content.tr;

            // Her İngilizce içeriğin Türkçe karşılığı olmalı
            enItems.forEach((enItem) => {
                const trItem = trItems.find(tr => tr.ID === enItem.ID);
                expect(trItem).toBeDefined();
                expect(trItem?.description).toBeDefined();
                expect(trItem?.description).not.toBe(enItem.description);
            });
        });
    });
});
