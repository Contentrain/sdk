  private buildQuery(): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = 'SELECT m.*, t.* FROM ' + this.tableName + ' m';

    // Translation table join
    if (this.options.locale) {
      sql += ' LEFT JOIN ' + this.tableName + '_translations t ON m.id = t.id AND t.locale = ?';
      params.push(this.options.locale);
    } else {
      sql += ' LEFT JOIN ' + this.tableName + '_translations t ON m.id = t.id';
    }

    // WHERE clause
    if (this.filters.length > 0) {
      sql += ' WHERE ' + this.filters.map(filter => {
        const prefix = this.isTranslatedField(filter.field) ? 't.' : 'm.';
        params.push(...this.getFilterParams(filter));
        return this.buildFilterCondition(filter, prefix);
      }).join(' AND ');
    }

    // ORDER BY clause
    if (this.sorting.length > 0) {
      sql += ' ORDER BY ' + this.sorting.map(sort => {
        const prefix = this.isTranslatedField(sort.field) ? 't.' : 'm.';
        return `COALESCE(${prefix}${sort.field}, 0) ${sort.direction}`;
      }).join(', ');
    }

    // LIMIT and OFFSET
    if (this.pagination.limit) {
      sql += ' LIMIT ?';
      params.push(this.pagination.limit);
    }
    if (this.pagination.offset) {
      sql += ' OFFSET ?';
      params.push(this.pagination.offset);
    }

    return { sql, params };
  }
