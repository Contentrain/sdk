# @contentrain/query

Core package of the Contentrain SDK. Originally designed for JSON-based content management, now extended with SQLite integration for enhanced performance and scalability.

## Features

### Core Features (JSON-based)
- 📦 JSON file-based content management
- 🌍 Multi-language support with JSON files
- 💾 LRU caching with size-based eviction
- 🔍 Type-safe query operations
- 📝 Full TypeScript support

### SQLite Extension Features
- 🚀 High-performance SQLite database integration
- 🔄 Advanced relation management (One-to-One & One-to-Many)
- 🗃️ Efficient data indexing and querying
- 🔒 Thread-safe database operations
- 📊 Advanced filtering and sorting
- 🎯 Efficient pagination
- 🌐 Enhanced translation support

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

### JSON-based Usage (Original)

```typescript
import { ContentrainSDK } from '@contentrain/query';

// Initialize SDK with JSON files
const sdk = new ContentrainSDK({
  contentDir: './content',  // Directory containing JSON files
  defaultLocale: 'en'
});

// Query JSON content
const posts = await sdk.query('posts')
  .where('status', 'eq', 'publish')
  .get();

// Load with translations
const trPosts = await sdk.query('posts')
  .locale('tr')
  .get();
```

### SQLite Usage (Extended Feature)

```typescript
import { SQLiteQueryBuilder, BaseSQLiteLoader } from '@contentrain/query';

// Initialize SQLite loader
const loader = new BaseSQLiteLoader('path/to/database.db');

// Create SQLite query builder
const builder = new SQLiteQueryBuilder('posts', loader);

// Execute SQLite query
const result = await builder
  .where('status', 'eq', 'publish')
  .get();
```

## Data Management

### JSON-based Storage
- Content stored in JSON files
- Directory-based organization
- File-based translations
- Simple version control with Git

### SQLite Storage
- Relational database storage
- Optimized for querying and relations
- Efficient data indexing
- Better performance for large datasets

## Relations

### JSON Relations
```typescript
// JSON-based relation loading
const posts = await sdk.query('posts')
  .include('author')
  .get();
```

### SQLite Relations
```typescript
interface Post {
  id: string;
  title: string;
  author_id: string;
  _relations?: {
    author: Author;
    categories: Category[];
  }
}

// One-to-One in SQLite
const post = await builder
  .include('author')
  .where('id', 'eq', '123')
  .first();

// One-to-Many in SQLite
const postWithCategories = await builder
  .include('categories')
  .where('id', 'eq', '123')
  .first();
```

## Translations

### JSON Translations
- Separate JSON files for each locale
- File-based translation management
- Git-friendly structure

### SQLite Translations
```typescript
// Dedicated translation tables
const trPost = await builder
  .locale('tr')
  .where('id', 'eq', '123')
  .first();

// Fallback support
const result = await builder
  .locale('tr')
  .include(['author', 'categories'])
  .get();
```

## API Reference

### ContentrainSDK (JSON-based)
```typescript
class ContentrainSDK {
  constructor(options: ContentLoaderOptions)
  query<T extends QueryConfig>(model: string): ContentrainQueryBuilder<T>
  load<T>(model: string): Promise<LoaderResult<T>>
}
```

### SQLiteQueryBuilder (SQLite Extension)
```typescript
class SQLiteQueryBuilder<T extends DBRecord> {
  constructor(model: string, connection: BaseSQLiteLoader)

  // Query Methods
  where<K extends keyof T>(
    field: K,
    operator: Operator,
    value: T[K] | T[K][]
  ): this

  include(relations: string | string[]): this
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  locale(code: string): this

  // Execution Methods
  get(): Promise<QueryResult<T>>
  first(): Promise<T | null>
  count(): Promise<number>
}
```

## Best Practices

### JSON vs SQLite Usage

```typescript
// ✅ Use JSON when:
// - Small to medium dataset
// - Git-based version control is priority
// - Simple content structure
const posts = await sdk.query('posts').get();

// ✅ Use SQLite when:
// - Large dataset
// - Complex relations
// - Performance is critical
// - Advanced querying needed
const posts = await builder
  .where('status', 'eq', 'publish')
  .include(['author', 'categories'])
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

### Performance Considerations

#### JSON Storage
- Keep files organized in directories
- Use appropriate file naming
- Consider file size for large datasets

#### SQLite Storage
- Use appropriate indexes
- Optimize relation queries
- Implement pagination
- Use eager loading for relations

## Error Handling

```typescript
try {
  const result = await builder
    .where('status', 'eq', 'publish')
    .get();
} catch (error) {
  if (error instanceof SQLiteError) {
    // Handle SQLite specific errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof RelationError) {
    // Handle relation errors
  } else if (error instanceof FileSystemError) {
    // Handle JSON file system errors
  }
}
```

## Migration Guide

### From JSON to SQLite
1. Initialize SQLite database
2. Import JSON content
3. Set up relations
4. Update queries to use SQLiteQueryBuilder
5. Test and verify data integrity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
