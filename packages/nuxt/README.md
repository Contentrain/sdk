# @contentrain/nuxt

Official Nuxt module for Contentrain CMS. This module integrates Contentrain's content management system into your Nuxt application.

## Features

- 🚀 Automatic content synchronization
- 🔄 Real-time content updates
- 💾 Built-in caching
- 🎯 Auto-import composables
- 📦 TypeScript support

## Installation

```bash
# Using npm
npm install @contentrain/nuxt

# Using yarn
yarn add @contentrain/nuxt

# Using pnpm
pnpm add @contentrain/nuxt
```

## Configuration

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@contentrain/nuxt'],
  contentrain: {
    contentDir: './content',
    // optional configurations
    cache: true,
    ttl: 3600000, // 1 hour
  }
})
```

## Usage

### Composables

#### useContentrain

```vue
<script setup>
const { data: posts } = await useContentrain('posts')
  .where('status', 'published')
  .orderBy('createdAt', 'desc')
  .get();
</script>

<template>
  <div>
    <article v-for="post in posts" :key="post.ID">
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
    </article>
  </div>
</template>
```

#### useContentrainItem

```vue
<script setup>
const { data: post } = await useContentrainItem('posts', 'my-first-post');
</script>

<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </article>
</template>
```

### Page Routing

```vue
<script setup>
// pages/blog/[slug].vue
const route = useRoute();
const { data: post } = await useContentrainItem('posts', route.params.slug);

// 404 redirect
if (!post) {
  throw createError({ statusCode: 404, message: 'Post not found' });
}
</script>
```

### Related Data

```vue
<script setup>
const { data: post } = await useContentrainItem('posts', 'my-first-post')
  .include('author')
  .include('categories')
  .get();
</script>

<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <p>Author: {{ post._relations.author.name }}</p>
    <ul>
      <li v-for="category in post._relations.categories" :key="category.ID">
        {{ category.name }}
      </li>
    </ul>
  </article>
</template>
```

### SSR and ISR Support

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@contentrain/nuxt'],
  contentrain: {
    // For static site generation
    static: true,
    // For incremental static regeneration
    isr: {
      enabled: true,
      revalidate: 3600 // 1 hour
    }
  }
})
```

## API Reference

### Module Configuration

```typescript
interface ContentrainModuleOptions {
  contentDir: string;
  cache?: boolean;
  ttl?: number;
  static?: boolean;
  isr?: {
    enabled: boolean;
    revalidate: number;
  };
}
```

### Composables

#### useContentrain

```typescript
function useContentrain(collection: string) {
  return {
    where: (field: string, value: any) => this;
    orderBy: (field: string, direction: 'asc' | 'desc') => this;
    limit: (count: number) => this;
    offset: (count: number) => this;
    include: (relation: string | object) => this;
    get: () => Promise<{ data: any[] }>;
  }
}
```

#### useContentrainItem

```typescript
function useContentrainItem(
  collection: string,
  id: string
) {
  return {
    include: (relation: string | object) => this;
    get: () => Promise<{ data: any }>;
  }
}
```

## License

MIT
