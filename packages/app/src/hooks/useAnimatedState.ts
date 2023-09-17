import { useEffect } from 'react';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import type {
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

type AnimatedStateConfig =
  | (WithSpringConfig & { kind: 'spring' })
  | (WithTimingConfig & { kind?: 'timing' });

const useAnimatedState = (
  state: boolean | number,
  config?: AnimatedStateConfig,
) => {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = typeof state === 'boolean' ? (state ? 1 : 0) : state;
  }, [state, value]);

  const transition = useDerivedValue(() => {
    switch (config?.kind) {
      case 'spring':
        return withSpring(value.value, config);
      default:
        return withTiming(value.value, config);
    }
  }, [value]);
  return transition;
};

export default useAnimatedState;
