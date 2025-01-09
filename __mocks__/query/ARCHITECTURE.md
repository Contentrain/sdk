
# Contentrain Query Package Mimarisi

## Genel Bakış
Contentrain Query paketi, Git-based headless CMS olan Contentrain'in oluşturduğu JSON formatındaki içerikleri sorgulamak, filtrelemek ve yönetmek için geliştirilmiş framework-agnostic bir query builder'dır.

## Temel Özellikler
- Browser ve Node.js ortamlarında çalışabilme ✅
- Framework bağımsız yapı (React, Vue, Angular, vb.) ✅
- TypeScript desteği ve tip güvenliği ✅
- İçerik filtreleme ve sıralama ✅
- Sayfalama desteği ✅
- İlişki (Relations) yönetimi ✅
- Çoklu dil (Locale) desteği ✅
- Performans odaklı cache mekanizması ✅
- Build-time optimizasyonları ✅
- Hot-reload desteği ✅
- SSR Uyumlu yapı ✅

## CONTENTRAIN Icerikleri ve Modellerinde Temel Yapı

### 1. Tip Tanımları
Contentrain projelerinde otomatik olarak generate edilen tipler yada kullanicilarin tanimladigi tipler olabilir Query paketi bu tipleri gerekli yerlerde kullanabilmeli yada tip kullanilmadan calisabilmelidir.
Asagida otomatik generate edilen tip tanimlari ornek olarak belirtilmistir.

#### a) Temel Tipler
```typescript
// Temel içerik tipi
export interface BaseContentrainType {
  ID: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'changed' | 'publish'
  scheduled: boolean
}

// Model ID'leri
export type ModelId = 'workitems' | 'workcategories' | /* diğer modeller */;
```

#### b) Model Interface'leri
```typescript
export interface IWorkItems extends BaseContentrainType {
  title: string
  image?: string
  description: string
  category: string
  order: number
  'category-data'?: IWorkCategories // İlişki alanı
}
```

#### c) Metadata Tanımları
```typescript
export const contentrainMetadata = {
  'workitems': {
    name: 'WorkItems',
    modelId: 'workitems',
    localization: true,
    type: 'JSON',
    createdBy: 'user',
    isServerless: false,
  }
  // ... diğer modeller
}
```

### 2. Model Yapısı (`__mocks__/models.json`)
Contentrain Model standartlarinin belirtildigi tum detaylarin oldugu ornek dosyadir.

```json
[
  {
    "id": "text",
    "label": "Text",
    "shortcutKey": "T",
    "type": "combination",
    "fields": [
      "single-line-text",
      "multi-line-text",
      "email",
      "url",
      "slug",
      "color"
    ],
    "disabled": false
  },
  {
    "id": "number",
    "label": "Number",
    "shortcutKey": "N",
    "type": "combination",
    "fields": [
      "integer",
      "decimal",
      "rating",
      "percent",
      "phone-number"
    ],
    "disabled": false
  }
]
```

## Alan (Field) Tipleri

### 1. Temel Alan Tipleri
- **Text**: Metin tabanlı alanlar
  - single-line-text
  - multi-line-text
  - email
  - url
  - slug
  - color

- **Number**: Sayısal alanlar
  - integer
  - decimal
  - rating
  - percent
  - phone-number

- **Boolean**: Mantıksal alanlar
  - checkbox
  - switch

- **Date**: Tarih alanları
  - date
  - date-time

### 2. Özel Alan Tipleri

#### a) Media Alanı
  assets.json dosyasinda yalnizca Contentrain Asset Manager uzerinden yuklenen medyalarin metadatasi bulunur.

```typescript
export interface ContentrainAsset {
  path: string
  mimetype: string
  size: number
  alt: string
  meta: {
    user: {
      name: string
      email: string
      avatar: string
    }
    createdAt: string
  }
}
```

#### b) İlişki (Relation) Alanı
```typescript
export interface ModelRelations {
  'workitems': {
    model: 'workcategories'
    type: 'one-to-one'
  }
}
```

## Alan Validasyonları ve Seçenekleri

### 1. Validasyonlar
```typescript
export interface ContentrainValidations {
  'required-field'?: ContentrainValidation
  'unique-field'?: ContentrainValidation
  'min-length'?: ContentrainValidation & { minLength: number }
  'max-length'?: ContentrainValidation & { maxLength: number }
}
```

### 2. Alan Seçenekleri
```typescript
export interface ContentrainFieldOptions {
  'title-field'?: ContentrainTitleFieldOption
  'default-value'?: ContentrainDefaultValueOption<string | number | boolean>
  'reference'?: ContentrainReferenceOption
}
```
## Content exapmles
### 1. Dil Tipleri
```json
[
  {
    "ID": "0c1b5726fbf6",
    "createdAt": "2024-10-13T09:47:51.000Z",
    "updatedAt": "2024-10-13T10:53:47.055Z",
    "status": "publish",
    "question": "Do you offer technical support and maintenance services after delivering the project?",
    "answer": "Yes, we provide ongoing technical support and maintenance services to ensure your product runs smoothly. Our support includes bug fixes, updates, and feature enhancements.",
    "order": 7,
    "scheduled": false
  },
  {
    "ID": "7d33292fa865",
    "createdAt": "2024-10-13T10:16:28.000Z",
    "updatedAt": "2024-10-13T11:03:34.276Z",
    "status": "publish",
    "question": "Can you integrate 3rd party app services into my existing project?",
    "answer": "Our team is skilled in integrating 3rd party solutions with existing systems. Whether it’s APIs or 3rd platforms we provide seamless integrations to enhance your digital ecosystem.",
    "order": 10,
    "scheduled": false
  },
]
```
## Çoklu Dil Desteği

