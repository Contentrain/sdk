import type { ContentrainErrorDetails } from '../../../types';

export class ContentrainError extends Error {
    public readonly code: string;
    public readonly details?: unknown;
    public readonly timestamp: number;

    constructor({ code, message, details }: ContentrainErrorDetails) {
        super(message);
        this.name = 'ContentrainError';
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
    }

    public toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

export const ERROR_CODES = {
    MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
    INVALID_MODEL_ID: 'INVALID_MODEL_ID',
    MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
    MODELS_DIR_NOT_FOUND: 'MODELS_DIR_NOT_FOUND',
    METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
    CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
    INVALID_DATA_ERROR: 'INVALID_DATA_ERROR',
    FIELD_NOT_FOUND: 'FIELD_NOT_FOUND',
    INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
    QUERY_EXECUTION_ERROR: 'QUERY_EXECUTION_ERROR',
    RELATION_NOT_FOUND: 'RELATION_NOT_FOUND',
    INVALID_RELATION: 'INVALID_RELATION',
    PRERENDER_FAILED: 'PRERENDER_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    INVALID_URL_ERROR: 'INVALID_URL_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export const ERROR_MESSAGES = {
    // Model ile ilgili hatalar
    [ERROR_CODES.MODEL_NOT_FOUND]: 'Model not found',
    [ERROR_CODES.INVALID_MODEL_ID]: 'Invalid model ID',
    [ERROR_CODES.MODEL_LOAD_ERROR]: 'Model load error',
    [ERROR_CODES.MODELS_DIR_NOT_FOUND]: 'Models directory not found',
    [ERROR_CODES.METADATA_NOT_FOUND]: 'Metadata not found or invalid',

    // İçerik ile ilgili hatalar
    [ERROR_CODES.CONTENT_NOT_FOUND]: 'Content not found',
    [ERROR_CODES.INVALID_DATA_ERROR]: 'Invalid data',
    [ERROR_CODES.FIELD_NOT_FOUND]: 'Field not found',

    // Sorgu ile ilgili hatalar
    [ERROR_CODES.INVALID_QUERY_PARAMS]: 'Invalid query parameters',
    [ERROR_CODES.QUERY_EXECUTION_ERROR]: 'Query execution error',

    // İlişki ile ilgili hatalar
    [ERROR_CODES.RELATION_NOT_FOUND]: 'Relation not found',
    [ERROR_CODES.INVALID_RELATION]: 'Invalid relation',

    // Sistem ile ilgili hatalar
    [ERROR_CODES.PRERENDER_FAILED]: 'Prerender failed',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error',
    [ERROR_CODES.INVALID_URL_ERROR]: 'Invalid URL',
} as const;

export function createError(code: ErrorCode, details?: unknown): ContentrainError {
    return new ContentrainError({
        code,
        message: ERROR_MESSAGES[code],
        details,
    });
}
