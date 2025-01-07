/* eslint-disable node/prefer-global/process */
import fs from 'node:fs';
import path from 'node:path';

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertToTypeScriptType(field) {
  // Önce özel durumları kontrol et
  if (field.fieldId === 'status') {
    return '\'draft\' | \'changed\' | \'publish\'';
  }

  // ComponentId'ye göre spesifik tipler
  switch (field.componentId) {
    case 'checkbox':
    case 'switch':
      return 'boolean';
    case 'integer':
    case 'decimal':
    case 'rating':
    case 'percent':
      return 'number';
    case 'phone-number':
      return 'string';
    case 'date':
    case 'date-time':
      return 'string'; // ISO date string
    case 'json':
      return 'Record<string, any>'; // veya 'any'
    case 'media':
      return 'string'; // URL veya path
  }

  // Relation field'ları için
  if (field.fieldType === 'relation') {
    return field.componentId === 'one-to-one' ? 'string' : 'string[]';
  }

  // Genel fieldType'a göre
  switch (field.fieldType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'string[]'; // veya component'e göre array type
    case 'date':
      return 'string'; // ISO date string
    case 'media':
      return 'string';
    default:
      return 'unknown';
  }
}

function formatPropertyName(name) {
  return name.includes('-') ? `'${name}'` : name;
}

function isFieldRequired(field) {
  return field.validations?.['required-field']?.value === true;
}

function formatTypeName(str) {
  return str
    .split(/[-\s]+/)
    .map(part => capitalizeFirstLetter(part))
    .join('');
}

function formatFieldName(str) {
  return str.includes('-') ? `'${str}'` : str;
}

function checkDuplicateFields(modelFields, modelName) {
  const fieldIds = new Set();
  const duplicates = [];

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

function generateRelationMapping(modelFiles, modelsDir, _modelMap) {
  const relationMap = {};

  modelFiles.forEach((file) => {
    const modelId = path.basename(file, '.json');
    const modelPath = path.join(modelsDir, file);
    const modelFields = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));

    const relations = modelFields
      .filter(field => field.fieldType === 'relation')
      .map(field => ({
        fieldId: field.fieldId,
        relatedModel: field.options.reference.form.reference.value,
        type: field.componentId,
      }));

    // Her model için array oluştur (boş olsa bile)
    relationMap[modelId] = relations;
  });

  // İlişki tiplerini oluştur
  let typeDefinitions = '\n// Relation Mappings\n';

  // Her model için relation type'ları
  Object.entries(relationMap).forEach(([modelId, relations]) => {
    if (relations.length) {
      const relationFields = relations.map(r => `'${r.fieldId}'`).join(' | ');
      const typeName = formatTypeName(modelId);
      typeDefinitions += `export type ${typeName}RelationFields = ${relationFields}\n`;
    }
  });

  // Model -> Related Model mapping
  typeDefinitions += '\nexport type ModelRelations = {\n';
  Object.entries(relationMap).forEach(([modelId, relations]) => {
    typeDefinitions += `  '${modelId}': {\n`;
    // Relations varsa ekle, yoksa boş obje olarak bırak
    if (relations.length) {
      relations.forEach((relation) => {
        const fieldName = formatFieldName(relation.fieldId);
        typeDefinitions += `    ${fieldName}: {\n`;
        typeDefinitions += `      model: '${relation.relatedModel}'\n`;
        typeDefinitions += `      type: '${relation.type}'\n`;
        typeDefinitions += '    }\n';
      });
    }
    typeDefinitions += '  }\n';
  });
  typeDefinitions += '}\n';

  return typeDefinitions;
}

function findContentrainRoot() {
  const searchPaths = [];
  let currentDir = process.cwd();

  // Önce üst dizinlere bak
  while (currentDir !== path.parse(currentDir).root) {
    searchPaths.push(currentDir);
    currentDir = path.dirname(currentDir);
  }

  // Alt dizinleri recursive olarak tara
  function searchInDirectory(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && item.name === 'contentrain') {
        results.push(fullPath);
      }
      else if (item.isDirectory() && item.name !== 'node_modules') {
        results.push(...searchInDirectory(fullPath));
      }
    }
    return results;
  }

  // Tüm olası contentrain klasörlerini bul
  const possiblePaths = [
    ...searchPaths.map(dir => path.join(dir, 'contentrain')),
    ...searchInDirectory(process.cwd()),
  ];

  // Bulunan path'i projenin root'una göre relative yap
  function makeRelativePath(absolutePath) {
    const projectRoot = process.cwd();
    return path.relative(projectRoot, absolutePath);
  }

  // Bulunan ilk geçerli contentrain klasörünü ve locale bilgilerini döndür
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      const modelsPath = path.join(possiblePath, 'models');
      const metadataPath = path.join(modelsPath, 'metadata.json');

      if (fs.existsSync(modelsPath) && fs.existsSync(metadataPath)) {
        // Localization bilgilerini topla
        const localizationMap = {};
        const collections = fs.readdirSync(possiblePath)
          .filter(item => fs.statSync(path.join(possiblePath, item)).isDirectory())
          .filter(dir => dir !== 'models');

        collections.forEach((collection) => {
          const collectionPath = path.join(possiblePath, collection);
          const files = fs.readdirSync(collectionPath);
          const locales = files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'))
            .filter(locale => locale !== collection); // collection.json'u hariç tut

          if (locales.length > 0) {
            localizationMap[collection] = locales;
          }
        });

        return {
          root: makeRelativePath(possiblePath),
          models: makeRelativePath(modelsPath),
          metadata: makeRelativePath(metadataPath),
          localization: localizationMap,
        };
      }
    }
  }

  throw new Error('Valid Contentrain directory not found');
}

