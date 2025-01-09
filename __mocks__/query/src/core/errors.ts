export class ContentrainQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentrainQueryError';
  }
}

export class ModelNotFoundError extends ContentrainQueryError {
  constructor(modelId: string) {
    super(`Model not found: ${modelId}`);
    this.name = 'ModelNotFoundError';
  }
}

export class RelationLoadError extends ContentrainQueryError {
  constructor(relationKey: string, modelId: string, cause?: Error) {
    super(`Failed to load relation "${relationKey}" for model "${modelId}"${cause ? `: ${cause.message}` : ''}`);
    this.name = 'RelationLoadError';
  }
}

export class ContentrainValidationError extends ContentrainQueryError {
  constructor(field: string, reason: string) {
    super(`Validation error for field "${field}": ${reason}`);
    this.name = 'ContentrainValidationError';
  }
}

export class LocaleNotSupportedError extends ContentrainQueryError {
  constructor(modelId: string, locale: string) {
    super(`Locale "${locale}" is not supported for model "${modelId}"`);
    this.name = 'LocaleNotSupportedError';
  }
}

export class CacheError extends ContentrainQueryError {
  constructor(operation: string, cause?: Error) {
    super(`Cache operation failed: ${operation}${cause ? ` (${cause.message})` : ''}`);
    this.name = 'CacheError';
  }
}

export class InvalidConfigError extends ContentrainQueryError {
  constructor(field: string, value: any) {
    super(`Invalid configuration for "${field}": ${value}`);
    this.name = 'InvalidConfigError';
  }
}
