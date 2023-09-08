type Entry<T> = Exclude<
  { [K in keyof T]: [K, T[K]] }[keyof T],
  null | undefined
>;

/**
 * Similar to Object.entries, but with a type-safe return value.
 * @param object The object to get entries from.
 * @returns An array of entries.
 */
export function typedEntries<T extends object>(object: T) {
  return Object.entries(object) as Array<Entry<T>>;
}

/**
 * Similar to Partial, but only makes the fields nullable.
 */
export type NullableFields<T> = {
  [K in keyof T]: T[K] | null;
};
