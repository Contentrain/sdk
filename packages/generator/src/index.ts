import type {
  ContentrainConfig,
  ContentrainField,
  ContentrainModelMetadata,
} from '@contentrain/types';
import { ContentrainCore } from '@contentrain/core';

export interface GeneratorConfig extends ContentrainConfig {
  output: string
}

export class ContentrainGenerator {
  private core: ContentrainCore;

  constructor(config: GeneratorConfig = { output: 'src/types/contentrain.ts' }) {
    this.core = new ContentrainCore(config);
  }

  private getFieldType(field: ContentrainField): string {
    if (field.type === 'relation') {
      return field.relation?.multiple ? 'string[]' : 'string';
    }

    switch (field.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'string[]';
      case 'date':
        return 'string';
      case 'media':
        return 'string';
      default:
        return 'string';
    }
  }

  private getFieldName(field: ContentrainField): string {
    return field.required ? field.id : `${field.id}?`;
  }

  private getModelName(metadata: ContentrainModelMetadata): string {
    return `${metadata.modelId}Model`;
  }

  private getModelContent(metadata: ContentrainModelMetadata): string {
    const fields = metadata.fields.map((field) => {
      const fieldName = this.getFieldName(field);
      const fieldType = this.getFieldType(field);
      return `  ${fieldName}: ${fieldType}`;
    });

    const modelName = this.getModelName(metadata);
    const baseModel = 'ContentrainBaseModel';

    return `export interface ${modelName} extends ${baseModel} {
${fields.join('\n')}
}`;
  }

  private getRelationContent(metadata: ContentrainModelMetadata): string {
    const fields = metadata.fields.filter(field => field.type === 'relation' && field.relation);
    if (fields.length === 0) {
      return '';
    }

    const relations = fields.map((field) => {
      const fieldName = this.getFieldName(field);
      const relatedModelName = this.getModelName(metadata);
      return `  ${fieldName}: ${relatedModelName}`;
    });

    return `export interface ${this.getModelName(metadata)}WithRelations extends ${this.getModelName(metadata)} {
${relations.join('\n')}
}`;
  }

  async generate(): Promise<string> {
    const collections = await this.core.getAvailableCollections();
    const models = await Promise.all(collections.map(async collection => this.core.getModelMetadata(collection)));

    const content = models.map((metadata) => {
      const modelContent = this.getModelContent(metadata);
      const relationContent = this.getRelationContent(metadata);
      return [modelContent, relationContent].filter(Boolean).join('\n\n');
    });

    return content.join('\n\n');
  }
}
