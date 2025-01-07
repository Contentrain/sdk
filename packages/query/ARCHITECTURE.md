# Contentrain Query Package Mimarisi

## Genel Bakış
Contentrain Query paketi, Git-based headless CMS olan Contentrain'in oluşturduğu JSON formatındaki içerikleri sorgulamak, filtrelemek ve yönetmek için geliştirilmiş framework-agnostic bir query builder'dır.

## Temel Özellikler
- Browser ve Node.js ortamlarında çalışabilme
- Framework bağımsız yapı (React, Vue, Angular, vb.)
- TypeScript desteği ve tip güvenliği
- İçerik filtreleme ve sıralama
- Sayfalama desteği
- İlişki (Relations) yönetimi
- Çoklu dil (Locale) desteği
- Performans odaklı cache mekanizması
- Build-time optimizasyonları
- Hot-reload desteği

## Teknik Detaylar

### 1. Query Builder API
```typescript
class ContentrainQuery<T extends ContentrainBaseModel> {
  constructor(options?: QueryOptions) {}
  from<K extends string>(model: K): ContentrainQuery<T>
  where(field: keyof T, operator: FilterOperator, value: any): this
  whereIn(field: keyof T, values: any[]): this
  whereLike(field: keyof T, pattern: string): this
  with(relation: string): this
  withCount(relation: string): this
  orderBy(field: keyof T, direction: SortDirection): this
  locale(locale: string): this
  skip(count: number): this
  take(count: number): this
  paginate(page: number, perPage: number): this
  async get(): Promise<T[]>
  async first(): Promise<T | null>
  async count(): Promise<number>
  search(query: string): this
  preload(): Promise<void>
}
```

### 2. Build-time Optimizasyonları
```typescript
interface BuildOptions {
  models: string[];
  output: string;
  transformers?: ContentTransformer[];
  indexing?: IndexingOptions;
}

interface IndexingOptions {
  fields: string[];
  language?: string;
  searchOptions?: SearchOptions;
}

class ContentrainBuilder {
  async build(options: BuildOptions): Promise<void>
  async watch(): Promise<void>
  async generateTypes(): Promise<void>
}
```

### 3. Runtime Stratejisi
- **Node.js Ortamı**:
  - Doğrudan dosya sistemi erişimi
  - Build çıktılarını kullanma
  - Memory-based caching

- **Browser Ortamı**:
  - REST API üzerinden erişim
  - Chunk-based lazy loading
  - IndexedDB tabanlı caching
  - Service Worker desteği

### 4. Framework Adaptörleri
```typescript
interface FrameworkAdapter {
  setup(options: AdapterOptions): void;
  query<T>(builder: ContentrainQuery<T>): Promise<T>;
  cache: CacheManager;
}

class ReactAdapter implements FrameworkAdapter {}
class VueAdapter implements FrameworkAdapter {}
class SvelteAdapter implements FrameworkAdapter {}
```

### 5. Tip Sistemi
- Contentrain'in ürettiği tipleri kullanabilme
- Kullanıcıların kendi tiplerini tanımlayabilmesi
- Tip çıkarımı (Type inference) desteği
- İlişki tiplerinin otomatik çıkarımı

### 6. Filtreleme Operatörleri
```typescript
type FilterOperator =
  | 'eq'      // Eşitlik
  | 'neq'     // Eşit değil
  | 'gt'      // Büyüktür
  | 'gte'     // Büyük eşit
  | 'lt'      // Küçüktür
  | 'lte'     // Küçük eşit
  | 'in'      // Dizi içinde
  | 'nin'     // Dizi içinde değil
  | 'like'    // Pattern eşleşmesi
  | 'exists'  // Alan var mı
```

### 7. İlişkiler (Relations)
- One-to-One ve One-to-Many ilişki desteği
- Maksimum 2 seviye derinlik
- Otomatik populate özelliği
- İlişki sayısı alma (withCount)

### 8. Locale Yönetimi
- Varsayılan locale belirleme
- Locale bazlı içerik filtreleme
- Locale bazlı sıralama
- Fallback stratejisi (configurable)

### 9. Cache Stratejisi
```typescript
interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

- SSR ve CSR desteği
- Memory-based caching
- Configurable TTL
- Namespace desteği

### 10. Hata Yönetimi
- @contentrain/types paketinden error type'ları extend etme
- Özelleştirilmiş hata kodları
- Detaylı hata mesajları

### 11. Test Verileri
Tüm test verileri root dizindeki `__mocks__` klasörü altında bulunmaktadır. Bu veriler paket içerisindeki tüm testlerde kullanılmaktadır. Mock veriler gerçek Contentrain veri yapısını yansıtacak şekilde oluşturulmuştur ve test senaryolarını doğru bir şekilde simüle etmektedir. Testlerde bu veriler kullanilmalidir.

## Kullanım Örnekleri

### 1. Temel Sorgu
```typescript
const query = new ContentrainQuery<CustomWorkItem>();
const results = await query
  .from('workitems')
  .where('status', 'eq', 'publish')
  .orderBy('createdAt', 'desc')
  .get();
