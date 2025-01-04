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
// Generated from posts.model.json
interface Post {
  ID: string
  title: string
  content: string
  author: string
  tags: string[]
  createdAt: string
  updatedAt: string
  status: string
  scheduled: boolean
}

// Generated from authors.model.json
interface Author {
  ID: string
  name: string
  bio: string
  avatar: string
  createdAt: string
  updatedAt: string
  status: string
  scheduled: boolean
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
