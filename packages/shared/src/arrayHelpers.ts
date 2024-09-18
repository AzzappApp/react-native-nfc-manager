import { pseudoSinRandom } from './numberHelpers';
import { simpleHash } from './stringHelpers';

export type ArrayItemType<T> = T extends ReadonlyArray<infer U> ? U : never;

/**
 * An helper function that filters out null and undefined values from an array
 * @deprecated Use `array.filter(n => n !== null) or array.filter(n => n!==undefined)` instead
 */
export const convertToNonNullArray = <T>(val: T[]) =>
  val.filter(t => t !== null && t !== undefined);

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

/**
 * Swap two elements in an array
 * @param arr The array
 * @param index1 The index of the first element to swap
 * @param index2 The index of the second element to swap
 * @returns a copy of the array with the two elements swapped
 */
export const swap = <T>(arr: T[], index1: number, index2: number): T[] => {
  arr = arr.slice();
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
  return arr;
};
