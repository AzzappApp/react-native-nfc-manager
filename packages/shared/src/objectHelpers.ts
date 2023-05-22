type Entry<T> = Exclude<
  { [K in keyof T]: [K, T[K]] }[keyof T],
  null | undefined
>;

export function typedEntries<T extends object>(object: T) {
  return Object.entries(object) as Array<Entry<T>>;
}
