# @contentrain/query

Core package of the Contentrain SDK. This package provides the fundamental functionality and types for interacting with Contentrain CMS.

## Features

- 🚀 High-performance content loading
- 💾 LRU caching with size-based eviction
- 🔍 Advanced query capabilities with type-safe operators
- 📦 Full TypeScript support with generic types
- 🛡️ Comprehensive error handling
- ⚡ Memory-optimized performance
- 🌍 Multi-language support
- 🔄 Relation resolution

## Installation

```bash
# Using npm
npm install @contentrain/query

# Using yarn
yarn add @contentrain/query

# Using pnpm
pnpm add @contentrain/query
```

## Usage

### Content Loading

```typescript
import { ContentLoader } from '@contentrain/query';

const loader = new ContentLoader({
  contentDir: './content',
  defaultLocale: 'en',
  cache: true,
  ttl: 60 * 1000, // 1 minute
  maxCacheSize: 100 // 100 MB
});

// Load all blog posts
const posts = await loader.load('posts');

// Load with locale
const trPosts = await loader.load('posts').locale('tr');

// Error handling
try {
  const post = await loader.load('posts', 'non-existent-post');
} catch (error) {
  if (error instanceof ContentNotFoundError) {
    console.error('Post not found');
  } else if (error instanceof ContentValidationError) {
    console.error('Content validation failed');
  }
}
```

### Query Operations

```typescript
import { ContentrainSDK } from '@contentrain/query';

const sdk = new ContentrainSDK({
  contentDir: './content'
});

// Type-safe querying
interface Post {
  ID: string;
  title: string;
  status: 'draft' | 'published';
  tags: string[];
  createdAt: string;
}

const query = sdk.query<{
  fields: Post;
  locales: 'en' | 'tr';
  relations: {
    author: Author;
    categories: Category[];
  }
}>('posts');

// Available operators
const posts = await query
  .where('status', 'eq', 'published')
  .where('tags', 'contains', ['javascript'])
  .where('createdAt', 'gt', '2024-01-01')
  .where('category', 'in', ['tech', 'programming'])
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get();

// Relation handling
const postsWithRelations = await query
  .include(['author', 'categories'])
  .where('status', 'eq', 'published')
  .get();

// Locale support
const trPosts = await query
  .locale('tr')
  .where('status', 'eq', 'published')
  .get();
```

### Caching

```typescript
import { MemoryCache } from '@contentrain/query';

const cache = new MemoryCache({
  maxSize: 100, // Maximum cache size in MB
  defaultTTL: 60 * 1000, // Default TTL in ms
});

// Set with custom TTL
await cache.set('key', data, 5 * 60 * 1000); // 5 minutes TTL

// Get with type safety
const data = await cache.get<Post[]>('key');

// Cache stats
const stats = cache.getStats();
console.log(`
  Hits: ${stats.hits}
  Misses: ${stats.misses}
  Size: ${stats.size} bytes
  Last Cleanup: ${stats.lastCleanup}
`);
```

## API Reference

### ContentrainSDK

Main entry point for the SDK.

```typescript
class ContentrainSDK {
  constructor(options: ContentLoaderOptions)
  query<T extends QueryConfig>(model: string): ContentrainQueryBuilder<T>
  load<T>(model: string): Promise<LoaderResult<T>>
}
```

### Query Builder

```typescript
interface QueryBuilder<T> {
  // Filter operations
  where<K extends keyof T>(
    field: K,
    operator: QueryOperator,
    value: T[K] | T[K][]
  ): this

  // Available operators:
  // 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' |
  // 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'

  // Relation operations
  include(relations: string | string[]): this

  // Sorting
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): this

  // Pagination
  limit(count: number): this
  offset(count: number): this

  // Locale
  locale(code: string): this

  // Cache control
  cache(ttl?: number): this
  noCache(): this
  bypassCache(): this

  // Execution
  get(): Promise<QueryResult<T>>
  first(): Promise<T | null>
  count(): Promise<number>
}

interface QueryResult<T> {
  data: T[]
  total: number
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

### Cache Manager

```typescript
interface CacheManager {
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  get<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  getStats(): CacheStats
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  lastCleanup: number
}
```

### Content Loader

```typescript
interface ContentLoader {
  load<T>(model: string): Promise<LoaderResult<T>>
  resolveRelation<T, R>(
    model: string,
    relationField: keyof T,
    data: T[],
    locale?: string
  ): Promise<R[]>
  clearCache(): Promise<void>
  refreshCache(model: string): Promise<void>
  getCacheStats(): CacheStats
}
```

## Error Handling

The package provides specific error types for different scenarios:

```typescript
import {
  ContentrainError, // Base error class
  ContentNotFoundError,
  ContentValidationError,
  CacheError,
  RelationError
} from '@contentrain/query';

try {
  const posts = await loader.load('posts');
} catch (error) {
  if (error instanceof ContentNotFoundError) {
    // Handle not found
  } else if (error instanceof ContentValidationError) {
    // Handle validation errors
  } else if (error instanceof CacheError) {
    // Handle cache errors
  } else if (error instanceof RelationError) {
    // Handle relation errors
  }
}
```

## License

MIT
