# @contentrain/generator

Type and schema generator for Contentrain SDK.

## Installation

```bash
npm install @contentrain/generator
```

## Usage

### CLI Usage

```bash
# Generate types for all models
contentrain-generate

# Generate types with custom configuration
contentrain-generate --content ./content --output ./types
```

### Programmatic Usage

```typescript
import { ContentrainGenerator } from '@contentrain/generator'

// Initialize generator
const generator = new ContentrainGenerator({
  contentPath: './content',
  output: './types'
})

// Generate types
await generator.generate()
```

## Configuration

```typescript
interface GeneratorConfig {
  // Path to content directory (default: 'contentrain')
  contentPath?: string

  // Output path for generated types (default: 'contentrain/types')
  output?: string
}
```

## Generated Types

The generator creates TypeScript interfaces for your content models. For example:

```typescript
// Base model type that all content models extend
export interface BaseContentrainModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
  scheduled: boolean
}

// Generated from metadata.json
// {
//   "name": "BlogPost",
//   "modelId": "blog-posts",
//   ...
// }
interface IBlogPost extends BaseContentrainModel {
  title: string
  content: string
  author: string
  tags: string[]
}

// Generated from metadata.json
// {
//   "name": "Author",
//   "modelId": "authors",
//   ...
// }
interface IAuthor extends BaseContentrainModel {
  name: string
  bio: string
  avatar: string
}

// Type mapping for model IDs to their respective interfaces
export type ContentrainTypeMap = {
  'blog-posts': IBlogPost
  'authors': IAuthor
}
```

## CLI Options

```bash
Options:
  --content    Path to content directory     [string] [default: "contentrain"]
  --output     Output path for types         [string] [default: "contentrain/types"]
  --help       Show help                     [boolean]
  --version    Show version number           [boolean]
```

## License

MIT
