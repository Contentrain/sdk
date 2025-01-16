# @contentrain/nuxt

Official Nuxt module for Contentrain CMS. This module integrates Contentrain's content management system into your Nuxt application.

## Features

- 🚀 Auto-imported composables
- 🔄 Server API integration
- 💾 Built-in caching
- 📦 Full TypeScript support
- 🛡️ Error handling
- ⚡ SSR & SSG support
- 🌍 Multi-language support
- 🔍 Type-safe queries

## Installation

```bash
# Using npm
npm install @contentrain/nuxt

# Using yarn
yarn add @contentrain/nuxt

# Using pnpm
pnpm add @contentrain/nuxt
```

## Module Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@contentrain/nuxt'],
  contentrain: {
    // Required: Content directory path
    contentDir: './content',

    // Optional: Default locale (default: 'en')
    defaultLocale: 'en',

    // Optional: Cache configuration
    cache: true,
    ttl: 60 * 1000, // 1 minute
    maxCacheSize: 1000, // MB

    // Optional: Model-specific TTL
    modelTTL: {
      posts: 5 * 60 * 1000, // 5 minutes for posts
      products: 60 * 60 * 1000 // 1 hour for products
    }
  }
})
```

## Basic Usage

### Query Operations

```typescript
// Type-safe querying
interface Post {
  ID: string
  title: string
  content: string
  status: 'draft' | 'published'
  authorId: string
  categoryIds: string[]
}

interface Author {
  ID: string
  name: string
  email: string
}

interface Category {
  ID: string
  name: string
  slug: string
}

// In your component
const { query } = useContentrain();

// Basic query
const { data: posts } = await query<Post>('posts')
  .where('status', 'eq', 'published')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

// With relations
const { data: post } = await query<
  Post,
  'en' | 'tr',
  {
    author: Author
    categories: Category[]
  }
>('posts')
  .where('ID', 'eq', '123')
  .include('author')
  .include('categories')
  .get();

// With locale
const { data: trPosts } = await query<Post>('posts')
  .locale('tr')
  .get();
```

### Content Loading

```typescript
// Direct content loading
const { load } = useContentrain();

// Load all posts
const { content } = await load<Post>('posts');

// Access localized content
const enPosts = content.en;
const trPosts = content.tr;
```

### Error Handling

```typescript
// Component level
try {
  const { data } = await query<Post>('posts')
    .where('status', 'eq', 'published')
    .get();
} catch (error) {
  if (error.statusCode === 404) {
    // Handle not found
  } else if (error.statusCode === 400) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}

// Global error handler
export default defineNuxtConfig({
  contentrain: {
    errorHandler: (error) => {
      console.error('Contentrain error:', error);
    }
  }
})
```

### SSR & SSG Support

```typescript
// pages/blog/[slug].vue
<script setup lang="ts">
const route = useRoute();
const { query } = useContentrain();

// This will be executed on server-side
const { data: post } = await query<Post>('posts')
  .where('slug', 'eq', route.params.slug)
  .include('author')
  .first();

// Handle 404
if (!post) {
  throw createError({
    statusCode: 404,
    message: 'Post not found'
  });
}
</script>

<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <p>By: {{ post._relations.author.name }}</p>
    <div v-html="post.content" />
  </article>
</template>
```

## API Reference

### Module Options

```typescript
interface ModuleOptions {
  // Required
  contentDir: string;

  // Optional
  defaultLocale?: string;
  cache?: boolean;
  ttl?: number;
  maxCacheSize?: number;
  modelTTL?: Record<string, number>;
}
```

### Composables

#### useContentrain

```typescript
function useContentrain() {
  return {
    // Query builder
    query<
      M extends BaseContentrainType,
      L extends string = string,
      R extends Record<string, BaseContentrainType> = Record<string, never>
    >(model: string): QueryBuilder<M, L, R>;

    // Direct content loader
    load<T extends BaseContentrainType>(
      model: string
    ): Promise<LoaderResult<T>>;
  }
}
```

#### QueryBuilder

```typescript
interface QueryBuilder<M, L, R> {
  // Filter operations
  where(
    field: keyof M | keyof BaseContentrainType,
    operator: Operator,
    value: any
  ): this;

  // Available operators:
  // 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' |
  // 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'

  // Relations
  include(relation: keyof R): this;

  // Sorting
  orderBy(
    field: keyof M | keyof BaseContentrainType,
    direction?: 'asc' | 'desc'
  ): this;

  // Pagination
  limit(count: number): this;
  offset(count: number): this;

  // Localization
  locale(code: L): this;

  // Execution
  get(): Promise<QueryResult<M>>;
  first(): Promise<M | null>;
}

interface QueryResult<T> {
  data: T[];
  total: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

### Server API Routes

The module automatically registers these server routes:

- `POST /_contentrain/query`: Execute queries
- `POST /_contentrain/load`: Direct content loading

These routes are for internal use by the composables and shouldn't be called directly.

## TypeScript Support

The module includes built-in type declarations and augments Nuxt's type system:

```typescript
// Auto-imported composables
const { query, load } = useContentrain();

// Type-safe configuration
declare module '@nuxt/schema' {
  interface ConfigSchema {
    contentrain?: ModuleOptions;
  }
}

// Runtime config types
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    contentrain: {
      contentDir: string;
      defaultLocale: string;
      // ...other options
    };
  }
}
```

## License

MIT
