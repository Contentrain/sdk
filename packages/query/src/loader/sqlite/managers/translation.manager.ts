import type { IDBTranslationRecord } from 'src/loader/types/sqlite';
import { TranslationError } from '../../../errors';
import { loggers } from '../../../utils/logger';
import { normalizeTableName, normalizeTranslationTableName } from '../../../utils/normalizer';
import { SQLiteContentManager } from './content.manager';

const logger = loggers.sqlite;

export class SQLiteTranslationManager extends SQLiteContentManager {
  constructor(
    databasePath: string,
  ) {
    super(databasePath);
  }

  async hasTranslations(model: string): Promise<boolean> {
    try {
      const tableName = normalizeTranslationTableName(model);
      const result = await this.connection.get<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type='table'
         AND name=?`,
        [tableName],
      );

      const exists = !!result;
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
      const query = `
        SELECT DISTINCT locale
        FROM ${tableName}
        ORDER BY locale ASC
      `;

      const results = await this.connection.query<{ locale: string }>(query);
      const locales = results.map(row => row.locale);
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
      return result.map(row => row.name);
    }
    catch (error: any) {
      logger.error('Failed to get main columns', {
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
      return columns;
    }
    catch (error: any) {
      logger.error('Failed to get translation columns', {
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

  async getAllColumns(model: string): Promise<string[]> {
    try {
      // Çeviri olmayan modeller için tüm kolonları al
      const mainTable = normalizeTableName(model);
      const result = await this.connection.query<{ name: string, type: string }>(
        `PRAGMA table_info(${mainTable})`,
      );
      return result.map(row => row.name);
    }
    catch (error: any) {
      logger.error('Failed to get all columns', {
        model,
        error: error?.message,
        code: error?.code,
      });

      throw new TranslationError(
        'Failed to get all columns',
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
