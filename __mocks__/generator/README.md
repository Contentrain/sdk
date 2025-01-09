# @contentrain/generator

`@contentrain/generator` is a type and schema generator tool for the Contentrain SDK. It generates TypeScript interfaces for your content models and can be used via CLI or programmatically.

## Installation

You can install the package via npm:

```bash
npm install @contentrain/generator
```

## Usage

### CLI Usage

The CLI tool allows you to generate type definitions for your models.

```bash
# Generate types for all models
contentrain-generate

# Generate types with custom configuration
contentrain-generate --models ./content --output ./types
```

### Programmatic Usage

You can use the `ContentrainGenerator` class to generate type definitions programmatically.

```typescript
import { ContentrainGenerator } from '@contentrain/generator';

// Initialize the generator
const generator = new ContentrainGenerator({
  modelsDir: './content',
  outputDir: './types'
});

// Generate types
await generator.generateTypes();
```

## Configuration

The `ContentrainGenerator` class supports the following configuration options:

```typescript
interface GeneratorConfig {
  // Path to the models directory (default: 'contentrain/models')
  modelsDir?: string;

  // Output path for generated types (default: 'contentrain/types')
  outputDir?: string;
}
```

Additionally, you can provide configuration via a `contentrain-config.json` file in the root directory. This file will be merged with the default configuration.

## Generated Types

This tool generates TypeScript interfaces for your content models. Example:

```typescript
// Base model type that all content models extend
export interface BaseContentrainModel {
  ID: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'changed' | 'publish';
}

// Generated from metadata.json
// {
//   "name": "BlogPost",
//   "modelId": "blog-posts",
//   ...
// }
interface IBlogPost extends BaseContentrainModel {
  title: string;
  content: string;
  author: string;
  tags: string[];
}

// Type mapping for model IDs to their respective interfaces
export type ContentrainTypeMap = {
  'blog-posts': IBlogPost;
  'authors': IAuthor;
}
```

## CLI Options

The CLI tool supports the following options:

```bash
Options:
  --models     Path to the models directory  [string] [default: "contentrain/models"]
  --output     Output path for types         [string] [default: "contentrain/types"]
  --help       Show help                     [boolean]
  --version    Show version number           [boolean]
```

## License

MIT
