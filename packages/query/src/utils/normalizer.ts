const TABLE_PREFIX = 'tbl_';
const CAMEL_CASE_REGEX = /([a-z0-9])([A-Z])/g;
const PASCAL_CASE_REGEX = /([A-Z])([A-Z][a-z])/g;
const KEBAB_CASE_REGEX = /-/g;

function normalizeTableName(modelId: string): string {
  // 1. Snake case dönüşümü
  const snakeCase = modelId
    .replace(CAMEL_CASE_REGEX, '$1_$2')
    .replace(PASCAL_CASE_REGEX, '$1_$2')
    .replace(KEBAB_CASE_REGEX, '_')
    .toLowerCase();

  // 2. Özel karakter kontrolü
  const normalized = snakeCase.replace(/[^a-z0-9_]/g, '_');

  // 3. Tablo öneki ekle
  return `${TABLE_PREFIX}${normalized}`;
}

export { normalizeTableName };
