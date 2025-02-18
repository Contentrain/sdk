import type { ContentrainStatus } from '../../loader/types/common';
import type { IDBRecord } from '../../loader/types/sqlite';
import type { ISQLiteQuery } from '../types';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueryFactory } from '../..';
import { SQLiteLoader } from '../../loader/sqlite/sqlite.loader';
import { loggers } from '../../utils/logger';

interface Reference extends IDBRecord {
  logo: string
  status: ContentrainStatus
  created_at: string
  updated_at: string
}

interface WorkCategory extends IDBRecord {
  category: string
  status: ContentrainStatus
  field_order: number
}

interface Service extends IDBRecord {
  title: string | null
  description: string | null
  reference_id: string | null
  status: ContentrainStatus
  image: string | null
  field_order?: number
  _relations?: {
    reference?: Reference
  }
}

interface Stats extends IDBRecord {
  view_count: number
  status: ContentrainStatus
}

interface WorkItem extends IDBRecord {
  category_id: string
  title?: string
  description?: string
  image?: string
  field_order?: number
  status: ContentrainStatus
  _relations?: {
    category?: WorkCategory
    reference?: Reference
    stats?: Stats
  }
}

interface TestimonialItem extends IDBRecord {
  title: string
  name: string
  description: string
  creative_work_id: string
  status: ContentrainStatus
  _relations?: {
    'creative-work'?: WorkItem
  }
}

interface TabItem extends IDBRecord {
  category_id: string
  status: ContentrainStatus
  _relations?: {
    category: WorkCategory[]
  }
}

interface SocialLink extends IDBRecord {
  link: string
  icon: string
  service_id: string
  status: ContentrainStatus
  _relations?: {
    service: Service
  }
}

interface ProjectDetails extends IDBRecord {
  title: string
  description: string
  work: string
  testimonial: string
  status: ContentrainStatus
  _relations?: {
    work?: WorkItem
    testimonial?: TestimonialItem
  }
}

interface ProjectStats extends IDBRecord {
  view_count: number
  work_id: string
  reference_id: string
  status: ContentrainStatus
  _relations?: {
    work?: WorkItem
    reference?: Reference
  }
}

interface IServiceQuery extends ISQLiteQuery<
  Service,
  'en' | 'tr',
  {
    reference: Reference
  }
> {}

interface IWorkItemQuery extends ISQLiteQuery<
  WorkItem,
  'en' | 'tr',
  {
    category: WorkCategory
    reference: Reference
    stats: Stats
  }
> {}

interface ITestimonialQuery extends ISQLiteQuery<
  TestimonialItem,
  'en' | 'tr',
  {
    'creative-work': WorkItem
  }
> {}

interface ITabItemQuery extends ISQLiteQuery<
  TabItem,
  'en' | 'tr',
  {
    category: WorkCategory
  }
> {}

interface ISocialLinkQuery extends ISQLiteQuery<
  SocialLink,
  'en' | 'tr',
  {
    service: Service
  }
> {}

interface IProjectDetailsQuery extends ISQLiteQuery<
  ProjectDetails,
  'en' | 'tr',
  {
    work: WorkItem
    testimonial: TestimonialItem
  }
> {}

interface IProjectStatsQuery extends ISQLiteQuery<
  ProjectStats,
  'en' | 'tr',
  {
    work: WorkItem
    reference: Reference
  }
> {}

