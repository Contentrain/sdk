# Reference Implementation

Bu klasör, SDK'nın orijinal implementasyonunu ve tasarım kararlarını içerir.
Yeni özellikler eklerken veya mevcut kodu değiştirirken bu implementasyona başvurun.

## Önemli Dosyalar

- `useContentrain.ts`: Query builder ve tip güvenliği implementasyonu
- `models.json`: Contentrain model yapısı ve validasyonlar
- `generate-types.mjs`: Tip üretimi ve dönüşüm mantığı
- `contentrain.ts`: Üretilen tip örnekleri ve yapısı
- `contentrain\**`: Contentrain içe üretilmeiş içerik örnekleri modeller vb..

## Anahtar Özellikler

1. Tip Üretimi:
   - Model -> Interface dönüşümü
   - Relation mapping
   - Validation desteği

2. Query Builder:
   - Type-safe sorgular
   - İlişki yükleme
   - Filtreleme ve sıralama

3. Validation:
   - Field validasyonları
   - Tip kontrolü
   - Runtime checks 