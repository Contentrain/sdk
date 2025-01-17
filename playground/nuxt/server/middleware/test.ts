import type { BaseContentrainType, QueryConfig } from '@contentrain/query';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentrainSDK } from '@contentrain/query';

interface IWorkCategory extends BaseContentrainType {
  category: string
  order: number
}

interface ITabItem extends BaseContentrainType {
  title: string
  description: string
  order: number
  category: string[]
  _relations?: {
    category: IWorkCategory[]
  }
}
export interface ITabItemsQuery extends QueryConfig<
  ITabItem,
  'en' | 'tr',
  Record<string, never>
> {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../../../contentrain');

export default defineEventHandler(async () => {
  const sdk = new ContentrainSDK({
    contentDir,
    cache: true,
    ttl: 1000 * 60 * 60 * 24,
    maxCacheSize: 1000,
  });
  const res = await sdk.query<ITabItemsQuery>('tabitems')
    .where('status', 'eq', 'publish')
    .include('category')
    .get();
  console.log(res.data.map((item) => {
    return {
      title: item.ID,
      category: item._relations?.category.map(category => category.category),
    };
  }), 'res');
});
