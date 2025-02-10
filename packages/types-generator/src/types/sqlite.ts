export interface TableInfo {
  name: string
  columns: ColumnInfo[]
  relations: RelationInfo[]
  hasTranslations: boolean
}

export interface ColumnInfo {
  name: string
  type: string
  notNull: boolean
}

export interface RelationInfo {
  fieldName: string
  targetTable: string
  type: 'one-to-one' | 'one-to-many'
}
