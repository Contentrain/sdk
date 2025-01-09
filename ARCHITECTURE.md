# Contentrain SDK Mimarisi

## 1. Genel Bakış

Contentrain SDK, Git-based headless CMS olan Contentrain'in içerik yönetimi ve sorgulama yeteneklerini modern web uygulamalarına entegre etmek için geliştirilmiş bir araçtır.

### 1.1 Temel Özellikler
- Framework-agnostic yapı (Vue, React, Svelte, vb.)
- TypeScript öncelikli geliştirme
- Build-time optimizasyonları
- SSR/SSG uyumlu
- HMR desteği
- Tip güvenliği
- Performans odaklı cache sistemi

### 1.2 Kullanım Senaryoları
- Statik site oluşturma (SSG)
- Server-side rendering (SSR)
- Single-page applications (SPA)
- Jamstack uygulamaları

## 2. Core Paket Mimarisi

### 2.1 Paket Yapısı
```
packages/
  core/                       # Framework-agnostic core package
    ├── src/
    │   ├── types/           # Temel tip tanımları
    │   │   ├── index.ts     # Re-export tüm tipler
    │   │   ├── model.ts     # Model ve Field tipleri
    │   │   ├── query.ts     # Query tipleri
    │   │   ├── config.ts    # Konfigürasyon tipleri
    │   │   ├── error.ts     # Error tipleri
    │   │   ├── loader.ts    # Loader tipleri
    │   │   └── cache.ts     # Cache tipleri
    │   │
    │   ├── query/           # Query engine
    │   │   ├── builder.ts   # Query builder
    │   │   └── executor.ts  # Query execution
    │   │
    │   ├── loader/          # Content loader
    │   │   └── content.ts   # Content loader implementasyonu
    │   │
    │   ├── cache/          # Cache sistemi
    │   │   ├── memory.ts   # Memory cache implementasyonu
    │   │   └── index.ts    # Re-export
    │   │
    │   └── utils/          # Utility fonksiyonlar
    │       ├── path.ts     # Path işlemleri
    │       └── validation.ts # Validasyon helpers
    │
    └── package.json
```

### 2.2 Core Modüller

#### 2.2.1 Query Engine
```typescript
class ContentrainQueryBuilder<T extends BaseContentrainType> {
  where(field: keyof T, operator: Operator, value: any): this
  include(relations: string | string[] | Include): this
  orderBy(field: keyof T, direction: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  locale(code: string): this
  cache(ttl?: number): this
  noCache(): this
  bypassCache(): this
  get(): Promise<QueryResult<T>>
  first(): Promise<T | null>
}

class QueryExecutor {
  private loader: ContentLoader
  private cache: MemoryCache

  execute<T>(query: QueryBuilder<T>): Promise<QueryResult<T>>
  resolveRelations<T>(data: T[], relations: string[]): Promise<T[]>
}
```

#### 2.2.2 Content Loader
```typescript
class ContentLoader {
  private options: ContentLoaderOptions
  private modelConfigs: Map<string, ModelConfig>
  private relations: Map<string, RelationConfig[]>
  private cache: MemoryCache

  async load<T extends BaseContentrainType>(model: string): Promise<LoaderResult<T>>
  async resolveRelation<T extends BaseContentrainType, R extends BaseContentrainType>(
    model: string,
    relationField: keyof T,
    data: T[],
    locale?: string,
  ): Promise<R[]>
}
```

#### 2.2.3 Cache Sistemi
```typescript
class MemoryCache {
  private cache: Map<string, CacheEntry>
  private options: Required<MemoryCacheOptions>
  private stats: CacheStats

  constructor(options: MemoryCacheOptions = {}) {
    this.options = {
      maxSize: 100, // 100 MB
      defaultTTL: 60 * 1000, // 1 dakika
      ...options,
    }
  }

  set(key: string, value: any, ttl?: number): void
  get(key: string): any | null
  has(key: string): boolean
  delete(key: string): void
  clear(): void
  getStats(): CacheStats
}
```

### 2.3 Error Handling

```typescript
type ContentrainError =
  | 'MODEL_NOT_FOUND'
  | 'INVALID_FIELD'
  | 'INVALID_RELATION'
  | 'INVALID_OPERATOR'
  | 'CACHE_ERROR'

class ContentrainError extends Error {
  constructor(
    public type: ContentrainError,
    message: string,
    public details?: any
  ) {
    super(message)
  }
}
```

## 3. Test Stratejisi

### 3.1 Unit Tests
- Memory Cache Tests (14 test)
  - Set/Get operasyonları
  - TTL yönetimi
  - Cache temizleme
  - Memory limitleri
  - İstatistik takibi

- Content Loader Tests (20 test)
  - Model yükleme
  - İlişki çözümleme
  - Hata yönetimi
  - Lokalizasyon
  - Concurrent yükleme

- Query Builder Tests (21 test)
  - Filtreleme operasyonları
  - İlişki yükleme
  - Sıralama ve sayfalama
  - Cache yönetimi
  - Kompleks sorgular

### 3.2 Performance Tests
- Bundle size limitleri
- Memory kullanım limitleri
- Query performance benchmarks
- Cache hit/miss oranları

## 4. Versiyonlama ve Release

### 4.1 Semantic Versioning
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### 4.2 Release Checklist
- Test coverage kontrolü
- Bundle size kontrolü
- Breaking change kontrolü
- Doküman güncellemesi
- Changelog güncellemesi
