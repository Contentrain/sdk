# @contentrain/query

Query builder for Contentrain SDK.

## Installation

```bash
npm install @contentrain/query @contentrain/core
```

## Usage

```typescript
import { ContentrainCore } from '@contentrain/core'
import { ContentrainQuery } from '@contentrain/query'

// Initialize core and query
const core = new ContentrainCore()
const query = new ContentrainQuery(core)

// Basic query
const posts = await query
  .from('posts')
  .where('status', 'publish')
  .get()

// Complex query
const featuredPosts = await query
  .from('posts')
  .where('status', 'publish')
  .where('featured', true)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()

// Query with relations
const postsWithAuthor = await query
  .from('posts')
  .with('author')
  .where('status', 'publish')
  .get()

// Query with multiple conditions
const searchPosts = await query
  .from('posts')
  .where([
    ['status', 'publish'],
    ['category', 'technology'],
    ['title', 'startsWith', 'How to']
  ])
  .get()
```

## API Reference

### Constructor

```typescript
constructor(core: ContentrainCore)
```

Creates a new instance of ContentrainQuery.

### Methods

#### from
```typescript
from(collection: string): ContentrainQuery
```

Specifies the collection to query.

#### where
```typescript
where(field: string, value: any): ContentrainQuery
where(field: string, operator: FilterOperator, value: any): ContentrainQuery
where(conditions: [string, any][] | [string, FilterOperator, any][]): ContentrainQuery
```

Adds where conditions to the query.

#### orderBy
```typescript
orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): ContentrainQuery
```

Orders the results by a field.

#### limit
```typescript
limit(count: number): ContentrainQuery
```

Limits the number of results.

#### offset
```typescript
offset(count: number): ContentrainQuery
```

Skips the specified number of results.

#### with
```typescript
with(...relations: string[]): ContentrainQuery
```

Includes related content in the results.

#### get
```typescript
get<T>(): Promise<T[]>
```

Executes the query and returns the results.

### Filter Operators

- `equals` (default)
- `notEquals`
- `contains`
- `notContains`
- `startsWith`
- `endsWith`
- `exists`
- `notExists`
- `gt` (greater than)
- `gte` (greater than or equal)
- `lt` (less than)
- `lte` (less than or equal)

## License

MIT