```

### 2. İlişkili Sorgu
```typescript
const query = new ContentrainQuery<CustomWorkItem>();
const results = await query
  .from('workitems')
  .with('category')
  .where('status', 'eq', 'publish')
  .get();
```

### 3. Locale ile Sorgu
```typescript
const query = new ContentrainQuery<CustomWorkItem>({
  defaultLocale: 'tr'
});
const results = await query
  .from('workitems')
  .locale('en')
  .get();
```

## Performans Konuları
- Build-time içerik optimizasyonu
- Lazy loading stratejisi
- Cache mekanizması
  - Browser: IndexedDB + Memory
  - Node.js: Filesystem + Memory
- İlişki yükleme optimizasyonu
- Sorgu optimizasyonu
- Chunk-based veri transferi

## Konfigürasyon
```typescript
interface QueryOptions {
  defaultLocale?: string;
  basePath?: string;
  cacheStrategy?: 'memory' | 'indexeddb' | 'none';
  cacheTTL?: number;
  adapter?: FrameworkAdapter;
  buildOutput?: string;
  transformers?: ContentTransformer[];
  api?: {
    endpoint?: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
}
```

## Gelecek Geliştirmeler
Evet, kesinlikle. Yeni mimari dokümanına göre paketimizi güncellemeliyiz. İşte adım adım yapmamız gerekenler:

1. **Paket Yapısı Güncellemesi**:
```packages/query/ARCHITECTURE.md
packages/query/
├── src/
│   ├── builder/           # Build-time işlemleri için yeni modül
│   ├── adapters/         # Framework adaptörleri
│   │   ├── react.ts
│   │   ├── vue.ts
│   │   └── svelte.ts
│   ├── runtime/          # Runtime stratejileri
│   │   ├── node/
│   │   └── browser/
│   ├── cache/            # Gelişmiş cache sistemi
│   │   ├── memory.ts
│   │   ├── indexeddb.ts
│   │   └── filesystem.ts
│   ├── query/           # Mevcut query sistemi
│   ├── loader/          # Mevcut loader sistemi
│   └── types/           # Tip sistemi
```

2. **Öncelikli Geliştirmeler**:

a) **Builder Modülü**:
```typescript
// Yeni oluşturulacak
- builder/index.ts
- builder/transformer.ts
- builder/indexer.ts
```

b) **Framework Adaptörleri**:
```typescript
// Yeni oluşturulacak
- adapters/base.ts
- adapters/react.ts
- adapters/vue.ts
```

c) **Runtime Stratejileri**:
```typescript
// Güncellenecek
- runtime/browser/index.ts
- runtime/node/index.ts
```

3. **Mevcut Kodda Yapılacak Değişiklikler**:

a) **Query Builder**:
- `search` ve `preload` metodlarının eklenmesi
- Build-time optimizasyonları için hazırlık
- Framework adapter desteği

b) **Cache Sistemi**:
- IndexedDB desteği
- Filesystem cache desteği
- Service Worker entegrasyonu

c) **Loader Sistemi**:
- Chunk-based loading desteği
- Hot-reload mekanizması
- Build çıktılarını kullanma

4. **Yeni Özellikler İçin Plan**:

a) **Build-time Optimizasyonları**:
```typescript
// Örnek kullanım
const builder = new ContentrainBuilder()
await builder.build({
  models: ['articles', 'categories'],
  output: '.contentrain/dist',
  indexing: {
    fields: ['title', 'content'],
    language: 'tr'
  }
})
```

b) **Framework Adaptörleri**:
```typescript
// React örneği
const queryClient = new ContentrainQuery({
  adapter: new ReactAdapter({
    cache: 'indexeddb',
    ssr: true
  })
})
```

5. **Test Stratejisi**:
- Her framework için ayrı test suite
- Build süreçleri için integration testleri
- Performance testleri
- Browser ve Node.js ortamları için ayrı testler

6. **Dokümantasyon**:
- Her framework için ayrı kullanım kılavuzu
- Migration guide
- Performance best practices
- API referansı

Bu değişiklikleri yaparken şu sırayı izlemeliyiz:

1. Builder modülü implementasyonu
2. Runtime stratejilerinin güncellenmesi
3. Cache sisteminin genişletilmesi
4. Framework adaptörlerinin eklenmesi
5. Mevcut kodun refaktör edilmesi
6. Test ve dokümantasyon güncellemesi


