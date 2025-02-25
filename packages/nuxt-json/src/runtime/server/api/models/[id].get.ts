import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useStorage } from 'nitropack/dist/runtime/storage'
import type { ModelData } from '../../../types/contentrain'
import { STORAGE_KEYS } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const modelId = getRouterParam(event, 'id')

    if (!modelId) {
      throw createError({
        statusCode: 400,
        message: 'Model ID is required',
      })
    }

    const storage = useStorage('data')
    const modelData = await storage.getItem(STORAGE_KEYS.MODEL_DATA(modelId)) as ModelData | null
    if (!modelData) {
      console.warn('[Model API] Model not found:', modelId)
      throw createError({
        statusCode: 404,
        message: 'Model not found',
      })
    }
    event.node.res.setHeader('Content-Type', 'application/json')
    return modelData
  }
  catch (err) {
    console.error('[Model API] Error:', err)
    throw err
  }
})
