/* eslint-disable no-prototype-builtins */
import { isEqual } from 'lodash';
import { forwardRef, useLayoutEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type {
  TransitionableStyle,
  TransitionValues,
  ViewTransitionProps,
} from './helpers';
import type { ForwardedRef } from 'react';
import type { ViewStyle, View, TransformsStyle } from 'react-native';
import type { AnimatedStyleProp } from 'react-native-reanimated';

const ViewTransition = (
  {
    transitions,
    transitionDuration,
    disableAnimation,
    easing = 'linear',
    style,
    ...props
  }: ViewTransitionProps,
  ref: ForwardedRef<View>,
) => {
  const transitionsValues = useMemo(() => {
    const flatStyle = { ...StyleSheet.flatten(style) };
    const transitionsValues: TransitionValues = {};

    transitions.forEach(key => {
      transitionsValues[key] = flatStyle[key] as any;
      delete flatStyle[key];
    });
    return transitionsValues;
  }, [style, transitions]);

  const transitionStateSharedValue = useSharedValue(0);
  const transitionFrom = useSharedValue<TransitionValues>({
    ...transitionsValues,
  });
  const transitionTo = useSharedValue<TransitionValues>({
    ...transitionsValues,
  });
  useLayoutEffect(() => {
    if (!isEqual(transitionsValues, transitionTo.value)) {
      transitionTo.value = {
        ...transitionsValues,
      };
      transitionStateSharedValue.value = withTiming(
        1,
        {
          duration: transitionDuration,
          easing: EasingToEasingFunc[easing],
        },
        wasNotCanceled => {
          if (wasNotCanceled) {
            transitionFrom.value = {
              ...transitionsValues,
            };
            transitionStateSharedValue.value = 0;
          }
        },
      );
    }
  }, [
    easing,
    transitionDuration,
    transitionFrom,
    transitionStateSharedValue,
    transitionTo,
    transitionsValues,
  ]);

  const animatedStyles = useAnimatedStyle(() => {
    if (disableAnimation) {
      return transitionTo.value;
    }
    const style: AnimatedStyleProp<ViewStyle> = {};
    const keySet: Set<TransitionableStyle> = new Set();
    Object.keys(transitionFrom.value).forEach((key: any) => {
      keySet.add(key);
    });
    Object.keys(transitionTo.value).forEach((key: any) => {
      keySet.add(key);
    });
    keySet.forEach(key => {
      if (key === 'transform') {
        const transformsFrom = getTransformMap(transitionFrom.value[key]);
        const transformsTo = getTransformMap(transitionTo.value[key]);
        style[key] = Object.keys(transformsTo).map(key => ({
          [key]: interpolateStyleValue(
            transitionStateSharedValue.value,
            transformsFrom[key],
            transformsTo[key],
          ),
        })) as any;
      } else {
        style[key] = interpolateStyleValue(
          transitionStateSharedValue.value,
          transitionFrom.value?.[key],
          transitionTo.value?.[key],
        );
      }
    });

    return style;
  }, [
    transitionStateSharedValue,
    disableAnimation,
    transitionFrom,
    transitionTo,
  ]);

  return (
    <Animated.View
      ref={ref as any}
      style={[style, animatedStyles]}
      {...props}
    />
  );
};

export default forwardRef(ViewTransition);

const interpolateStyleValue = (
  progress: number,
  oldValue: any,
  newValue: any,
): any => {
  'worklet';
  if (oldValue === newValue) {
    return newValue;
  }
  if (typeof oldValue === 'number' || typeof newValue === 'number') {
    return interpolate(progress, [0, 1], [oldValue ?? 0, newValue ?? 0]);
  }
  const percent = /^[0-9.]+%$/;
  if (percent.test(oldValue) || percent.test(newValue)) {
    const numOld = oldValue ? parseFloat(oldValue.slice(0, -1)) : 0;
    const numNew = newValue ? parseFloat(newValue.slice(0, -1)) : 0;
    return `${interpolate(progress, [0, 1], [numOld ?? 0, numNew ?? 0])}%`;
  }
  const deg = /^[0-9.]+%deg$/;
  if (deg.test(oldValue) || deg.test(newValue)) {
    const numOld = oldValue ? parseFloat(oldValue.slice(0, -3)) : 0;
    const numNew = newValue ? parseFloat(newValue.slice(0, -3)) : 0;
    return `${interpolate(progress, [0, 1], [numOld ?? 0, numNew ?? 0])}deg`;
  }
  const rad = /^[0-9.]+%rad$/;
  if (rad.test(oldValue) || rad.test(newValue)) {
    const numOld = oldValue ? parseFloat(oldValue.slice(0, -3)) : 0;
    const numNew = newValue ? parseFloat(newValue.slice(0, -3)) : 0;
    return `${interpolate(progress, [0, 1], [numOld ?? 0, numNew ?? 0])}rad`;
  }
  return interpolateColor(progress, [0, 1], [oldValue, newValue]);
};

const getTransformMap = (
  value: TransformsStyle['transform'] | null | undefined,
) => {
  'worklet';
  return (value ?? []).reduce((transforms, transform) => {
    const key = Object.keys(transform)[0];
    transforms[key] = (transform as any)[key];
    return transforms;
  }, {} as Record<string, string>);
};

const EasingToEasingFunc = {
  'ease-in': Easing.in(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
  'ease-out': Easing.out(Easing.ease),
  ease: Easing.ease,
  linear: Easing.linear,
};
