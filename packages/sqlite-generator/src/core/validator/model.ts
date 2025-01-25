import type { ModelField, ModelMetadata } from '../../types';

export class ModelValidator {
  async validateMetadata(metadata: ModelMetadata[]): Promise<void> {
    // Check for duplicate model IDs
    const modelIds = metadata.map(model => model.modelId);
    const uniqueModelIds = new Set(modelIds);
    if (modelIds.length !== uniqueModelIds.size) {
      throw new Error('Model IDs must be unique');
    }

    // Validate each model
    for (const model of metadata) {
      // Model ID must be kebab-case
      if (!/^[a-z][a-z0-9-]*$/.test(model.modelId)) {
        throw new Error(`Model ID "${model.modelId}" must be in kebab-case`);
      }

      // Type must be JSON
      if (model.type !== 'JSON') {
        throw new Error('Model type must be \'JSON\'');
      }
    }
  }

  async validateFields(fields: ModelField[]): Promise<void> {
    // Check for duplicate field IDs within the same model
    const fieldsByModel = new Map<string, Set<string>>();

    for (const field of fields) {
      if (!fieldsByModel.has(field.modelId)) {
        fieldsByModel.set(field.modelId, new Set());
      }
      const modelFields = fieldsByModel.get(field.modelId)!;
      if (modelFields.has(field.fieldId)) {
        throw new Error(`Field IDs must be unique within model "${field.modelId}"`);
      }
      modelFields.add(field.fieldId);
      // TODO kontrol edilecek field id  kebap-case camelcase yada eger id ise ID gibi uppercase olabilir

      // Field ID must be camelCase
      /*       if (!/^[a-z][a-zA-Z0-9]*$/.test(field.fieldId)) {
        throw new Error(`Field ID "${field.fieldId}" must be in camelCase`);
      } */

      // Validate relation fields
      if (field.fieldType === 'relation') {
        if (!field.options.reference?.value || !field.options.reference.form?.reference?.value) {
          throw new Error(`Reference model is required for relation field "${field.fieldId}"`);
        }

        // Validate relation component type
        if (!['one-to-one', 'one-to-many'].includes(field.componentId)) {
          throw new Error(`Component "${field.componentId}" is not valid for relation type`);
        }
      }

      // Validate component and field type compatibility
      this.validateComponentFieldTypeCompatibility(field);
    }
  }

  private validateComponentFieldTypeCompatibility(field: ModelField): void {
    const stringComponents = ['single-line-text', 'multi-line-text', 'email', 'url', 'slug', 'color', 'md-editor', 'rich-text-editor', 'phone-number'];
    const numberComponents = ['integer', 'decimal', 'rating', 'percent'];
    const booleanComponents = ['checkbox', 'switch'];
    const dateComponents = ['date', 'date-time'];
    const mediaComponents = ['media'];
    const relationComponents = ['one-to-one', 'one-to-many'];
    const arrayComponents = ['json'];

    let isValid = false;
    switch (field.fieldType) {
      case 'string':
        isValid = stringComponents.includes(field.componentId);
        break;
      case 'number':
        isValid = numberComponents.includes(field.componentId);
        break;
      case 'boolean':
        isValid = booleanComponents.includes(field.componentId);
        break;
      case 'date':
        isValid = dateComponents.includes(field.componentId);
        break;
      case 'media':
        isValid = mediaComponents.includes(field.componentId);
        break;
      case 'relation':
        isValid = relationComponents.includes(field.componentId);
        break;
      case 'array':
        isValid = arrayComponents.includes(field.componentId);
        break;
    }

    if (!isValid) {
      throw new Error(`Component ${field.componentId} is not compatible with field type ${field.fieldType}`);
    }
  }
}
