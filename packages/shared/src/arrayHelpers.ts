import { pseudoSinRandom } from './numberHelpers';

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

export const isNonNullArray = <T>(val: T[]): val is Array<Exclude<T, null>> =>
  Array.isArray(val) && val.every(t => t != null);

export function shuffle<T>(array: T[], seed: number) {
  const result = [...array];
  let m = array.length;
  let t;
  let i;

  while (m) {
    i = Math.floor(pseudoSinRandom(seed) * m--); // <-- MODIFIED LINE
    t = result[m];
    result[m] = result[i];
    result[i] = t;
    ++seed; // <-- ADDED LINE
  }

  return result;
}