function generateMetadataTypes() {
  return `
// Metadata types
export interface ContentrainModelMetadata {
  name: string
  modelId: ModelId
  localization: boolean
  type: 'JSON' | 'MD' | 'MDX'
  createdBy: string
  isServerless: boolean
}

export type ContentrainMetadata = ContentrainModelMetadata[]
`;
}

function generateFieldTypes() {
  return `
// Field Types
export type ContentrainDataType = 'string' | 'number' | 'boolean' | 'array' | 'date' | 'media' | 'relation'

// Runtime value types
export type ContentrainValueType<T extends ContentrainDataType, C extends ContentrainComponentId> =
  T extends 'date' ? string :  // ISO date string
  T extends 'number' ? number :
  T extends 'boolean' ? boolean :
  T extends 'array' ? string[] :  // veya component'e göre array type
  T extends 'media' ? string :    // URL/path
  T extends 'relation' ? 
    C extends 'one-to-one' ? string :
    C extends 'one-to-many' ? string[] :
    never :
  string

export type ContentrainComponentId = 
  | 'single-line-text' | 'multi-line-text' | 'email' | 'url' | 'slug' | 'color' | 'json' | 'md-editor' | 'rich-text-editor'  // string
  | 'integer' | 'decimal' | 'rating' | 'percent' | 'phone-number'  // number
  | 'checkbox' | 'switch'  // boolean
  | 'date' | 'date-time'  // date
  | 'media'  // media
  | 'one-to-one' | 'one-to-many'  // relation

export interface ContentrainValidation {
  'required-field'?: {
    value: boolean
  }
  'unique-field'?: {
    value: boolean
  }
  'input-range-field'?: {
    value: boolean
    form: {
      'number-of-stars': {
        component: 'integer'
        value: string
        props: {
          min: number
          max: number
        }
      }
    }
  }
}

export interface ContentrainFieldOptions {
  'title-field'?: {
    value: boolean
  }
  'default-value'?: {
    value: boolean
    form?: {
      'default-value': {
        component: 'default-value'
        value: string
      }
    }
  }
  'number-of-stars'?: {
    value: boolean
    form: {
      'number-of-stars': {
        component: 'integer'
        value: string
        props: {
          min: number
          max: number
        }
      }
    }
  }
  'reference'?: {
    value: boolean
    form: {
      reference: {
        props: {
          options: any[]
        }
        component: 'single-select'
        value: string
      }
    }
  }
}

export interface ContentrainModelField {
  fieldId: string
  fieldType: ContentrainDataType
  componentId: ContentrainComponentId
  validations?: ContentrainValidation
  options?: ContentrainFieldOptions
}

export type ContentrainModel = ContentrainModelField[]
`;
}

