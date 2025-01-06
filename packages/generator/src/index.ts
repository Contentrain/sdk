import type { ContentrainError, ContentrainField, ContentrainModelMetadata } from '@contentrain/types';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Constants
const FieldTypeComponentMap = {
  string: ['single-line-text', 'multi-line-text', 'email', 'url', 'slug', 'color', 'json', 'md-editor', 'rich-text-editor'] as const,
  number: ['integer', 'decimal', 'rating', 'percent', 'phone-number'] as const,
  boolean: ['checkbox', 'switch'] as const,
  array: ['single-line-text', 'multi-line-text', 'email', 'url', 'slug', 'color', 'integer', 'decimal', 'rating', 'percent', 'phone-number'] as const,
  date: ['date', 'date-time'] as const,
  media: ['media'] as const,
  relation: ['one-to-one', 'one-to-many'] as const,
} as const;

// Types
export interface GeneratorConfig {
  modelsDir: string
  outputDir: string
  contentPath: string
}

// Helper Functions
function readJsonFile<T>(filePath: string): T | null {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(fileContent) as T;
  }
  catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    return null;
  }
}

export class ContentrainGenerator {
  private config: GeneratorConfig;

  constructor(config?: Partial<GeneratorConfig>) {
    const defaultConfig: GeneratorConfig = {
      modelsDir: path.join(process.cwd(), 'contentrain/models'),
      outputDir: path.join(process.cwd(), 'types'),
      contentPath: path.join(process.cwd(), 'contentrain'),
    };

    const configPath = path.join(process.cwd(), 'contentrain-config.json');
    if (fs.existsSync(configPath)) {
      const fileConfig = readJsonFile<Partial<GeneratorConfig>>(configPath) || {};
      this.config = { ...defaultConfig, ...fileConfig, ...config };
    }
    else {
      this.config = { ...defaultConfig, ...config };
    }
  }

  // Public Methods
  async generateTypes(): Promise<void> {
    const modelFiles = this.getModelFiles(this.config.modelsDir);
    const modelIds = this.getModelIds(modelFiles);
    const metadata = this.getMetaData(this.config.modelsDir);
    let typeDefinitions = this.initializeTypeDefinitions(modelIds);
    const { generatedCount, skippedCount, errors, interfaceNames, updatedTypeDefinitions } = this.processModelFiles(modelFiles, this.config.modelsDir, typeDefinitions, metadata);
    typeDefinitions = updatedTypeDefinitions;
    typeDefinitions += this.finalizeTypeDefinitions(modelIds, interfaceNames, modelFiles, this.config.modelsDir, metadata);

    this.writeTypeDefinitions(this.config.outputDir, typeDefinitions, generatedCount, skippedCount, errors);
  }

  // Type Generation Methods
  private initializeTypeDefinitions(modelIds: string[]): string {
    const modelIdType = `export type ModelId = ${modelIds.map(id => `'${id}'`).join(' | ')}\n\n`;
    return `// Generated by ContentrainGenerator
// Do not edit this file manually

export type Status = 'draft' | 'changed' | 'publish'

export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: Status
}

${modelIdType}`;
  }

  private processModelFiles(modelFiles: string[], modelsDir: string, typeDefinitions: string, metadata: ContentrainModelMetadata[]): {
    generatedCount: number
    skippedCount: number
    errors: Array<{ model: string, error: string }>
    interfaceNames: Map<string, string>
    updatedTypeDefinitions: string
  } {
    let generatedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ model: string, error: string }> = [];
    const interfaceNames = new Map<string, string>();

    modelFiles.forEach((file) => {
      const modelId = path.basename(file, '.json');
      const modelPath = path.join(modelsDir, file);
      const modelContent: ContentrainField[] = readJsonFile<ContentrainField[]>(modelPath) || [];
      const modelMetadata: ContentrainModelMetadata | undefined = metadata.find(m => m.modelId === modelId);
      const modelName = modelMetadata?.name || modelId;

      try {
        this.checkDuplicateFields(modelContent, modelName);
        const interfaceName = this.formatInterfaceName({
          name: modelName,
          modelId,
          fields: modelContent,
          localization: false,
          type: 'JSON',
          createdBy: '',
          isServerless: false,
        });
        const relations = this.extractRelations(modelContent, metadata);
        const typeDefinition = this.generateTypeForModel(modelContent, relations);
        typeDefinitions += `export interface ${interfaceName} extends BaseContentrainType ${typeDefinition}\n\n`;
        interfaceNames.set(modelId, interfaceName);
        generatedCount++;
        console.log(`✓ Generated interface for ${interfaceName}`);
      }
      catch (error: any) {
        const contentrainError: ContentrainError = {
          name: 'ContentrainError',
          message: error.message,
          code: 'MODEL_PROCESSING_ERROR',
          path: modelPath,
        };
        errors.push({ model: modelName, error: contentrainError.message });
        skippedCount++;
        console.error('\x1B[31m%s\x1B[0m', `✗ Error in ${modelName}: ${contentrainError.message}`);
      }
    });

