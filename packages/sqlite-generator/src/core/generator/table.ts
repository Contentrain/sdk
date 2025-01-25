import type { Database } from 'better-sqlite3';
import type { ModelField } from '../../types';
import { SchemaManager } from '../database/schema';

export class TableGenerator {
  private schema: SchemaManager;

  constructor(private db: Database) {
    this.schema = new SchemaManager(db);
  }

  async createMainTable(modelId: string, fields: ModelField[]): Promise<void> {
    const sql = this.schema.createMainTableSQL(modelId, fields);
    this.db.exec(sql);
  }

  async createLocalizationTable(modelId: string, fields: ModelField[]): Promise<void> {
    const sql = this.schema.createLocalizationTableSQL(modelId, fields);
    this.db.exec(sql);
  }

  getLocalizableFields(fields: ModelField[]): ModelField[] {
    return fields.filter((field) => {
      // İlişki alanları lokalize edilemez
      if (field.fieldType === 'relation')
        return false;

      // Sistem alanları lokalize edilemez
      const systemFields = ['ID', 'status', 'created_at', 'updated_at', 'scheduled'];
      if (systemFields.includes(field.fieldId))
        return false;

      return true;
    });
  }
}
