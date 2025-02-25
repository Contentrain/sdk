import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { useStorage } from 'nitropack/dist/runtime/storage'
import { useRuntimeConfig } from 'nitropack/runtime/internal/config'
import type {
  ModelMetadata,
  FieldMetadata,
  Content,
  LocalizedContent,
  ModelData,
} from '../../types/contentrain'
import { STORAGE_KEYS } from '../../utils/storage'

export default defineNitroPlugin(async (nitro) => {
  const storage = useStorage('data')
  const config = useRuntimeConfig()
  const contentrainPath = config.public.contentrain.path

  console.log('Loading Contentrain from:', contentrainPath)

  // Find language files in a directory
  const findLanguages = async (dirPath: string): Promise<string[]> => {
    try {
      const files = await fs.readdir(dirPath)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(lang => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(lang))
    }
    catch (error) {
      console.warn('Error finding languages in:', dirPath, error)
      return []
    }
  }

  // Load model metadata and fields
  const loadModelMetadata = async () => {
    try {
      // Check if models directory exists
      const modelsDir = join(contentrainPath, 'models')
      try {
        await fs.access(modelsDir)
        console.log('Models directory found:', modelsDir)
      }
      catch (error) {
        console.error('Models directory not found:', modelsDir, error)
        return
      }

      // Read metadata.json file
      const metadataPath = join(modelsDir, 'metadata.json')
      try {
        await fs.access(metadataPath)
        console.log('Metadata file found:', metadataPath)
      }
      catch (error) {
        console.error('metadata.json file not found:', metadataPath, error)
        return
      }

      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      const metadata: ModelMetadata[] = JSON.parse(metadataContent)
      console.log('Loaded metadata for models:', metadata.map(m => m.modelId).join(', '))

      // Load all models in parallel and save to storage
      const modelDataList = await Promise.all(metadata.map(async (model) => {
        // Load field definitions
        const fieldsPath = join(modelsDir, `${model.modelId}.json`)
        let fields: FieldMetadata[] = []

        try {
          const fieldsContent = await fs.readFile(fieldsPath, 'utf-8')
          fields = JSON.parse(fieldsContent)
          console.log(`Loaded fields for model ${model.modelId}:`, fields.length)
        }
        catch (error) {
          console.error(`Field definitions not found for model ${model.modelId}:`, fieldsPath, error)
          return null
        }

        // Load content
        let content: (Content | LocalizedContent)[] = []
        const modelPath = join(contentrainPath, model.modelId)

        if (model.localization) {
          // Find and load language files
          const languages = await findLanguages(modelPath)
          if (languages.length === 0) {
            console.warn(`No language files found for model ${model.modelId}:`, modelPath)
            return null
          }

          console.log(`Found languages for model ${model.modelId}:`, languages.join(', '))

          // Load language files in parallel
          const langContents = await Promise.all(
            languages.map(async (lang) => {
              const langPath = join(modelPath, `${lang}.json`)
              try {
                const contentData = await fs.readFile(langPath, 'utf-8')
                const langContent = JSON.parse(contentData) as Content[]
                console.log(`Loaded ${langContent.length} items for ${model.modelId} in ${lang}`)
                return langContent.map(item => ({ ...item, lang })) as LocalizedContent[]
              }
              catch (error) {
                console.error(`Error loading ${lang} content for ${model.modelId}:`, error)
                return []
              }
            }),
          )
          content = langContents.flat()
        }
        else {
          // Load single content file
          const contentFilePath = join(modelPath, `${model.modelId}.json`)
          try {
            const contentData = await fs.readFile(contentFilePath, 'utf-8')
            content = JSON.parse(contentData)
            console.log(`Loaded ${content.length} items for ${model.modelId}`)
          }
          catch (error) {
            console.error(`Error loading content for ${model.modelId}:`, error)
            content = []
          }
        }

        // Create and save model data
        const modelData: ModelData = {
          metadata: model,
          fields,
          content,
        }

        // Save individual model data
        await storage.setItem(STORAGE_KEYS.MODEL_DATA(model.modelId), modelData)
        console.log(`Saved model data for ${model.modelId}`)

        return modelData
      }))

      // Filter out null values and save model list
      const validModelList = modelDataList.filter((model): model is ModelData => model !== null)
      await storage.setItem(STORAGE_KEYS.MODEL_LIST, validModelList)
      console.log('Saved model list with', validModelList.length, 'models')

      // Emit hook after loading
      await nitro.hooks.callHook('contentrain:loaded', { models: metadata })
      console.log('Contentrain loading completed')
    }
    catch (error) {
      console.error('Error loading Contentrain:', error)
      throw error
    }
  }

  // Initial load
  await loadModelMetadata()
})
