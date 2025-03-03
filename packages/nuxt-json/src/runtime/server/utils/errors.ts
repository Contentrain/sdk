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
    INVALID_MODEL_ID: 'INVALID_MODEL_ID',
    INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
    MODELS_DIR_NOT_FOUND: 'MODELS_DIR_NOT_FOUND',
    METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
    FIELD_NOT_FOUND: 'FIELD_NOT_FOUND',
    CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
