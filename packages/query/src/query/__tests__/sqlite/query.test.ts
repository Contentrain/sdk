import type { DBRecord } from '../../../types/database';
import type { ContentrainStatus } from '../../../types/model';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseSQLiteLoader } from '../../../loader/base-sqlite';
import { SQLiteQueryBuilder } from '../../sqlite-builder';

interface Reference extends DBRecord {
  logo: string
  status: ContentrainStatus
  created_at: string
  updated_at: string
}

interface Stats extends DBRecord {
  view_count: number
  status: ContentrainStatus
}

interface WorkItem extends DBRecord {
  category_id: string
  title?: string
  description?: string
  image?: string
  field_order?: number
  _relations?: {
    category?: WorkCategory
    reference?: Reference
    stats?: Stats
  }
}

interface TestimonialItem extends DBRecord {
  title: string
  name: string
  description: string
  creative_work_id: string
  _relations?: {
    'creative-work'?: WorkItem
  }
}

interface WorkCategory extends DBRecord {
  category: string
  status: ContentrainStatus
  field_order: number
}

interface TabItem extends DBRecord {
  category_id: string
  status: ContentrainStatus
  _relations?: {
    category: WorkCategory[]
  }
}

interface DBRelation extends DBRecord {
  type: string
  source_model: string
  source_id: string
  field_id: string
  target_model: string
  target_id: string
}

interface Service extends DBRecord {
  title: string
  description: string
  reference_id: string
  status: ContentrainStatus
  _relations?: {
    reference?: Reference
  }
}

interface SocialLink extends DBRecord {
  link: string
  icon: string
  service_id: string
  status: ContentrainStatus
  _relations?: {
    service: Service
  }
}

interface ProjectDetails extends DBRecord {
  title: string
  description: string
  work: string
  testimonial: string
  _relations?: {
    work?: WorkItem
    testimonial?: TestimonialItem
  }
}

interface ProjectStats extends DBRecord {
  view_count: number
  work: string
  reference: string
  _relations?: {
    work?: WorkItem
    reference?: Reference
  }
}

