export interface Services {
  ID: string | null;
  title: string;
  description: string | null;
  image: string | null;
  reference: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Services_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  image: string | null;
}

export interface Services_reference {
  source_id: string;
  target_id: string;
  created_at: string;
}

export interface Processes {
  ID: string | null;
  title: string;
  description: string;
  icon: string;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Processes_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  icon: string;
}

export interface Tabitems {
  ID: string | null;
  link: string;
  description: string;
  image: string;
  category: string;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Tabitems_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  link: string;
  description: string;
  image: string;
}

export interface Tabitems_category {
  source_id: string;
  target_id: string;
  created_at: string;
}

export interface Workitems {
  ID: string | null;
  title: string;
  image: string | null;
  description: string;
  category: string;
  link: string;
  order_field: number;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Workitems_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  title: string;
  image: string | null;
  description: string;
  link: string;
  order_field: number;
}

export interface Workitems_category {
  source_id: string;
  target_id: string;
  created_at: string;
}

export interface Workcategories {
  ID: string | null;
  category: string;
  order_field: number;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Workcategories_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  category: string;
  order_field: number;
}

export interface Faqitems {
  ID: string | null;
  question: string;
  answer: string;
  order_field: number;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Faqitems_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  question: string;
  answer: string;
  order_field: number;
}

export interface Sections {
  ID: string | null;
  title: string;
  description: string;
  buttontext: string | null;
  buttonlink: string | null;
  name: string;
  subtitle: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Sections_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  buttontext: string | null;
  buttonlink: string | null;
  name: string;
  subtitle: string | null;
}

export interface Sociallinks {
  ID: string | null;
  link: string;
  icon: string;
  service: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Sociallinks_service {
  source_id: string;
  target_id: string;
  created_at: string;
}

export interface References_table {
  ID: string | null;
  logo: string;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Meta_tags {
  ID: string | null;
  name: string;
  content: string;
  description: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Meta_tags_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  name: string;
  content: string;
  description: string | null;
}

export interface Testimonail_items {
  ID: string | null;
  name: string;
  description: string;
  title: string;
  image: string;
  creative_work: string;
  status: number;
  created_at: string;
  updated_at: string;
  scheduled: number;
  scheduled_at: string | null;
}

export interface Testimonail_items_i18n {
  lang: string;
  ID: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  title: string;
  image: string;
}

export interface Testimonail_items_creative_work {
  source_id: string;
  target_id: string;
  created_at: string;
}

