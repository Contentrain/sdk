import type { DBTranslationRecord } from '../types/database';
import { loggers } from '../utils/logger';
import { normalizeTableName, normalizeTranslationTableName } from '../utils/normalizer';
import { BaseSQLiteLoader } from './base-sqlite';

const logger = loggers.translation;

export class TranslationLoader extends BaseSQLiteLoader {
  async hasTranslations(model: string): Promise<boolean> {
    try {
      const tableName = normalizeTranslationTableName(model);
      const result = await this.connection.get<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type='table'
         AND name=?`,
        [tableName],
      );

      logger.debug('Translation table check:', {
        model,
        tableName,
        exists: !!result,
      });

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

      const mainTable = normalizeTableName(model);
      const translationTable = normalizeTranslationTableName(model);

      logger.debug('Loading translations:', {
        model,
        mainTable,
        translationTable,
        idsCount: ids.length,
        locale,
        firstId: ids[0],
      });

      const query = `
        SELECT t.*, m.created_at, m.updated_at, m.status
        FROM ${translationTable} t
        JOIN ${mainTable} m ON t.id = m.id
        WHERE t.id IN (${ids.map(() => '?').join(',')})
        ${locale ? 'AND t.locale = ?' : ''}
      `;

      const params = [...ids];
      if (locale)
        params.push(locale);

      logger.debug('Translation query:', {
        query,
        params,
        model,
        locale,
      });

      const translations = await this.connection.query<DBTranslationRecord>(query, params);
      logger.debug('Translations loaded:', {
        count: translations.length,
        firstTranslation: translations[0],
        model,
        locale,
      });

      // ID'ye göre grupla
      const groupedTranslations = translations.reduce((acc, trans) => {
        acc[trans.id] = trans;
        return acc;
      }, {} as Record<string, DBTranslationRecord>);

      logger.debug('Translations grouped:', {
        originalCount: translations.length,
        groupedCount: Object.keys(groupedTranslations).length,
        model,
        locale,
      });

      return groupedTranslations;
    }
    catch (error) {
      logger.error('Load translations error:', { model, ids, locale, error });
      throw error;
    }
  }

  async getLocales(model: string): Promise<string[]> {
    try {
      const translationTable = normalizeTranslationTableName(model);
      const query = `
        SELECT DISTINCT locale
        FROM ${translationTable}
      `;

      logger.debug('Getting locales:', {
        model,
        translationTable,
        query,
      });

      const results = await this.connection.query<{ locale: string }>(query);
      logger.debug('Locales loaded:', {
        model,
        locales: results.map(r => r.locale),
      });

      return results.map(r => r.locale);
    }
    catch (error) {
      logger.error('Get locales error:', { model, error });
      return [];
    }
  }

  async getMainColumns(model: string): Promise<string[]> {
    try {
      const mainTable = normalizeTableName(model);
      const result = await this.query<{ name: string }>(
        `PRAGMA table_info(${mainTable})`,
      );

      logger.debug('Main columns loaded:', {
        model,
        mainTable,
        columns: result.map(row => row.name),
      });

      return result.map(row => row.name);
    }
    catch (error) {
      logger.error('Error getting main columns:', { error, model });
      return ['id', 'created_at', 'updated_at', 'status'];
    }
  }

  async getTranslationColumns(model: string): Promise<string[]> {
    try {
      const translationTable = normalizeTranslationTableName(model);
      const result = await this.query<{ name: string }>(
        `PRAGMA table_info(${translationTable})`,
      );

      const columns = result
        .map(row => row.name)
        .filter(name => !['id', 'locale'].includes(name));

      logger.debug('Translation columns loaded:', {
        model,
        translationTable,
        columns,
        totalColumns: result.length,
      });

      return columns;
    }
    catch (error) {
      logger.error('Error getting translation columns:', { error, model });
      return [];
    }
  }
}
