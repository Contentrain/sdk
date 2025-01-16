// @contentrain/types-generator tarafından otomatik oluşturuldu
// Bu dosyayı manuel olarak düzenlemeyin

import type { BaseContentrainType, QueryConfig } from '@contentrain/query';

export interface IFaqItems extends BaseContentrainType {
  question: string
  answer: string
  order: number
}

export interface IMetaTags extends BaseContentrainType {
  name: string
  content: string
  description?: string
}

export interface IProcessItems extends BaseContentrainType {
  title: string
  description: string
  icon: string
}

export interface IReferences extends BaseContentrainType {
  logo: string
}

export interface ISections extends BaseContentrainType {
  title: string
  description: string
  buttontext?: string
  buttonlink?: string
  name: string
  subtitle?: string
}

export interface IServicesItems extends BaseContentrainType {
  title: string
  description?: string
  image?: string
}

export interface ISocialLinks extends BaseContentrainType {
  link: string
  icon: string
}

export interface ITabItems extends BaseContentrainType {
  link: string
  description: string
  image: string
  category: string
  _relations: {
    category: IWorkItems[]
  }
}

export interface ITestimonailItems extends BaseContentrainType {
  'name': string
  'description': string
  'title': string
  'image': string
  'creative-work': string
  '_relations'?: {
    'creative-work': IWorkItems
  }
}

export interface IWorkCategories extends BaseContentrainType {
  category: string
  order: number
}

export interface IWorkItems extends BaseContentrainType {
  title: string
  image?: string
  description: string
  category: string
  _relations?: {
    category: IWorkCategories
  }
  link: string
  order: number
}

// Query Config Tipleri
export interface IFaqItemsQuery extends QueryConfig<
  IFaqItems,
  'en' | 'tr',
  Record<string, never>
> {}

export interface IMetaTagsQuery extends QueryConfig<
  IMetaTags,
  'en' | 'tr',
  Record<string, never>
> {}

export interface IProcessItemsQuery extends QueryConfig<
  IProcessItems,
  'en' | 'tr',
  Record<string, never>
> {}

export interface IReferencesQuery extends QueryConfig<
  IReferences,
  never,
  Record<string, never>
> {}

export interface ISectionsQuery extends QueryConfig<
  ISections,
  'en' | 'tr',
  Record<string, never>
> {}

export interface IServicesItemsQuery extends QueryConfig<
  IServicesItems,
  'en' | 'tr',
  Record<string, never>
> {}

export interface ISocialLinksQuery extends QueryConfig<
  ISocialLinks,
  never,
  Record<string, never>
> {}

export interface ITabItemsQuery extends QueryConfig<
  ITabItems,
  'en' | 'tr',
  Record<string, never>
> {}

export interface ITestimonailItemsQuery extends QueryConfig<
  ITestimonailItems,
  'en' | 'tr',
  {
    'creative-work': IWorkItems
  }
> {}

export interface IWorkCategoriesQuery extends QueryConfig<
  IWorkCategories,
  'en' | 'tr',
  Record<string, never>
> {}

export interface IWorkItemsQuery extends QueryConfig<
  IWorkItems,
  'en' | 'tr',
  {
    category: IWorkCategories
  }
> {}
