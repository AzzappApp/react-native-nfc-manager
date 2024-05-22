import type { Matrix4 } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

export const ScaleFactor = (matrix: SharedValue<Matrix4>): number => {
  'worklet';
  return (
    1 / Math.sqrt(Math.pow(matrix.value[0], 2) + Math.pow(matrix.value[1], 2))
  );
};
