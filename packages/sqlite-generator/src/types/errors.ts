/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  EMPTY_MODEL_ID = 'EMPTY_MODEL_ID',
  EMPTY_MODEL_NAME = 'EMPTY_MODEL_NAME',
  NO_FIELDS_DEFINED = 'NO_FIELDS_DEFINED',
  EMPTY_FIELD_ID = 'EMPTY_FIELD_ID',
  EMPTY_FIELD_TYPE = 'EMPTY_FIELD_TYPE',
  INVALID_MODEL = 'INVALID_MODEL',
  INVALID_FIELD = 'INVALID_FIELD',
  INVALID_CONTENT = 'INVALID_CONTENT',
  INVALID_CONTENT_FORMAT = 'INVALID_CONTENT_FORMAT',
  INVALID_TRANSLATION = 'INVALID_TRANSLATION',
  INVALID_RELATION = 'INVALID_RELATION',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  INVALID_RELATION_CONFIG = 'INVALID_RELATION_CONFIG',
  INVALID_RELATION_TYPE = 'INVALID_RELATION_TYPE',
  TARGET_MODEL_NOT_FOUND = 'TARGET_MODEL_NOT_FOUND',
  LOCALIZATION_MISMATCH = 'LOCALIZATION_MISMATCH',
  TITLE_FIELD_NOT_FOUND = 'TITLE_FIELD_NOT_FOUND',
  EMPTY_SQL_INPUT = 'EMPTY_SQL_INPUT',
  SQL_INPUT_TOO_LONG = 'SQL_INPUT_TOO_LONG',
  MODEL_LIST_EMPTY = 'MODEL_LIST_EMPTY',
  INVALID_CONTENT_ITEM = 'INVALID_CONTENT_ITEM',
  SOURCE_MODEL_NOT_FOUND = 'SOURCE_MODEL_NOT_FOUND',
  RELATION_TYPE_MISMATCH = 'RELATION_TYPE_MISMATCH',
  TRANSLATION_ID_MISMATCH = 'TRANSLATION_ID_MISMATCH',
  MISSING_REQUIRED_FIELD_IN_TRANSLATION = 'MISSING_REQUIRED_FIELD_IN_TRANSLATION',
  CONTENT_READ_ERROR = 'CONTENT_READ_ERROR',
  INVALID_JSON_FORMAT = 'INVALID_JSON_FORMAT',
  INVALID_LOCALIZATION_FLAG = 'INVALID_LOCALIZATION_FLAG',

  // Migration Errors
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  MODEL_MIGRATION_FAILED = 'MODEL_MIGRATION_FAILED',
  TRANSLATION_MIGRATION_FAILED = 'TRANSLATION_MIGRATION_FAILED',
  RELATION_MIGRATION_FAILED = 'RELATION_MIGRATION_FAILED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  SOURCE_RECORD_NOT_FOUND = 'SOURCE_RECORD_NOT_FOUND',
  TARGET_RECORD_NOT_FOUND = 'TARGET_RECORD_NOT_FOUND',
  INVALID_RELATION_FIELD = 'INVALID_RELATION_FIELD',
  ONE_TO_ONE_VIOLATION = 'ONE_TO_ONE_VIOLATION',

  // Schema Errors
  SCHEMA_CREATION_FAILED = 'SCHEMA_CREATION_FAILED',
  TABLE_CREATION_FAILED = 'TABLE_CREATION_FAILED',
  INDEX_CREATION_FAILED = 'INDEX_CREATION_FAILED',
  INVALID_SCHEMA_VERSION = 'INVALID_SCHEMA_VERSION',
  MODELS_DIR_NOT_FOUND = 'MODELS_DIR_NOT_FOUND',
  NO_MODELS_FOUND = 'NO_MODELS_FOUND',

  // Database Errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Security Errors
  SQL_INJECTION_DETECTED = 'SQL_INJECTION_DETECTED',
  PATH_TRAVERSAL_DETECTED = 'PATH_TRAVERSAL_DETECTED',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DANGEROUS_CHARACTER_DETECTED = 'DANGEROUS_CHARACTER_DETECTED',
  SQL_KEYWORD_IN_FIELD_NAME = 'SQL_KEYWORD_IN_FIELD_NAME',
  SQL_KEYWORD_IN_TABLE_NAME = 'SQL_KEYWORD_IN_TABLE_NAME',
  OBJECT_NOT_ALLOWED_AS_VALUE = 'OBJECT_NOT_ALLOWED_AS_VALUE',
  EMPTY_TABLE_NAME = 'EMPTY_TABLE_NAME',
  INVALID_TABLE_NAME_FORMAT = 'INVALID_TABLE_NAME_FORMAT',
  EMPTY_FIELD_NAME = 'EMPTY_FIELD_NAME',
  INVALID_FIELD_NAME_FORMAT = 'INVALID_FIELD_NAME_FORMAT',
  INVALID_MODEL_ID_FORMAT = 'INVALID_MODEL_ID_FORMAT',

  // File System Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',
  NO_LOCALE_FILES_FOUND = 'NO_LOCALE_FILES_FOUND',
  DEFAULT_LOCALE_NOT_FOUND = 'DEFAULT_LOCALE_NOT_FOUND',
  NO_VALID_CONTENT = 'NO_VALID_CONTENT',
  CONTENT_DIR_NOT_FOUND = 'CONTENT_DIR_NOT_FOUND',
  NO_CONTENT_FILES = 'NO_CONTENT_FILES',
  MODEL_CONTENT_FILE_NOT_FOUND = 'MODEL_CONTENT_FILE_NOT_FOUND',

  // Analysis Errors
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  MODEL_ANALYSIS_FAILED = 'MODEL_ANALYSIS_FAILED',
  CONTENT_ANALYSIS_FAILED = 'CONTENT_ANALYSIS_FAILED',
  RELATION_ANALYSIS_FAILED = 'RELATION_ANALYSIS_FAILED',
  INVALID_METADATA_FORMAT = 'INVALID_METADATA_FORMAT',
  MODEL_FIELDS_NOT_FOUND = 'MODEL_FIELDS_NOT_FOUND',
  INVALID_FIELDS_FORMAT = 'INVALID_FIELDS_FORMAT',
  MODEL_FIELDS_READ_ERROR = 'MODEL_FIELDS_READ_ERROR',
  METADATA_READ_ERROR = 'METADATA_READ_ERROR',
  INVALID_FIELDS_TYPE = 'INVALID_FIELDS_TYPE',
  MISSING_SYSTEM_FIELD = 'MISSING_SYSTEM_FIELD',
  INVALID_SYSTEM_FIELD = 'INVALID_SYSTEM_FIELD',
  MISSING_RELATION_TARGET = 'MISSING_RELATION_TARGET',
  MISSING_LOCALE_FILE = 'MISSING_LOCALE_FILE',

  // Query Errors
  INVALID_OPERATOR = 'INVALID_OPERATOR',
  INVALID_QUERY_PARAMETER = 'INVALID_QUERY_PARAMETER',
  INVALID_QUERY_FILTER = 'INVALID_QUERY_FILTER',
  INVALID_QUERY_SORT = 'INVALID_QUERY_SORT',
  INVALID_QUERY_INCLUDE = 'INVALID_QUERY_INCLUDE',
  INVALID_QUERY_PAGINATION = 'INVALID_QUERY_PAGINATION',
  INVALID_QUERY_OPTION = 'INVALID_QUERY_OPTION',
}

