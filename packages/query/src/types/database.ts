export interface DBRecord {
  id: string
  created_at: string
  updated_at: string
  status: string
  scheduled?: boolean
  _relations?: {
    [key: string]: DBRecord | DBRecord[]
  }
}

export interface DBTranslationRecord extends DBRecord {
  locale: string
  [key: string]: any
}

export interface DBRelation {
  id: string
  source_model: string
  source_id: string
  target_model: string
  target_id: string
  field_id: string
  type: 'one-to-one' | 'one-to-many'
}
