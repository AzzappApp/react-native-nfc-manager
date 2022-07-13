import clamp from 'lodash/clamp';

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

export const lerp = ([start, end]: [number, number], value: number) =>
  start * (1 - value) + end * value;

export const invlerp = ([start, end]: [number, number], value: number) =>
  clamp((value - start) / (end - start), 0, 1);

export const interpolate = (
  inputRange: [number, number],
  outputRange: [number, number],
  value: number,
) => lerp(outputRange, invlerp(inputRange, value));
