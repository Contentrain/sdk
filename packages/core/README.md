# @contentrain/core

Core package of the Contentrain SDK. This package provides the fundamental functionality and types for interacting with Contentrain CMS.

## Features

- 🚀 High-performance content loading
- 💾 LRU caching support
- 🔍 Advanced query capabilities
- 📦 TypeScript support

## Installation

```bash
# Using npm
npm install @contentrain/core

# Using yarn
yarn add @contentrain/core

# Using pnpm
pnpm add @contentrain/core
```

## Usage

### Content Loading

```typescript
import { ContentLoader } from '@contentrain/core';

const loader = new ContentLoader({
  contentDir: './content'
});

// Load all blog posts
const posts = await loader.load('posts');

// Load a specific blog post
const post = await loader.load('posts', 'my-first-post');
```

### Query Operations

```typescript
import { ContentQuery } from '@contentrain/core';

const query = new ContentQuery(posts);

// Filtering
const publishedPosts = query
  .where('status', 'published')
  .where('category', 'tech')
  .get();

// Sorting
const recentPosts = query
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get();
```

### Caching

```typescript
import { CacheManager } from '@contentrain/core';

const cache = new CacheManager({
  maxSize: 100 // maximum cache size
});

// Add data to cache
cache.set('key', data);

// Retrieve data from cache
const cachedData = cache.get('key');
```

## API Reference

### ContentLoader

Manages content loading operations.

#### Methods

- `load(collection: string, id?: string)`: Loads content from the specified collection
- `loadAll(collection: string)`: Loads all content from a collection

### ContentQuery

Manages content querying operations.

#### Methods

- `where(field: string, value: any)`: Adds a filtering condition
- `orderBy(field: string, direction: 'asc' | 'desc')`: Adds sorting
- `limit(count: number)`: Limits the result count
- `get()`: Executes the query and returns results

### CacheManager

Manages caching operations.

#### Methods

- `set(key: string, value: any)`: Adds data to cache
- `get(key: string)`: Retrieves data from cache
- `has(key: string)`: Checks if key exists in cache
- `clear()`: Clears the cache

## License

MIT
