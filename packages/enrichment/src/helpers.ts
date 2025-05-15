import type {
  ApiResult,
  EnrichedData,
  EnrichedDataFieldExpr,
  EnrichedDataFieldPath,
} from './types';

export const firstDefined = async <T>(
  items: T[],
  fn: (item: T) => Promise<ApiResult | null>,
): Promise<Partial<ApiResult>> => {
  for (const item of items) {
    const res = await fn(item);
    if (res?.data && Object.keys(res.data).length > 0) {
      return res;
    }
  }
  return {};
};

const getFieldValue = (
  data: EnrichedData,
  path: EnrichedDataFieldPath,
): unknown => {
  const [section, key] = path.split('.') as ['contact' | 'profile', string];
  return data[section]?.[key as keyof (typeof data)[typeof section]];
};

export const evaluateExpr = (
  data: EnrichedData,
  expr: EnrichedDataFieldExpr,
): boolean => {
  const isMeaningful = (val: unknown): boolean => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return !!val.trim();
    if (Array.isArray(val)) return val.length > 0;
    return true;
  };

  if (typeof expr === 'string') {
    return isMeaningful(getFieldValue(data, expr));
  }
  if (typeof expr === 'function') {
    try {
      return expr(data);
    } catch {
      return false;
    }
  }
  if ('all' in expr) return expr.all.every(e => evaluateExpr(data, e));
  if ('any' in expr) return expr.any.some(e => evaluateExpr(data, e));
  if ('not' in expr) return !evaluateExpr(data, expr.not);
  return false;
};

export const extractSingleJsonObject = <T>(text: string): T | null => {
  const startIndexes = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') startIndexes.push(i);
  }

  for (const start of startIndexes) {
    let depth = 0;
    for (let end = start; end < text.length; end++) {
      if (text[end] === '{') depth++;
      else if (text[end] === '}') depth--;

      if (depth === 0) {
        const candidate = text.slice(start, end + 1);
        try {
          const parsed = JSON.parse(candidate);
          return parsed;
        } catch {
          continue;
        }
      }
    }
  }

  return null;
};

export const describeDependsOn = (expr: EnrichedDataFieldExpr): string => {
  if (typeof expr === 'string') {
    return expr;
  }
  if (typeof expr === 'function') {
    return '[function]';
  }
  if ('all' in expr) {
    return `all(${expr.all.map(describeDependsOn).join(', ')})`;
  }
  if ('any' in expr) {
    return `any(${expr.any.map(describeDependsOn).join(', ')})`;
  }
  if ('not' in expr) {
    return `not(${describeDependsOn(expr.not)})`;
  }
  return '[unknown]';
};

export const extractFieldPaths = (
  expr: EnrichedDataFieldExpr,
): EnrichedDataFieldPath[] => {
  if (typeof expr === 'string') {
    return [expr];
  }
  if (typeof expr === 'function') {
    return [];
  }
  if ('all' in expr) {
    return expr.all.flatMap(extractFieldPaths);
  }
  if ('any' in expr) {
    return expr.any.flatMap(extractFieldPaths);
  }
  if ('not' in expr) {
    return extractFieldPaths(expr.not);
  }
  return [];
};
