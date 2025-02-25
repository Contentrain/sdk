import { defineEventHandler } from 'h3'
import { useStorage } from 'nitropack/dist/runtime/storage'
import { STORAGE_KEYS } from '../../../utils/storage'

export default defineEventHandler(async () => {
  try {
    const storage = useStorage('data')
    const modelList = await storage.getItem<string[]>(STORAGE_KEYS.MODEL_LIST)

    if (!modelList) {
      console.warn('[Models API] No models found in storage')
      return []
    }
    return modelList
  }
  catch (err) {
    console.error('[Models API] Error:', err)
    return []
  }
})
