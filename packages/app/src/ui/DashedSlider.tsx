import { LinearGradient } from 'expo-linear-gradient';
import range from 'lodash/range';
import { memo, useMemo } from 'react';
import {
  Platform,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useThrottledCallback } from 'use-debounce';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type DashedSliderProps = ViewProps & {
  variant?: 'default' | 'small';
  value: SharedValue<number>;
  min: number;
  max: number;
  step: number;
  interval?: number;
  onChange: (value: number) => void;
};

const gradientLocation = [0.0, 0.5, 1];
const gradientStart = { x: 0, y: 1 };
const gradientEnd = { x: 1, y: 1 };

const MemoizedLinearGradient = memo(
  LinearGradient,
  (prevProps, nextProps) =>
    prevProps.colors === nextProps.colors &&
    prevProps.locations === nextProps.locations &&
    prevProps.start === nextProps.start &&
    prevProps.end === nextProps.end,
);

const getPrecision = (a: number) => {
  'worklet';
  if (!isFinite(a)) return 0;
  let e = 1;
  let p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
};

export const getClampedValue = (
  currentValue: number,
  step: number,
  min: number,
  max: number,
) => {
  'worklet';
  const multiplier = 10 ** getPrecision(step);
  const value = (currentValue - min) * multiplier;
  const modulo = step * multiplier;
  const clampedValue = clamp(
    Math.floor(value - (value % modulo)) / multiplier,
    0,
    max - min,
  );
  return min + clampedValue;
};

const DashedSlider = ({
  variant = 'default',
  value: pan,
  min,
  max,
  step,
  onChange,
  interval: chosenInterval,
  style,
  ...props
}: DashedSliderProps) => {
  const windowWidth = useWindowDimensions().width;

  const interval = chosenInterval ?? Math.floor((windowWidth - 80) / 60);

  const computedInterval = interval * (variant === 'small' ? 0.5 : 1);

  const animationOffsetValue = useSharedValue(0);

  const debouncedUpdate = useThrottledCallback(
    onChange,
    // delay in ms
    200,
    { trailing: false, leading: false },
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      animationOffsetValue.value = pan.value;
    })
    .onUpdate(e => {
      const dval = step * (e.translationX / computedInterval);
      const newValue = Math.min(
        Math.max(animationOffsetValue.value - dval, min),
        max,
      );

      pan.value = newValue;
      runOnJS(Platform.OS === 'android' ? debouncedUpdate : onChange)(newValue);
    })
    .onEnd(() => {
      const clamped = getClampedValue(pan.value, step, min, max);
      pan.value = withTiming(
        clamped,
        {
          duration: 50,
          easing: Easing.out(Easing.exp),
        },
        () => {
          runOnJS(onChange)(clamped);
        },
      );
    });

  const steps = range(min, max, step);
  const size = steps.length * computedInterval;
  const colorScheme = useColorScheme();
  const colorsGradient = useMemo(
    () =>
      colorScheme === 'light'
        ? ['rgba(245, 245, 246, 0)', colors.grey50, 'rgba(245, 245, 246, 0)']
        : ['rgba(0, 0, 0, 0)', '#1E1E1E', 'rgba(0, 0, 0, 0)'],
    [colorScheme],
  );

  const styles = useStyleSheet(styleSheet);

  const dashContainerStyle = useAnimatedStyle(() => ({
    gap: computedInterval - 1,
    transform: [
      {
        translateX: interpolate(
          pan.value,
          [min, max],
          [0, -size],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <MemoizedLinearGradient
      colors={colorsGradient}
      locations={gradientLocation}
      start={gradientStart}
      end={gradientEnd}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          {...props}
          style={[
            style,
            styles.container,
            variant === 'small' && { width: '50%' },
          ]}
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: pan.value }}
        >
          <Animated.View style={[styles.dashContainer, dashContainerStyle]}>
            {steps.map(step => (
              <View key={step} style={styles.dash} />
            ))}
            <View style={styles.dash} />
          </Animated.View>
          <View style={styles.thumb} />
        </Animated.View>
      </GestureDetector>
    </MemoizedLinearGradient>
  );
};

export default DashedSlider;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 23,
    overflow: 'hidden',
    width: '100%',
  },
  dashContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 6,
    left: '50%',
    width: '100%',
  },
  dash: {
    height: 12,
    width: 1,
    borderRadius: 3,
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.white,
  },
  thumb: {
    height: 20,
    width: 6,
    borderRadius: 3,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
}));
