# Contentrain SDK

Type-safe content delivery SDK for Contentrain Git-based Headless CMS.

## What is Contentrain SDK?

Contentrain SDK is a TypeScript library that provides a type-safe way to interact with content managed by Contentrain Git-based Headless CMS. It automatically generates TypeScript types from your Contentrain models and provides a fluent query API to fetch and filter your content.

## Key Features

- 🔤 **Automatic Type Generation**: Generate TypeScript types from your Contentrain models
- 🔍 **Type-Safe Queries**: Query your content with full TypeScript support
- 🔗 **Relationship Support**: Handle related content with ease
- 🎯 **Framework Agnostic**: Works with any JavaScript framework
- 📦 **Zero Runtime Dependencies**: Lightweight and efficient

## Quick Start

```typescript
import { Contentrain } from '@contentrain/sdk'

// Initialize SDK
const contentrain = new Contentrain({
  rootDir: process.cwd()
})

// Generate types (during development/build)
await contentrain.generateTypes()

// Query your content with full type support
const posts = await contentrain
  .query<BlogPost>('blog-posts')
  .with('author')
  .where('status', 'publish')
  .orderBy('createdAt', 'desc')
  .execute()
```

## Installation

```bash
# Using npm
npm install @contentrain/sdk

# Using yarn
yarn add @contentrain/sdk

# Using pnpm
pnpm add @contentrain/sdk
```

## Type Generation

The SDK automatically generates TypeScript types from your Contentrain models:

```typescript
// Generated types example
interface IBlogPost extends BaseModel {
  title: string
  content: string
  author: string        // Reference to IAuthor
  tags: string[]
  'author-data'?: IAuthor  // Loaded relation data
}

interface IAuthor extends BaseModel {
  name: string
  bio: string
}
```

## Query API

```typescript
// Filter by field
const publishedPosts = await contentrain
  .query<IBlogPost>('blog-posts')
  .where('status', 'publish')
  .execute()

// Load relations
const postsWithAuthors = await contentrain
  .query<IBlogPost>('blog-posts')
  .with('author')
  .execute()

// Sort and limit
const recentPosts = await contentrain
  .query<IBlogPost>('blog-posts')
  .orderBy('createdAt', 'desc')
  .limit(5)
  .execute()
```

## Project Structure

```
contentrain-sdk/
├── packages/
│   └── sdk/              # Main SDK package
│       ├── src/
│       │   ├── core/     # Core functionality
│       │   ├── types/    # Base types
│       │   └── plugins/  # Framework integrations
│       └── package.json
│
└── playground/           # Development and testing
    ├── contentrain/      # Test content and models
    ├── src/             # Test implementation
    └── types/           # Generated types
```

## Development

```bash
# Install dependencies
pnpm install

# Build SDK
pnpm build

# Run playground
pnpm --filter playground dev
```

## Testing

The playground directory contains a full test environment with example Contentrain content and models. Use this to test and develop the SDK.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

- [Documentation](https://docs.contentrain.io)
- [Discord Community](https://discord.gg/contentrain)
- [GitHub Issues](https://github.com/contentrain/sdk/issues)