describe('sQLiteQueryBuilder', () => {
  let serviceLoader: SQLiteLoader<Service>;
  let workItemLoader: SQLiteLoader<WorkItem>;
  let testimonialLoader: SQLiteLoader<TestimonialItem>;
  let tabItemLoader: SQLiteLoader<TabItem>;
  let socialLinkLoader: SQLiteLoader<SocialLink>;
  let projectDetailsLoader: SQLiteLoader<ProjectDetails>;
  let projectStatsLoader: SQLiteLoader<ProjectStats>;

  let builder: IServiceQuery;
  let workItemBuilder: IWorkItemQuery;
  let testimonialBuilder: ITestimonialQuery;
  let _tabItemBuilder: ITabItemQuery;
  let _socialLinkBuilder: ISocialLinkQuery;
  let projectDetailsBuilder: IProjectDetailsQuery;
  let _projectStatsBuilder: IProjectStatsQuery;

  const dbPath = join(__dirname, '../../../../../playground/contentrain-db/contentrain.db');

  beforeEach(() => {
    serviceLoader = new SQLiteLoader<Service>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    workItemLoader = new SQLiteLoader<WorkItem>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    testimonialLoader = new SQLiteLoader<TestimonialItem>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    tabItemLoader = new SQLiteLoader<TabItem>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    socialLinkLoader = new SQLiteLoader<SocialLink>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    projectDetailsLoader = new SQLiteLoader<ProjectDetails>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    projectStatsLoader = new SQLiteLoader<ProjectStats>({
      databasePath: dbPath,
      cache: true,
      maxCacheSize: 100,
    }, loggers.loader);

    builder = QueryFactory.createSQLiteBuilder('services', serviceLoader);
    workItemBuilder = QueryFactory.createSQLiteBuilder('workitems', workItemLoader);
    testimonialBuilder = QueryFactory.createSQLiteBuilder('testimonial-items', testimonialLoader);
    _tabItemBuilder = QueryFactory.createSQLiteBuilder('tabitems', tabItemLoader);
    _socialLinkBuilder = QueryFactory.createSQLiteBuilder('sociallinks', socialLinkLoader);
    projectDetailsBuilder = QueryFactory.createSQLiteBuilder('project-details', projectDetailsLoader);
    _projectStatsBuilder = QueryFactory.createSQLiteBuilder('project-stats', projectStatsLoader);
  });

  afterEach(async () => {
    await serviceLoader.clearCache();
    await workItemLoader.clearCache();
    await testimonialLoader.clearCache();
    await tabItemLoader.clearCache();
    await socialLinkLoader.clearCache();
    await projectDetailsLoader.clearCache();
    await projectStatsLoader.clearCache();
  });
  describe('basic querying', () => {
    it('should retrieve records with publish status from services table', async () => {
      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(result.data.length).toBe(7);

      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('status', 'publish');
      expect(firstItem).toHaveProperty('created_at');
      expect(firstItem).toHaveProperty('updated_at');
      expect(firstItem).toHaveProperty('reference_id');
    });
  });

  describe('filtering', () => {
    it('should filter records by reference_id with exact value', async () => {
      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('reference_id', 'eq', '34e63b4829f0')
        .get();

      expect(result.data.length).toBe(1); // We know this from database_structure.md

      const item = result.data[0];
      expect(item.reference_id).toBe('34e63b4829f0');
      expect(item.status).toBe('publish');
    });

    it('should filter records with null reference_id', async () => {
      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('reference_id', 'eq', null)
        .get();

      expect(result.data.length).toBe(4); // We know this from database_structure.md

      result.data.forEach((item) => {
        expect(item.reference_id).toBeNull();
        expect(item.status).toBe('publish');
      });
    });

    it('should filter records where title starts with "Web"', async () => {
      const result = await builder
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('title', 'startsWith', 'Web')
        .locale('en')
        .get();
      expect(result.data.length).toBe(2); // We know this from database_structure.md

      const item = result.data[0];
      expect(item.title).toMatch(/^Web/);
      expect(item.status).toBe('publish');
    });
  });

  describe('translation management', () => {
    it('should retrieve translations in default language', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      // Check translation fields of the first record
      expect(result).toBeDefined();
      if (result) {
        // Fields from translation table
        expect(result.title).toBe('Web App. Development');
        expect(result.description).toContain('From concept to launch');
        expect(result.image).toContain('Webapp.svg');

        // Fields from main table
        expect(result.status).toBe('publish');
        expect(result.reference_id).toBeDefined();
      }
    });

    it('should retrieve translations in different language', async () => {
      const result = await builder
        .locale('tr')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      // Check translation fields of the first record
      expect(result).toBeDefined();
      if (result) {
        // Fields from translation table
        expect(result.title).toBe('Web Uygulama Geliştirme');
        expect(result.description).toContain('Konseptten lansmana kadar');
        expect(result.image).toContain('Webapp.svg');

        // Fields from main table
        expect(result.status).toBe('publish');
        expect(result.reference_id).toBeDefined();
      }
    });

    it('should retrieve translations for all records', async () => {
      const result = await builder
        .locale('tr')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(result.data.length).toBe(7); // We know this from database_structure.md

      // Each record should have translations
      result.data.forEach((item) => {
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.image).toBeDefined();
      });
    });

    it('should handle records without translations', async () => {
      const result = await builder
        .locale('fr' as any) // A language that doesn't exist in database
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .get();

      expect(result.data.length).toBe(7);

      // Translation fields should be null or undefined
      result.data.forEach((item) => {
        expect(item.title).toBeNull();
        expect(item.description).toBeNull();
        expect(item.image).toBeNull();

        // But system fields should be populated
        expect(item.id).toBeDefined();
        expect(item.status).toBe('publish');
        expect(item.created_at).toBeDefined();
        expect(item.updated_at).toBeDefined();
      });
    });

    it('should retrieve all fields from translation table', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      expect(result).toBeDefined();
      if (result) {
        // All translation fields we know from database_structure.md
        expect(result.title).not.toBeNull();
        expect(result.description).not.toBeNull();
        expect(result.image).not.toBeNull();
      }
    });
  });

  describe('sorting', () => {
    it('should sort by user-generated field in translatable model', async () => {
      const result = await builder
        .locale('en')
        .orderBy('title', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevTitle = result.data[i - 1].title || '';
        const currTitle = result.data[i].title || '';
        expect(currTitle.localeCompare(prevTitle)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by user-generated field in non-translatable model', async () => {
      const result = await _socialLinkBuilder
        .orderBy('link', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevLink = result.data[i - 1].link;
        const currLink = result.data[i].link;
        expect(currLink.localeCompare(prevLink)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by multiple fields including user-generated and system fields', async () => {
      const result = await builder
        .locale('en')
        .orderBy('status', 'asc')
        .orderBy('title', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1];
        const curr = result.data[i];

        if (prev.status === curr.status) {
          const prevTitle = prev.title || '';
          const currTitle = curr.title || '';
          expect(currTitle.localeCompare(prevTitle)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should sort by user-generated field in different locales', async () => {
      const enResult = await builder
        .locale('en')
        .orderBy('image', 'asc')
        .get();

      const trResult = await builder
        .locale('tr')
        .orderBy('image', 'asc')
        .get();

      expect(enResult.data.length).toBe(trResult.data.length);
      expect(enResult.data[0].image).toBe(trResult.data[0].image);

      // Her iki dilde de sıralama doğru olmalı
      for (let i = 1; i < enResult.data.length; i++) {
        const prevEnImage = enResult.data[i - 1].image || '';
        const currEnImage = enResult.data[i].image || '';
        expect(currEnImage.localeCompare(prevEnImage)).toBeGreaterThanOrEqual(0);

        const prevTrImage = trResult.data[i - 1].image || '';
        const currTrImage = trResult.data[i].image || '';
        expect(currTrImage.localeCompare(prevTrImage)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by description field in translatable model', async () => {
      const result = await builder
        .locale('en')
        .orderBy('description', 'asc')
        .get();

      expect(result.data.length).toBeGreaterThan(1);
      for (let i = 1; i < result.data.length; i++) {
        const prevDesc = result.data[i - 1].description || '';
        const currDesc = result.data[i].description || '';
        expect(currDesc.localeCompare(prevDesc)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('pagination', () => {
    it('should limit results', async () => {
      const limit = 2;
      const result = await builder
        .locale('en')
        .orderBy('created_at', 'asc')
        .limit(limit)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
    });

    it('should offset results', async () => {
      const offset = 2;
      const result = await builder
        .locale('en')
        .orderBy('created_at', 'asc')
        .offset(offset)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle limit and offset together', async () => {
      const limit = 2;
      const offset = 1;
      const result = await builder
        .locale('en')
        .orderBy('created_at', 'asc')
        .limit(limit)
        .offset(offset)
        .get();

      expect(result.data).toHaveLength(limit);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.limit).toBe(limit);
      expect(result.pagination?.offset).toBe(offset);
    });
  });

  describe('advanced filtering', () => {
    it('should handle multiple AND conditions', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('reference_id', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.status).toBe('publish');
        expect(item.reference_id).toBeTruthy();
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
        .where('title', 'startsWith', 'Web')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.title).toMatch(/^Web/i);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid table name', async () => {
      const invalidBuilder = QueryFactory.createSQLiteBuilder('invalid_table', serviceLoader);
      await expect(invalidBuilder.get()).rejects.toThrow();
    });

    it('should handle invalid relation field', async () => {
      await expect(
        builder.include('invalidRelation' as any).get(),
      ).rejects.toThrow();
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

  describe('non-translatable models', () => {
    describe('sociallinks', () => {
      it('should load sociallinks without translations', async () => {
        const result = await _socialLinkBuilder
          .where('status', 'eq', 'publish' as ContentrainStatus)
          .get();

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.link).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item.service_id).toBeDefined();
          expect(item.status).toBe('publish');
        });
      });

      it('should load sociallinks with related service', async () => {
        const result = await _socialLinkBuilder
          .where('status', 'eq', 'publish' as ContentrainStatus)
          .include({ relation: 'service', locale: 'en' })
          .get();

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((item) => {
          expect(item.link).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item._relations?.service).toBeDefined();
          expect(item._relations?.service?.title).toBeDefined();
        });
      });
    });
  });

  describe('relations', () => {
    it('should load one-to-one relation', async () => {
      const result = await workItemBuilder
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
      const result = await projectDetailsBuilder
        .locale('en')
        .include(['work', 'testimonial'])
        .where('work', 'ne', '')
        .where('testimonial', 'ne', '')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item._relations?.work).toBeDefined();
        expect(item._relations?.testimonial).toBeDefined();
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

    it('should handle one-to-many relations', async () => {
      const result = await _tabItemBuilder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('category_id', 'ne', '')
        .include('category')
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.category).toBeDefined();
        expect(Array.isArray(result._relations?.category)).toBe(true);
        expect(result._relations?.category?.length).toBeGreaterThan(0);

        result._relations?.category?.forEach((category) => {
          expect(category.id).toBeDefined();
          expect(category.status).toBe('publish');
        });
      }
    });

    it('should handle multiple categories for a single item', async () => {
      const testItemId = '9ab7dcca9d1d'; // Vue.js item
      const result = await _tabItemBuilder
        .locale('en')
        .where('id', 'eq', testItemId)
        .include('category')
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.category).toBeDefined();
        expect(Array.isArray(result._relations?.category)).toBe(true);
        expect(result._relations?.category?.length).toBe(2);

        const categories = result._relations?.category || [];
        const categoryNames = categories.map(c => c.category);

        expect(categoryNames).toContain('Frontend Development');
        expect(categoryNames).toContain('UI/UX Design');
      }
    });
  });

  describe('complex relation scenarios', () => {
    it('should handle multiple localized relations in project details', async () => {
      const result = await projectDetailsBuilder
        .locale('en')
        .include([
          { relation: 'work', locale: 'en' },
          { relation: 'testimonial', locale: 'en' },
        ])
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result.title).toBeDefined();
        expect(result.description).toBeDefined();
        expect(result._relations?.work).toBeDefined();
        expect(result._relations?.testimonial).toBeDefined();
        expect(result._relations?.work?.title).toBeDefined();
        expect(result._relations?.testimonial?.name).toBeDefined();
      }
    });

    it('should handle both localized and non-localized relations', async () => {
      const result = await _projectStatsBuilder
        .include([
          { relation: 'work', locale: 'en' },
          { relation: 'reference' },
        ])
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result.view_count).toBeDefined();
        expect(result._relations?.work).toBeDefined();
        expect(result._relations?.work?.title).toBeDefined();
        expect(result._relations?.reference).toBeDefined();
        expect(result._relations?.reference?.logo).toBeDefined();
      }
    });

    it('should filter project stats by view count and load relations', async () => {
      const result = await _projectStatsBuilder
        .include(['work', 'reference'])
        .where('view_count', 'gt', 2000)
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((item) => {
        expect(item.view_count).toBeGreaterThan(2000);
        expect(item._relations?.work).toBeDefined();
        expect(item._relations?.reference).toBeDefined();
      });
    });
  });
  describe('complex query scenarios', () => {
    it('should load multiple relations with different locales', async () => {
      const result = await projectDetailsBuilder
        .locale('en')
        .include([
          { relation: 'work', locale: 'en' },
          { relation: 'testimonial', locale: 'tr' },
        ])
        .first();

      expect(result).toBeDefined();
      if (result) {
        // İngilizce work kontrolü
        expect(result._relations?.work).toBeDefined();
        expect(result._relations?.work?.title).toBeDefined();

        // Türkçe testimonial kontrolü
        expect(result._relations?.testimonial).toBeDefined();
        expect(result._relations?.testimonial?.name).toBeDefined();
      }
    });

    it('should load nested relations', async () => {
      const result = await testimonialBuilder
        .locale('en')
        .include([
          {
            relation: 'creative-work',
            locale: 'en',
          },
        ])
        .first();

      expect(result).toBeDefined();
      if (result) {
        expect(result._relations?.['creative-work']).toBeDefined();
        expect(result._relations?.['creative-work']?.title).toBeDefined();
        expect(result._relations?.['creative-work']?.description).toBeDefined();
      }
    });

    it('should handle complex filtering and sorting', async () => {
      const result = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .where('title', 'contains', 'Development')
        .orderBy('created_at', 'desc')
        .get();

      expect(result.data.length).toBeGreaterThan(0);
      if (result.data.length > 0) {
        // İçerik kontrolü
        result.data.forEach((item: Service) => {
          expect(item.status).toBe('publish');
          expect(item.title).toContain('Development');
        });

        // Sıralama kontrolü
        const dates = result.data.map((item: Service) => new Date(item.created_at).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
      }
    });

    it('should load relations with pagination', async () => {
      const pageSize = 2;
      const result = await projectDetailsBuilder
        .locale('en')
        .include([
          { relation: 'work', locale: 'en' },
          { relation: 'testimonial', locale: 'en' },
        ])
        .limit(pageSize)
        .offset(0)
        .get();

      expect(result.data.length).toBeLessThanOrEqual(pageSize);
      expect(result.pagination).toBeDefined();
      if (result.pagination) {
        expect(result.pagination.limit).toBe(pageSize);
        expect(result.pagination.offset).toBe(0);
        expect(typeof result.pagination.hasMore).toBe('boolean');
      }

      // İlişkilerin yüklendiğini kontrol et
      result.data.forEach((item) => {
        expect(item._relations).toBeDefined();
        if (item._relations?.work) {
          expect(item._relations.work.title).toBeDefined();
        }
        if (item._relations?.testimonial) {
          expect(item._relations.testimonial.name).toBeDefined();
        }
      });
    });

    it('should handle different translations for same content', async () => {
      // İngilizce sorgu
      const enResult = await builder
        .locale('en')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      // Türkçe sorgu
      const trResult = await builder
        .locale('tr')
        .where('status', 'eq', 'publish' as ContentrainStatus)
        .first();

      expect(enResult).toBeDefined();
      expect(trResult).toBeDefined();

      if (enResult && trResult) {
        // Aynı ID'ye sahip olmalılar
        expect(enResult.id).toBe(trResult.id);

        // Farklı dillerde içerikler olmalı
        if (enResult.title && trResult.title) {
          expect(enResult.title).not.toBe(trResult.title);
        }

        // Açıklamalar da farklı dillerde olmalı
        if (enResult.description && trResult.description) {
          expect(enResult.description).not.toBe(trResult.description);
        }
      }
    });
  });
});
