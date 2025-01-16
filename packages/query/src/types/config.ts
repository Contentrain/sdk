export interface ContentrainConfig {
  contentDir: string
  defaultLocale?: string
  models: {
    [modelId: string]: {
      localized: boolean
      defaultLocale?: string
      locales?: string[]
    }
  }
}
