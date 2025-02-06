// Bu dosya otomatik olarak oluşturulmuştur
import type BetterSQLite3 from 'better-sqlite3';

export interface Faqitems {
  ID: string | null
  question: string
  answer: string
  order_field: number
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface FaqitemsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  question: string
  answer: string
  order_field: number
}

export interface MetaTags {
  ID: string | null
  name: string
  content: string
  description: string | null
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface MetaTagsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  name: string
  content: string
  description: string | null
}

export interface Processes {
  ID: string | null
  title: string
  description: string
  icon: string
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface ProcessesI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  title: string
  description: string
  icon: string
}

export interface ReferencesTable {
  ID: string | null
  logo: string
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface Sections {
  ID: string | null
  title: string
  description: string
  buttontext: string | null
  buttonlink: string | null
  name: string
  subtitle: string | null
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface SectionsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  title: string
  description: string
  buttontext: string | null
  buttonlink: string | null
  name: string
  subtitle: string | null
}

export interface Services {
  ID: string | null
  title: string
  description: string | null
  image: string | null
  reference: string | null
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface ServicesI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  title: string
  description: string | null
  image: string | null
}

export interface ServicesReference {
  source_id: string
  target_id: string
  created_at: string
}

export interface Sociallinks {
  ID: string | null
  link: string
  icon: string
  service: string | null
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface SociallinksService {
  source_id: string
  target_id: string
  created_at: string
}

export interface Tabitems {
  ID: string | null
  link: string
  description: string
  image: string
  category: string
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface TabitemsCategory {
  source_id: string
  target_id: string
  created_at: string
}

export interface TabitemsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  link: string
  description: string
  image: string
}

export interface testimonialItems {
  ID: string | null
  name: string
  description: string
  title: string
  image: string
  creative_work: string
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface testimonialItemsCreativeWork {
  source_id: string
  target_id: string
  created_at: string
}

export interface testimonialItemsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  name: string
  description: string
  title: string
  image: string
}

export interface Workcategories {
  ID: string | null
  category: string
  order_field: number
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface WorkcategoriesI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  category: string
  order_field: number
}

export interface Workitems {
  ID: string | null
  title: string
  image: string | null
  description: string
  category: string
  link: string
  order_field: number
  status: number
  created_at: string
  updated_at: string
  scheduled: number
  scheduled_at: string | null
}

export interface WorkitemsCategory {
  source_id: string
  target_id: string
  created_at: string
}

export interface WorkitemsI18n {
  lang: string
  ID: string
  created_at: string
  updated_at: string
  title: string
  image: string | null
  description: string
  link: string
  order_field: number
}

export class FaqitemsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Faqitems[] {
    return this.db.prepare('SELECT * FROM faqitems').all() as Faqitems[];
  }

  findById(id: string): Faqitems | undefined {
    return this.db.prepare('SELECT * FROM faqitems WHERE ID = ?').get(id) as Faqitems;
  }

  findByStatus(status: 'publish' | 'draft'): Faqitems[] {
    return this.db.prepare('SELECT * FROM faqitems WHERE status = ?').all(status) as Faqitems[];
  }
}

export class FaqitemsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): FaqitemsI18n[] {
    return this.db.prepare('SELECT * FROM faqitems_i18n').all() as FaqitemsI18n[];
  }

  findById(id: string): FaqitemsI18n | undefined {
    return this.db.prepare('SELECT * FROM faqitems_i18n WHERE ID = ?').get(id) as FaqitemsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): FaqitemsI18n[] {
    return this.db.prepare('SELECT * FROM faqitems_i18n WHERE status = ?').all(status) as FaqitemsI18n[];
  }
}

export class MetaTagsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): MetaTags[] {
    return this.db.prepare('SELECT * FROM meta_tags').all() as MetaTags[];
  }

  findById(id: string): MetaTags | undefined {
    return this.db.prepare('SELECT * FROM meta_tags WHERE ID = ?').get(id) as MetaTags;
  }

  findByStatus(status: 'publish' | 'draft'): MetaTags[] {
    return this.db.prepare('SELECT * FROM meta_tags WHERE status = ?').all(status) as MetaTags[];
  }
}

