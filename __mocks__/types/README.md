# @contentrain/types

Core type definitions for Contentrain SDK.

## Installation

```bash
npm install @contentrain/types
```

## Usage

```typescript
import type {
  ContentrainBaseModel,
  ContentrainConfig,
  ContentrainField,
  ContentrainModelMetadata
} from '@contentrain/types'

// Model metadata example
const metadata: ContentrainModelMetadata = {
  modelId: 'posts',
  fields: [
    {
      id: 'title',
      type: 'string',
      required: true,
      componentId: 'single-line-text'
    }
  ],
  localization: true
}

// Content model example
interface Post extends ContentrainBaseModel {
  title: string
  content: string
}
```

## Type Definitions

### ContentrainConfig
Configuration type for the SDK.

```typescript
interface ContentrainConfig {
  contentDir?: string
  modelsPath?: string
  assetsPath?: string
  locale?: string
}
```

### ContentrainModelMetadata
Type definition for model metadata.

```typescript
interface ContentrainModelMetadata {
  modelId: string
  fields: ContentrainField[]
  localization?: boolean
}
```

### ContentrainField
Type definition for model fields.

```typescript
interface ContentrainField {
  id: string
  type: string
  required: boolean
  componentId: string
  relation?: {
    model: string
    multiple: boolean
  }
}
```

### ContentrainBaseModel
Base type that all content models inherit from.

```typescript
interface ContentrainBaseModel {
  ID: string
  createdAt: string
  updatedAt: string
  status: string
  scheduled: boolean
}
```

## License

MIT
