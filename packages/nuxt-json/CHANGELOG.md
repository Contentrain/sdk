# @contentrain/nuxt-json

## 2.0.0

### Major Changes

- Breaking: `useContentrainClient` composable removed (simplified to API + `useContentrainModels`).
- Feature: Locale list injected into metadata during build (`model.locales`).
- Refactor: Shared filter & sort utilities (`runtime/utils/query.ts`).
- Feature: New error codes (`INVALID_URL_ERROR`, `INVALID_DATA_ERROR`, `INVALID_RELATION`, `RELATION_NOT_FOUND`).
- Internal: Nuxt 4 compatibility adjustments, type generation stability improvements.

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

### Initial Release

- Release Nuxt JSON query builder module.
