# @contentrain/core

Contentrain SDK Core paketi, Contentrain platformu için geliştirilmiş resmi JavaScript/TypeScript SDK'sıdır.

## Özellikler

- 🚀 Model bazlı veri yönetimi
- 🔄 İlişkisel veri desteği (one-to-one, one-to-many)
- 💾 Yerleşik önbellek sistemi
- 🌍 Çoklu dil desteği
- 🔍 Gelişmiş sorgu yetenekleri
- 📦 Tree-shakeable ve hafif paket boyutu
- 💪 Tam TypeScript desteği

## Kurulum

```bash
npm install @contentrain/core
# veya
yarn add @contentrain/core
# veya
pnpm add @contentrain/core
```

## Hızlı Başlangıç

```typescript
import { ContentrainSDK } from '@contentrain/core';

// SDK'yı yapılandırın
const sdk = new ContentrainSDK({
  contentDir: './contentrain',
  cache: true, // Önbellek aktif (opsiyonel)
  ttl: 3600000, // Önbellek süresi - ms (opsiyonel)
});

// Veri yükleme
const result = await sdk.load('blog-posts');

// Sorgu oluşturma
const posts = await sdk
  .query('blog-posts')
  .where('status', 'eq', 'publish')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
```

## API Referansı

### ContentrainSDK

SDK'nın ana sınıfı. Veri yükleme ve sorgu oluşturma işlemlerini yönetir.

```typescript
const sdk = new ContentrainSDK({
  contentDir: string;
  defaultLocale?: string;
  cache?: boolean;
  ttl?: number;
  maxCacheSize?: number;
  modelTTL?: {
    [model: string]: number;
  };
});
```

#### Metodlar

- `load<T>(model: string)`: Model verilerini yükler
- `query<T>(model: string)`: Sorgu builder'ı başlatır

### Query Builder

Veri sorgulama için akıcı bir API sunar.

```typescript
sdk.query('model-name')
  .where(field, operator, value)
  .include(relations)
  .orderBy(field, direction)
  .limit(count)
  .offset(count)
  .locale(code)
  .cache(ttl)
  .get();
```

#### Sorgu Operatörleri

- `eq`: Eşitlik
- `ne`: Eşit değil
- `gt`: Büyüktür
- `gte`: Büyük veya eşit
- `lt`: Küçüktür
- `lte`: Küçük veya eşit
- `in`: Liste içinde
- `nin`: Liste içinde değil
- `contains`: İçerir
- `startsWith`: İle başlar
- `endsWith`: İle biter

### İlişki Yönetimi

İlişkiler, `_relations` alanı altında döner. İlişki tipine göre (one-to-one veya one-to-many) tekil veya dizi olarak gelir.

```typescript
// Temel ilişki tipleri
interface BaseContentrainType {
  ID: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'changed' | 'publish';
  scheduled: boolean;
  _relations?: {
    [key: string]: BaseContentrainType | BaseContentrainType[];
  };
}

// Örnek model tanımları
interface Author extends BaseContentrainType {
  name: string;
  email: string;
}

interface Post extends BaseContentrainType {
  title: string;
  content: string;
  authorId: string; // İlişki için foreign key
  categoryIds: string[]; // Çoklu ilişki için foreign key array
  _relations?: {
    author?: Author;        // One-to-one ilişki
    categories?: Category[]; // One-to-many ilişki
  };
}

// Kullanım örnekleri
const posts = await sdk.query<Post>('posts')
  .include('author')
  .get();

// Tekli ilişki erişimi
const authorName = posts.data[0]._relations?.author?.name;

// Çoklu ilişki erişimi
const categories = posts.data[0]._relations?.categories?.map(c => c.name);

// İç içe ilişki tanımı
interface PostWithNestedRelations extends BaseContentrainType {
  title: string;
  _relations?: {
    author?: Author & {
      _relations?: {
        profile?: Profile;
      };
    };
    comments?: Comment[];
  };
}

// İç içe ilişki sorgusu
const postsWithNested = await sdk.query<PostWithNestedRelations>('posts')
  .include({
    author: {
      include: {
        profile: true
      }
    },
    comments: true
  })
  .get();

// İç içe ilişkilere erişim
const authorProfile = postsWithNested.data[0]._relations?.author?._relations?.profile;
const comments = postsWithNested.data[0]._relations?.comments;
```

