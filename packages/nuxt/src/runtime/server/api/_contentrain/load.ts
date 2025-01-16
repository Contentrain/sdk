import type { H3Event } from 'h3';
import { defineEventHandler, readBody, useRuntimeConfig } from '#imports';
import { getSDK } from '../../utils/sdk';

interface LoadBody {
  model: string
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const body = await readBody<LoadBody>(event);
  const { model } = body;
  const sdk = getSDK(config);
  const result = await sdk.load(model);
  return result;
});
