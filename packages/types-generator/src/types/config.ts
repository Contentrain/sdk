// Source types
export type SourceType = 'json' | 'sqlite';

export interface BaseGeneratorConfig {
  output: {
    dir: string
    filename?: string // default: 'contentrain.d.ts'
  }
}

export interface JSONSourceConfig extends BaseGeneratorConfig {
  source: {
    type: 'json'
    modelsDir: string
    contentDir: string
  }
}

export interface SQLiteSourceConfig extends BaseGeneratorConfig {
  source: {
    type: 'sqlite'
    databasePath: string
  }
}

export type GeneratorConfig = JSONSourceConfig | SQLiteSourceConfig;

// Type guard'lar
export function isJSONConfig(config: GeneratorConfig): config is JSONSourceConfig {
  return config.source.type === 'json';
}

export function isSQLiteConfig(config: GeneratorConfig): config is SQLiteSourceConfig {
  return config.source.type === 'sqlite';
}
