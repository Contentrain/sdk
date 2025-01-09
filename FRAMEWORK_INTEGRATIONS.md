# Contentrain SDK Framework Entegrasyonları

## 1. Genel Bakış

Contentrain SDK'nın farklı framework'lere entegrasyonu için adaptör pattern kullanılmaktadır. Bu doküman, desteklenen framework'ler için entegrasyon detaylarını içermektedir.

## 2. Adaptör Pattern

```typescript
interface ContentrainAdapter {
  initialize(options: AdapterOptions): void
  createPlugin(): unknown
  handleHotReload?(file: string): void
}
```

## 3. Framework Entegrasyonları

### 3.1 Vue/Nuxt Integration

```typescript
// Nuxt modülü
export default defineNuxtModule({
  setup(options) {
    // Nuxt-specific optimizasyonlar
  }
})

// Vue plugin
export const ContentrainVuePlugin = {
  install(app: App, options: ContentrainOptions) {
    // Vue-specific implementasyon
  }
}
```

### 3.2 React/Next.js Integration

```typescript
// Next.js plugin
export default function ContentrainNextPlugin(options: ContentrainOptions) {
  // Next.js-specific optimizasyonlar
}

// React hooks
export function useContentrain() {
  // React-specific implementasyon
}
```

### 3.3 Svelte/SvelteKit Integration

```typescript
// SvelteKit plugin
export default function ContentrainSveltePlugin(options: ContentrainOptions) {
  // SvelteKit-specific optimizasyonlar
}

// Svelte stores
export const contentrainStore = writable({
  // Svelte-specific implementasyon
})
```

## 4. Virtual Modules

Her framework entegrasyonu için aşağıdaki virtual modüller sağlanmaktadır:

```typescript
// Tip modülü
import type { WorkItem } from 'virtual:contentrain/types'

// Query modülü
import { createQuery } from 'virtual:contentrain/query'

// Config modülü
import { config } from 'virtual:contentrain/config'

// Asset modülü
import { resolveAsset } from 'virtual:contentrain/assets'
```

## 5. Plugin Konfigürasyonu

```typescript
interface ContentrainPluginOptions {
  // Content dizini
  contentDir: string

  // Model konfigürasyonları
  models: {
    [modelId: string]: {
      // Lokalizasyon
      localized?: boolean
      defaultLocale?: string
      locales?: string[]

      // İlişkiler
      relations?: {
        [fieldId: string]: {
          model: string
          type: 'one-to-one' | 'one-to-many'
        }
      }

      // Validasyonlar
      validations?: {
        [fieldId: string]: {
          required?: boolean
          unique?: boolean
          min?: number
          max?: number
        }
      }
    }
  }

  // Cache stratejisi
  cache?: {
    strategy: 'memory' | 'localStorage'
    ttl?: number
  }
}
```

## 6. Framework-Specific Özellikler

### 6.1 Vue/Nuxt
- Composables
- Auto-imports
- HMR desteği
- SSR optimizasyonları

### 6.2 React/Next.js
- Custom hooks
- Context providers
- Server components
- App router desteği

### 6.3 Svelte/SvelteKit
- Stores
- Actions
- Server routes
- Load functions
