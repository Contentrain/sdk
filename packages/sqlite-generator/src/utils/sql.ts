export const RESERVED_KEYWORDS: Set<string> = new Set([
  'ABORT',
  'ACTION',
  'ADD',
  'AFTER',
  'ALL',
  'ALTER',
  'ANALYZE',
  'AND',
  'AS',
  'ASC',
  'ATTACH',
  'AUTOINCREMENT',
  'BEFORE',
  'BEGIN',
  'BETWEEN',
  'BY',
  'CASCADE',
  'CASE',
  'CAST',
  'CHECK',
  'COLLATE',
  'COLUMN',
  'COMMIT',
  'CONFLICT',
  'CONSTRAINT',
  'CREATE',
  'CROSS',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP',
  'DATABASE',
  'DEFAULT',
  'DEFERRABLE',
  'DEFERRED',
  'DELETE',
  'DESC',
  'DETACH',
  'DISTINCT',
  'DROP',
  'EACH',
  'ELSE',
  'END',
  'ESCAPE',
  'EXCEPT',
  'EXCLUDE',
  'EXCLUSIVE',
  'EXISTS',
  'EXPLAIN',
  'FAIL',
  'FILTER',
  'FIRST',
  'FOLLOWING',
  'FOR',
  'FOREIGN',
  'FROM',
  'FULL',
  'GENERATED',
  'GLOB',
  'GROUP',
  'GROUPS',
  'HAVING',
  'IF',
  'IGNORE',
  'IMMEDIATE',
  'IN',
  'INDEX',
  'INDEXED',
  'INITIALLY',
  'INNER',
  'INSERT',
  'INSTEAD',
  'INTERSECT',
  'INTO',
  'IS',
  'ISNULL',
  'JOIN',
  'KEY',
  'LAST',
  'LEFT',
  'LIKE',
  'LIMIT',
  'MATCH',
  'MATERIALIZED',
  'NATURAL',
  'NO',
  'NOT',
  'NOTHING',
  'NOTNULL',
  'NULL',
  'NULLS',
  'OF',
  'OFFSET',
  'ON',
  'OR',
  'ORDER',
  'OTHERS',
  'OUTER',
  'OVER',
  'PARTITION',
  'PLAN',
  'PRAGMA',
  'PRECEDING',
  'PRIMARY',
  'QUERY',
  'RAISE',
  'RANGE',
  'RECURSIVE',
  'REFERENCES',
  'REGEXP',
  'REINDEX',
  'RELEASE',
  'RENAME',
  'REPLACE',
  'RESTRICT',
  'RETURNING',
  'RIGHT',
  'ROLLBACK',
  'ROW',
  'ROWS',
  'SAVEPOINT',
  'SELECT',
  'SET',
  'TABLE',
  'TEMP',
  'TEMPORARY',
  'THEN',
  'TIES',
  'TO',
  'TRANSACTION',
  'TRIGGER',
  'UNBOUNDED',
  'UNION',
  'UNIQUE',
  'UPDATE',
  'USING',
  'VACUUM',
  'VALUES',
  'VIEW',
  'VIRTUAL',
  'WHEN',
  'WHERE',
  'WINDOW',
  'WITH',
  'WITHOUT',
]);

/**
 * Normalizes a given name by checking it against SQLite reserved keywords.
 * @param name The name to be normalized (e.g., table or column name).
 * @param type Optional: Specify "table" or "field" to append context-specific suffixes.
 * @returns A normalized version of the name.
 */
export function normalizeName(name: string, type: 'table' | 'field' = 'field'): string {
  // Önce kebab-case ve camelCase'i snake_case'e çevir
  const snakeCase = name
    .replace(/-/g, '_')
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

  if (snakeCase === 'id') {
    return 'ID'; // ID her zaman büyük harf
  }

  // Reserved keyword kontrolü
  const upperName = snakeCase.toUpperCase();
  if (RESERVED_KEYWORDS.has(upperName)) {
    return type === 'table' ? `${snakeCase}_table` : `${snakeCase}_field`;
  }

  return snakeCase;
}

/**
 * Tablo adını normalize eder
 * @param modelId Model ID
 * @param suffix Opsiyonel suffix (örn: i18n, categoryId)
 * @returns Normalize edilmiş tablo adı
 */
export function normalizeTableName(modelId: string, suffix?: string): string {
  const baseTableName = normalizeName(modelId, 'table');

  if (!suffix) {
    return baseTableName;
  }

  // i18n özel durumu
  if (suffix === 'i18n') {
    return `${baseTableName}_${suffix}`;
  }

  // Diğer suffix'ler için alan adı normalizasyonu kullan
  const normalizedSuffix = normalizeName(suffix, 'field');
  return `${baseTableName}_${normalizedSuffix}`;
}
