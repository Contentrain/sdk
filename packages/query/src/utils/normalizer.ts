export function normalizeTableName(name: string): string {
  // Tire ve alt çizgileri tutarlı hale getir
  const normalized = name.replace(/[-_]/g, '_');
  return `tbl_${normalized}`;
}

export function normalizeTranslationTableName(name: string): string {
  // Tire ve alt çizgileri tutarlı hale getir
  const normalized = name.replace(/[-_]/g, '_');
  return `tbl_${normalized}_translations`;
}
