/**
 * return the precition of a number (number of digit after the dot)
 */
export function getPrecision(a: number) {
  if (!isFinite(a)) return 0;
  let e = 1;
  let p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
}

/**
 * A pseudo random number generator that takes a seed and returns a number between 0 and 1.
 * base on sin function
 * @param seed The seed to use.
 * @returns A number between 0 and 1.
 */
export function pseudoSinRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}
