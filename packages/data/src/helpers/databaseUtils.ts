/* eslint-disable guard-for-in */
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';

type ColumMappingOptions<T> = {
  parse?: (val: any) => T;
  serialize?: (val: T) => any;
};

export const createObjectMapper = <T>(
  options: {
    [K in keyof T]?: ColumMappingOptions<T[K]>;
  },
  modelSymbol: symbol,
) => ({
  parse<U>(object: U): U extends null | undefined ? null : T {
    if (!object) {
      return null as any;
    }
    const result: any = {};
    for (const key in object) {
      const modelKey = camelCase(key) as keyof T;
      const { parse } = options[modelKey] ?? {};
      result[modelKey] = parse ? parse(object[key]) : object[key];
    }
    result[modelSymbol] = true;
    return result;
  },
  serialize(model: Partial<T>): any {
    if (!model) {
      return null;
    }
    const result: Record<string, any> = {};
    for (const key in model) {
      const dbKey = snakeCase(key);
      const { serialize } = options[key] ?? {};
      result[dbKey] = serialize ? serialize(model[key] as any) : model[key];
    }
    return result;
  },

  createUpdate(
    table: string,
    updates: Partial<T>,
    selectKeys: Partial<T>,
  ): [string, any[]] {
    const updateEntries = Object.entries(this.serialize(updates));
    const updateClause = updateEntries.map(([key]) => `${key}=?`).join(',');
    const updateParams = updateEntries.map(([, value]) => value);
    const selectClause = Object.entries(this.serialize(selectKeys))
      .map(([key]) => `${key}=?`)
      .join(' AND ');
    const selectedParams = Object.entries(selectKeys).map(([, value]) => value);

    return [
      `UPDATE ${table} SET ${updateClause} WHERE ${selectClause}`,
      [...updateParams, ...selectedParams],
    ];
  },

  createInsert(table: string, data: T): [string, any[]] {
    const updateEntries = Object.entries(this.serialize(data));
    const rows = updateEntries.map(([key]) => `${key}`).join(',');
    const values = updateEntries.map(() => '?').join(',');
    const params = updateEntries.map(([, value]) => value);
    return [`INSERT INTO ${table} (${rows}) VALUES(${values})`, params];
  },
});

export const uuidMapping: ColumMappingOptions<string> = {
  parse: uuid => (uuid ? uuid.toString() : null),
};
