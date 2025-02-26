import type { ErrorContext, ErrorMetadata, ErrorOperation } from './types';
import { ContentrainError } from './base';

export class DatabaseError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'DATABASE_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'DatabaseError';
    }
}

export class ConnectionError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'CONNECTION_ERROR',
            operation,
            severity: 'fatal',
            context,
        };
        super(message, metadata);
        this.name = 'ConnectionError';
    }
}

export class QueryError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'QUERY_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'QueryError';
    }
}

export class LoaderError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'LOADER_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'LoaderError';
    }
}

export class CacheError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'CACHE_ERROR',
            operation,
            severity: 'warning',
            context,
        };
        super(message, metadata);
        this.name = 'CacheError';
    }
}

export class ValidationError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'VALIDATION_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'ValidationError';
    }
}

export class RelationError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'RELATION_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'RelationError';
    }
}

export class TranslationError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'TRANSLATION_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'TranslationError';
    }
}

export class FileSystemError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'FILE_SYSTEM_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'FileSystemError';
    }
}

export class ConfigurationError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'CONFIGURATION_ERROR',
            operation,
            severity: 'fatal',
            context,
        };
        super(message, metadata);
        this.name = 'ConfigurationError';
    }
}

export class QueryBuilderError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'QUERY_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'QueryBuilderError';
    }
}

export class QueryExecutorError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'QUERY_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'QueryExecutorError';
    }
}

export class QueryValidationError extends ContentrainError {
    constructor(
        message: string,
        operation: ErrorOperation,
        context?: ErrorContext,
    ) {
        const metadata: ErrorMetadata = {
            code: 'VALIDATION_ERROR',
            operation,
            severity: 'error',
            context,
        };
        super(message, metadata);
        this.name = 'QueryValidationError';
    }
}

export * from './base';
export * from './types';
