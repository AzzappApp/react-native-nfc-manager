export type ArrayItemType<T> = T extends ReadonlyArray<infer U> ? U : never;

export const convertToNonNullArray = <T>(
  val: T[],
): Array<Exclude<T, null | undefined>> => val.filter(t => t != null) as any;

export const objectToArray = (
  object: any,
  compareFn?: (a: unknown, b: unknown) => number,
) => {
  const values = Object.values(object);

  if (compareFn) {
    return values.sort(compareFn);
  }
  return values;
};