describe('sQLiteQueryBuilder', () => {
  let loader: BaseSQLiteLoader;
  let builder: SQLiteQueryBuilder<WorkItem>;
  let testimonialBuilder: SQLiteQueryBuilder<TestimonialItem>;
  let tabItemBuilder: SQLiteQueryBuilder<TabItem>;
  let socialLinkBuilder: SQLiteQueryBuilder<SocialLink>;
  let projectDetailsBuilder: SQLiteQueryBuilder<ProjectDetails>;
  let projectStatsBuilder: SQLiteQueryBuilder<ProjectStats>;
  const dbPath = join(__dirname, '../../../../../../playground/node/src/outputs/db/contentrain.db');

  beforeEach(() => {
    loader = new BaseSQLiteLoader(dbPath);
    builder = new SQLiteQueryBuilder<WorkItem>('workitems', loader);
    testimonialBuilder = new SQLiteQueryBuilder<TestimonialItem>('testimonial-items', loader);
    tabItemBuilder = new SQLiteQueryBuilder<TabItem>('tabitems', loader);
    socialLinkBuilder = new SQLiteQueryBuilder<SocialLink>('sociallinks', loader);
    projectDetailsBuilder = new SQLiteQueryBuilder<ProjectDetails>('project-details', loader);
    projectStatsBuilder = new SQLiteQueryBuilder<ProjectStats>('project-stats', loader);
  });

  afterEach(async () => {
    await loader.close();
  });

  describe('filtering', () => {
    it('should filter by exact match', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
      });
    });

    it('should filter by contains', async () => {
      const result = await builder
        .locale('en')
        .where('description', 'contains', 'app')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.description?.toLowerCase()).toContain('app');
      });
    });

    it('should combine multiple filters', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.category_id).toBeTruthy();
      });
    });
  });

  describe('sorting', () => {
    it('should sort by field_order ascending', async () => {
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevOrder = result.data[i - 1].field_order || 0;
        const currOrder = result.data[i].field_order || 0;
        expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
      }
    });

    it('should sort by field_order descending', async () => {
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevOrder = result.data[i - 1].field_order || 0;
        const currOrder = result.data[i].field_order || 0;
        expect(currOrder).toBeLessThanOrEqual(prevOrder);
      }
    });

    it('should support multiple sort fields', async () => {
      const result = await builder
        .locale('en')
        .orderBy('status', 'asc')
        .orderBy('field_order', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1];
        const curr = result.data[i];

        if (prev.status === curr.status) {
          const prevOrder = prev.field_order || 0;
          const currOrder = curr.field_order || 0;
          expect(currOrder).toBeLessThanOrEqual(prevOrder);
        }
      }
    });
  });

  describe('pagination', () => {
    it('should limit results', async () => {
      const limit = 2;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .limit(limit)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.data[0].field_order).toBe(1);
      expect(result.data[1].field_order).toBe(2);
    });

    it('should offset results', async () => {
      const offset = 2;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .offset(offset)
        .get();

      expect(result.data[0].field_order).toBe(3);
    });

    it('should handle limit and offset together', async () => {
      const limit = 2;
      const offset = 1;
      const result = await builder
        .locale('en')
        .orderBy('field_order', 'asc')
        .limit(limit)
        .offset(offset)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.pagination?.offset).toBe(offset);
      expect(result.data[0].field_order).toBe(2);
      expect(result.data[1].field_order).toBe(3);
    });
  });

  describe('relations', () => {
    it('should load one-to-one relation', async () => {
      const result = await builder
        .locale('en')
        .include('category')
        .where('category_id', 'ne', '')
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.category).toBeDefined();
        expect(result._relations?.category?.id).toBe(result.category_id);
      }
    });

    it('should handle multiple relations', async () => {
      const result = await builder
        .locale('en')
        .include(['category'])
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.category_id) {
          expect(item._relations?.category).toBeDefined();
          expect(item._relations?.category?.id).toBe(item.category_id);
        }
      });
    });

    it('should handle relations with dashes in name', async () => {
      const result = await testimonialBuilder
        .locale('en')
        .include('creative-work')
        .where('creative_work_id', 'ne', '')
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.['creative-work']).toBeDefined();
        expect(result._relations?.['creative-work']?.id).toBe(result.creative_work_id);
      }
    });

    it('should handle one-to-many relations for tabitems', async () => {
      console.log('\n=== TEST: one-to-many relations for tabitems ===');

      // İlk olarak ilişki tiplerini kontrol edelim
      const relationTypes = await loader.query<{ type: string }>(`
        SELECT DISTINCT type
        FROM tbl_contentrain_relations
        WHERE source_model = 'tabitems'
        AND field_id = 'category'
      `);
      console.log('Relation Type:', relationTypes[0]?.type);

      const result = await tabItemBuilder
        .locale('en')
        .where('status', 'eq', 'publish')
        .where('category_id', 'ne', '')
        .include('category')
        .first();

      console.log('TabItem Result:', {
        id: result?.id,
        status: result?.status,
        category_id: result?.category_id,
      });

      expect(result).toBeDefined();
      if (result) {
        console.log('Relations:', {
          hasRelations: !!result._relations,
          hasCategory: !!result._relations?.category,
          isArray: Array.isArray(result._relations?.category),
          categoryCount: result._relations?.category?.length,
        });

        expect(result._relations?.category).toBeDefined();
        expect(Array.isArray(result._relations?.category)).toBe(true);
        expect(result._relations?.category?.length).toBeGreaterThan(0);

        // Her kategorinin gerekli alanları var mı kontrol et
        console.log('Categories:', result._relations?.category?.map(cat => ({
          id: cat.id,
          category: cat.category,
          status: cat.status,
        })));

        result._relations?.category?.forEach((category) => {
          expect(category.id).toBeDefined();
          expect(category.category).toBeDefined();
          expect(category.status).toBe('publish');
        });

        // İlişki tablosundaki kayıtlarla eşleşiyor mu kontrol et
        const relations = await loader.query<DBRelation>(`
          SELECT * FROM tbl_contentrain_relations
          WHERE source_model = 'tabitems'
          AND source_id = ?
          AND field_id = 'category'
        `, [result.id]);

        console.log('Database Relations:', relations);

        expect(relations.length).toBe(result._relations?.category?.length);
        expect(relations[0].type).toBe('one-to-many');
      }
    });

    it('should handle multiple categories for a single tabitem', async () => {
      console.log('\n=== TEST: multiple categories for a single tabitem ===');

      // Bilinen bir test verisi kullanalım
      const testItemId = '9ab7dcca9d1d'; // Vue.js item
      console.log('Testing with ID:', testItemId);

      // İlk olarak ilişki tiplerini kontrol edelim
      const relationTypes = await loader.query<{ type: string }>(`
        SELECT DISTINCT type
        FROM tbl_contentrain_relations
        WHERE source_model = 'tabitems'
        AND field_id = 'category'
      `);
      console.log('Relation Type:', relationTypes[0]?.type);

      const result = await tabItemBuilder
        .locale('en')
        .where('id', 'eq', testItemId)
        .include('category')
        .first();

      console.log('TabItem Result:', {
        id: result?.id,
        status: result?.status,
        category_id: result?.category_id,
      });

      expect(result).toBeDefined();
      if (result) {
        console.log('Relations:', {
          hasRelations: !!result._relations,
          hasCategory: !!result._relations?.category,
          isArray: Array.isArray(result._relations?.category),
          categoryCount: result._relations?.category?.length,
        });

        expect(result._relations?.category).toBeDefined();
        expect(Array.isArray(result._relations?.category)).toBe(true);
        expect(result._relations?.category?.length).toBe(2); // Frontend ve UI/UX kategorilerine sahip

        // Kategorileri kontrol et
        const categories = result._relations?.category || [];
        console.log('Categories:', categories.map(cat => ({
          id: cat.id,
          category: cat.category,
          status: cat.status,
        })));

        const categoryNames = categories.map(c => c.category);
        console.log('Category Names:', categoryNames);

        expect(categoryNames).toContain('Frontend Development');
        expect(categoryNames).toContain('UI/UX Design');

        // İlişki tablosunu da kontrol edelim
        const relations = await loader.query<DBRelation>(`
          SELECT * FROM tbl_contentrain_relations
          WHERE source_model = 'tabitems'
          AND source_id = ?
          AND field_id = 'category'
        `, [result.id]);

        console.log('Database Relations:', relations);
        expect(relations[0].type).toBe('one-to-many');
      }
    });
  });

  describe('localization', () => {
    it('should load content in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
      });
    });

    it('should load relations in specified locale', async () => {
      const result = await builder
        .locale('tr')
        .include('category')
        .where('category_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        if (item.category_id) {
          expect(item._relations?.category).toBeDefined();
        }
      });
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple AND conditions', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('category_id', 'ne', '')
        .where('title', 'contains', 'Pazardan')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.category_id).toBeTruthy();
        expect(item.title?.toLowerCase()).toContain('pazardan');
      });
    });

    it('should handle array operations with "in" operator', async () => {
      const validStatuses: ContentrainStatus[] = ['publish', 'draft'];
      const result = await builder
        .locale('en')
        .where('status', 'in', validStatuses)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(validStatuses).toContain(item.status);
      });
    });

    it('should handle string operations correctly', async () => {
      const result = await builder
        .locale('en')
        .where('title', 'startsWith', 'Pazardan')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toMatch(/^Pazardan/i);
      });
    });

    it('should handle numeric comparisons correctly', async () => {
      const result = await builder
        .locale('en')
        .where('field_order', 'gte', 1)
        .where('field_order', 'lte', 5)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        const order = item.field_order || 0;
        expect(order).toBeGreaterThanOrEqual(1);
        expect(order).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid table name', async () => {
      const invalidBuilder = new SQLiteQueryBuilder('invalid_table', loader);
      await expect(invalidBuilder.get()).rejects.toThrow();
    });

    it('should handle invalid relation field', async () => {
      await expect(
        builder.include('invalidRelation' as any).get(),
      ).rejects.toThrow();
    });

    it('should handle invalid filter operator', async () => {
      const promise = builder
        .where('title', 'invalid' as any, 'test')
        .get();

      await expect(promise).rejects.toThrow('Invalid operator: invalid');
    });

    it('should handle invalid sort field', async () => {
      await expect(
        builder
          .where('status', 'eq', 'publish' as ContentrainStatus)
          .orderBy('nonexistentField' as any, 'asc')
          .get(),
      ).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should get first item correctly', async () => {
      const item = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .orderBy('field_order', 'asc')
        .first();

      expect(item).toBeDefined();
      if (item) {
        expect(item.status).toBe('publish');
      }
    });

    it('should return null for first() when no results', async () => {
      const item = await builder
        .locale('en')
        .where('title', 'eq', 'NonExistent')
        .first();

      expect(item).toBeNull();
    });

    it('should count results correctly', async () => {
      const total = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .count();

      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(total).toBe(result.total);
    });
  });

  describe('relation filtering', () => {
    it('should filter by related field value', async () => {
      const categoryId = (await builder
        .locale('en')
        .where('category_id', 'ne', '')
        .first())?.category_id;

      if (categoryId) {
        const result = await builder
          .locale('en')
          .include('category')
          .where('category_id', 'eq', categoryId)
          .get();

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item._relations?.category).toBeDefined();
          expect(item._relations?.category?.id).toBe(categoryId);
        });
      }
    });

    it('should handle nested relation filtering', async () => {
      const result = await builder
        .locale('en')
        .include('category')
        .where('category_id', 'ne', '')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations?.category).toBeDefined();
        if (item._relations?.category) {
          expect(item._relations.category.status).toBe('publish');
        }
      });
    });
  });

  describe('non-translatable models', () => {
    describe('sociallinks', () => {
      it('should load sociallinks without translations', async () => {
        console.log('\n=== TEST: sociallinks without translations ===');

        const result = await socialLinkBuilder
          .where('status', 'eq', 'publish')
          .get();

        console.log('SocialLinks Result:', result.data.map(item => ({
          id: item.id,
          link: item.link,
          icon: item.icon,
          service_id: item.service_id,
        })));

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.link).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item.service_id).toBeDefined();
          expect(item.status).toBe('publish');
        });
      });

      it('should load sociallinks with related service', async () => {
        console.log('\n=== TEST: sociallinks with service relation ===');

        const result = await socialLinkBuilder
          .where('status', 'eq', 'publish')
          .locale('tr') // Önce locale ayarla
          .include('service') // Sonra ilişkiyi ekle
          .get();

        console.log('SocialLinks with Service:', result.data.map(item => ({
          id: item.id,
          link: item.link,
          icon: item.icon,
          service: item._relations?.service?.title,
        })));

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.link).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item._relations?.service).toBeDefined();
          expect(item._relations?.service?.title).toBeDefined();
        });
      });

      it('should filter sociallinks by icon type', async () => {
        console.log('\n=== TEST: filter sociallinks by icon ===');

        const result = await socialLinkBuilder
          .where('status', 'eq', 'publish')
          .where('icon', 'contains', 'linkedin') // Veritabanındaki gerçek değer
          .get();

        console.log('LinkedIn Links:', result.data.map(item => ({
          id: item.id,
          link: item.link,
          icon: item.icon,
        })));

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.icon.toLowerCase()).toContain('linkedin');
        });
      });

      it('should handle sociallinks without locale', async () => {
        console.log('\n=== TEST: sociallinks without locale ===');

        const result = await socialLinkBuilder
          .where('status', 'eq', 'publish')
          .get();

        console.log('SocialLinks with Locale:', result.data.map(item => ({
          id: item.id,
          link: item.link,
          icon: item.icon,
        })));

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.link).toBeDefined();
          expect(item.icon).toBeDefined();
        });
      });
    });
  });

  describe('complex relation scenarios', () => {
    it('should handle multiple relation types in single query', async () => {
      // Bir modelde farklı ilişki tipleri
      const result = await tabItemBuilder
        .locale('tr')
        .include('category') // one-to-many ilişki
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations?.category).toBeDefined();
        expect(Array.isArray(item._relations?.category)).toBe(true);
        if (item._relations?.category) {
          item._relations.category.forEach((cat) => {
            expect(cat.category).toBeDefined();
          });
        }
      });
    });

    it('should handle non-localized to localized relation', async () => {
      // Çevirisiz modelden çevirili modele ilişki
      const result = await socialLinkBuilder
        .locale('tr')
        .include('service') // sociallinks -> services (çevirisiz -> çevirili)
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.link).toBeDefined(); // çevirisiz alan
        expect(item._relations?.service?.title).toBeDefined(); // çevirili alan
      });
    });

    it('should handle localized to localized relation', async () => {
      // Önce ilişki tiplerini kontrol edelim
      console.log('\n=== TEST: localized to localized relation ===');

      const result = await testimonialBuilder
        .locale('tr')
        .include('creative-work')
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toBeDefined(); // çevirili alan
        expect(item._relations?.['creative-work']?.title).toBeDefined(); // çevirili alan
      });
    });

    it('should handle localized to localized nested relation', async () => {
      // İç içe çevirili ilişkiler
      const result = await testimonialBuilder
        .locale('tr')
        .include('creative-work') // testimonial-items -> workitems -> workcategories
        .where('status', 'eq', 'publish')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        const work = item._relations?.['creative-work'];
        expect(work?.title).toBeDefined();
        if (work?._relations?.category) {
          expect(work._relations.category.category).toBeDefined();
        }
      });
    });

    it('should handle service with reference relation', async () => {
      // Service ve referans ilişkisi
      const serviceBuilder = new SQLiteQueryBuilder<Service>('services', loader);
      const result = await serviceBuilder
        .locale('tr')
        .include('reference') // services -> references
        .where('status', 'eq', 'publish')
        .where('reference_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toBeDefined(); // çevirili alan
        expect(item._relations?.reference?.logo).toBeDefined(); // çevirisiz alan
      });
    });
  });

  describe('multiple localized relations', () => {
    it('should handle multiple localized relations in project details', async () => {
      console.log('\n=== TEST: multiple localized relations in project details ===');

      // Önce çeviri tablosunu kontrol edelim
      const translations = await loader.query(`
        SELECT * FROM tbl_project_details_translations
        WHERE locale = ?
      `, ['tr']);
      console.log('Project Details Translations:', translations);

      const result = await projectDetailsBuilder
        .locale('tr')
        .include(['work', 'testimonial'])
        .where('status', 'eq', 'publish')
        .first();

      console.log('Project Details Result:', {
        id: result?.id,
        title: result?.title,
        description: result?.description,
        work_title: result?._relations?.work?.title,
        testimonial_name: result?._relations?.testimonial?.name,
      });

      // İlişkileri kontrol edelim
      const relations = await loader.query(`
        SELECT * FROM tbl_contentrain_relations
        WHERE source_model = 'project-details'
        AND source_id = ?
      `, [result?.id]);
      console.log('Relations:', relations);

      expect(result).toBeDefined();
      if (result) {
        // Ana içerik kontrolü
        expect(result.title).toBeDefined();
        expect(result.description).toBeDefined();

        // İlişkili içeriklerin kontrolü
        expect(result._relations?.work).toBeDefined();
        expect(result._relations?.testimonial).toBeDefined();

        // İlişkili içeriklerin çevirilerinin kontrolü
        expect(result._relations?.work?.title).toBeDefined();
        expect(result._relations?.testimonial?.name).toBeDefined();
      }
    });
  });

  describe('mixed relations', () => {
    it('should handle both localized and non-localized relations in project stats', async () => {
      console.log('\n=== TEST: mixed relations in project stats ===');

      const result = await projectStatsBuilder
        .locale('tr') // work ilişkisi için gerekli
        .include(['work', 'reference'])
        .where('status', 'eq', 'publish')
        .first();

      console.log('Project Stats Result:', {
        id: result?.id,
        view_count: result?.view_count,
        work_title: result?._relations?.work?.title,
        reference_logo: result?._relations?.reference?.logo,
      });

      expect(result).toBeDefined();
      if (result) {
        // Ana içerik kontrolü
        expect(result.view_count).toBeDefined();

        // Çevirili ilişki kontrolü (work)
        expect(result._relations?.work).toBeDefined();
        expect(result._relations?.work?.title).toBeDefined();

        // Çevirisiz ilişki kontrolü (reference)
        expect(result._relations?.reference).toBeDefined();
        expect(result._relations?.reference?.logo).toBeDefined();
      }
    });

    it('should filter project stats by view count and load relations', async () => {
      console.log('\n=== TEST: filter project stats by view count ===');

      const result = await projectStatsBuilder
        .locale('tr')
        .include(['work', 'reference'])
        .where('view_count', 'gt', 2000)
        .get();

      console.log('Filtered Stats:', result.data.map(item => ({
        id: item.id,
        view_count: item.view_count,
        work_title: item._relations?.work?.title,
      })));

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.view_count).toBeGreaterThan(2000);
        expect(item._relations?.work).toBeDefined();
        expect(item._relations?.reference).toBeDefined();
      });
    });
  });

  describe('relation filtering scenarios', () => {
    it('should find project details by work title', async () => {
      console.log('\n=== TEST: find project details by work title ===');

      const result = await projectDetailsBuilder
        .locale('tr')
        .include(['work'])
        .where('status', 'eq', 'publish')
        .get();

      console.log('Project Details with Work:', result.data.map(item => ({
        title: item.title,
        work_title: item._relations?.work?.title,
      })));

      const contentrain = result.data.find(item =>
        item._relations?.work?.title?.toLowerCase().includes('contentrain'),
      );

      expect(contentrain).toBeDefined();
      expect(contentrain?._relations?.work?.title).toContain('Contentrain');
    });

    it('should load project stats with high view counts and their relations', async () => {
      console.log('\n=== TEST: high view count projects ===');

      const result = await projectStatsBuilder
        .locale('tr')
        .include(['work', 'reference'])
        .where('view_count', 'gte', 2000)
        .orderBy('view_count', 'desc')
        .get();

      console.log('High View Count Projects:', result.data.map(item => ({
        view_count: item.view_count,
        work_title: item._relations?.work?.title,
        reference_logo: item._relations?.reference?.logo,
      })));

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.view_count).toBeGreaterThanOrEqual(2000);
        expect(item._relations?.work).toBeDefined();
        expect(item._relations?.reference).toBeDefined();
      });
    });
  });
});