/**
 * Error details interface
 */
export interface ErrorDetails {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  cause?: Error
}

/**
 * Base error class for Contentrain errors
 */
export class ContentrainError extends Error {
  public readonly cause?: Error;

  constructor(
    public readonly details: ErrorDetails,
  ) {
    super(details.message);
    this.name = 'ContentrainError';
    this.cause = details.cause;
  }

  public toJSON(): ErrorDetails {
    return {
      code: this.details.code,
      message: this.message,
      details: this.details.details,
      cause: this.cause instanceof Error
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends ContentrainError {
  constructor(details: Omit<ErrorDetails, 'code'> & { code: typeof ErrorCode[keyof typeof ErrorCode] }) {
    super({
      ...details,
      code: ErrorCode[details.code],
    });
    this.name = 'ValidationError';
  }
}

/**
 * Error for migration failures
 */
export class MigrationError extends ContentrainError {
  constructor(details: Omit<ErrorDetails, 'code'> & { code: typeof ErrorCode[keyof typeof ErrorCode] }) {
    super({
      ...details,
      code: ErrorCode[details.code],
    });
    this.name = 'MigrationError';
  }
}

/**
 * Error for schema-related failures
 */
export class SchemaError extends ContentrainError {
  constructor(details: Omit<ErrorDetails, 'code'> & { code: typeof ErrorCode[keyof typeof ErrorCode] }) {
    super({
      ...details,
      code: ErrorCode[details.code],
    });
    this.name = 'SchemaError';
  }
}

/**
 * Error for security-related failures
 */
export class SecurityError extends ContentrainError {
  constructor(details: Omit<ErrorDetails, 'code'> & { code: typeof ErrorCode[keyof typeof ErrorCode] }) {
    super({
      ...details,
      code: ErrorCode[details.code],
    });
    this.name = 'SecurityError';
  }
}

/**
 * Error for database-related failures
 */
export class DatabaseError extends ContentrainError {
  constructor(details: Omit<ErrorDetails, 'code'> & { code: typeof ErrorCode[keyof typeof ErrorCode] }) {
    super({
      ...details,
      code: ErrorCode[details.code],
    });
    this.name = 'DatabaseError';
  }
}
