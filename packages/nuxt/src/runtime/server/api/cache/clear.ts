import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, readBody } from 'h3';
import { getSDK } from '../../utils/sdk';

interface ClearCacheBody {
    model?: string
}

function handleCacheError(error: unknown): never {
    console.error('Cache error:', error);
    const err = error as { statusCode?: number, message?: string };
    throw createError({
        statusCode: err.statusCode || 500,
        message: err.message || 'Failed to clear cache',
        cause: error,
    });
}

export default defineEventHandler(async (event: H3Event) => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody<ClearCacheBody>(event);
        const sdk = getSDK(config);

        if (body.model) {
            await sdk.refreshCache(body.model);
        }
        else {
            await sdk.clearCache();
        }

        return { success: true };
    }
    catch (error: unknown) {
        handleCacheError(error);
    }
});
