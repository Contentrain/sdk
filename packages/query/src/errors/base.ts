import type { ErrorCode, ErrorContext, ErrorMetadata, ErrorOperation, ErrorSeverity } from './types';
import { loggers } from '../utils/logger';

const logger = loggers.default;

export class ContentrainError extends Error {
  public readonly code: ErrorCode;
  public readonly operation: ErrorOperation;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly timestamp: number;

  constructor(message: string, metadata: ErrorMetadata) {
    super(message);
    this.name = 'ContentrainError';
    this.code = metadata.code;
    this.operation = metadata.operation;
    this.severity = metadata.severity || 'error';
    this.context = metadata.context;
    this.timestamp = metadata.timestamp || Date.now();

    // Hatayı otomatik olarak logla
    logger.error(message, {
      name: this.name,
      code: this.code,
      operation: this.operation,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    });

    // Stack trace'i koru
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      operation: this.operation,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}