export class MetaTagsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): MetaTagsI18n[] {
    return this.db.prepare('SELECT * FROM meta_tags_i18n').all() as MetaTagsI18n[];
  }

  findById(id: string): MetaTagsI18n | undefined {
    return this.db.prepare('SELECT * FROM meta_tags_i18n WHERE ID = ?').get(id) as MetaTagsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): MetaTagsI18n[] {
    return this.db.prepare('SELECT * FROM meta_tags_i18n WHERE status = ?').all(status) as MetaTagsI18n[];
  }
}

export class ProcessesRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Processes[] {
    return this.db.prepare('SELECT * FROM processes').all() as Processes[];
  }

  findById(id: string): Processes | undefined {
    return this.db.prepare('SELECT * FROM processes WHERE ID = ?').get(id) as Processes;
  }

  findByStatus(status: 'publish' | 'draft'): Processes[] {
    return this.db.prepare('SELECT * FROM processes WHERE status = ?').all(status) as Processes[];
  }
}

export class ProcessesI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): ProcessesI18n[] {
    return this.db.prepare('SELECT * FROM processes_i18n').all() as ProcessesI18n[];
  }

  findById(id: string): ProcessesI18n | undefined {
    return this.db.prepare('SELECT * FROM processes_i18n WHERE ID = ?').get(id) as ProcessesI18n;
  }

  findByStatus(status: 'publish' | 'draft'): ProcessesI18n[] {
    return this.db.prepare('SELECT * FROM processes_i18n WHERE status = ?').all(status) as ProcessesI18n[];
  }
}

export class ReferencesTableRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): ReferencesTable[] {
    return this.db.prepare('SELECT * FROM references_table').all() as ReferencesTable[];
  }

  findById(id: string): ReferencesTable | undefined {
    return this.db.prepare('SELECT * FROM references_table WHERE ID = ?').get(id) as ReferencesTable;
  }

  findByStatus(status: 'publish' | 'draft'): ReferencesTable[] {
    return this.db.prepare('SELECT * FROM references_table WHERE status = ?').all(status) as ReferencesTable[];
  }
}

export class SectionsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Sections[] {
    return this.db.prepare('SELECT * FROM sections').all() as Sections[];
  }

  findById(id: string): Sections | undefined {
    return this.db.prepare('SELECT * FROM sections WHERE ID = ?').get(id) as Sections;
  }

  findByStatus(status: 'publish' | 'draft'): Sections[] {
    return this.db.prepare('SELECT * FROM sections WHERE status = ?').all(status) as Sections[];
  }
}

export class SectionsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): SectionsI18n[] {
    return this.db.prepare('SELECT * FROM sections_i18n').all() as SectionsI18n[];
  }

  findById(id: string): SectionsI18n | undefined {
    return this.db.prepare('SELECT * FROM sections_i18n WHERE ID = ?').get(id) as SectionsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): SectionsI18n[] {
    return this.db.prepare('SELECT * FROM sections_i18n WHERE status = ?').all(status) as SectionsI18n[];
  }
}

export class ServicesRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Services[] {
    return this.db.prepare('SELECT * FROM services').all() as Services[];
  }

  findById(id: string): Services | undefined {
    return this.db.prepare('SELECT * FROM services WHERE ID = ?').get(id) as Services;
  }

  findByStatus(status: 'publish' | 'draft'): Services[] {
    return this.db.prepare('SELECT * FROM services WHERE status = ?').all(status) as Services[];
  }
}

export class ServicesI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): ServicesI18n[] {
    return this.db.prepare('SELECT * FROM services_i18n').all() as ServicesI18n[];
  }

  findById(id: string): ServicesI18n | undefined {
    return this.db.prepare('SELECT * FROM services_i18n WHERE ID = ?').get(id) as ServicesI18n;
  }

  findByStatus(status: 'publish' | 'draft'): ServicesI18n[] {
    return this.db.prepare('SELECT * FROM services_i18n WHERE status = ?').all(status) as ServicesI18n[];
  }
}

