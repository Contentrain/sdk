import type { ModelField } from '../../types';

export class LocalizationManager {
  async validateLanguages(languages: string[]): Promise<void> {
    // Dil kodları benzersiz olmalı
    if (new Set(languages).size !== languages.length) {
      throw new Error('Language codes must be unique');
    }

    // Her dil kodu için validasyon
    for (const lang of languages) {
      // 2 karakterli dil kodu kontrolü
      if (!lang || typeof lang !== 'string' || lang.length !== 2) {
        throw new Error(`Language code "${lang}" must be a valid 2-letter code`);
      }

      // Küçük harf kontrolü
      if (lang !== lang.toLowerCase()) {
        throw new Error(`Language code "${lang}" must be lowercase`);
      }
    }
  }

  getLocalizableFields(fields: ModelField[]): ModelField[] {
    return fields.filter((field) => {
      // İlişki alanları lokalize edilemez
      if (field.fieldType === 'relation')
        return false;

      // Sistem alanları lokalize edilemez
      const systemFields = ['ID', 'status', 'order', 'created_at', 'updated_at', 'scheduled'];
      if (systemFields.includes(field.fieldId))
        return false;

      return true;
    });
  }
}
