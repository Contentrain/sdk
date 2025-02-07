

Tabii ki! İşte SQLite entegrasyonu için kapsamlı implementasyon planı:

# Contentrain SDK SQLite Entegrasyonu İmplementasyon Planı

## 1. Yeni Tip Tanımlamaları
```typescript
// types/database.ts

// Ana DB kayıt tipi
export interface DBRecord {
  id: string
  created_at: string
  updated_at: string
  status: string
  scheduled?: boolean
}

// Çeviri tablosu tipi
export interface DBTranslationRecord extends DBRecord {
  locale: string
  [key: string]: any // Dinamik çeviri alanları
}

// İlişki tablosu tipi
export interface DBRelation {
  id: string
  source_model: string
  source_id: string
  target_model: string
  target_id: string
  field_id: string
  type: 'one-to-one' | 'one-to-many'
}
```

## 2. SQLite Loader İmplementasyonu
```typescript
// loader/sqlite.ts

export class SQLiteLoader extends ContentSource {
  private db: Database
  private cache: MemoryCache

  constructor(databasePath: string, options?: ContentrainConfig) {
    this.db = new Database(databasePath)
    this.cache = new MemoryCache(options)
  }

  // Ana yükleme metodu
  async load<T extends DBRecord>(model: string): Promise<LoaderResult<T>> {
    const cacheKey = `${model}`

    // Cache kontrolü
    if (this.options.cache) {
      const cached = await this.cache.get<LoaderResult<T>>(cacheKey)
      if (cached) return cached
    }

    const result = await this.loadContent<T>(model)

    // Cache'e kaydet
    if (this.options.cache) {
      await this.cache.set(cacheKey, result, this.options.ttl)
    }

    return result
  }

  // İçerik yükleme
  private async loadContent<T extends DBRecord>(
    model: string
  ): Promise<LoaderResult<T>> {
    const hasTranslations = await this.hasTranslations(model)

    if (hasTranslations) {
      return this.loadTranslatedContent<T>(model)
    }

    return this.loadDefaultContent<T>(model)
  }

  // Çevirili içerik yükleme
  private async loadTranslatedContent<T extends DBRecord>(
    model: string
  ): Promise<LoaderResult<T>> {
    const query = `
      SELECT t.*, m.*
      FROM tbl_${model}_translations t
      JOIN tbl_${model} m ON t.id = m.id
    `

    const records = await this.db.all<DBTranslationRecord>(query)
    const content: { [locale: string]: T[] } = {}

    for (const record of records) {
      const { locale, ...data } = record
      if (!content[locale]) content[locale] = []
      content[locale].push(data as T)
    }

    return { content }
  }

  // Çevirisiz içerik yükleme
  private async loadDefaultContent<T extends DBRecord>(
    model: string
  ): Promise<LoaderResult<T>> {
    const query = `SELECT * FROM tbl_${model}`
    const records = await this.db.all<T>(query)

    return {
      content: {
        default: records
      }
    }
  }

  // İlişki çözümleme
  async resolveRelation<T extends DBRecord, R extends DBRecord>(
    model: string,
    relationField: keyof T,
    data: T[],
    locale?: string
  ): Promise<R[]> {
    // İlişkileri çek
    const relations = await this.loadRelations(model, data, relationField)

    // İlişkili verileri yükle
    return this.loadRelatedContent<R>(relations, locale)
  }
}
```

## 3. Query Builder Adaptasyonu
```typescript
// query/sqlite-builder.ts

export class SQLiteQueryBuilder<T extends DBRecord> {
  private conditions: string[] = []
  private params: any[] = []
  private sorts: string[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(private model: string) {}

  where(field: keyof T, operator: string, value: any): this {
    const condition = this.buildCondition(field, operator, value)
    this.conditions.push(condition.sql)
    this.params.push(...condition.params)
    return this
  }

  orderBy(field: keyof T, direction: 'asc' | 'desc'): this {
    this.sorts.push(`${field} ${direction}`)
    return this
  }

  limit(value: number): this {
    this.limitValue = value
    return this
  }

  offset(value: number): this {
    this.offsetValue = value
    return this
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT * FROM tbl_${this.model}`

    if (this.conditions.length) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`
    }

    if (this.sorts.length) {
      sql += ` ORDER BY ${this.sorts.join(', ')}`
    }

    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`
    }

    if (this.offsetValue) {
      sql += ` OFFSET ${this.offsetValue}`
    }

    return { sql, params: this.params }
  }
}
```

## 4. İmplementasyon Adımları

### 1. Adım: Temel Yapı
- Yeni tip tanımlamalarını oluştur
- SQLite bağlantı yönetimini kur
- Temel CRUD operasyonlarını implement et

### 2. Adım: Çeviri Desteği
- Çeviri tabloları için destek ekle
- Locale bazlı veri yükleme
- Çeviri birleştirme mantığını implement et

### 3. Adım: İlişki Yönetimi
- İlişki tablosu desteği ekle
- One-to-One ve One-to-Many ilişkileri implement et
- İlişki çözümleme mantığını geliştir

### 4. Adım: Query Builder
- SQL sorgu oluşturucuyu implement et
- Filtre ve sıralama desteği ekle
- Sayfalama mantığını implement et

### 5. Adım: Cache Yönetimi
- Cache stratejisini belirle
- Cache invalidation mantığını implement et
- TTL desteği ekle

### 6. Adım: Test Coverage
- Unit testleri yaz
- Integration testleri yaz
- Performance testleri ekle

## 5. Örnek Kullanım

```typescript
// SDK başlatma
const sdk = new ContentrainSDK({
  source: './content.db',
  defaultLocale: 'tr',
  cache: true
})

// Temel sorgu
const posts = await sdk.query<DBRecord>('posts')
  .where('status', 'eq', 'publish')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()

// İlişkili sorgu
const services = await sdk.query<DBRecord>('services')
  .include('reference')
  .where('status', 'eq', 'publish')
  .get()

// Çevirili içerik
const trContent = await sdk.query<DBTranslationRecord>('sections')
  .locale('tr')
  .first()
```

## 6. Test Stratejisi

1. **Unit Testler**
```typescript
describe('SQLiteLoader', () => {
  it('should load basic content', async () => {
    // Test implementation
  })

  it('should handle translations', async () => {
    // Test implementation
  })

  it('should resolve relations', async () => {
    // Test implementation
  })
})
```

2. **Integration Testler**
```typescript
describe('SQLite Integration', () => {
  it('should work with query builder', async () => {
    // Test implementation
  })

  it('should handle complex queries', async () => {
    // Test implementation
  })
})
```

## 7. Performance Optimizasyonları

1. **İndeks Yönetimi**
```sql
CREATE INDEX idx_status ON tbl_posts(status);
CREATE INDEX idx_created_at ON tbl_posts(created_at);
CREATE INDEX idx_translations ON tbl_posts_translations(id, locale);
```

2. **Cache Stratejisi**
```typescript
class SQLiteCache {
  // Query cache
  async cacheQuery(key: string, result: any): Promise<void>

  // Relation cache
  async cacheRelation(key: string, result: any): Promise<void>

  // Cache invalidation
  async invalidate(model: string): Promise<void>
}
```