export class ServicesReferenceRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): ServicesReference[] {
    return this.db.prepare('SELECT * FROM services_reference').all() as ServicesReference[];
  }

  findById(id: string): ServicesReference | undefined {
    return this.db.prepare('SELECT * FROM services_reference WHERE ID = ?').get(id) as ServicesReference;
  }

  findByStatus(status: 'publish' | 'draft'): ServicesReference[] {
    return this.db.prepare('SELECT * FROM services_reference WHERE status = ?').all(status) as ServicesReference[];
  }
}

export class SociallinksRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Sociallinks[] {
    return this.db.prepare('SELECT * FROM sociallinks').all() as Sociallinks[];
  }

  findById(id: string): Sociallinks | undefined {
    return this.db.prepare('SELECT * FROM sociallinks WHERE ID = ?').get(id) as Sociallinks;
  }

  findByStatus(status: 'publish' | 'draft'): Sociallinks[] {
    return this.db.prepare('SELECT * FROM sociallinks WHERE status = ?').all(status) as Sociallinks[];
  }
}

export class SociallinksServiceRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): SociallinksService[] {
    return this.db.prepare('SELECT * FROM sociallinks_service').all() as SociallinksService[];
  }

  findById(id: string): SociallinksService | undefined {
    return this.db.prepare('SELECT * FROM sociallinks_service WHERE ID = ?').get(id) as SociallinksService;
  }

  findByStatus(status: 'publish' | 'draft'): SociallinksService[] {
    return this.db.prepare('SELECT * FROM sociallinks_service WHERE status = ?').all(status) as SociallinksService[];
  }
}

export class TabitemsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Tabitems[] {
    return this.db.prepare('SELECT * FROM tabitems').all() as Tabitems[];
  }

  findById(id: string): Tabitems | undefined {
    return this.db.prepare('SELECT * FROM tabitems WHERE ID = ?').get(id) as Tabitems;
  }

  findByStatus(status: 'publish' | 'draft'): Tabitems[] {
    return this.db.prepare('SELECT * FROM tabitems WHERE status = ?').all(status) as Tabitems[];
  }
}

export class TabitemsCategoryRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): TabitemsCategory[] {
    return this.db.prepare('SELECT * FROM tabitems_category').all() as TabitemsCategory[];
  }

  findById(id: string): TabitemsCategory | undefined {
    return this.db.prepare('SELECT * FROM tabitems_category WHERE ID = ?').get(id) as TabitemsCategory;
  }

  findByStatus(status: 'publish' | 'draft'): TabitemsCategory[] {
    return this.db.prepare('SELECT * FROM tabitems_category WHERE status = ?').all(status) as TabitemsCategory[];
  }
}

export class TabitemsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): TabitemsI18n[] {
    return this.db.prepare('SELECT * FROM tabitems_i18n').all() as TabitemsI18n[];
  }

  findById(id: string): TabitemsI18n | undefined {
    return this.db.prepare('SELECT * FROM tabitems_i18n WHERE ID = ?').get(id) as TabitemsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): TabitemsI18n[] {
    return this.db.prepare('SELECT * FROM tabitems_i18n WHERE status = ?').all(status) as TabitemsI18n[];
  }
}

export class testimonialItemsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): testimonialItems[] {
    return this.db.prepare('SELECT * FROM testimonial_items').all() as testimonialItems[];
  }

  findById(id: string): testimonialItems | undefined {
    return this.db.prepare('SELECT * FROM testimonial_items WHERE ID = ?').get(id) as testimonialItems;
  }

  findByStatus(status: 'publish' | 'draft'): testimonialItems[] {
    return this.db.prepare('SELECT * FROM testimonial_items WHERE status = ?').all(status) as testimonialItems[];
  }
}

export class testimonialItemsCreativeWorkRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): testimonialItemsCreativeWork[] {
    return this.db.prepare('SELECT * FROM testimonial_items_creative_work').all() as testimonialItemsCreativeWork[];
  }

  findById(id: string): testimonialItemsCreativeWork | undefined {
    return this.db.prepare('SELECT * FROM testimonial_items_creative_work WHERE ID = ?').get(id) as testimonialItemsCreativeWork;
  }

  findByStatus(status: 'publish' | 'draft'): testimonialItemsCreativeWork[] {
    return this.db.prepare('SELECT * FROM testimonial_items_creative_work WHERE status = ?').all(status) as testimonialItemsCreativeWork[];
  }
}

export class testimonialItemsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): testimonialItemsI18n[] {
    return this.db.prepare('SELECT * FROM testimonial_items_i18n').all() as testimonialItemsI18n[];
  }

  findById(id: string): testimonialItemsI18n | undefined {
    return this.db.prepare('SELECT * FROM testimonial_items_i18n WHERE ID = ?').get(id) as testimonialItemsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): testimonialItemsI18n[] {
    return this.db.prepare('SELECT * FROM testimonial_items_i18n WHERE status = ?').all(status) as testimonialItemsI18n[];
  }
}

export class WorkcategoriesRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Workcategories[] {
    return this.db.prepare('SELECT * FROM workcategories').all() as Workcategories[];
  }

  findById(id: string): Workcategories | undefined {
    return this.db.prepare('SELECT * FROM workcategories WHERE ID = ?').get(id) as Workcategories;
  }

  findByStatus(status: 'publish' | 'draft'): Workcategories[] {
    return this.db.prepare('SELECT * FROM workcategories WHERE status = ?').all(status) as Workcategories[];
  }
}

export class WorkcategoriesI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): WorkcategoriesI18n[] {
    return this.db.prepare('SELECT * FROM workcategories_i18n').all() as WorkcategoriesI18n[];
  }

  findById(id: string): WorkcategoriesI18n | undefined {
    return this.db.prepare('SELECT * FROM workcategories_i18n WHERE ID = ?').get(id) as WorkcategoriesI18n;
  }

  findByStatus(status: 'publish' | 'draft'): WorkcategoriesI18n[] {
    return this.db.prepare('SELECT * FROM workcategories_i18n WHERE status = ?').all(status) as WorkcategoriesI18n[];
  }
}

export class WorkitemsRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): Workitems[] {
    return this.db.prepare('SELECT * FROM workitems').all() as Workitems[];
  }

  findById(id: string): Workitems | undefined {
    return this.db.prepare('SELECT * FROM workitems WHERE ID = ?').get(id) as Workitems;
  }

  findByStatus(status: 'publish' | 'draft'): Workitems[] {
    return this.db.prepare('SELECT * FROM workitems WHERE status = ?').all(status) as Workitems[];
  }
}

export class WorkitemsCategoryRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): WorkitemsCategory[] {
    return this.db.prepare('SELECT * FROM workitems_category').all() as WorkitemsCategory[];
  }

  findById(id: string): WorkitemsCategory | undefined {
    return this.db.prepare('SELECT * FROM workitems_category WHERE ID = ?').get(id) as WorkitemsCategory;
  }

  findByStatus(status: 'publish' | 'draft'): WorkitemsCategory[] {
    return this.db.prepare('SELECT * FROM workitems_category WHERE status = ?').all(status) as WorkitemsCategory[];
  }
}

export class WorkitemsI18nRepository {
  constructor(private db: BetterSQLite3.Database) {}

  findAll(): WorkitemsI18n[] {
    return this.db.prepare('SELECT * FROM workitems_i18n').all() as WorkitemsI18n[];
  }

  findById(id: string): WorkitemsI18n | undefined {
    return this.db.prepare('SELECT * FROM workitems_i18n WHERE ID = ?').get(id) as WorkitemsI18n;
  }

  findByStatus(status: 'publish' | 'draft'): WorkitemsI18n[] {
    return this.db.prepare('SELECT * FROM workitems_i18n WHERE status = ?').all(status) as WorkitemsI18n[];
  }
}
