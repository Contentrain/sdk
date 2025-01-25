import type { Database } from 'better-sqlite3';
import type { ModelField } from '../../types';
import { SchemaManager } from '../database/schema';

export class RelationGenerator {
  private schema: SchemaManager;

  constructor(private db: Database) {
    this.schema = new SchemaManager(db);
  }

  getRelationFields(fields: ModelField[]): ModelField[] {
    return fields.filter(field => field.fieldType === 'relation');
  }

  async createRelations(modelId: string, relationFields: ModelField[]): Promise<void> {
    for (const field of relationFields) {
      const targetModelId = field.options?.reference?.form?.reference?.value;
      if (!targetModelId)
        continue;

      const sql = this.schema.createRelationTableSQL(modelId, field, targetModelId);
      this.db.exec(sql);
    }
  }
}
