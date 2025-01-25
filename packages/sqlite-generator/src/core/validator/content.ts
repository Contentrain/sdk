import type { ContentItem, ContentrainStatus, ModelField } from '../../types';

export class ContentValidator {
  private readonly validStatus: ContentrainStatus[] = ['publish', 'draft', 'changed'];

  async validateContent(content: ContentItem[], fields: ModelField[]): Promise<ContentItem[]> {
    console.log('İçerik validasyonu başladı:', { contentCount: content.length });

    const validatedContent: ContentItem[] = [];

    for (const item of content) {
      // Status validation
      if (!this.validStatus.includes(item.status)) {
        throw new Error(`Status must be one of: ${this.validStatus.join(', ')}`);
      }

      const validatedItem = { ...item };

      // Field validations
      for (const field of fields) {
        const value = validatedItem[field.fieldId];

        // Required field validation
        if (field.validations['required-field']?.value && (value === undefined || value === null || value === '')) {
          throw new Error(`Field ${field.fieldId} is required`);
        }

        // Type validation
        if (value !== undefined && value !== null) {
          this.validateFieldType(field, value);

          // Normalize date fields
          if (field.fieldType === 'date') {
            validatedItem[field.fieldId] = new Date(value).toISOString();
          }
        }

        // Input range validation
        if (field.validations['input-range-field']?.value && value !== undefined && value !== null) {
          const { min, max } = field.validations['input-range-field'].value;
          if (value < min || value > max) {
            throw new Error(`Field ${field.fieldId} must be between ${min} and ${max}`);
          }
        }
      }

      validatedContent.push(validatedItem);
    }

    // Unique field validation
    for (const field of fields) {
      if (field.validations['unique-field']?.value) {
        const values = validatedContent.map(item => item[field.fieldId]);
        const uniqueValues = new Set(values);
        if (values.length !== uniqueValues.size) {
          throw new Error(`Field ${field.fieldId} must be unique`);
        }
      }
    }

    return validatedContent;
  }

  private validateFieldType(field: ModelField, value: any): void {
    switch (field.fieldType) {
      case 'string':
        if (typeof value !== 'string') {
          throw new TypeError(`Field ${field.fieldId} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new TypeError(`Field ${field.fieldId} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new TypeError(`Field ${field.fieldId} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new TypeError(`Field ${field.fieldId} must be an array`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && !Date.parse(value)) {
          throw new Error(`Field ${field.fieldId} must be a valid date`);
        }
        break;
      case 'media':
        if (typeof value !== 'string') {
          throw new TypeError(`Field ${field.fieldId} must be a string`);
        }
        break;
      case 'relation':
        if (field.componentId === 'one-to-one' && typeof value !== 'string') {
          throw new Error(`Field ${field.fieldId} must be a string ID`);
        }
        if (field.componentId === 'one-to-many') {
          if (!Array.isArray(value)) {
            throw new TypeError(`Field ${field.fieldId} must be an array of IDs`);
          }
          if (!value.every(id => typeof id === 'string')) {
            throw new Error(`Field ${field.fieldId} must contain only string IDs`);
          }
        }
        break;
    }
  }

  async validateLocalizedContent(content: ContentItem[], fields: ModelField[], lang: string): Promise<ContentItem[]> {
    if (!/^[a-z]{2}$/.test(lang)) {
      throw new Error('Language code must be a valid 2-letter code');
    }
    return this.validateContent(content, fields);
  }
}
