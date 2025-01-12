import type { FieldMetadata, ModelMetadata } from '@contentrain/core';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Types
export interface GeneratorConfig {
  modelsDir: string
  outputDir: string
  contentDir: string
}

export class ContentrainTypesGenerator {
  private config: GeneratorConfig;

  constructor(config?: Partial<GeneratorConfig>) {
    const defaultConfig: GeneratorConfig = {
      modelsDir: path.join(process.cwd(), 'contentrain/models'),
      outputDir: path.join(process.cwd(), 'types'),
      contentDir: path.join(process.cwd(), 'contentrain'),
    };

    // Eğer config parametresi verilmişse, dosya aramadan direkt olarak kullan
    if (config) {
      const cliConfig: Partial<GeneratorConfig> = {};
      if (config.modelsDir)
        cliConfig.modelsDir = path.resolve(process.cwd(), config.modelsDir);
      if (config.outputDir)
        cliConfig.outputDir = path.resolve(process.cwd(), config.outputDir);
      if (config.contentDir)
        cliConfig.contentDir = path.resolve(process.cwd(), config.contentDir);

      this.config = {
        ...defaultConfig,
        ...cliConfig,
      };
    }
    else {
      // Config dosyasını ara
      const possibleConfigPaths = [
        path.join(process.cwd(), 'contentrain-config.json'),
        path.join(process.cwd(), '.contentrain/config.json'),
        path.join(process.cwd(), '.config/contentrain.json'),
      ];

      const fileConfig: Partial<GeneratorConfig> = {};
      for (const configPath of possibleConfigPaths) {
        if (fs.existsSync(configPath)) {
          try {
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            const parsedConfig = JSON.parse(fileContent) as Partial<GeneratorConfig>;

            console.log('Okunan yapılandırma:', parsedConfig);

            // Yolları mutlak yola çevir
            if (parsedConfig.modelsDir)
              fileConfig.modelsDir = path.resolve(process.cwd(), parsedConfig.modelsDir);
            if (parsedConfig.outputDir)
              fileConfig.outputDir = path.resolve(process.cwd(), parsedConfig.outputDir);
            if (parsedConfig.contentDir)
              fileConfig.contentDir = path.resolve(process.cwd(), parsedConfig.contentDir);

            console.log('Çözümlenmiş yapılandırma:', fileConfig);
            console.log(`✓ Yapılandırma dosyası okundu: ${configPath}`);
            break;
          }
          catch (error) {
            // Dosya varsa ama JSON geçersizse hata fırlat
            if (error instanceof SyntaxError) {
              console.warn(`! Yapılandırma dosyası okunamadı: ${configPath}`, error);
              throw new Error('Yapılandırma dosyası okunamadı');
            }
            // Diğer hatalarda sadece uyarı ver ve devam et
            console.warn(`! Yapılandırma dosyası okunamadı: ${configPath}`, error);
          }
        }
      }

      this.config = {
        ...defaultConfig,
        ...fileConfig,
      };
    }

    console.log('Birleştirilmiş yapılandırma:', this.config);

    if (!this.config.modelsDir || !this.config.contentDir || !this.config.outputDir) {
      throw new Error('Geçersiz yapılandırma: modelsDir, contentDir ve outputDir zorunludur');
    }
  }

  // Config'i döndür
  getConfig(): GeneratorConfig {
    return this.config;
  }

  // Ana tip üretme metodu
  generate(): void {
    try {
      const modelFiles = this.getModelFiles();
      const metadata = this.getMetadata();

      let typeDefinitions = this.initializeTypeDefinitions();
      const { baseTypes, queryTypes } = this.processModelFiles(modelFiles, metadata);

      typeDefinitions += baseTypes;
      typeDefinitions += '\n// Query Config Tipleri\n';
      typeDefinitions += queryTypes;

      this.writeTypeDefinitions(typeDefinitions);
    }
    catch (error) {
      throw new Error('Tip üretimi başarısız oldu', { cause: error });
    }
  }

  // Model dosyalarını okuma
  private getModelFiles(): string[] {
    try {
      return fs.readdirSync(this.config.modelsDir)
        .filter(file => file.endsWith('.json') && file !== 'metadata.json');
    }
    catch (error) {
      throw new Error(`Model dizini okunamadı: ${this.config.modelsDir}`, { cause: error });
    }
  }

  // Metadata okuma
  private getMetadata(): ModelMetadata[] {
    try {
      const metadataPath = path.join(this.config.modelsDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata dosyası bulunamadı: ${metadataPath}`);
      }
      const content = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(content);
    }
    catch (error) {
      throw new Error('Metadata okunamadı', { cause: error });
    }
  }

  // Temel tip tanımlarını oluşturma
  private initializeTypeDefinitions(): string {
    return `// @contentrain/types-generator tarafından otomatik oluşturuldu
// Bu dosyayı manuel olarak düzenlemeyin

import type { BaseContentrainType, QueryConfig } from '@contentrain/core';\n\n`;
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
          throw new Error(`Model metadata bulunamadı: ${modelId}`);
        }

        // Base Type Üretimi
        const interfaceName = this.formatInterfaceName(modelMetadata);
        const { typeDefinition, relations } = this.generateTypeForModel(modelContent, metadata);
        baseTypes += `export interface ${interfaceName} extends BaseContentrainType ${typeDefinition}\n\n`;

        // Query Type Üretimi
        const queryInterfaceName = `${interfaceName}Query`;
        queryTypes += this.generateQueryType(interfaceName, queryInterfaceName, modelMetadata, relations);
      }
      catch (error) {
        console.error(`✗ ${file} dosyasında hata: ${error instanceof Error ? error.message : String(error)}`);
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

            // İlişki alanını ekle
            typeDefinition += `  ${this.formatPropertyName(field.fieldId)}: string${field.componentId === 'one-to-many' ? '[]' : ''}\n`;

            // _relations nesnesini ekle
            if (Object.keys(relations).length === 1) {
              typeDefinition += '  _relations?: {\n';
            }
            typeDefinition += `    ${field.fieldId}: ${relatedInterfaceName}${field.componentId === 'one-to-many' ? '[]' : ''}\n`;
            if (Object.keys(relations).length === Object.keys(modelFields.filter(f => f.fieldType === 'relation')).length) {
              typeDefinition += '  }\n';
            }
          }
        }
        else {
          const fieldType = this.determineTypeScriptType(field);
          const isRequired = this.isFieldRequired(field);
          const propertyName = this.formatPropertyName(field.fieldId);
          typeDefinition += `  ${propertyName}${isRequired ? '' : '?'}: ${fieldType}\n`;
        }
      }
    });

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
        .map(([key]) => `${key}: ${relations[key].model}`)
        .join(',\n    ')}\n  }`
      : 'Record<string, never>';

    const locales = modelMetadata.localization ? '\'en\' | \'tr\'' : 'never';

    return `export interface ${queryInterfaceName} extends QueryConfig<
  ${interfaceName},
  ${locales},
  ${relationsType}
> {}\n\n`;
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

  // Alan adını formatlama
  private formatPropertyName(name: string): string {
    // Tire içeren property'leri tırnak içinde yaz
    return name.includes('-') ? `'${name}'` : name;
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

      console.log(`\n✨ Tip tanımları başarıyla oluşturuldu: ${outputPath}`);
    }
    catch (error) {
      throw new Error('Tip tanımları yazılamadı', { cause: error });
    }
  }
}
