# @contentrain/types-generator

A tool for automatically generating TypeScript type definitions for Contentrain CMS. This package provides type safety for your Contentrain content models.

## Features

- 🚀 Automatic type generation
- 🔄 Automatic relation type mapping
- 📦 TypeScript support
- 🎯 CLI tool
- 💪 Full type safety

## Installation

```bash
# Using npm
npm install -D @contentrain/types-generator

# Using yarn
yarn add -D @contentrain/types-generator

# Using pnpm
pnpm add -D @contentrain/types-generator
```

## CLI Usage

```bash
# With default configuration
contentrain-generate

# With custom config file
contentrain-generate --config contentrain.config.js

# With custom directories
contentrain-generate --models ./models --output ./types
```

## Configuration

Create a `contentrain.config.js` file:

```javascript
module.exports = {
  // Directory containing model definitions
  modelsDir: './models',

  // Directory for generated types
  outputDir: './types',

  // Directory containing content files
  contentDir: './content',

  // Type generation options
  options: {
    // Generate relation types automatically
    generateRelationTypes: true,

    // Include base types
    includeBaseTypes: true,

    // Custom type mappings
    typeMapping: {
      'string[]': 'Array<string>',
      'number[]': 'Array<number>'
    }
  }
}
```

## Programmatic Usage

```typescript
import { generateTypes } from '@contentrain/types-generator';

// Asynchronous type generation
await generateTypes({
  modelsDir: './models',
  outputDir: './types',
  contentDir: './content',
  options: {
    generateRelationTypes: true,
    includeBaseTypes: true
  }
});
```

## Type Examples

### Basic Model Type

```typescript
// Generated type example
interface Post extends BaseContentrainType {
  title: string;
  content: string;
  author: string;
  tags: string[];
  publishDate: string;
  featured: boolean;
}
```

### Relation Types

```typescript
// Model with relations
interface Post extends BaseContentrainType {
  title: string;
  authorId: string;
  categoryIds: string[];
  _relations?: {
    author?: Author;        // One-to-one relation
    categories?: Category[]; // One-to-many relation
  };
}

interface Author extends BaseContentrainType {
  name: string;
  email: string;
  _relations?: {
    posts?: Post[]; // Reverse relation
  };
}
```

### Custom Type Mappings

```typescript
// Custom type mappings defined in contentrain.config.js
interface CustomTypes {
  tags: Array<string>;    // Instead of string[]
  scores: Array<number>;  // Instead of number[]
  meta: Record<string, any>; // Instead of object
}
```

## API Reference

### CLI Options

```bash
Options:
  --config    Path to config file
  --models    Path to models directory
  --output    Path to output directory
  --content   Path to content directory
  --watch     Watch for changes and update automatically
  --help      Show help information
  --version   Show version information
```

### Programmatic API

```typescript
interface TypeGeneratorOptions {
  modelsDir: string;
  outputDir: string;
  contentDir: string;
  options?: {
    generateRelationTypes?: boolean;
    includeBaseTypes?: boolean;
    typeMapping?: Record<string, string>;
    prettier?: boolean;
    declaration?: boolean;
  };
}

function generateTypes(options: TypeGeneratorOptions): Promise<void>;
```

## License

MIT
