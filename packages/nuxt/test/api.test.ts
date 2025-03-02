import type { IDBRecord, QueryResult } from '@contentrain/query';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $fetch, setup, url } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

// Model tipleri
interface IWorkItem extends IDBRecord {
    title: string
    description: string
    image: string
    category_id: string
    link: string
    field_order: number
    status: 'publish' | 'draft'
    created_at: string
    updated_at: string
    _relations: {
        category: IWorkCategory
    }
}

interface IWorkCategory extends IDBRecord {
    category: string
    field_order: number
    status: 'publish' | 'draft'
    created_at: string
    updated_at: string
}

interface ITabItem extends IDBRecord {
    title: string
    description: string
    field_order: number
    category_id: string
    status: 'publish' | 'draft'
    created_at: string
    updated_at: string
    _relations: {
        category: IWorkCategory[]
    }
}

interface IFaqItem extends IDBRecord {
    question: string
    answer: string
    order: number
}

interface ITestimonialItem extends IDBRecord {
    'name': string
    'description': string
    'title': string
    'image': string
    'creative-work_id': string
    'status': 'publish' | 'draft'
    'created_at': string
    'updated_at': string
    '_relations': {
        'creative-work': IWorkItem
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../../playground/contentrain-db/contentrain.db');

describe('contentrain API Endpoints', async () => {
    // Test ortamını hazırla
    await setup({
        rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
        server: true,
        browser: false,
        nuxtConfig: {
            contentrain: {
                databasePath: dbPath,
                cache: true,
                ttl: 60 * 1000,
                maxCacheSize: 1000,
            },
            experimental: {
                asyncContext: true,
            },
            nitro: {
                moduleSideEffects: ['better-sqlite3'],
            },
        },
    });

    describe('0. API Hazırlık Kontrolü', () => {
        it('0.1 API Endpoint Kontrolü', async () => {
            const response = await $fetch(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                },
            }).catch((error) => {
                console.error('API Hazırlık Hatası:', error);
                throw error;
            });
            expect(response).toBeDefined();
        });
    });

    describe('1. Temel Sorgular', () => {
        it('1.1 Filtreleme ve Sıralama', async () => {
            const response = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    where: [
                        ['status', 'eq', 'publish'],
                        ['field_order', 'lt', 5],
                    ],
                    orderBy: [['field_order', 'asc']],
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            response.data.forEach((item) => {
                expect(item.status).toBe('publish');
                expect(item.field_order).toBeLessThan(5);
            });
        });

        it('1.2 Sayfalama', async () => {
            const response = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    limit: 3,
                    offset: 1,
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeLessThanOrEqual(3);
            expect(response.pagination).toBeDefined();
            expect(response.pagination?.limit).toBe(3);
            expect(response.pagination?.offset).toBe(1);
        });
    });

    describe('2. İlişki Sorguları', () => {
        it('2.1 Bire-Bir İlişki', async () => {
            const response = await $fetch<QueryResult<ITestimonialItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'testimonial-items',
                    include: [{ relation: 'creative-work', locale: 'tr' }],
                    locale: 'tr',
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            response.data.forEach((item) => {
                expect(item._relations?.['creative-work']).toBeDefined();
                expect(item._relations?.['creative-work'].id).toBeDefined();
            });
        });

        it('2.2 Bire-Çok İlişki', async () => {
            const response = await $fetch<QueryResult<ITabItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'tabitems',
                    where: [['status', 'eq', 'publish']],
                    include: [{ relation: 'category', locale: 'tr' }],
                    locale: 'tr',
                },
            }).catch((error) => {
                console.error('Bire-Çok İlişki Hatası:', error.cause || error);
                throw error;
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            if (response.data.length > 0) {
                response.data.forEach((item) => {
                    expect(item._relations).toBeDefined();
                    expect(Array.isArray(item._relations?.category)).toBe(true);
                    expect(item._relations?.category.length).toBeGreaterThan(0);
                    item._relations?.category.forEach((cat) => {
                        expect(cat.id).toBeDefined();
                        expect(cat.category).toBeDefined();
                    });
                });
            }
        });
    });

    describe('3. Gelişmiş Sorgular', () => {
        it('3.1 Çoklu Filtreler', async () => {
            const response = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    where: [
                        ['status', 'eq', 'publish'],
                        ['field_order', 'gt', 2],
                        ['field_order', 'lt', 6],
                        ['description', 'contains', 'platform'],
                    ],
                    orderBy: [['field_order', 'asc']],
                    locale: 'tr',
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            response.data.forEach((item) => {
                expect(item.status).toBe('publish');
                expect(item.field_order).toBeGreaterThan(2);
                expect(item.field_order).toBeLessThan(6);
                expect(item.description.toLowerCase()).toContain('platform');
            });
        });

        it('3.2 Dizi Operatörleri', async () => {
            const response = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    where: [['status', 'in', ['publish', 'draft']]],
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            response.data.forEach((item) => {
                expect(['publish', 'draft']).toContain(item.status);
            });
        });
    });

    describe('4. Çoklu Dil Desteği', () => {
        it('4.1 Farklı Dillerde İçerik', async () => {
            // TR içerik
            const trResponse = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    locale: 'tr',
                    where: [['status', 'eq', 'publish']],
                    limit: 1,
                },
            });

            // EN içerik
            const enResponse = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    locale: 'en',
                    where: [['status', 'eq', 'publish']],
                    limit: 1,
                },
            });

            expect(trResponse).toBeDefined();
            expect(enResponse).toBeDefined();

            // Veri varsa kontrol et
            if (trResponse.data.length > 0 && enResponse.data.length > 0) {
                // En az bir alan farklı olmalı
                const trItem = trResponse.data[0];
                const enItem = enResponse.data[0];

                const hasDifference
          = trItem.title !== enItem.title
            || trItem.description !== enItem.description;

                expect(hasDifference).toBe(true);
            }
        });

        it('4.2 Lokalize Olmayan Model', async () => {
            const response = await $fetch<QueryResult<any>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'sociallinks',
                    where: [['status', 'eq', 'publish']],
                    orderBy: [['icon', 'asc']],
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            response.data.forEach((item) => {
                expect(item.icon).toBeDefined();
                expect(item.link).toBeDefined();
            });
        });
    });

    describe('5. Önbellek Yönetimi', () => {
        it('5.1 Önbellek Bypass', async () => {
            const response = await $fetch<QueryResult<IFaqItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'faqitems',
                    bypassCache: true,
                },
            });

            expect(response).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
        });

        it('5.2 Önbellek Kontrolü', async () => {
            // İlk istek - önbelleklenir
            const firstResponse = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    where: [['status', 'eq', 'publish']],
                },
            });

            // İkinci istek - önbellekten gelir
            const secondResponse = await $fetch<QueryResult<IWorkItem>>(url('/api/_contentrain/query'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                    where: [['status', 'eq', 'publish']],
                },
            });

            expect(firstResponse).toEqual(secondResponse);
        });
    });

    describe('6. Metadata ve Assets', () => {
        it('6.1 Model Metadata', async () => {
            const response = await $fetch<any>(url('/api/_contentrain/load'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                },
            });

            expect(response).toBeDefined();
            expect(response.model).toBeDefined();
            expect(response.model.metadata).toBeDefined();
        });

        it('6.2 Assets Kontrolü', async () => {
            const response = await $fetch<any>(url('/api/_contentrain/load'), {
                method: 'POST',
                body: {
                    model: 'workitems',
                },
            });

            expect(response).toBeDefined();
            expect(response.assets).toBeDefined();
            expect(Array.isArray(response.assets)).toBe(true);
        });
    });
});
