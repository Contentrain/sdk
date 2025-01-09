import type { QueryConfig } from '../types/query';

export class ContentLoader {
  private strategy: 'fetch' | 'import';
  private baseUrl: string;
  private modelsDir: string;
  private contentDir: string;
  private assetsDir: string;

  constructor(config: QueryConfig = {}) {
    this.strategy = config.strategy || 'fetch';
    this.baseUrl = config.baseUrl || '/contentrain';
    this.modelsDir = config.modelsDir || 'models';
    this.contentDir = config.contentDir || '';
    this.assetsDir = config.assetsDir || '';
  }

  private async loadWithFetch(path: string) {
    const response = await fetch(`file://${this.baseUrl}/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.statusText}`);
    }
    return response.json();
  }

  private async loadWithImport(path: string) {
    try {
      const module = await import(`${this.baseUrl}/${path}`);
      return module;
    }
    catch (error: unknown) {
      if (error instanceof Error) {
        throw new TypeError(`Failed to import content: ${error.message}`);
      }
      throw new Error('Failed to import content: Unknown error');
    }
  }

  async load(path: string) {
    if (this.strategy === 'fetch') {
      return this.loadWithFetch(path);
    }
    return this.loadWithImport(path);
  }

  async loadModel(modelId: string, locale?: string) {
    if (this.contentDir.length) {
      const path = locale
        ? `${this.contentDir}/${modelId}/${locale}.json`
        : `${this.contentDir}/${modelId}.json`;
      return this.load(path);
    }
    else {
      return this.load(`${modelId}/${locale ? `${locale}.json` : `${modelId}.json`}`);
    }
  }

  async loadModelMetadata(modelId: string) {
    return this.load(`${this.modelsDir}/${modelId}.json`);
  }

  async loadAllMetadata() {
    return this.load(`${this.modelsDir}/metadata.json`);
  }

  async loadAssets() {
    if (this.assetsDir.length) {
      return this.load(`${this.assetsDir}/assets.json`);
    }
    return this.load('assets.json');
  }
}
