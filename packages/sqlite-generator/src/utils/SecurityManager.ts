import { ErrorCode, SecurityError, ValidationError } from '../types/errors';

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
   */
  validatePath(path: string): void {
    if (path.includes('..')) {
      throw new SecurityError({
        code: ErrorCode.PATH_TRAVERSAL_DETECTED,
        message: 'Path traversal detected',
        details: { path },
      });
    }
  }

  /**
   * SQL enjeksiyon güvenliğini kontrol eder
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
      throw new ValidationError({
        code: ErrorCode.EMPTY_SQL_INPUT,
        message: 'Empty SQL input',
        details: { input },
      });
    }

    if (input.length > maxLength) {
      throw new ValidationError({
        code: ErrorCode.SQL_INPUT_TOO_LONG,
        message: 'SQL input too long',
        details: { input, maxLength },
      });
    }

    if (!allowKeywords) {
      const upperInput = input.toUpperCase();
      for (const keyword of this.SQL_KEYWORDS) {
        if (this.containsWord(upperInput, keyword)) {
          throw new SecurityError({
            code: ErrorCode.SQL_INJECTION_DETECTED,
            message: 'SQL injection detected',
            details: { input, keyword },
          });
        }
      }
    }

    if (!allowSpecialChars) {
      for (const char of this.DANGEROUS_CHARS) {
        if (input.includes(char)) {
          throw new SecurityError({
            code: ErrorCode.DANGEROUS_CHARACTER_DETECTED,
            message: 'Dangerous character detected',
            details: { input, character: char },
          });
        }
      }
    }
  }

  /**
   * Model ID güvenliğini kontrol eder
   */
  validateModelId(modelId: string): void {
    const modelIdPattern = /^[a-z][\w-]*$/i;
    if (!modelIdPattern.test(modelId)) {
      throw new SecurityError({
        code: ErrorCode.INVALID_MODEL_ID_FORMAT,
        message: 'Invalid model ID format',
        details: { modelId },
      });
    }
  }

  /**
   * Alan adı güvenliğini kontrol eder
   */
  validateFieldName(fieldName: string): void {
    // Alan adı boş olamaz
    if (!fieldName?.trim()) {
      throw new SecurityError({
        code: ErrorCode.EMPTY_FIELD_NAME,
        message: 'Empty field name',
        details: { fieldName },
      });
    }

    // Alan adı formatı kontrolü
    const fieldNamePattern = /^[a-z][\w-]*$/i;
    if (!fieldNamePattern.test(fieldName)) {
      throw new SecurityError({
        code: ErrorCode.INVALID_FIELD_NAME_FORMAT,
        message: 'Invalid field name format',
        details: { fieldName },
      });
    }

    // SQL anahtar kelime kontrolü
    const upperFieldName = fieldName.toUpperCase();
    for (const keyword of this.SQL_KEYWORDS) {
      if (this.containsWord(upperFieldName, keyword)) {
        throw new SecurityError({
          code: ErrorCode.SQL_KEYWORD_IN_FIELD_NAME,
          message: 'SQL keyword in field name',
          details: { fieldName, keyword },
        });
      }
    }
  }

  /**
   * Tablo adı doğrulaması yapar
   */
  validateTableName(tableName: string): void {
    // Tablo adı boş olamaz
    if (!tableName?.trim()) {
      throw new SecurityError({
        code: ErrorCode.EMPTY_TABLE_NAME,
        message: 'Empty table name',
        details: { tableName },
      });
    }

    // Tablo adı formatı kontrolü
    const tableNamePattern = /^[a-z][\w-]*$/i;
    if (!tableNamePattern.test(tableName)) {
      throw new SecurityError({
        code: ErrorCode.INVALID_TABLE_NAME_FORMAT,
        message: 'Invalid table name format',
        details: { tableName },
      });
    }

    // SQL anahtar kelime kontrolü
    const upperTableName = tableName.toUpperCase();
    for (const keyword of this.SQL_KEYWORDS) {
      if (this.containsWord(upperTableName, keyword)) {
        throw new SecurityError({
          code: ErrorCode.SQL_KEYWORD_IN_TABLE_NAME,
          message: 'SQL keyword in table name',
          details: { tableName, keyword },
        });
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
      throw new SecurityError({
        code: ErrorCode.OBJECT_NOT_ALLOWED_AS_VALUE,
        message: 'Object not allowed as value',
        details: { value: JSON.stringify(value) },
      });
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
