import type { ILogger } from '../../types/common';
import type { IDBTranslationRecord } from '../../types/sqlite';
import { TranslationError } from '../../../errors';
import { normalizeTableName, normalizeTranslationTableName } from '../../../utils/normalizer';
import { SQLiteContentManager } from './content.manager';

export class SQLiteTranslationManager extends SQLiteContentManager {
  constructor(
    databasePath: string,
    logger: ILogger,
  ) {
    super(databasePath, logger);
    this.logger.debug('Initializing SQLiteTranslationManager', {
      databasePath,
      operation: 'initialize',
    });
  }

  async hasTranslations(model: string): Promise<boolean> {
    try {
      const tableName = normalizeTranslationTableName(model);
      this.logger.debug('Checking translations table', {
        model,
        tableName,
        operation: 'read',
      });

      const result = await this.connection.get<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type='table'
         AND name=?`,
        [tableName],
      );

      const exists = !!result;
      this.logger.debug('Translation table check completed', {
        model,
        tableName,
        exists,
        operation: 'read',
      });

      return exists;
    }
    catch (error: any) {
      throw new TranslationError(
        'Failed to check translations',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async loadTranslations(
    model: string,
    ids: string[],
    locale?: string,
  ): Promise<Record<string, IDBTranslationRecord>> {
    try {
      if (!ids.length) {
        return {};
      }

      const mainTable = normalizeTableName(model);
      const translationTable = normalizeTranslationTableName(model);

      this.logger.debug('Loading translations', {
        model,
        mainTable,
        translationTable,
        idsCount: ids.length,
        locale,
        operation: 'read',
      });

      const query = `
        SELECT t.*, m.created_at, m.updated_at, m.status
        FROM ${translationTable} t
        JOIN ${mainTable} m ON t.id = m.id
        WHERE t.id IN (${ids.map(() => '?').join(',')})
        ${locale ? 'AND t.locale = ?' : ''}
      `;

      const params = [...ids];
      if (locale) {
        params.push(locale);
      }

      const translations = await this.connection.query<IDBTranslationRecord>(query, params);

      const grouped = translations.reduce<Record<string, IDBTranslationRecord>>(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {},
      );

      this.logger.debug('Translations loaded and grouped', {
        originalCount: translations.length,
        groupedCount: Object.keys(grouped).length,
        model,
        locale,
        operation: 'read',
      });

      return grouped;
    }
    catch (error: any) {
      throw new TranslationError(
        'Failed to load translations',
        'read',
        {
          model,
          locale,
          idsCount: ids.length,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async getLocales(model: string): Promise<string[]> {
    try {
      const tableName = normalizeTranslationTableName(model);
      this.logger.debug('Getting available locales', {
        model,
        tableName,
        operation: 'read',
      });

      const query = `
        SELECT DISTINCT locale
        FROM ${tableName}
        ORDER BY locale ASC
      `;

      const results = await this.connection.query<{ locale: string }>(query);
      const locales = results.map(row => row.locale);

      this.logger.debug('Available locales retrieved', {
        model,
        localeCount: locales.length,
        locales,
        operation: 'read',
      });

      return locales;
    }
    catch (error: any) {
      throw new TranslationError(
        'Failed to get locales',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async getMainColumns(model: string): Promise<string[]> {
    try {
      const mainTable = normalizeTableName(model);
      const result = await this.connection.query<{ name: string }>(
        `PRAGMA table_info(${mainTable})`,
      );

      this.logger.debug('Main columns loaded', {
        model,
        mainTable,
        columns: result.map(row => row.name),
        operation: 'read',
      });

      return result.map(row => row.name);
    }
    catch (error: any) {
      this.logger.error('Failed to get main columns', {
        model,
        error: error?.message,
        code: error?.code,
      });

      throw new TranslationError(
        'Failed to get main columns',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }

  async getTranslationColumns(model: string): Promise<string[]> {
    try {
      const translationTable = normalizeTranslationTableName(model);
      const result = await this.connection.query<{ name: string }>(
        `PRAGMA table_info(${translationTable})`,
      );

      const columns = result
        .map(row => row.name)
        .filter(name => !['id', 'locale'].includes(name));

      this.logger.debug('Translation columns loaded', {
        model,
        translationTable,
        columns,
        totalColumns: result.length,
        operation: 'read',
      });

      return columns;
    }
    catch (error: any) {
      this.logger.error('Failed to get translation columns', {
        model,
        error: error?.message,
        code: error?.code,
      });

      throw new TranslationError(
        'Failed to get translation columns',
        'read',
        {
          model,
          originalError: error?.message,
          errorCode: error?.code,
        },
      );
    }
  }
}
