# @contentrain/nuxt-json

## 2.0.0

### Major Changes

- feat(nuxt-json): locale metadata, query utils refactor, error codes and removal of deprecated client composable

## 1.1.0

- Add Nuxt 4 compatibility metadata
- Update development dependencies to Nuxt 4.2.1 and tooling requirements
- Skip asset build when the content directory is not configured to avoid runtime errors

## 1.0.4

- Clean unnececary logs

## 1.0.3

- Storage to server assets fix 2

## 1.0.2

### Patch Changes

- Storage to server assets fix

## 1.0.1

### Patch Changes

- Storage to server assets

## 1.0.0

## 1.2.0

- Locale dizisi build aşamasında metadata'ya ekleniyor (`model.locales`) – lokalizasyon mevcut dillerin tespiti.
- Sunucu sorgu endpointinde filtre ve sıralama mantığı ortak utility'e taşındı (`runtime/utils/query.ts`).
- `useContentrainClient` composable kaldırıldı; `useContentrainModels` doğrudan API çağrıları ve kendi cache yapısı ile sadeleştirildi.
- Yeni hata kodları eklendi: `INVALID_URL_ERROR`, `INVALID_DATA_ERROR`, `INVALID_RELATION`, `RELATION_NOT_FOUND`.
- Nuxt 4 uyumluluk refactor'ü sonrası iç mimari temizlik.

- Relase Nuxt Json query builder module.
