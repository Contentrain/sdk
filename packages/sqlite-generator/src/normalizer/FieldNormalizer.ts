export class FieldNormalizer {
  // Sistem alanları için özel dönüşüm kuralları
  private readonly SYSTEM_FIELDS = new Map([
    ['ID', 'id'],
    ['createdAt', 'created_at'],
    ['updatedAt', 'updated_at'],
    ['status', 'status'],
    ['locale', 'locale'],
  ]);

  // SQLite rezerve edilmiş kelimeler
  private readonly RESERVED_KEYWORDS = new Set([
    'abort',
    'action',
    'add',
    'after',
    'all',
    'alter',
    'analyze',
    'and',
    'as',
    'asc',
    'attach',
    'autoincrement',
    'before',
    'begin',
    'between',
    'by',
    'cascade',
    'case',
    'cast',
    'check',
    'collate',
    'column',
    'commit',
    'conflict',
    'constraint',
    'create',
    'cross',
    'current_date',
    'current_time',
    'current_timestamp',
    'database',
    'default',
    'deferrable',
    'deferred',
    'delete',
    'desc',
    'detach',
    'distinct',
    'drop',
    'each',
    'else',
    'end',
    'escape',
    'except',
    'exclusive',
    'exists',
    'explain',
    'fail',
    'for',
    'foreign',
    'from',
    'full',
    'glob',
    'group',
    'having',
    'if',
    'ignore',
    'immediate',
    'in',
    'index',
    'indexed',
    'initially',
    'inner',
    'insert',
    'instead',
    'intersect',
    'into',
    'is',
    'isnull',
    'join',
    'key',
    'left',
    'like',
    'limit',
    'match',
    'natural',
    'no',
    'not',
    'notnull',
    'null',
    'of',
    'offset',
    'on',
    'or',
    'order',
    'outer',
    'plan',
    'pragma',
    'primary',
    'query',
    'raise',
    'recursive',
    'references',
    'regexp',
    'reindex',
    'release',
    'rename',
    'replace',
    'restrict',
    'right',
    'rollback',
    'row',
    'savepoint',
    'select',
    'set',
    'table',
    'temp',
    'temporary',
    'then',
    'to',
    'transaction',
    'trigger',
    'union',
    'unique',
    'update',
    'using',
    'vacuum',
    'values',
    'view',
    'virtual',
    'when',
    'where',
    'with',
    'without',
  ]);

  /**
   * Normalizes field name for database
   * Example: myFieldName -> my_field_name
   */
  public normalize(fieldName: string): string {
    // Sistem alanı kontrolü
    if (this.SYSTEM_FIELDS.has(fieldName)) {
      return this.SYSTEM_FIELDS.get(fieldName)!;
    }

    const normalized = fieldName
      // camelCase -> snake_case
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      // PascalCase -> snake_case
      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
      // kebab-case -> snake_case
      .replace(/-/g, '_')
      .toLowerCase();

    // Rezerve edilmiş kelime kontrolü
    return this.RESERVED_KEYWORDS.has(normalized)
      ? `field_${normalized}`
      : normalized;
  }

  /**
   * Denormalizes field name from database
   * Example: my_field_name -> myFieldName
   */
  public denormalize(fieldName: string): string {
    // Sistem alanı kontrolü
    for (const [raw, normalized] of this.SYSTEM_FIELDS.entries()) {
      if (normalized === fieldName) {
        return raw;
      }
    }

    // Rezerve edilmiş kelime kontrolü
    const denormalized = fieldName.replace(/^field_/, '');

    return denormalized
      // snake_case -> camelCase
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Normalizes table name for database
   * Example: MyModel -> tbl_my_model
   */
  public normalizeTableName(modelId: string): string {
    return `tbl_${this.normalize(modelId)}`;
  }

  /**
   * Denormalizes table name from database
   * Example: tbl_my_model -> MyModel
   */
  public denormalizeTableName(tableName: string): string {
    return tableName
      .replace(/^tbl_/, '')
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Normalizes relation table names
   * @param parentModel Parent model ID
   * @param childModel Child model ID
   * @returns Normalized relation table name
   */
  normalizeRelationTableName(parentModel: string, childModel: string): string {
    return `${this.normalizeTableName(parentModel)}_${this.normalize(childModel)}`;
  }

  /**
   * Normalizes index names
   * @param tableName Table name
   * @param columns Column names
   * @param type Index type (idx or udx)
   * @returns Normalized index name
   */
  normalizeIndexName(tableName: string, columns: string[], type: 'idx' | 'udx' = 'idx'): string {
    const cols = columns.map(col => this.normalize(col)).join('_');
    return `${type}_${tableName}_${cols}`;
  }
}
