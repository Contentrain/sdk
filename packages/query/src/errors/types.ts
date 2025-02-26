export type ErrorContext = Record<string, unknown>;

export type ErrorCode =
  | 'DATABASE_ERROR'
  | 'CACHE_ERROR'
  | 'LOADER_ERROR'
  | 'QUERY_ERROR'
  | 'VALIDATION_ERROR'
  | 'RELATION_ERROR'
  | 'TRANSLATION_ERROR'
  | 'CONNECTION_ERROR'
  | 'INITIALIZATION_ERROR'
  | 'FILE_SYSTEM_ERROR'
  | 'CONFIGURATION_ERROR';

export type ErrorOperation =
  | 'constructor'
  | 'query'
  | 'load'
  | 'resolve'
  | 'translate'
  | 'cache'
  | 'validate'
  | 'initialize'
  | 'connect'
  | 'disconnect'
  | 'read'
  | 'write'
  | 'delete'
  | 'update'
  | 'filter'
  | 'include'
  | 'sort'
  | 'paginate'
  | 'localize'
  | 'execute'
  | 'serialize';

export type ErrorSeverity =
  | 'fatal'
  | 'error'
  | 'warning';

export interface ErrorMetadata {
    code: ErrorCode
    operation: ErrorOperation
    severity?: ErrorSeverity
    context?: ErrorContext
    timestamp?: number
}
