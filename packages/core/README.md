# @contentrain/core

Core functionality for Contentrain SDK.

## Installation

```bash
npm install @contentrain/core
```

## Usage

```typescript
import { ContentrainCore } from '@contentrain/core'

// Initialize with default configuration
const core = new ContentrainCore()

// Initialize with custom configuration
const customCore = new ContentrainCore({
  contentDir: 'custom/content/path',
  modelsPath: 'custom/models/path',
  locale: 'en'
})

// Get model metadata
const metadata = await core.getModelMetadata('posts')

// Get content
const posts = await core.getContent('posts')

// Get content by ID
const post = await core.getContentById('posts', '123')

// Get available collections
const collections = await core.getAvailableCollections()
```

## API Reference

### Constructor

```typescript
constructor(config?: ContentrainConfig, customFs?: ContentrainFileSystem)
```

Creates a new instance of ContentrainCore.

#### Parameters

- `config` (optional): Configuration object
  - `contentDir`: Path to content directory (default: 'contentrain')
  - `modelsPath`: Path to models directory (default: 'contentrain/models')
  - `assetsPath`: Path to assets directory (default: 'contentrain/assets')
  - `locale`: Locale for content (default: undefined)

- `customFs` (optional): Custom filesystem implementation

### Methods

#### getModelMetadata
```typescript
getModelMetadata(collection: string): Promise<ContentrainModelMetadata>
```

Gets metadata for a specific collection.

#### getContent
```typescript
getContent<T>(collection: string): Promise<T[]>
```

Gets all content items from a collection.

#### getContentById
```typescript
getContentById<T>(collection: string, id: string): Promise<T>
```

Gets a specific content item by ID.

#### getAvailableCollections
```typescript
getAvailableCollections(): Promise<string[]>
```

Gets a list of all available collections.

#### getLocale
```typescript
getLocale(): string | undefined
```

Gets the current locale setting.

## License

MIT
