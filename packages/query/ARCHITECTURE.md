# Contentrain Query Package Mimarisi

## Genel Bakış
Contentrain Query paketi, Git-based headless CMS olan Contentrain'in oluşturduğu JSON formatındaki içerikleri sorgulamak, filtrelemek ve yönetmek için geliştirilmiş bir query builder'dır.

## Temel Özellikler
- Browser ve Node.js ortamlarında çalışabilme
- TypeScript desteği ve tip güvenliği
- İçerik filtreleme ve sıralama
- Sayfalama desteği
- İlişki (Relations) yönetimi
- Çoklu dil (Locale) desteği
- Performans odaklı cache mekanizması

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
}
```

### 2. Tip Sistemi
- Contentrain'in ürettiği tipleri kullanabilme
- Kullanıcıların kendi tiplerini tanımlayabilmesi
- Tip çıkarımı (Type inference) desteği
- İlişki tiplerinin otomatik çıkarımı

### 3. Filtreleme Operatörleri
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

### 4. İlişkiler (Relations)
- One-to-One ve One-to-Many ilişki desteği
- Maksimum 2 seviye derinlik
- Otomatik populate özelliği
- İlişki sayısı alma (withCount)

### 5. Locale Yönetimi
- Varsayılan locale belirleme
- Locale bazlı içerik filtreleme
- Locale bazlı sıralama
- Fallback stratejisi (configurable)

### 6. Cache Stratejisi
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

### 7. Hata Yönetimi
- @contentrain/types paketinden error type'ları extend etme
- Özelleştirilmiş hata kodları
- Detaylı hata mesajları

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
- Lazy loading stratejisi
- Cache mekanizması
- İlişki yükleme optimizasyonu
- Sorgu optimizasyonu

## Konfigürasyon
```typescript
interface QueryOptions {
  defaultLocale?: string;
  basePath?: string;
  cacheStrategy?: 'memory' | 'none';
  cacheTTL?: number;
}
```

## Gelecek Geliştirmeler
- Daha fazla filtreleme operatörü
- Gelişmiş cache stratejileri
- Batch işlem desteği
- Aggregation fonksiyonları
