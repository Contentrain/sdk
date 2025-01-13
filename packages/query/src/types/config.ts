export interface ContentrainConfig {
  contentDir: string
  models: {
    [modelId: string]: {
      localized?: boolean
      defaultLocale?: string
      locales?: string[]
    }
  }
}
