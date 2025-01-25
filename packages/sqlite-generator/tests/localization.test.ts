import type { ModelField } from '../src/types';
import { describe, expect, it } from 'vitest';
import { LocalizationManager } from '../src/core/localization/manager';

describe('localization', () => {
  const manager = new LocalizationManager();

  describe('validateLanguages', () => {
    it('should validate correct language codes', async () => {
      const languages = ['en', 'tr', 'es'];
      await expect(manager.validateLanguages(languages)).resolves.not.toThrow();
    });

    it('should reject duplicate language codes', async () => {
      const languages = ['en', 'tr', 'en'];
      await expect(manager.validateLanguages(languages)).rejects.toThrow('Language codes must be unique');
    });

    it('should reject invalid language codes', async () => {
      const invalidCodes = [
        ['EN'], // büyük harf
        ['eng'], // 3 karakter
        ['e'], // 1 karakter
        [''], // boş string
        [null], // null
        [undefined], // undefined
      ];

      for (const codes of invalidCodes) {
        // @ts-expect-error - Bilinçli olarak hatalı tipler test ediliyor
        await expect(manager.validateLanguages(codes)).rejects.toThrow();
      }
    });
  });

  describe('getLocalizableFields', () => {
    it('should filter out non-localizable fields', () => {
      const fields: ModelField[] = [
        {
          name: 'Title',
          fieldId: 'title',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        },
        {
          name: 'Category',
          fieldId: 'categoryId',
          modelId: 'services',
          componentId: 'one-to-one',
          fieldType: 'relation',
          validations: {},
          options: {},
        },
        {
          name: 'Status',
          fieldId: 'status',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
          system: true,
        },
      ];

      const localizableFields = manager.getLocalizableFields(fields);

      // Sadece title alanı lokalize edilebilir olmalı
      expect(localizableFields).toHaveLength(1);
      expect(localizableFields[0].fieldId).toBe('title');
    });

    it('should exclude system fields', () => {
      const fields: ModelField[] = [
        {
          name: 'ID',
          fieldId: 'ID',
          modelId: 'services',
          componentId: 'single-line-text',
          fieldType: 'string',
          validations: {},
          options: {},
        },
        {
          name: 'Created At',
          fieldId: 'created_at',
          modelId: 'services',
          componentId: 'date',
          fieldType: 'date',
          validations: {},
          options: {},
        },
      ];

      const localizableFields = manager.getLocalizableFields(fields);
      expect(localizableFields).toHaveLength(0);
    });
  });
});
