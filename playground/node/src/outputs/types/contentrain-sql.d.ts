// Automatically generated by @contentrain/types-generator
// Do not edit this file manually

import type {
  BaseContentrainType,
  DBRecord,
  QueryConfig,
} from '@contentrain/query';

export interface IServices extends DBRecord {
  reference_id?: string

  _relations?: {
    reference: IReferences
  }
}

export interface IProcesses extends DBRecord {}

export interface ITabitems extends DBRecord {
  category_id?: string

  _relations?: {
    category: IWorkcategories[]
  }
}

export interface IWorkitems extends DBRecord {
  category_id?: string

  _relations?: {
    category: IWorkcategories
  }
}

export interface IWorkcategories extends DBRecord {}

export interface IFaqitems extends DBRecord {}

export interface ISections extends DBRecord {}

export interface ISociallinks extends DBRecord {
  link: string
  icon: string
  service_id?: string

  _relations?: {
    service: IServices
  }
}

export interface IReferences extends DBRecord {
  logo: string
}

export interface IMetaTags extends DBRecord {}

export interface ITestimonialItems extends DBRecord {
  creative_work_id?: string
}

export interface IProjectDetails extends DBRecord {
  work_id?: string
  testimonial_id?: string
}

export interface IProjectStats extends DBRecord {
  view_count: number
  work_id?: string
  reference_id?: string
}

export interface IContentrainRelations extends DBRecord {
  source_model: string
  source_id: string
  target_model: string
  target_id: string
  field_id: string
  type: string
}

export type IServicesQuery = QueryConfig<
  IServices,
  never,
  {
    reference: IReferences
  }
>;

export type IProcessesQuery = QueryConfig<
  IProcesses,
  never,
  Record<string, never>
>;

export type ITabitemsQuery = QueryConfig<
  ITabitems,
  never,
  {
    category: IWorkcategories
  }
>;

export type IWorkitemsQuery = QueryConfig<
  IWorkitems,
  never,
  {
    category: IWorkcategories
  }
>;

export type IWorkcategoriesQuery = QueryConfig<
  IWorkcategories,
  never,
  Record<string, never>
>;

export type IFaqitemsQuery = QueryConfig<
  IFaqitems,
  never,
  Record<string, never>
>;

export type ISectionsQuery = QueryConfig<
  ISections,
  never,
  Record<string, never>
>;

export type ISociallinksQuery = QueryConfig<
  ISociallinks,
  never,
  {
    service: IServices
  }
>;

export type IReferencesQuery = QueryConfig<
  IReferences,
  never,
  Record<string, never>
>;

export type IMetaTagsQuery = QueryConfig<
  IMetaTags,
  never,
  Record<string, never>
>;

export type ITestimonialItemsQuery = QueryConfig<
  ITestimonialItems,
  never,
  Record<string, never>
>;

export type IProjectDetailsQuery = QueryConfig<
  IProjectDetails,
  never,
  Record<string, never>
>;

export type IProjectStatsQuery = QueryConfig<
  IProjectStats,
  never,
  Record<string, never>
>;

export type IContentrainRelationsQuery = QueryConfig<
  IContentrainRelations,
  never,
  Record<string, never>
>;
