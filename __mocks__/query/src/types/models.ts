export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
  scheduled: boolean
}

export interface ContentrainAsset {
  path: string
  mimetype: string
  size: number
  alt: string
  meta: {
    user: {
      name: string
      email: string
      avatar: string
    }
    createdAt: string
  }
}

export interface ContentrainModelMetadata {
  name: string
  modelId: string
  localization: boolean
  type: string
  createdBy: string
  isServerless: boolean
}
