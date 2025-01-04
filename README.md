# Contentrain SDK

Official TypeScript/JavaScript SDK for Contentrain. This SDK provides all the necessary tools to interact with Contentrain.

## Packages

This monorepo contains the following packages:

- [@contentrain/types](./packages/types/README.md) - Core type definitions
- [@contentrain/core](./packages/core/README.md) - Core Contentrain functionality
- [@contentrain/query](./packages/query/README.md) - Content querying tools
- [@contentrain/generator](./packages/generator/README.md) - Type and schema generator

## Installation

```bash
# npm
npm install @contentrain/core @contentrain/query

# yarn
yarn add @contentrain/core @contentrain/query

# pnpm
pnpm add @contentrain/core @contentrain/query
```

## Quick Start

```typescript
import { ContentrainCore } from '@contentrain/core';
import { ContentrainQuery } from '@contentrain/query';

// Create a core instance
const core = new ContentrainCore({
  contentPath: 'contentrain',
  locale: 'en' // Optional
});

// Create a query instance
const query = new ContentrainQuery(core);

// Get content
const posts = await query
  .from('posts')
  .where('status', 'publish')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Build packages
pnpm build
```

## License

MIT
