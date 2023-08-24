import { pseudoSinRandom } from './numberHelpers';

export type ArrayItemType<T> = T extends ReadonlyArray<infer U> ? U : never;

/**
 * An helper function that filters out null and undefined values from an array
 */
export const convertToNonNullArray = <T>(
  val: T[],
): Array<Exclude<T, null | undefined>> => val.filter(t => t != null) as any;

/**
 * And helper function that returns a shuffled version of the given array using the given seed
 */
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
