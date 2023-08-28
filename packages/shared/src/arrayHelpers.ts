import { pseudoSinRandom } from './numberHelpers';
import { simpleHash } from './stringHelpers';

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
export function shuffle<T>(array: T[], seed: number | string) {
  const result = [...array];
  let m = array.length;
  let t;
  let i;

  let s = typeof seed === 'string' ? simpleHash(seed) : seed;
  while (m) {
    i = Math.floor(pseudoSinRandom(s) * m--); // <-- MODIFIED LINE
    t = result[m];
    result[m] = result[i];
    result[i] = t;
    ++s; // <-- ADDED LINE
  }

  return result;
}