    return { generatedCount, skippedCount, errors, interfaceNames, updatedTypeDefinitions: typeDefinitions };
  }

  private finalizeTypeDefinitions(modelIds: string[], interfaceNames: Map<string, string>, modelFiles: string[], modelsDir: string, metadata: ContentrainModelMetadata[]): string {
    let typeDefinitions = '';

    // ContentrainTypeMap
    const typeMapEntries = modelIds.map(id => `  '${id}': ${interfaceNames.get(id)}`).join('\n');
    typeDefinitions += `// Type mapping for model IDs to their respective interfaces\nexport type ContentrainTypeMap = {\n${typeMapEntries}\n}\n`;

    // Relations
    typeDefinitions += this.generateRelationMapping(modelFiles, modelsDir);

    // Locales
    typeDefinitions += this.generateLocaleContentMap(metadata);

    // Assets
    typeDefinitions += this.generateAssetTypes();

    return typeDefinitions;
  }

  // Type Generation Helper Methods
  private generateTypeForModel(modelFields: ContentrainField[], relations: Record<string, { model: string, type: string, modelName: string }>): string {
    let typeDefinition = '{\n';

    // Normal fields
    modelFields.forEach((field) => {
      if (field.fieldType !== 'relation' && !['ID', 'createdAt', 'updatedAt', 'status'].includes(field.fieldId)) {
        const fieldType = this.determineTypeScriptType(field);
        const isRequired = this.isFieldRequired(field);
        typeDefinition += `  ${this.formatPropertyName(field.fieldId)}${isRequired ? '' : '?'}: ${fieldType}\n`;
      }
    });

    // Relations
    if (relations) {
      Object.entries(relations).forEach(([fieldId, relation]) => {
        const relatedModelName = `I${this.formatTypeName(relation.modelName)}`;
        const isOneToOne = relation.type === 'one-to-one';
        const isRequired = modelFields.find(f => f.fieldId === fieldId)?.validations?.['required-field']?.value === true;
        typeDefinition += `  ${this.formatPropertyName(fieldId)}${isRequired ? '' : '?'}: ${isOneToOne ? 'string' : 'string[]'}\n`;
        const dataField = `'${fieldId}-data'`;
        typeDefinition += `  ${dataField}?: ${isOneToOne ? relatedModelName : `${relatedModelName}[]`}\n`;
      });
    }

    typeDefinition += '}';
    return typeDefinition;
  }

  private generateRelationMapping(modelFiles: string[], modelsDir: string): string {
    const relationMap: Record<string, { model: string, type: string }> = {};

    modelFiles.forEach((file) => {
      const modelId = path.basename(file, '.json');
      const modelPath = path.join(modelsDir, file);
      const modelFields: ContentrainField[] = readJsonFile<ContentrainField[]>(modelPath) || [];

      const relations = modelFields
        .filter(field => field.fieldType === 'relation')
        .map(field => ({
          model: field.options.reference?.form?.reference?.value || '',
          type: field.componentId,
        }));

      if (relations.length) {
        relationMap[modelId] = relations[0];
      }
    });

    let typeDefinitions = '\n// Relation Mappings\n';
    typeDefinitions += 'export type ModelRelations = {\n';
    Object.entries(relationMap).forEach(([modelId, relation]) => {
      typeDefinitions += `  '${modelId}': {\n`;
      typeDefinitions += `      model: '${relation.model}'\n`;
      typeDefinitions += `      type: '${relation.type}'\n`;
      typeDefinitions += '  }\n';
    });
    typeDefinitions += '}\n';
    return typeDefinitions;
  }

  private generateLocaleContentMap(metadata: ContentrainModelMetadata[]): string {
    const modelLocales: Record<string, Set<string>> = {};
    const contentDir = path.resolve(this.config.contentPath);
    const allLocales = new Set<string>();

    // Get localized models and their locales
    metadata.filter(model => model.localization).forEach((model) => {
      const modelPath = path.join(contentDir, model.modelId);
      if (fs.existsSync(modelPath)) {
        const localeFiles = fs.readdirSync(modelPath).filter(file => file.endsWith('.json'));
        const locales = localeFiles.map(file => file.replace('.json', ''));
        modelLocales[model.modelId] = new Set(locales);
        locales.forEach(locale => allLocales.add(locale));
      }
    });

    let typeDefinitions = '\n// Available locales\n';
    typeDefinitions += `export type AvailableLocale = ${Array.from(allLocales).map(l => `'${l}'`).join(' | ')};\n\n`;

    // Model specific locale types
    typeDefinitions += '// Model specific locale types\n';
    Object.entries(modelLocales).forEach(([modelId, locales]) => {
      const localeUnion = Array.from(locales).map(l => `'${l}'`).join(' | ');
      typeDefinitions += `export type ${this.formatTypeName(modelId)}Locales = ${localeUnion};\n`;
    });
    typeDefinitions += '\n';

    // Model specific locale map
    typeDefinitions += '// Model specific locale availability\n';
    typeDefinitions += 'export type LocaleContentMap = {\n';
    Object.entries(modelLocales).forEach(([modelId]) => {
      typeDefinitions += `  '${modelId}': ${this.formatTypeName(modelId)}Locales[];\n`;
    });
    typeDefinitions += '};\n';

    // Validation helpers
    typeDefinitions += this.generateLocaleValidators(allLocales, modelLocales);

    return typeDefinitions;
  }

  private generateLocaleValidators(allLocales: Set<string>, modelLocales: Record<string, Set<string>>): string {
    let validators = '\n// Locale validation helpers\n';

    // Global validator
    validators += 'export const isValidLocale = (locale: string): locale is AvailableLocale => {\n';
    validators += `  return [${Array.from(allLocales).map(l => `'${l}'`).join(', ')}].includes(locale);\n`;
    validators += '};\n\n';

    // Model specific validators
    validators += '// Model specific locale validators\n';
    Object.entries(modelLocales).forEach(([modelId, locales]) => {
      const funcName = `isValid${this.formatTypeName(modelId)}Locale`;
      const typeName = `${this.formatTypeName(modelId)}Locales`;
      validators += `export const ${funcName} = (locale: string): locale is ${typeName} => {\n`;
      validators += `  return [${Array.from(locales).map(l => `'${l}'`).join(', ')}].includes(locale);\n`;
      validators += '};\n';
    });

    return validators;
  }

  private generateAssetTypes(): string {
    return `\n// Asset types
export interface ContentrainAssetMeta {
  user: {
    name: string
    email: string
    avatar: string
  }
  createdAt: string
}

export interface ContentrainAsset {
  path: string
  mimetype: string
  size: number
  alt: string
  meta: ContentrainAssetMeta
}

export type ContentrainAssets = ContentrainAsset[]\n`;
  }

  // Utility Methods
  private getModelFiles(modelsDir: string): string[] {
    return fs.readdirSync(modelsDir).filter(file => file.endsWith('.json') && file !== 'metadata.json');
  }

  private getModelIds(modelFiles: string[]): string[] {
    return modelFiles.map(file => path.basename(file, '.json'));
  }

  private getMetaData(modelsDir: string): ContentrainModelMetadata[] {
    const metadataPath = path.join(modelsDir, 'metadata.json');
    const metadata = readJsonFile<ContentrainModelMetadata[]>(metadataPath);
    if (!metadata) {
      throw new Error(`Metadata could not be read from ${metadataPath}`);
    }
    return metadata;
  }

  // Type Conversion Methods
  private determineTypeScriptType(field: ContentrainField): string {
    if (field.fieldId === 'status')
      return '\'draft\' | \'changed\' | \'publish\'';
    if (field.componentId === 'checkbox')
      return 'boolean';
    if (field.fieldType === 'relation') {
      return field.componentId === 'one-to-one' ? 'string' : 'string[]';
    }

    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'string',
      'date-time': 'string',
      'media': 'string',
      'json': 'string',
      'md-editor': 'string',
      'rich-text-editor': 'string',
      'switch': 'boolean',
      'one-to-one': 'string',
      'one-to-many': 'string',
    };

    if (field.fieldType === 'array' && field.componentId && (FieldTypeComponentMap.array as readonly string[]).includes(field.componentId)) {
      const arrayTypeMap: Record<string, string> = {
        'single-line-text': 'string[]',
        'multi-line-text': 'string[]',
        'email': 'string[]',
        'url': 'string[]',
        'slug': 'string[]',
        'color': 'string[]',
        'integer': 'number[]',
        'decimal': 'number[]',
        'rating': 'number[]',
        'percent': 'number[]',
        'phone-number': 'number[]',
      };
      return arrayTypeMap[field.componentId] || 'any[]';
    }

    return typeMap[field.fieldType] || 'unknown';
  }

  // String Manipulation Methods
  private formatInterfaceName(metadata: ContentrainModelMetadata): string {
    if (!metadata.name && !metadata.modelId) {
      throw new Error('Model must have either name or modelId');
    }
    const baseName = metadata.name || metadata.modelId;
    return `I${baseName.replace(/\s+/g, '').replace(/-./g, x => x[1].toUpperCase())}`;
  }

  private formatPropertyName(name: string): string {
    return name.includes('-') ? `'${name}'` : name;
  }

  private formatTypeName(str: string): string {
    return str
      .split(/[-\s]+/)
      .map(part => this.capitalizeFirstLetter(part))
      .join('');
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Validation Methods
  private checkDuplicateFields(modelFields: ContentrainField[], modelName: string): void {
    const fieldIds = new Set();
    const duplicates: string[] = [];
    modelFields.forEach((field) => {
      if (fieldIds.has(field.fieldId)) {
        duplicates.push(field.fieldId);
      }
      fieldIds.add(field.fieldId);
    });
    if (duplicates.length > 0) {
      throw new Error(`Duplicate fields found in model '${modelName}': ${duplicates.join(', ')}`);
    }
  }

  private isFieldRequired(field: ContentrainField): boolean {
    return field.validations?.['required-field']?.value === true;
  }

  private extractRelations(modelContent: ContentrainField[], modelMetadata: ContentrainModelMetadata[]): Record<string, { model: string, type: string, modelName: string }> {
    if (!modelMetadata || !modelContent) {
      throw new Error('Model metadata and content are required to extract relations');
    }

    return modelContent
      .filter((field: ContentrainField) => field.fieldType === 'relation' && field.options.reference)
      .reduce((acc: Record<string, { model: string, type: string, modelName: string }>, field: ContentrainField) => {
        if (field.options.reference) {
          const relatedModelId = field.options.reference.form.reference.value;
          const relatedModelName = modelMetadata.find(m => m.modelId === relatedModelId)?.name || '';
          acc[field.fieldId] = {
            model: relatedModelId,
            type: field.componentId,
            modelName: relatedModelName,
          };
        }
        return acc;
      }, {});
  }

  // File System Methods
  private writeTypeDefinitions(outputDir: string, typeDefinitions: string, generatedCount: number, skippedCount: number, errors: any[]): void {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(path.join(outputDir, 'contentrain.ts'), typeDefinitions);
      this.logGenerationSummary(generatedCount, skippedCount, errors, outputDir);
    }
    catch (error) {
      console.error('Error writing type definitions:', error);
    }
  }

  private logGenerationSummary(generatedCount: number, skippedCount: number, errors: any[], outputDir: string): void {
    console.log('\n\x1B[36m%s\x1B[0m', 'Generation Summary:');
    console.log('\x1B[36m%s\x1B[0m', '-----------------------------------');
    console.log('\x1B[32m%s\x1B[0m', `✓ Successfully generated ${generatedCount} interfaces`);

    if (skippedCount > 0) {
      console.log('\x1B[31m%s\x1B[0m', `✗ Skipped ${skippedCount} models due to errors`);
      console.log('\n\x1B[31m%s\x1B[0m', 'Errors:');
      errors.forEach(({ model, error }) => {
        console.log('\x1B[31m%s\x1B[0m', `  - ${model}: ${error}`);
      });
    }

    console.log('\n\x1B[32m%s\x1B[0m', `TypeScript types generated in ${path.join(outputDir, 'contentrain.ts')}`);
  }
}
