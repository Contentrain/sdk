import type { ContentrainBaseModel } from '@contentrain/types';
import type { IndexingOptions } from './types';

export class Indexer {
  private indexes: Map<string, Map<string, Set<string>>> = new Map();
  private options: IndexingOptions;

  constructor(options: IndexingOptions) {
    this.options = options;
  }

  private createFieldIndex(field: string): Map<string, Set<string>> {
    const fieldIndex = new Map<string, Set<string>>();
    this.indexes.set(field, fieldIndex);
    return fieldIndex;
  }

  private getFieldIndex(field: string): Map<string, Set<string>> {
    let fieldIndex = this.indexes.get(field);
    if (!fieldIndex) {
      fieldIndex = this.createFieldIndex(field);
    }
    return fieldIndex;
  }

  indexDocument(document: ContentrainBaseModel): void {
    const { fields } = this.options;

    for (const field of fields) {
      const value = document[field];
      if (value !== undefined && value !== null) {
        const fieldIndex = this.getFieldIndex(field);
        const valueStr = String(value).toLowerCase();

        let documents = fieldIndex.get(valueStr);
        if (!documents) {
          documents = new Set<string>();
          fieldIndex.set(valueStr, documents);
        }
        documents.add(document.ID);
      }
    }
  }

  search(field: string, query: string): Set<string> {
    const fieldIndex = this.indexes.get(field);
    if (!fieldIndex)
      return new Set();

    const searchQuery = query.toLowerCase();
    const { fuzzy = false, minScore = 0.5 } = this.options.searchOptions || {};

    if (!fuzzy) {
      return fieldIndex.get(searchQuery) || new Set();
    }

    // Basit fuzzy arama implementasyonu
    const results = new Set<string>();
    for (const [value, documents] of fieldIndex.entries()) {
      const score = this.calculateSimilarity(searchQuery, value);
      if (score >= minScore) {
        documents.forEach(doc => results.add(doc));
      }
    }

    return results;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein mesafesi bazlı benzerlik hesaplama
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        }
        else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str1.length][str2.length];
  }

  clear(): void {
    this.indexes.clear();
  }

  getStats(): { [field: string]: { count: number } } {
    const stats: { [field: string]: { count: number } } = {};

    for (const [field, fieldIndex] of this.indexes.entries()) {
      stats[field] = {
        count: Array.from(fieldIndex.values()).reduce((acc, docs) => acc + docs.size, 0),
      };
    }

    return stats;
  }
}
