export const STORAGE_PREFIX = 'contentrain'

export const createStorageKey = (key: string): string => {
  return `${STORAGE_PREFIX}:${key}`
}

export const STORAGE_KEYS = {
  MODEL_LIST: createStorageKey('models:list'),
  MODEL_DATA: (modelId: string) => createStorageKey(`model:${modelId}:data`),
} as const
