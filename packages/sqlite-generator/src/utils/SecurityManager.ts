import { SecurityError, ValidationError } from '../types/errors';

export class SecurityManager {
  // SQL anahtar kelimeleri ve tehlikeli karakterler
  private readonly SQL_KEYWORDS = new Set([
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'UNION',
    'JOIN',
    'WHERE',
    'FROM',
    'INTO',
    'VALUES',
    'SET',
    'EXEC',
    'EXECUTE',
    'DECLARE',
    'PROCEDURE',
    'FUNCTION',
    'TRIGGER',
    'INDEX',
    'CONSTRAINT',
    'REFERENCES',
    'GRANT',
    'REVOKE',
    'ROLLBACK',
    'COMMIT',
    'SAVEPOINT',
    'TRANSACTION',
  ]);

  private readonly DANGEROUS_CHARS = new Set([
    ';',
    '--',
    '/*',
    '*/',
    'xp_',
    'sp_',
    '@@',
    '@',
    'char(',
    'nchar(',
    'varchar(',
    'nvarchar(',
    'exec(',
    'execute(',
    '+',
    '||',
    '%',
  ]);

  /**
   * Dosya yolu güvenliğini kontrol eder
   * @param path Kontrol edilecek dosya yolu
   * @throws {SecurityError} Güvenlik ihlali durumunda
   */
  validatePath(path: string): void {
    if (path.includes('..')) {
      throw new SecurityError('PATH_TRAVERSAL_DETECTED', { path });
    }
  }

  /**
   * SQL enjeksiyon güvenliğini kontrol eder
   * @param input Kontrol edilecek SQL girdisi
   * @throws {SecurityError} Güvenlik ihlali durumunda
   */
  validateSQLInput(input: string, options: {
    allowKeywords?: boolean
    allowSpecialChars?: boolean
    maxLength?: number
  } = {}): void {
    const {
      allowKeywords = false,
      allowSpecialChars = false,
      maxLength = 1000,
    } = options;

    if (!input?.trim()) {
      throw new ValidationError('EMPTY_SQL_INPUT', { input });
    }

    if (input.length > maxLength) {
      throw new ValidationError('SQL_INPUT_TOO_LONG', { input, maxLength });
    }

    if (!allowKeywords) {
      const upperInput = input.toUpperCase();
      for (const keyword of this.SQL_KEYWORDS) {
        if (this.containsWord(upperInput, keyword)) {
          throw new SecurityError('SQL_INJECTION_DETECTED', { input, keyword });
        }
      }
    }

    if (!allowSpecialChars) {
      for (const char of this.DANGEROUS_CHARS) {
        if (input.includes(char)) {
          throw new SecurityError('DANGEROUS_CHARACTER_DETECTED', { input, character: char });
        }
      }
    }
  }

  /**
   * Model ID güvenliğini kontrol eder
   * @param modelId Kontrol edilecek model ID
   * @throws {SecurityError} Güvenlik ihlali durumunda
   */
  validateModelId(modelId: string): void {
    const modelIdPattern = /^[a-z][\w-]*$/i;
    if (!modelIdPattern.test(modelId)) {
      throw new SecurityError('INVALID_MODEL_ID_FORMAT', { modelId });
    }
  }

  /**
   * Alan adı güvenliğini kontrol eder
   * @param fieldName Kontrol edilecek alan adı
   * @throws {SecurityError} Güvenlik ihlali durumunda
   */
  validateFieldName(fieldName: string): void {
    // Alan adı boş olamaz
    if (!fieldName?.trim()) {
      throw new SecurityError('EMPTY_FIELD_NAME', { fieldName });
    }

    // Alan adı formatı kontrolü
    const fieldNamePattern = /^[a-z][\w-]*$/i;
    if (!fieldNamePattern.test(fieldName)) {
      throw new SecurityError('INVALID_FIELD_NAME_FORMAT', { fieldName });
    }

    // SQL anahtar kelime kontrolü
    const upperFieldName = fieldName.toUpperCase();
    for (const keyword of this.SQL_KEYWORDS) {
      if (this.containsWord(upperFieldName, keyword)) {
        throw new SecurityError('SQL_KEYWORD_IN_FIELD_NAME', { fieldName, keyword });
      }
    }
  }

  /**
   * Tablo adı doğrulaması yapar
   */
  validateTableName(tableName: string): void {
    // Tablo adı boş olamaz
    if (!tableName?.trim()) {
      throw new SecurityError('EMPTY_TABLE_NAME', { tableName });
    }

    // Tablo adı formatı kontrolü
    const tableNamePattern = /^[a-z][\w-]*$/i;
    if (!tableNamePattern.test(tableName)) {
      throw new SecurityError('INVALID_TABLE_NAME_FORMAT', { tableName });
    }

    // SQL anahtar kelime kontrolü
    const upperTableName = tableName.toUpperCase();
    for (const keyword of this.SQL_KEYWORDS) {
      if (this.containsWord(upperTableName, keyword)) {
        throw new SecurityError('SQL_KEYWORD_IN_TABLE_NAME', { tableName, keyword });
      }
    }
  }

  /**
   * SQL değeri doğrulaması yapar
   */
  validateSQLValue(value: unknown): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      this.validateSQLInput(value, { allowSpecialChars: true });
    }
    else if (typeof value === 'object') {
      throw new SecurityError('OBJECT_NOT_ALLOWED_AS_VALUE', { value: JSON.stringify(value) });
    }
  }

  /**
   * Bir metinde tam kelime olarak arama yapar
   */
  private containsWord(text: string, word: string): boolean {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  }
}
