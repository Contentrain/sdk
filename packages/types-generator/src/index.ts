import type { FieldMetadata, ModelMetadata } from '@contentrain/query';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Types
export interface GeneratorConfig {
  modelsDir: string
  outputDir: string
  contentDir: string
  lint?: boolean
}

export class ContentrainTypesGenerator {
  private config: GeneratorConfig;

  // Config dosyasını recursive olarak arar
  private findConfigFile(startPath: string): string | null {
    const configNames = ['contentrain-config.json', '.contentrain/config.json', '.config/contentrain.json'];
    let currentPath = startPath;

    while (currentPath !== path.parse(currentPath).root) {
      for (const configName of configNames) {
        const configPath = path.join(currentPath, configName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentPath = path.dirname(currentPath);
    }
    return null;
  }

  constructor(config?: Partial<GeneratorConfig>) {
    const defaultConfig: GeneratorConfig = {
      modelsDir: path.join(process.cwd(), 'contentrain/models'),
      outputDir: path.join(process.cwd(), 'types'),
      contentDir: path.join(process.cwd(), 'contentrain'),
    };

    const fileConfig: Partial<GeneratorConfig> = {};

    // 1. Önce config dosyasını ara
    const configPath = this.findConfigFile(process.cwd());
    if (configPath) {
      try {
        console.log(`Found config file at: ${configPath}`);
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(fileContent) as Partial<GeneratorConfig>;

        // Yolları mutlak yola çevir
        if (parsedConfig.modelsDir)
          fileConfig.modelsDir = path.resolve(path.dirname(configPath), parsedConfig.modelsDir);
        if (parsedConfig.outputDir)
          fileConfig.outputDir = path.resolve(path.dirname(configPath), parsedConfig.outputDir);
        if (parsedConfig.contentDir)
          fileConfig.contentDir = path.resolve(path.dirname(configPath), parsedConfig.contentDir);

        console.log('Config from file:', fileConfig);
      }
      catch (error) {
        console.warn(`Warning: Failed to parse config file at ${configPath}:`, error);
      }
    }

    if (config) {
      const cliConfig: Partial<GeneratorConfig> = {};
      if (config.modelsDir)
        cliConfig.modelsDir = path.resolve(process.cwd(), config.modelsDir);
      if (config.outputDir)
        cliConfig.outputDir = path.resolve(process.cwd(), config.outputDir);
      if (config.contentDir)
        cliConfig.contentDir = path.resolve(process.cwd(), config.contentDir);

      console.log('CLI config:', cliConfig);
      this.config = {
        ...defaultConfig,
        ...fileConfig,
        ...cliConfig,
      };
    }
    else {
      this.config = {
        ...defaultConfig,
        ...fileConfig,
      };
    }

    console.log('Final merged configuration:', this.config);

    if (!fs.existsSync(this.config.modelsDir)) {
      console.warn(`Warning: Models directory does not exist: ${this.config.modelsDir}`);
    }

    // Output dizinini oluştur
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      console.log(`Created output directory: ${this.config.outputDir}`);
    }
  }

  // Config'i döndür
  getConfig(): GeneratorConfig {
    return this.config;
  }

  // Ana tip üretme metodu
  async generate(): Promise<void> {
    try {
      console.log('Reading model files...');
      const modelFiles = this.getModelFiles();
      console.log('Found model files:', modelFiles);

      console.log('Reading metadata...');
      const metadata = this.getMetadata();
      console.log('Metadata:', metadata);

      console.log('Initializing type definitions...');
      let typeDefinitions = this.initializeTypeDefinitions();

      console.log('Processing model files...');
      const { baseTypes, queryTypes } = this.processModelFiles(modelFiles, metadata);

      typeDefinitions += baseTypes;
      typeDefinitions += '\n// Query Config Types\n';
      typeDefinitions += queryTypes;

      console.log('Writing type definitions...');
      const outputPath = path.join(this.config.outputDir, 'contentrain.d.ts');
      this.writeTypeDefinitions(typeDefinitions);

      // Linting opsiyonel
      if (this.config.lint) {
        console.log('Running linter...');
        try {
          await this.runLinter(outputPath);
        }
        catch (error) {
          console.warn('⚠️ Linting failed:', error instanceof Error ? error.message : String(error));
          // Linting hatası olsa bile devam et
        }
      }

      console.log('✨ Type definitions successfully generated:', outputPath);
    }
    catch (error) {
      console.error('❌ Error details:', error instanceof Error ? error.cause : error);
      throw new Error('Type generation failed', { cause: error });
    }
  }

  // Linter çalıştırma
  private async runLinter(filePath: string): Promise<void> {
    try {
      // ESLint ile düzeltme
      console.log('Running ESLint fix...');
      const { ESLint } = await import('eslint');
      const eslint = new ESLint({
        fix: true,
        useEslintrc: false, // Proje config'ini kullanma
        baseConfig: {
          extends: ['eslint:recommended'],
          rules: {
            'semi': ['error', 'always'],
            'quotes': ['error', 'double'],
            'quote-props': ['error', 'consistent-as-needed'],
          },
        },
      } as any); // ESLint'in tip sorunlarını geçici olarak bypass ediyoruz

      const results = await eslint.lintFiles([filePath]);
      await ESLint.outputFixes(results);

      // Prettier ile formatlama
      console.log('Running Prettier...');
      const prettier = await import('prettier');
      const config = await prettier.resolveConfig(process.cwd());

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const formatted = await prettier.format(content, {
        ...config,
        parser: 'typescript',
      });

      await fs.promises.writeFile(filePath, formatted, 'utf-8');

      console.log('✓ Linting completed');
    }
    catch (error) {
      console.warn('⚠️ Linting failed:', error instanceof Error ? error.message : String(error));
      // Linting hatası olsa bile process'i durdurmuyoruz
    }
  }

  // Reading model files
  private getModelFiles(): string[] {
    try {
      if (!fs.existsSync(this.config.modelsDir)) {
        throw new Error(`Model directory not found: ${this.config.modelsDir}`);
      }
      const files = fs.readdirSync(this.config.modelsDir)
        .filter(file => file.endsWith('.json') && file !== 'metadata.json');
      if (files.length === 0) {
        throw new Error(`No JSON files found in model directory: ${this.config.modelsDir}`);
      }
      return files;
    }
    catch (error) {
      console.error('❌ Error reading model files:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to read model directory: ${this.config.modelsDir}`, { cause: error });
    }
  }

  // Reading metadata
  private getMetadata(): ModelMetadata[] {
    try {
      const metadataPath = path.join(this.config.modelsDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata file not found: ${metadataPath}`);
      }
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      if (!Array.isArray(metadata)) {
        throw new TypeError('Metadata is not a valid array');
      }
      return metadata;
    }
    catch (error) {
      console.error('❌ Error reading metadata:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to read metadata', { cause: error });
    }
  }

  // Creating base type definitions
  private initializeTypeDefinitions(): string {
    return `// Automatically generated by @contentrain/types-generator
// Do not edit this file manually

import type { BaseContentrainType, QueryConfig } from '@contentrain/query';\n\n`;
  }

  // Model dosyalarını işleme
  private processModelFiles(
    modelFiles: string[],
    metadata: ModelMetadata[],
  ): { baseTypes: string, queryTypes: string } {
    let baseTypes = '';
    let queryTypes = '';

    modelFiles.forEach((file) => {
      try {
        const modelId = path.basename(file, '.json');
        const modelPath = path.join(this.config.modelsDir, file);
        const modelContent: FieldMetadata[] = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
        const modelMetadata = metadata.find(m => m.modelId === modelId);

        if (!modelMetadata) {
          throw new Error(`Model metadata not found: ${modelId}`);
        }

        // Base Type Generation
        const interfaceName = this.formatInterfaceName(modelMetadata);
        const { typeDefinition, relations } = this.generateTypeForModel(modelContent, metadata);
        baseTypes += `export interface ${interfaceName} extends BaseContentrainType ${typeDefinition}\n\n`;

        // Query Type Generation
        const queryInterfaceName = `${interfaceName}Query`;
        queryTypes += this.generateQueryType(interfaceName, queryInterfaceName, modelMetadata, relations);
      }
      catch (error) {
        console.error(`✗ Error in file ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return { baseTypes, queryTypes };
  }

  // Model için tip üretme
  private generateTypeForModel(
    modelFields: FieldMetadata[],
    metadata: ModelMetadata[],
  ): { typeDefinition: string, relations: Record<string, { model: string, type: string }> } {
    let typeDefinition = '{\n';
    const relations: Record<string, { model: string, type: string }> = {};
    const relationFields: string[] = [];

    modelFields.forEach((field) => {
      if (!['ID', 'createdAt', 'updatedAt', 'status'].includes(field.fieldId)) {
        if (field.fieldType === 'relation' && field.options.reference) {
          const relatedModelId = field.options.reference.form.reference.value;
          const relatedModel = metadata.find(m => m.modelId === relatedModelId);

          if (relatedModel) {
            const relatedInterfaceName = this.formatInterfaceName(relatedModel);
            relations[field.fieldId] = {
              model: relatedInterfaceName,
              type: field.componentId,
            };

            // İlişki ID'lerini tutan property'yi ekle
            typeDefinition += `  "${this.formatPropertyName(field.fieldId)}": string${field.componentId === 'one-to-many' ? '[]' : ''};\n`;
            relationFields.push(field.fieldId);
          }
        }
        else {
          const fieldType = this.determineTypeScriptType(field);
          const isRequired = this.isFieldRequired(field);
          const propertyName = this.formatPropertyName(field.fieldId);
          typeDefinition += `  "${propertyName}"${isRequired ? '' : '?'}: ${fieldType};\n`;
        }
      }
    });

    // İlişkiler varsa _relations nesnesini ekle
    if (relationFields.length > 0) {
      typeDefinition += '\n  "_relations"?: {\n';
      relationFields.forEach((fieldId) => {
        const relation = relations[fieldId];
        typeDefinition += `    "${this.formatPropertyName(fieldId)}": ${relation.model}${relation.type === 'one-to-many' ? '[]' : ''};\n`;
      });
      typeDefinition += '  };\n';
    }

    typeDefinition += '}';
    return { typeDefinition, relations };
  }

  // Query tipi üretme
  private generateQueryType(
    interfaceName: string,
    queryInterfaceName: string,
    modelMetadata: ModelMetadata,
    relations: Record<string, { model: string, type: string }>,
  ): string {
    const hasRelations = Object.keys(relations).length > 0;
    const relationsType = hasRelations
      ? `{\n    ${Object.entries(relations)
        .map(([key]) => `"${this.formatPropertyName(key)}": ${relations[key].model}`)
        .join(';\n    ')}\n  }`
      : 'Record<string, never>';

    const locales = modelMetadata.localization ? '\'en\' | \'tr\'' : 'never';

    return `export type ${queryInterfaceName} = QueryConfig<
  ${interfaceName},
  ${locales},
  ${relationsType}
>;\n\n`;
  }

  // TypeScript tipini belirleme
  private determineTypeScriptType(field: FieldMetadata): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'string',
      media: 'string',
      relation: field.componentId === 'one-to-one' ? 'string' : 'string[]',
    };

    return typeMap[field.fieldType] || 'unknown';
  }

  // Property ismini formatla
  private formatPropertyName(name: string): string {
    // Tüm property'ler için orijinal ismi döndür, tırnak işaretleri generateTypeForModel'de ekleniyor
    return name;
  }

  // Arayüz adını formatlama
  private formatInterfaceName(metadata: ModelMetadata): string {
    const baseName = metadata.name || metadata.modelId;
    return `I${baseName.replace(/\s+/g, '').replace(/-./g, (x: string) => x[1].toUpperCase())}`;
  }

  // Alanın zorunlu olup olmadığını kontrol etme
  private isFieldRequired(field: FieldMetadata): boolean {
    return field.validations?.['required-field']?.value === true;
  }

  // Tip tanımlarını yazma
  private writeTypeDefinitions(typeDefinitions: string): void {
    try {
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
      }

      // Fazla boş satırları temizle
      const cleanedDefinitions = typeDefinitions
        .replace(/\n{3,}/g, '\n\n') // 2'den fazla boş satırı 2 satıra indir
        .replace(/\n+$/g, '\n'); // Dosya sonundaki boş satırları temizle

      const outputPath = path.join(this.config.outputDir, 'contentrain.d.ts');
      fs.writeFileSync(outputPath, cleanedDefinitions);

      console.log(`\n✨ Type definitions successfully generated: ${outputPath}`);
    }
    catch (error) {
      throw new Error('Failed to write type definitions', { cause: error });
    }
  }
}