#### Sorgu Sonuç Tipleri

```typescript
// Temel sorgu sonucu
interface QueryResult<T> {
  data: T[];           // Veri dizisi
  total: number;       // Toplam kayıt sayısı
  pagination?: {       // Sayfalama bilgisi (varsa)
    limit: number;     // Sayfa başına kayıt
    offset: number;    // Atlanan kayıt sayısı
    hasMore: boolean;  // Daha fazla kayıt var mı
  };
}

// Örnek kullanım
const result = await sdk.query<Post>('posts')
  .limit(10)
  .offset(0)
  .include('author')
  .get();

console.log(result.total);        // Toplam post sayısı
console.log(result.data.length);  // Dönen post sayısı
console.log(result.pagination?.hasMore); // Daha fazla post var mı
```

### Önbellek Yönetimi

```typescript
// Global önbellek konfigürasyonu
const sdk = new ContentrainSDK({
  cache: true,
  ttl: 3600000, // 1 saat
  maxCacheSize: 100 // MB
});

// Sorgu bazlı önbellek
sdk.query('posts')
  .cache(60000) // 1 dakika
  .get();

// Önbelleği devre dışı bırakma
sdk.query('posts')
  .noCache()
  .get();
```

## TypeScript Desteği

SDK, tam TypeScript desteği sunar. Model tiplerini iki farklı şekilde kullanabilirsiniz:

### 1. Sorgu Bazlı Tip Tanımlama

```typescript
interface BlogPost extends BaseContentrainType {
  title: string;
  content: string;
  author: string;
  tags: string[];
}

const posts = await sdk
  .query<BlogPost>('blog-posts')
  .where('tags', 'contains', 'typescript')
  .get();
```

### 2. SDK Instance'ı için Model-Tip Eşleştirmesi

```typescript
// Model tiplerini tanımlayın
interface BlogPost extends BaseContentrainType {
  title: string;
  content: string;
  author: string;
  tags: string[];
}

interface Author extends BaseContentrainType {
  name: string;
  email: string;
}

// Model-tip map'ini oluşturun
interface ContentrainModels {
  'blog-posts': BlogPost;
  'authors': Author;
}

// SDK'yı tip map'i ile başlatın
const sdk = new ContentrainSDK<ContentrainModels>({
  contentDir: './contentrain'
});

// Artık query metodları otomatik olarak doğru tipi alacak
const posts = await sdk
  .query('blog-posts') // Tip hatası olmadan sadece 'blog-posts' veya 'authors' yazılabilir
  .where('tags', 'contains', 'typescript') // BlogPost tipine göre alan kontrolü
  .get(); // posts otomatik olarak BlogPost[] tipinde

const authors = await sdk
  .query('authors') // Tip hatası olmadan sadece 'blog-posts' veya 'authors' yazılabilir
  .where('email', 'contains', '@') // Author tipine göre alan kontrolü
  .get(); // authors otomatik olarak Author[] tipinde

// Olmayan bir model adı kullanılamaz
const invalid = await sdk
  .query('invalid-model') // TypeScript hatası
  .get();
```

Bu yaklaşımın avantajları:
1. Model isimleri için otomatik tamamlama
2. Yanlış model isimlerinde derleme zamanında hata
3. Her sorgu için ayrıca tip belirtmeye gerek yok
4. Where, orderBy gibi metodlarda alan isimlerinin validasyonu
5. İlişki sorgularında tip güvenliği

### Gelişmiş Kullanım

```typescript
// İlişkili modeller için
interface ContentrainModels {
  'blog-posts': BlogPost & {
    _relations: {
      author: ContentrainModels['authors'];
      comments: ContentrainModels['comments'][];
    }
  };
  'authors': Author & {
    _relations: {
      posts: ContentrainModels['blog-posts'][];
      profile: ContentrainModels['profiles'];
    }
  };
  'comments': Comment;
  'profiles': Profile;
}

const sdk = new ContentrainSDK<ContentrainModels>({
  contentDir: './contentrain'
});

// İlişki sorgularında tam tip desteği
const posts = await sdk
  .query('blog-posts')
  .include({
    author: {
      include: {
        profile: true
      }
    }
  })
  .get();

// Tip güvenli erişim
const authorProfile = posts.data[0]._relations.author._relations.profile;
// authorProfile otomatik olarak Profile tipinde
```

## Lisans

MIT