function generateTypes() {
  const paths = findContentrainRoot();

  const pathConstants = `
// Generated paths and localization info
export const CONTENTRAIN_PATHS = {
  root: '${paths.root}',
  models: '${paths.models}',
  metadata: '${paths.metadata}'
} as const

export const CONTENTRAIN_LOCALES = ${JSON.stringify(paths.localization, null, 2)} as const

export type LocalizedModels = keyof typeof CONTENTRAIN_LOCALES
export type ModelLocales<T extends LocalizedModels> = typeof CONTENTRAIN_LOCALES[T][number]
`;

  const modelsDir = paths.models;
  const outputDir = path.join(process.cwd(), 'types');
  const metadataPath = paths.metadata;

  // Önce metadata'yı yükle ve modelMap'i oluştur
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const modelMap = metadata.reduce((acc, model) => {
    acc[model.modelId] = model.name;
    return acc;
  }, {});

  function generateTypeForModel(modelFields, relations) {
    let typeDefinition = '{\n';

    // Base fields - ortak alanları atlayarak
    modelFields.forEach((field) => {
      if (field.fieldType !== 'relation'
        && !['ID', 'createdAt', 'updatedAt', 'status'].includes(field.fieldId)) {
        const fieldType = convertToTypeScriptType(field);
        const isRequired = isFieldRequired(field);
        typeDefinition += `  ${formatPropertyName(field.fieldId)}${isRequired ? '' : '?'}: ${fieldType}\n`;
      }
    });

    // Relation fields
    if (relations) {
      Object.entries(relations).forEach(([fieldId, relation]) => {
        // İlişkili modelin interface ismini metadata'dan al
        const relatedModelName = `I${formatTypeName(modelMap[relation.model] || relation.model)}`;
        const isOneToOne = relation.type === 'one-to-one';
        const isRequired = modelFields.find(f => f.fieldId === fieldId)?.validations?.['required-field']?.value === true;

        // ID field
        typeDefinition += `  ${formatPropertyName(fieldId)}${isRequired ? '' : '?'}: ${isOneToOne ? 'string' : 'string[]'}\n`;

        // Data field (kebap-case)
        const dataField = `'${fieldId}-data'`;
        typeDefinition += `  ${dataField}?: ${isOneToOne ? relatedModelName : `${relatedModelName}[]`}\n`;
      });
    }

    typeDefinition += '}';
    return typeDefinition;
  }

  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.json') && file !== 'metadata.json');

  const modelIds = modelFiles.map(file => path.basename(file, '.json'));
  const modelIdType = `export type ModelId = ${modelIds.map(id => `'${id}'`).join(' | ')}\n\n`;

  // Type tanımlarını oluştur
  let typeDefinitions = `// Generated by scripts/generate-types.js
// Do not edit this file manually

${pathConstants}
${generateMetadataTypes()}
${generateFieldTypes()}

// Filter operator enum for runtime mapping
export enum FilterOperator {
  Equals = 'eq',
  NotEquals = 'neq',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'lt',
  LessThanOrEqual = 'lte',
  Contains = 'contains',
  In = 'in',
  NotIn = 'nin'
}

export type Status = 'draft' | 'changed' | 'publish'
export type SortDirection = 'asc' | 'desc'
export type RelationType = 'one-to-one' | 'one-to-many'

export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: Status
}

${modelIdType}`;

  console.log('\x1B[36m%s\x1B[0m', `Found ${modelFiles.length} models in contentrain/models`);
  console.log('\x1B[36m%s\x1B[0m', '-----------------------------------');

  let generatedCount = 0;
  let skippedCount = 0;
  const errors = [];
  const interfaceNames = new Map();

  modelFiles.forEach((file) => {
    const modelId = path.basename(file, '.json');
    const modelPath = path.join(modelsDir, file);
    const modelContent = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));

    try {
      const modelName = modelMap[modelId] || modelId;
      checkDuplicateFields(modelContent, modelName);

      const interfaceName = `I${formatTypeName(modelName)}`;

      // İlişkileri al
      const relations = modelContent
        .filter(field => field.fieldType === 'relation')
        .reduce((acc, field) => {
          acc[field.fieldId] = {
            model: field.options.reference.form.reference.value,
            type: field.componentId,
          };
          return acc;
        }, {});

      // Interface'i base type'dan extend et
      const typeDefinition = generateTypeForModel(modelContent, relations);
      typeDefinitions += `export interface ${interfaceName} extends BaseContentrainType ${typeDefinition}\n\n`;
      interfaceNames.set(modelId, interfaceName);

      generatedCount++;
      console.log(`✓ Generated interface for ${interfaceName}`);
    }
    catch (error) {
      const modelName = modelMap[modelId] || modelId;
      errors.push({ model: modelName, error: error.message });
      skippedCount++;
      console.error('\x1B[31m%s\x1B[0m', `✗ Error in ${modelName}: ${error.message}`);
    }
  });

  // Type mapping oluştur
  const typeMapEntries = modelIds
    .map(id => `  '${id}': ${interfaceNames.get(id)}`)
    .join('\n');

  typeDefinitions += `// Type mapping for model IDs to their respective interfaces
export type ContentrainTypeMap = {\n${typeMapEntries}\n}\n`;

  typeDefinitions += generateRelationMapping(modelFiles, modelsDir, modelMap);

  fs.writeFileSync(path.join(outputDir, 'contentrain.ts'), typeDefinitions);

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

  console.log('\n\x1B[32m%s\x1B[0m', `TypeScript types generated in ${path.join('packages', 'core', 'types', 'contentrain', 'index.ts')}`);
}

generateTypes();
