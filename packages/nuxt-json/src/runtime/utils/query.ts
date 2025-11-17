import type { Content, LocalizedContent, QueryFilter, QuerySort } from '../../types';

export function applyFilter<T extends Content | LocalizedContent>(item: T, filter: QueryFilter<T>): boolean {
    const value = (item as any)[filter.field];
    const compareValue = filter.value as any;
    switch (filter.operator) {
        case 'eq': return value === compareValue;
        case 'ne': return value !== compareValue;
        case 'gt': return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue;
        case 'gte': return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue;
        case 'lt': return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue;
        case 'lte': return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue;
        case 'in': return Array.isArray(compareValue) && compareValue.includes(value);
        case 'nin': return Array.isArray(compareValue) && !compareValue.includes(value);
        case 'contains': return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue);
        case 'startsWith': return typeof value === 'string' && typeof compareValue === 'string' && value.startsWith(compareValue);
        case 'endsWith': return typeof value === 'string' && typeof compareValue === 'string' && value.endsWith(compareValue);
        default: return true;
    }
}

export function applyFilters<T extends Content | LocalizedContent>(items: T[], filters?: QueryFilter<T>[]): T[] {
    if (!filters || !filters.length) return items;
    return items.filter(item => filters.every(f => applyFilter(item, f)));
}

export function applySortChain<T extends Content | LocalizedContent>(a: T, b: T, sorts: QuerySort<T>[]): number {
    for (const { field, direction } of sorts) {
        const av = (a as any)[field];
        const bv = (b as any)[field];
        if (av === bv) continue;
        if (typeof av === 'number' && typeof bv === 'number') {
            const mod = direction === 'asc' ? 1 : -1;
            return av > bv ? mod : -mod;
        }
        if (typeof av === 'string' && typeof bv === 'string') {
            return direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
    }
    return 0;
}

export function sortItems<T extends Content | LocalizedContent>(items: T[], sorts?: QuerySort<T>[]): T[] {
    if (!sorts || !sorts.length) return items;
    return [...items].sort((a, b) => applySortChain(a, b, sorts));
}

export function paginate<T extends Content | LocalizedContent>(items: T[], limit: number, offset: number) {
    const total = items.length;
    return { slice: items.slice(offset, offset + limit), total };
}
