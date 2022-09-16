export type ArrayItemType<T> = T extends ReadonlyArray<infer U> ? U : never;

export const convertToNonNullArray = <T>(
  val: T[],
): Array<Exclude<T, null | undefined>> => val.filter(t => t != null) as any;
