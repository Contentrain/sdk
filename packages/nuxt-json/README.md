# @contentrain/nuxt-json

![Contentrain Logo](https://contentrain.io/logo.svg)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

> Powerful, type-safe, and high-performance JSON-based content management module for Nuxt.js.

## Features

- 🚀 **High Performance**: Optimized query engine and caching system
- 🔒 **Type Safety**: Full TypeScript integration and type support
- 🔄 **Relational Data**: Easily manage relationships between models
- 🌐 **Multilingual Support**: Complete support for localized content
- 📊 **Advanced Querying**: Filtering, sorting, and pagination capabilities
- 🧩 **Seamless Integration**: Effortless integration with Nuxt.js

## Installation

```bash
# npm
npm install @contentrain/nuxt-json

# yarn
yarn add @contentrain/nuxt-json

# pnpm
pnpm add @contentrain/nuxt-json
```

## Quick Start

### 1. Configure the Module

Configure the module in your `nuxt.config.ts` file:

```ts
export default defineNuxtConfig({
  modules: ['@contentrain/nuxt-json'],
  contentrain: {
    path: './content', // Path to your content directory
    defaultLocale: 'en', // Default language (optional)
    storage: {
      driver: 'fs', // 'memory' or 'fs'
      base: '.contentrain' // Cache directory (optional)
    }
  }
})
```

### 2. Query Content

Query content in your pages or components:

```vue
<script setup>
import type { WorkItem } from '~/types'

// Basic query
const workQuery = useContentrainQuery<WorkItem>('work-items')
const { data: workItems } = await useAsyncData(() => workQuery.get())

// Query with filtering
const featuredQuery = useContentrainQuery<WorkItem>('work-items')
  .where('featured', 'eq', true)
  .limit(3)
const { data: featuredWorks } = await useAsyncData(() => featuredQuery.get())

// Query with relational data
const projectQuery = useContentrainQuery<Project>('projects')
  .include('categories')
  .orderBy('createdAt', 'desc')
const { data: projects } = await useAsyncData(() => projectQuery.get())
</script>

<template>
  <div>
    <h1>My Work</h1>
    <div v-for="item in workItems.data" :key="item.ID">
      <h2>{{ item.title }}</h2>
      <p>{{ item.description }}</p>
    </div>
  </div>
</template>
```

## Detailed Usage

### Model Structure

Contentrain organizes your content into models. Each model has the following structure:

```
content/
├── models/
│   ├── metadata.json
│   ├── work-items.json
│   └── projects.json
├── work-items/
│   ├── work-items.json (or en.json, fr.json, etc. for multilingual)
└── projects/
    ├── projects.json (or en.json, fr.json, etc. for multilingual)
```

### Managing Models

To retrieve all models or a specific model:

```ts
// Get all models
const models = useContentrainModels()
const { data: allModels } = await useAsyncData(() => models.getAll())

// Get a specific model
const { data: workModel } = await useAsyncData(() => models.get('work-items'))
```

### Query API

The `useContentrainQuery` composable provides a powerful API for querying your content:

#### Filtering

```ts
// Single filter
query.where('status', 'eq', 'publish')

// Multiple filters
query
  .where('category', 'eq', 'web')
  .where('featured', 'eq', true)
  .where('views', 'gt', 100)
```

Supported operators:
- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `in`: In array
- `nin`: Not in array
- `contains`: Contains (string)
- `startsWith`: Starts with (string)
- `endsWith`: Ends with (string)

#### Sorting

```ts
// Single sort
query.orderBy('createdAt', 'desc')

// Multiple sorts
query
  .orderBy('priority', 'desc')
  .orderBy('title', 'asc')
```

#### Pagination

```ts
// Limit and offset
query
  .limit(10)
  .offset(20)

// Lazy loading
const query = useContentrainQuery<Post>('posts').limit(10)
const { data: posts } = await useAsyncData(() => query.get())

// Load more data
if (query.hasMore.value) {
  await query.loadMore()
}
```

#### Relations

```ts
// Single relation
query.include('author')

// Multiple relations
query
  .include('author')
  .include('categories')
```

#### Multilingual

```ts
// Query for a specific language
query.locale('en')
```

#### Getting the First Item

```ts
// Get the first item
const { data: firstItem } = await useAsyncData(() => query.first())
```

#### Counting

```ts
// Get the total count
const { data: countResult } = await useAsyncData(() => query.count())
const total = countResult.total
```

### Reactive Data

The `useContentrainQuery` composable provides reactive data:

```ts
const query = useContentrainQuery<Post>('posts')
await query.get()

// Reactive data
const posts = query.data
const total = query.total
const loading = query.loading
const error = query.error
const hasMore = query.hasMore
```

## Type Safety

For full TypeScript integration, define your content types:

```ts
// types/content.ts
import type { Content, LocalizedContent } from '@contentrain/nuxt-json'

export interface Post extends Content {
  title: string
  content: string
  slug: string
  featured: boolean
  category: string
  tags: string[]
}

export interface LocalizedPost extends LocalizedContent {
  title: string
  content: string
  slug: string
  featured: boolean
  category: string
  tags: string[]
}
```

## API Reference

### Composables

#### `useContentrainQuery<M>`

The main composable for querying content.

**Parameters:**
- `modelId`: Model ID

**Methods:**
- `where(field, operator, value)`: Adds a filter
- `orderBy(field, direction)`: Adds a sort
- `limit(limit)`: Limits the number of results
- `offset(offset)`: Sets the starting index
- `include(relation)`: Includes a relation
- `locale(locale)`: Sets the language
- `get()`: Executes the query and returns the results
- `first()`: Returns the first result
- `count()`: Returns the total count
- `loadMore()`: Loads more data
- `reset()`: Resets the query state

**Properties:**
- `data`: Reactive data array
- `total`: Reactive total count
- `loading`: Reactive loading state
- `error`: Reactive error state
- `hasMore`: Reactive has more data state

#### `useContentrainModels`

Composable for managing model data.

**Methods:**
- `get(modelId)`: Returns a specific model
- `getAll()`: Returns all models

**Properties:**
- `useModel()`: Reactive model data
- `useModels()`: Reactive model list
- `useLoading()`: Reactive loading state
- `useError()`: Reactive error state

### Return Types

#### `QueryResult<T>`

Standard return type for queries that return multiple results.

```ts
interface QueryResult<T> {
  data: T[]
  total: number
  pagination: {
    limit: number
    offset: number
    total: number
  }
}
```

#### `SingleQueryResult<T>`

Standard return type for queries that return a single result.

```ts
interface SingleQueryResult<T> {
  data: T
  total: number
  pagination: {
    limit: number
    offset: number
    total: number
  }
}
```

#### `ModelResult<T>`

Return type for model queries.

```ts
interface ModelResult<T> {
  data: T
  metadata: {
    modelId: string
    timestamp: number
  }
}
```

#### `ApiResponse<T>`

Standard format for API responses.

```ts
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
```

## Advanced Features

### Custom Error Handling

The module provides a `ContentrainError` class for custom error handling:

```ts
try {
  const result = await query.get()
  // Operation successful
} catch (error) {
  if (error instanceof ContentrainError) {
    console.error(`Error code: ${error.code}`)
    console.error(`Error message: ${error.message}`)
    console.error(`Details:`, error.details)
  }
}
```

### Cache Management

The module provides automatic cache management to improve performance. The default cache duration is 5 minutes.

## Examples

### Blog Page

```vue
<script setup>
import type { Post } from '~/types'

// Get blog posts with pagination
const currentPage = ref(1)
const pageSize = 10
const query = useContentrainQuery<Post>('posts')
  .where('status', 'eq', 'publish')
  .orderBy('createdAt', 'desc')
  .limit(pageSize)

const { data: postsData } = await useAsyncData(() => {
  query.offset((currentPage.value - 1) * pageSize)
  return query.get()
})

// Reload when page changes
watch(currentPage, async () => {
  query.offset((currentPage.value - 1) * pageSize)
  await query.get()
})

// Calculate total pages
const totalPages = computed(() => Math.ceil(postsData.value.total / pageSize))
</script>

<template>
  <div>
    <h1>Blog</h1>

    <div v-if="query.loading.value">Loading...</div>

    <div v-else-if="query.error.value">
      Error: {{ query.error.value.message }}
    </div>

    <div v-else>
      <article v-for="post in query.data.value" :key="post.ID">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <NuxtLink :to="`/blog/${post.slug}`">Read More</NuxtLink>
      </article>

      <!-- Pagination -->
      <div class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </button>

        <span>{{ currentPage }} / {{ totalPages }}</span>

        <button
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
```

### Multilingual Support

```vue
<script setup>
import type { LocalizedPost } from '~/types'

const { locale } = useI18n()

// Get content for current language
const query = useContentrainQuery<LocalizedPost>('posts')
  .locale(locale.value)
  .where('featured', 'eq', true)
  .limit(5)

const { data: featuredPosts } = await useAsyncData(() => query.get())

// Update content when language changes
watch(locale, async () => {
  query.locale(locale.value)
  await query.get()
})
</script>
```

### Relational Data

```vue
<script setup>
import type { Project, Category } from '~/types'

// Get categories and projects
const categoriesQuery = useContentrainQuery<Category>('categories')
const { data: categories } = await useAsyncData(() => categoriesQuery.get())

const projectsQuery = useContentrainQuery<Project>('projects')
  .include('categories')
  .orderBy('createdAt', 'desc')
const { data: projects } = await useAsyncData(() => projectsQuery.get())

// Filter projects by category
const selectedCategory = ref(null)

const filteredProjects = computed(() => {
  if (!selectedCategory.value) return projects.value.data

  return projects.value.data.filter(project => {
    const projectCategories = project._relations?.categories || []
    return Array.isArray(projectCategories)
      ? projectCategories.some(cat => cat.ID === selectedCategory.value)
      : projectCategories.ID === selectedCategory.value
  })
})
</script>

<template>
  <div>
    <h1>Projects</h1>

    <!-- Category filters -->
    <div class="filters">
      <button
        :class="{ active: !selectedCategory }"
        @click="selectedCategory = null"
      >
        All
      </button>

      <button
        v-for="category in categories.data"
        :key="category.ID"
        :class="{ active: selectedCategory === category.ID }"
        @click="selectedCategory = category.ID"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Projects -->
    <div class="projects">
      <div v-for="project in filteredProjects" :key="project.ID" class="project">
        <h2>{{ project.title }}</h2>
        <p>{{ project.description }}</p>

        <!-- Related categories -->
        <div class="categories">
          <span v-if="project._relations?.categories">
            <template v-if="Array.isArray(project._relations.categories)">
              <span v-for="cat in project._relations.categories" :key="cat.ID" class="category">
                {{ cat.name }}
              </span>
            </template>
            <template v-else>
              <span class="category">{{ project._relations.categories.name }}</span>
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
```

## Integration with Contentrain CMS

This module is designed to work seamlessly with [Contentrain](https://contentrain.io), a Git-based Headless CMS that focuses on developer and content editor experience. Contentrain provides:

- 🔄 **Git Architecture**: Advantages in scaling, maintenance, and low cost
- 🛠️ **Flexible Data Models**: No-code interfaces for creating content schemas
- 🚀 **Perfect for Static Sites**: The ideal tool for dynamic content on statically published sites
- 👥 **Team Collaboration**: Custom roles and permissions for content teams
- 🌐 **Multilingual Support**: Create and manage content in multiple languages

Learn more about Contentrain at [contentrain.io](https://contentrain.io)

## Troubleshooting

### Common Errors

#### `STORAGE_NOT_READY`

Content directory is not properly configured or accessible.

**Solution:** Ensure that your content directory is properly configured and accessible.

#### `MODEL_NOT_FOUND`

The specified model was not found.

**Solution:** Ensure that the model ID is correct and exists in your content directory.

#### `INVALID_QUERY_PARAMS`

Query parameters are invalid.

**Solution:** Ensure that your query parameters are in the correct format.

## Contributing

We welcome your contributions! Please read our [contribution guidelines](CONTRIBUTING.md).

## License

[MIT License](LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@contentrain/nuxt-json/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@contentrain/nuxt-json
[npm-downloads-src]: https://img.shields.io/npm/dm/@contentrain/nuxt-json.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@contentrain/nuxt-json
[license-src]: https://img.shields.io/npm/l/@contentrain/nuxt-json.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@contentrain/nuxt-json
