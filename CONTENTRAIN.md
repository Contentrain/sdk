# Contentrain Dokümantasyonu

## 1. Mimari Yapı

### 1.1 Dizin Yapısı
```plaintext
contentrain/
├── models/
│   ├── metadata.json     # Model tanımlamaları
│   └── [modelId].json    # Model alan tanımlamaları
└── [modelId1]/           # localization true Her model için içerik klasörü en tr de vb dil kodlari olur.
    ├── tr.json          # Türkçe içerikler (localization: true ise)
    ├── en.json          # İngilizce içerikler (localization: true ise)
└── [modelId2]/           #localization false model için içerik klasörü
    └── [modelId2].json   # İçerikler (localization: false ise)
```

### 1.2 Model Metadata (metadata.json)
```json
[
  {
    "name": "ModelName", // PascalCase formatında
    "modelId": "model-id", // kebab-case formatında
    "localization": true, // Dil desteği
    "type": "JSON", // Veri tipi
    "createdBy": "user", // Oluşturan
    "isServerless": false // Sunucusuz mod
  }
]
```

### 1.3 Model Fields ([modelId].json)
```json
[
  {
    "name": "Alan Adı", // Görünen ad
    "fieldId": "alan-id", // Benzersiz ID
    "modelId": "model-id", // Bağlı olduğu model
    "componentId": "text", // Alan tipi
    "fieldType": "string", // Veri tipi
    "validations": {}, // Doğrulama kuralları
    "options": {} // Alan seçenekleri
  }
]
```

## 2. Sistem Alanları

Her modelde bulunması gereken zorunlu sistem alanları:

```json
[
  {
    "name": "ID",
    "fieldId": "ID",
    "componentId": "single-line-text",
    "fieldType": "string",
    "system": true,
    "validations": {
      "required-field": {
        "value": true
      }
    }
  },
  {
    "name": "createdAt",
    "fieldId": "createdAt",
    "componentId": "date",
    "fieldType": "date",
    "system": true,
    "validations": {
      "required-field": {
        "value": true
      }
    }
  },
  {
    "name": "updatedAt",
    "fieldId": "updatedAt",
    "componentId": "date",
    "fieldType": "date",
    "system": true,
    "validations": {
      "required-field": {
        "value": true
      }
    }
  },
  {
    "name": "status",
    "fieldId": "status",
    "componentId": "single-line-text",
    "fieldType": "string",
    "system": true,
    "validations": {
      "required-field": {
        "value": true
      }
    }
  }
]
```

## 3. Veri Tipleri ve Bileşenler

### 3.1 String Veri Tipi
- **single-line-text**: Tek satır metin
- **multi-line-text**: Çok satır metin
- **email**: E-posta adresi
- **url**: Web adresi
- **slug**: SEO dostu URL
- **color**: Renk seçici
- **json**: JSON verisi
- **md-editor**: Markdown editörü
- **rich-text-editor**: Zengin metin editörü

### 3.2 Number Veri Tipi
- **integer**: Tam sayı
- **decimal**: Ondalıklı sayı
- **rating**: Değerlendirme
- **percent**: Yüzde
- **phone-number**: Telefon numarası

### 3.3 Boolean Veri Tipi
- **checkbox**: Onay kutusu
- **switch**: Anahtar

### 3.4 Date Veri Tipi
- **date**: Tarih
- **date-time**: Tarih ve saat

### 3.5 Media Veri Tipi
- **media**: Medya dosyası

### 3.6 Relation Veri Tipi
- **one-to-one**: Bire bir ilişki
- **one-to-many**: Bire çok ilişki

## 4. Validasyonlar

### 4.1 Required Field
```json
{
  "validations": {
    "required-field": {
      "value": true
    }
  }
}
```
Açıklama: Alan boş bırakılamaz

### 4.2 Unique Field
```json
{
  "validations": {
    "unique-field": {
      "value": true
    }
  }
}
```
Açıklama: Aynı değere sahip başka bir kayıt olamaz

### 4.3 Input Range Field
```json
{
  "validations": {
    "input-range-field": {
      "value": true,
      "form": {
        "number-of-stars": {
          "min": 1,
          "max": 10
        }
      }
    }
  }
}
```
Açıklama: Belirtilen sayı aralığında değer kabul eder

## 5. Alan Seçenekleri

### 5.1 Title Field
```json
{
  "options": {
    "title-field": {
      "value": true
    }
  }
}
```
Açıklama: İlişkilerde ID yerine bu alanın değeri görüntülenir

### 5.2 Default Value
```json
{
  "options": {
    "default-value": {
      "value": true,
      "form": {
        "default-value": {
          "value": "varsayılan değer"
        }
      }
    }
  }
}
```
Açıklama: Form alanı için varsayılan değer belirler

### 5.3 Number of Stars
```json
{
  "options": {
    "number-of-stars": {
      "value": true,
      "form": {
        "number-of-stars": {
          "min": 1,
          "max": 5
        }
      }
    }
  }
}
```
Açıklama: Rating alanı için yıldız sayısını belirler

### 5.4 Reference
```json
{
  "options": {
    "reference": {
      "value": true,
      "form": {
        "reference": {
          "value": "referenced-model-id"
        }
      }
    }
  }
}
```
Açıklama: İlişki kurulacak modeli belirler

## 6. Veri Tipleri (fieldType)

### 6.1 Temel Tipler
- **string**: Metin verileri
- **number**: Sayısal veriler
- **boolean**: Mantıksal veriler
- **array**: Dizi verileri
- **date**: Tarih verileri
- **media**: Medya dosyaları
- **relation**: İlişki verileri

## 7. Bileşen Tipleri (componentId)

