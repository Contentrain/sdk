# Contentrain SDK

<p align="center">
  <img src="https://contentrain.io/images/1704967903123_logo.svg" alt="Contentrain SDK" width="200"/>
</p>

<p align="center">
  Official SDK for Contentrain - A Headless CMS that combines Git and Serverless Platforms
</p>

<p align="center">
  <a href="https://contentrain.io">Website</a> |
  <a href="https://docs.contentrain.io">Documentation</a> |
  <a href="https://discord.gg/contentrain">Discord</a>
</p>

## 🚀 Overview

Contentrain SDK provides a seamless integration layer between your applications and Contentrain CMS. It enables developers to build high-quality digital products without being tied to complex SDKs and APIs.

### Key Features

- 🔄 **Native Git Integration**: Built-in version control and content history tracking
- ⚡ **Serverless Collections**: Store and manage dynamic content on Serverless Platforms
- 🌐 **Multi-language Support**: Built-in internationalization capabilities
- 🔍 **Type-safe Queries**: Full TypeScript support with automatic type generation
- 💾 **Smart Caching**: Built-in LRU caching for optimal performance
- 🛠️ **Framework Agnostic**: Works with any JavaScript/TypeScript framework
- 📦 **Zero Dependencies**: Minimal core package with optional integrations

## 📦 Packages

This monorepo contains the following packages:

### [@contentrain/query](./packages/query)

Core query package for content management operations.

- **Features**:
  - High-performance content loading
  - Advanced query capabilities with type safety
  - Built-in LRU caching
  - Relation support
  - Multi-language content handling
  - Serverless collections support

[📚 Documentation](./packages/query/README.md) | [💻 Source](./packages/query) | [📦 npm](https://www.npmjs.com/package/@contentrain/query)

### [@contentrain/nuxt](./packages/nuxt)

Official Nuxt.js integration module for Contentrain.

- **Features**:
  - Auto-imported composables
  - SSR & SSG support
  - Built-in caching
  - Real-time content updates
  - TypeScript support
  - Nuxt 3 compatibility

[📚 Documentation](./packages/nuxt/README.md) | [💻 Source](./packages/nuxt) | [📦 npm](https://www.npmjs.com/package/@contentrain/nuxt)

### [@contentrain/types-generator](./packages/types-generator)

TypeScript types generator for content models.

- **Features**:
  - Automatic type generation
  - Watch mode support
  - Custom type transformers
  - Relation type mapping
  - CLI tool
  - Full type safety

[📚 Documentation](./packages/types-generator/README.md) | [💻 Source](./packages/types-generator) | [📦 npm](https://www.npmjs.com/package/@contentrain/types-generator)

## 🚀 Quick Start

```bash
# Install core package
npm install @contentrain/query

# Optional: Install framework integration
npm install @contentrain/nuxt # for Nuxt.js

# Optional: Install types generator
npm install -D @contentrain/types-generator
```

## 💡 Usage Examples

### Basic Query Operations

```typescript
import { ContentrainSDK } from '@contentrain/query';

const sdk = new ContentrainSDK({
  contentDir: './content'
});

// Simple query
const posts = await sdk.query('posts')
  .where('status', 'eq', 'published')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

// With relations
const post = await sdk.query('posts')
  .where('slug', 'eq', 'hello-world')
  .include('author')
  .include('categories')
  .first();

// Multi-language content
const trPosts = await sdk.query('posts')
  .locale('tr')
  .get();
```

### Nuxt.js Integration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@contentrain/nuxt'],
  contentrain: {
    contentDir: './content',
    defaultLocale: 'en'
  }
});

// In your components
const { query, load } = useContentrain();
const { data: posts } = await query('posts').get();
```

### Type Generation

```bash
# Generate types from your content models
npx contentrain-generate

# Watch mode
npx contentrain-generate --watch
```

## 🌟 Key Benefits

- **Developer Experience**: Built by developers, for developers
- **Content Team Collaboration**: Seamless workflow between developers and content creators
- **Serverless First**: Native support for serverless platforms
- **Type Safety**: Full TypeScript support with automatic type generation
- **Performance**: Built-in caching and optimization strategies
- **Flexibility**: Framework agnostic with official integrations

## 🔧 Advanced Features

- **Content Schema Builder**: Design your content models with JSON or Markdown
- **Asset Management**: Built-in support for various file types (SVG, PNG, PDF, JPEG, Video)
- **Webhooks**: Create automations with your favorite third-party tools
- **Version Control**: Track content history with native Git integration
- **SEO Optimization**: Full control over meta titles, descriptions, and OG images

## 🤝 Contributing

We love our contributors! Please read our [Contributing Guide](./CONTRIBUTING.md) to learn about our development process and how you can propose bugfixes and improvements.

## 📚 Documentation

- [Official Documentation](https://docs.contentrain.io)
- [API Reference](https://docs.contentrain.io/api)
- [Examples](https://docs.contentrain.io/examples)
- [Headless CMS Guide](https://contentrain.io/headless-cms-guide)

## 💬 Community

- [Discord](https://discord.gg/contentrain)
- [Twitter](https://twitter.com/contentrainio)
- [Blog](https://contentrain.io/blog)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🏢 Company

Contentrain Inc. is based in Beaverton, Oregon, U.S. Visit [contentrain.io](https://contentrain.io) to learn more about our company and products.
