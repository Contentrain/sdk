import type { ContentrainErrorDetails } from '../../../types';

export class ContentrainError extends Error {
    public code: string;
    public details?: unknown;

    constructor({ code, message, details }: ContentrainErrorDetails) {
        super(message);
        this.name = 'ContentrainError';
        this.code = code;
        this.details = details;
    }
}

export const ERROR_CODES = {
    STORAGE_NOT_READY: 'STORAGE_NOT_READY',
    MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
    MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
    INVALID_MODEL_ID: 'INVALID_MODEL_ID',
    INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
    MODELS_DIR_NOT_FOUND: 'MODELS_DIR_NOT_FOUND',
    METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
    FIELD_NOT_FOUND: 'FIELD_NOT_FOUND',
    CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
    INVALID_URL_ERROR: 'INVALID_URL_ERROR',
    INVALID_DATA_ERROR: 'INVALID_DATA_ERROR',
    INVALID_RELATION: 'INVALID_RELATION',
    RELATION_NOT_FOUND: 'RELATION_NOT_FOUND',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const ERROR_MESSAGES: Record<ErrorCode, string> = {
    STORAGE_NOT_READY: 'Contentrain storage is not ready yet',
    MODEL_NOT_FOUND: 'Requested model could not be found',
    MODEL_LOAD_ERROR: 'An error occurred while loading the model',
    INVALID_MODEL_ID: 'Model ID is invalid',
    INVALID_QUERY_PARAMS: 'Query parameters are invalid',
    MODELS_DIR_NOT_FOUND: 'Models directory could not be found',
    METADATA_NOT_FOUND: 'Model metadata could not be found',
    FIELD_NOT_FOUND: 'Requested field could not be found',
    CONTENT_NOT_FOUND: 'Requested content could not be found',
    INVALID_URL_ERROR: 'Provided URL is invalid or unreachable',
    INVALID_DATA_ERROR: 'Received data is invalid or malformed',
    INVALID_RELATION: 'Relation configuration is invalid',
    RELATION_NOT_FOUND: 'Related content could not be found',
    UNKNOWN_ERROR: 'An unexpected error occurred',
};

export function createError(code: ErrorCode, details?: unknown, message?: string): ContentrainError {
    const finalMessage = message || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
    return new ContentrainError({
        code,
        message: finalMessage,
        details,
    });
}