### 1. Dil Tipleri
```typescript
export type AvailableLocale = 'en' | 'tr';

export interface LocaleContentMap {
  'workitems': WorkitemsLocales[]
  'workcategories': WorkcategoriesLocales[]
  // ... diğer modeller
}
```

### 2. Dil Doğrulayıcıları
```typescript
export function isValidLocale(locale: string): locale is AvailableLocale {
  return ['en', 'tr'].includes(locale);
}

export function isValidWorkitemsLocale(locale: string): locale is WorkitemsLocales {
  return ['en', 'tr'].includes(locale);
}
```

## Dosya Yapısı

```
contentrain/
├── models/
│   ├── metadata.json     # Model metadata tanımları
│   └── [modelID].json       # Field metadata tanimlari
├── [modelID]/[modelID].json # Localizaton olmayan contentler.
├── [modelID]/[lang].json # Localizaton localization olan modeller.
├── assets.json # Asset metadata verileri

```

## Ornek Bir Dosya Yapısı

contentrain/
├── models/
│ ├── metadata.json
│ ├── workitems.json
│ └── workcategories.json
├── workitems/
│ ├── en.json
│ └── tr.json
│ └── de.json
├── workcategories/
│ ├── en.json
│ └── tr.json
├── references/
│ └── references.json
└── assets.json
```

## Query Kullanım Örnekleri

### 1. Temel Sorgu
```typescript
const query = new ContentrainQuery({
  defaultLocale: 'en',
  basePath: '__mocks__/contentrain'
});

const results = await query
  .from('workitems')
  .locale('tr')
  .where('category', 'eq', 'cab37361e7e6')
  .include('category')
  .orderBy('order', 'asc')
  .get();
```

### 2. İlişkili Sorgu
```typescript
const results = await query
  .from('workitems')
  .include({
    category: {
      fields: ['category', 'order']
    }
  })
  .get();
```

### 3. Filtreleme ve Sayfalama
```typescript
// Basic query
const posts = await query
  .from('posts')
  .where('status', 'publish')
  .get()

// Complex query
const featuredPosts = await query
  .from('posts')
  .where('status', 'publish')
  .where('featured', true)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()

// Query with relations
const postsWithAuthor = await query
  .from('posts')
  .with('author')
  .where('status', 'publish')
  .get()

// Query with multiple conditions and types example
const searchPosts = await query<IPost>
  .from('posts')
  .where([
    ['status', 'publish'],
    ['category', 'technology'],
    ['title', 'startsWith', 'How to']
  ])
  .get()
```
## Onemli dikkat edilmesi gerekenler.

-  Tum testlerde root dizinde bulunan (`__mocks__/contentrain`) contentrain ornekleri kullanilacaktir.
-  Browserda dosya okuma islemleri icin native fetch file fetching yada import document from 'path' syntaxindan en dogrusu kullanilabilinir.
-  https://github.com/nuxt/content Bu paket sadece nuxt icin gelistirilen ornek bir pakettir. Contentrain Query tum modern web browser ve node ortamlarinda framework agnostik calisacaktir.

## Yapılacaklar Listesi

### Test Coverage
- ❌ Unit test suite
- ❌ Integration test suite
- ❌ E2E test suite
- ❌ Performance benchmark testleri
- ❌ Browser compatibility testleri
- ❌ Memory leak testleri

### Dokümantasyon
- ❌ Temel API dokümantasyonu
- ❌ Mimari dokümantasyonu
- ❌ API referans dokümanı
- ❌ Framework-specific örnekler
- ❌ Performance best practices
- ❌ Troubleshooting guide

### Performans İyileştirmeleri
- ❌ Memory cache optimizasyonları
- ❌ Build-time optimizasyonları
- ❌ Runtime query optimizasyonları
- ❌ Bundle size optimizasyonları
- ❌ Network request optimizasyonları
- ❌ Memory footprint optimizasyonları

### Güvenlik
- ❌ Input validation
- ❌ Query injection prevention
- ❌ Rate limiting
- ❌ Access control
- ❌ Data sanitization
- ❌ Error handling

### CI/CD
- ❌ Automated testing
- ❌ Code quality checks
- ❌ Performance monitoring
- ❌ Deployment automation
- ❌ Version management
- ❌ Release notes generation
```

Cursor Tum promptlarda bu dokumana bagli kalmak ve burayi kontrol ederek ilerlemelidir.

Öncelikli Özellikler:
Sadece browser desteği
Framework bağımsız yapı
Temel query operasyonları (where, include, orderBy, limit)
TypeScript desteği
Basit cache mekanizması
Cache Stratejisi:
Browser'da performans için Memory-first cache kullanabiliriz
İkincil storage olarak localStorage
Cache invalidation için basit bir timestamp mekanizması
3. Build Sistemi Önerisi:
TSUP kullanmayı öneriyorum çünkü:
TypeScript'i destekler
Çok hızlı build süreleri
Minimal konfigürasyon gerektirir
ESM ve CommonJS çıktıları otomatik üretir
Tree-shaking desteği var
Bundle size optimizasyonu yapıyor
Test Stratejisi:
Vitest ile unit testler (browser environment desteği var)
Temel query fonksiyonları için integration testler
Performance testleri (özellikle cache mekanizması için)
