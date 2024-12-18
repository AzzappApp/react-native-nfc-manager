import { interpolate, useDerivedValue } from 'react-native-reanimated';
import type { DerivedValue } from 'react-native-reanimated';

export const getAdjacentValuesWithDiff = <T>(
  index: number,
  values: T[],
): {
  prev: T | null;
  next: T | null;
  diff: number;
} => {
  'worklet';
  const prev = Math.floor(index);
  const next = Math.ceil(index);
  const diff = index - prev;
  return { prev: values[prev], next: values[next], diff };
};

export const useIndexInterpolation = <T>(
  index: DerivedValue<number>,
  values: T[],
  defaultValue: T,
  // @ts-expect-error - can't default T to number
  interpolationFunction: (
    value: number,
    inputRange: number[],
    outputRange: T[],
  ) => T = interpolate,
): DerivedValue<T> => {
  return useDerivedValue(() => {
    const { prev, next, diff } = getAdjacentValuesWithDiff(index.value, values);
    if (prev != null && next != null) {
      return interpolationFunction(diff, [0, 1], [prev, next]);
    }
    return prev ?? next ?? defaultValue;
  }, [index, values, defaultValue, interpolationFunction]);
};
