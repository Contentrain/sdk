import type { DBTranslationRecord } from '../types/database';
import { logger } from '../utils/logger';
import { BaseSQLiteLoader } from './base-sqlite';

export class TranslationLoader extends BaseSQLiteLoader {
  async hasTranslations(model: string): Promise<boolean> {
    try {
      const result = await this.connection.get<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type='table'
         AND name=?`,
        [`tbl_${model}_translations`],
      );
      return !!result;
    }
    catch (error) {
      logger.error('Check translations error:', { model, error });
      return false;
    }
  }

  async loadTranslations(
    model: string,
    ids: string[],
    locale?: string,
  ): Promise<Record<string, DBTranslationRecord>> {
    try {
      if (!ids.length)
        return {};

      const query = `
        SELECT t.*, m.created_at, m.updated_at, m.status
        FROM tbl_${model}_translations t
        JOIN tbl_${model} m ON t.id = m.id
        WHERE t.id IN (${ids.map(() => '?').join(',')})
        ${locale ? 'AND t.locale = ?' : ''}
      `;

      const params = [...ids];
      if (locale)
        params.push(locale);

      const translations = await this.connection.query<DBTranslationRecord>(query, params);

      // ID'ye göre grupla
      return translations.reduce((acc, trans) => {
        acc[trans.id] = trans;
        return acc;
      }, {} as Record<string, DBTranslationRecord>);
    }
    catch (error) {
      logger.error('Load translations error:', { model, ids, locale, error });
      throw error;
    }
  }

  async getLocales(model: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT locale
        FROM tbl_${model}_translations
      `;
      const results = await this.connection.query<{ locale: string }>(query);
      return results.map(r => r.locale);
    }
    catch (error) {
      logger.error('Get locales error:', { model, error });
      return [];
    }
  }
}
