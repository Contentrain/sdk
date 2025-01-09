import type { QueryOperator, WhereCondition } from '../types/query';

export const operators = {
  where: {
    eq: (value: any, compareValue: any) => value === compareValue,
    ne: (value: any, compareValue: any) => value !== compareValue,
    gt: (value: any, compareValue: any) => value > compareValue,
    lt: (value: any, compareValue: any) => value < compareValue,
    gte: (value: any, compareValue: any) => value >= compareValue,
    lte: (value: any, compareValue: any) => value <= compareValue,
    in: (value: any, compareValue: any[]) => compareValue.includes(value),
    nin: (value: any, compareValue: any[]) => !compareValue.includes(value),
    exists: (value: any) => value !== undefined && value !== null,
    startsWith: (value: string, compareValue: string) => value.startsWith(compareValue),
    endsWith: (value: string, compareValue: string) => value.endsWith(compareValue),
    contains: (value: string, compareValue: string) => value.includes(compareValue),
  },

  evaluateCondition(data: any, condition: WhereCondition): boolean {
    const [field, operatorOrValue, value] = condition;

    // Simple equality check
    if (condition.length === 2) {
      return this.where.eq(data[field], operatorOrValue);
    }

    // Complex operator check
    const operator = operatorOrValue as QueryOperator;
    if (operator in this.where) {
      return this.where[operator](data[field], value);
    }

    return false;
  },

  evaluateConditions(data: any, conditions: WhereCondition[]): boolean {
    return conditions.every(condition => this.evaluateCondition(data, condition));
  },
};
