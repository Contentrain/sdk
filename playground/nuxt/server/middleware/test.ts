import type { IDBRecord, QueryConfig } from '@contentrain/query';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryFactory, SQLiteLoader } from '@contentrain/query';

interface IWorkCategory extends IDBRecord {
  category: string
  order: number
}

interface ISocialLink extends IDBRecord {
  icon: string
  link: string
}

interface ITabItem extends IDBRecord {
  title: string
  description: string
  order: number
  category: string[]
}
export interface ITabItemsQuery extends QueryConfig<
  ITabItem,
  'en' | 'tr',
  { category: IWorkCategory[] }
> {}

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineEventHandler(async () => {
  // Dizin yapısını oluştur
  const dbDir = join(__dirname, '../../../contentrain-db');

  const dbPath = join(dbDir, 'contentrain.db');
  // SQLite loader'ı oluştur
  const loader = new SQLiteLoader({
    databasePath: dbPath,
    cache: true,
    maxCacheSize: 100,
    defaultLocale: 'tr',
  });
  QueryFactory.setLoader(loader);

  const builder = QueryFactory.createSQLiteBuilder<ITabItem>('tabitems');
  const builder2 = QueryFactory.createSQLiteBuilder<ISocialLink>('sociallinks');
  // Loader'ı QueryFactory'ye set et
  const res = await builder
    .where('id', 'eq', '9ab7dcca9d1d')
    .include('category')
    .locale('tr')
    .get();
  const res2 = await builder2
    .where('icon', 'eq', 'ri-instagram-line')
    .orderBy('icon', 'asc')
    .get();

  console.log(res.data.length, 'res');
  console.log(res2.data.length, 'res2');
});
