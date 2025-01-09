# @contentrain/core

Contentrain SDK'nın çekirdek paketi. Bu paket, Contentrain CMS ile entegrasyon sağlamak için gerekli temel fonksiyonları içerir.

## Özellikler

- 🚀 Yüksek performanslı içerik yükleme
- 💾 Akıllı önbellek sistemi
- 🔍 Güçlü sorgu motoru
- 🔄 İlişki yönetimi
- 🌍 Çoklu dil desteği
- 📦 TypeScript ile tam tip desteği

## Kurulum

```bash
# npm ile
npm install @contentrain/core

# yarn ile
yarn add @contentrain/core

# pnpm ile
pnpm add @contentrain/core
```

## Hızlı Başlangıç

```typescript
import ContentrainSDK from '@contentrain/core';

// SDK'yı yapılandırın
const sdk = new ContentrainSDK({
  contentDir: './contentrain',
  defaultLocale: 'tr',
  cache: true,
});

// İçeriği yükleyin
const posts = await sdk.query('posts')
  .where('status', 'eq', 'publish')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

// İlişkili verileri yükleyin
const postsWithAuthor = await sdk.query('posts')
  .include('author')
  .where('status', 'eq', 'publish')
  .get();
```

## API Referansı

### ContentrainSDK

SDK'nın ana sınıfı.

```typescript
const sdk = new ContentrainSDK({
  contentDir: string;      // İçerik dizini
  defaultLocale?: string;  // Varsayılan dil
  cache?: boolean;         // Önbellek aktif/pasif
  ttl?: number;           // Önbellek süresi (ms)
  maxCacheSize?: number;  // Maksimum önbellek boyutu (MB)
});
```

### Query Builder

İçerik sorgulama için akıcı bir API.

```typescript
sdk.query(model: string)
  .where(field, operator, value)    // Filtreleme
  .include(relations)               // İlişkileri dahil etme
  .orderBy(field, direction)        // Sıralama
  .limit(count)                     // Limit
  .offset(count)                    // Sayfa atlama
  .locale(code)                     // Dil seçimi
  .cache(ttl?)                      // Önbellek ayarı
  .get()                           // Sorguyu çalıştır
```

#### Operatörler

- `eq`: Eşitlik
- `ne`: Eşit değil
- `gt`: Büyüktür
- `gte`: Büyük eşittir
- `lt`: Küçüktür
- `lte`: Küçük eşittir
- `in`: Liste içinde
- `nin`: Liste dışında
- `contains`: İçerir
- `startsWith`: İle başlar
- `endsWith`: İle biter

### Önbellek Yönetimi

```typescript
// Önbelleği temizle
await sdk.clearCache();

// Belirli bir modelin önbelleğini yenile
await sdk.refreshCache('posts');

// Önbellek istatistiklerini al
const stats = sdk.getCacheStats();
```

## TypeScript Desteği

SDK, tam TypeScript desteği sunar. Model tiplerini tanımlayarak tip güvenliği sağlayabilirsiniz:

```typescript
interface Post extends BaseContentrainType {
  title: string;
  content: string;
  author: string; // İlişki ID'si
  tags: string[];
}

const posts = await sdk.query<Post>('posts').get();
// posts.data[0].title -> string
```

## Hata Yönetimi

SDK, hataları `ContentrainError` sınıfı ile yönetir:

```typescript
try {
  const posts = await sdk.query('posts').get();
} catch (error) {
  if (error instanceof ContentrainError) {
    console.error(`Hata tipi: ${error.type}`);
    console.error(`Hata mesajı: ${error.message}`);
    console.error(`Detaylar:`, error.details);
  }
}
```

## Performans İpuçları

1. **Önbellek Kullanımı**: Sık erişilen veriler için önbellek kullanın
```typescript
const posts = await sdk.query('posts')
  .cache(60 * 1000) // 1 dakika
  .get();
```

2. **Seçici İlişki Yükleme**: Sadece ihtiyaç duyulan ilişkileri yükleyin
```typescript
const posts = await sdk.query('posts')
  .include({
    author: {
      fields: ['name', 'avatar']
    }
  })
  .get();
```

3. **Sayfalama**: Büyük veri setleri için sayfalama kullanın
```typescript
const posts = await sdk.query('posts')
  .limit(10)
  .offset(0)
  .get();
```

## Lisans

MIT