### 7.1 Metin Bileşenleri
- **single-line-text**: Tek satır metin
- **multi-line-text**: Çok satır metin
- **rich-text-editor**: Zengin metin editörü
- **markdown-editor**: Markdown editörü
- **email**: E-posta adresi
- **url**: Web adresi
- **slug**: SEO dostu URL
- **color**: Renk seçici
- **json**: JSON verisi

### 7.2 Sayısal Bileşenler
- **integer**: Tam sayı
- **decimal**: Ondalıklı sayı
- **rating**: Değerlendirme
- **percent**: Yüzde
- **phone-number**: Telefon numarası

### 7.3 Seçim Bileşenleri
- **checkbox**: Onay kutusu
- **switch**: Anahtar
- **select**: Tekli seçim
- **multi-select**: Çoklu seçim

### 7.4 Tarih Bileşenleri
- **date**: Tarih
- **date-time**: Tarih ve saat

### 7.5 Medya Bileşenleri
- **media**: Resim, video, dosya yükleme

### 7.6 İlişki Bileşenleri
- **one-to-one**: Bire bir ilişki
- **one-to-many**: Bire çok ilişki

## 8. Validasyonlar

### 8.1 Temel Validasyonlar
```json
{
  "validations": {
    "required-field": {
      "value": true
    },
    "unique-field": {
      "value": true
    }
  }
}
```

### 8.2 Sayısal Validasyonlar
```json
{
  "validations": {
    "input-range-field": {
      "value": true,
      "form": {
        "number-of-stars": {
          "min": 1,
          "max": 10
        }
      }
    }
  }
}
```

## 9. İlişki Yapısı

### 9.1 Bire Bir İlişki
```json
{
  "name": "Category",
  "fieldId": "category",
  "modelId": "posts",
  "componentId": "one-to-one",
  "fieldType": "relation",
  "options": {
    "reference": {
      "value": true,
      "form": {
        "reference": {
          "value": "categories"
        }
      }
    }
  }
}
```

### 9.2 Bire Çok İlişki
```json
{
  "name": "Tags",
  "fieldId": "tags",
  "modelId": "posts",
  "componentId": "one-to-many",
  "fieldType": "relation",
  "options": {
    "reference": {
      "value": true,
      "form": {
        "reference": {
          "value": "tags"
        }
      }
    }
  }
}
```

## 10. İçerik Yapısı

### 10.1 Dil Destekli İçerik (tr.json/en.json)
```json
[
  {
    "ID": "unique-uuid",
    "title": "İçerik Başlığı",
    "createdAt": "2024-01-13T10:00:00.000Z",
    "updatedAt": "2024-01-13T10:00:00.000Z",
    "status": "publish"
  }
]
```

### 10.2 Dil Desteksiz İçerik ([modelId].json)
```json
[
  {
    "ID": "unique-uuid",
    "image": "/path/to/image.jpg",
    "order": 1,
    "createdAt": "2024-01-13T10:00:00.000Z",
    "updatedAt": "2024-01-13T10:00:00.000Z",
    "status": "publish"
  }
]
```

## 11. Model Oluşturma Adımları

1. **Metadata Tanımlama**
   - [ ] Model adı ve ID belirleme
   - [ ] Dil desteği kararı
   - [ ] metadata.json güncelleme

2. **Alan Tanımlama**
   - [ ] Gerekli alanları belirleme
   - [ ] Alan tipleri seçimi
   - [ ] Validasyon kuralları
   - [ ] İlişki tanımları

3. **İçerik Oluşturma**
   - [ ] Doğru dizin yapısı
   - [ ] Dil dosyaları (gerekiyorsa)
   - [ ] Zorunlu alanlar
   - [ ] İlişki referansları

4. **Kontrol ve Test**
   - [ ] Tüm validasyonlar
   - [ ] İlişki bütünlüğü
   - [ ] Dil senkronizasyonu

## 12. Asset Yönetimi
## 8. Asset Yönetimi

### 8.1 Asset Yapısı (assets.json)
```json
[
  {
    "path": "public/image.svg",
    "mimetype": "image/svg+xml",
    "size": 5574,
    "alt": "Görsel açıklaması",
    "meta": {
      "user": {
        "name": "Kullanıcı Adı",
        "email": "kullanici@email.com",
        "avatar": "avatar_url"
      },
      "createdAt": "2024-01-13T10:00:00.000Z"
    }
  }
]
```

### 8.2 Asset Tipleri
- **Görseller**: SVG, PNG, JPG, JPEG, GIF
- **Dokümanlar**: PDF, DOC, DOCX
- **Medya**: MP4, MP3, WAV
- **Diğer**: JSON, XML, CSV

### 8.3 Asset Yönetimi Kuralları
1. **Dosya İsimlendirme**
   - Benzersiz timestamp öneki
   - Küçük harfler ve tire kullanımı
   - Özel karakter kullanımından kaçınma

2. **Metadata Yönetimi**
   - Alt text tanımı
   - Kullanıcı bilgileri
   - Oluşturma tarihi
   - Dosya boyutu ve tipi

3. **Organizasyon**
   - Tüm assetler `public/` dizininde
   - Otomatik timestamp ile versiyon kontrolü
   - Alt text ile SEO optimizasyonu

4. **Kullanım**
```typescript
// Asset URL'i oluşturma
const assetUrl = `/${asset.path}`
```
// Alt text kullanımı
<img :src="assetUrl" :alt="asset.alt">
```

5. **Best Practices**
   - SVG tercih edilmeli
   - Optimize edilmiş görseller
   - Anlamlı alt metinler
   - Versiyon kontrolü için timestamp
```
