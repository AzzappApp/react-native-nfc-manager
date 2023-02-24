import clamp from 'lodash/clamp';
import range from 'lodash/range';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { getPrecision } from '@azzapp/shared/lib/numberHelpers';
import { colors } from '../theme';
import type { StyleProp, ViewStyle } from 'react-native';

type DashedSliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_INTERVAL = 6;

const DashedSlider = ({
  value,
  min,
  max,
  step,
  onChange,
  style,
  interval = DEFAULT_INTERVAL,
}: DashedSliderProps) => {
  const pan = useRef(new Animated.Value(value)).current;

  const isPaning = useRef(false);
  const propsRef = useRef({ value, min, max, step, interval });
  propsRef.current = { value, min, max, step, interval };
  if (!isPaning) {
    pan.setValue(value);
  }

  const animationOffsetValue = useRef(0);
  const animatedEvent = useRef(
    Animated.event([pan], {
      useNativeDriver: false,
    }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant() {
        const { value } = propsRef.current;
        animationOffsetValue.current = value;
        isPaning.current = true;
      },
      onPanResponderMove: (e, gestureState) => {
        const { min, max, step, interval } = propsRef.current;
        const dval = step * (gestureState.dx / interval);
        animatedEvent(clamp(animationOffsetValue.current - dval, min, max));
      },
      onPanResponderRelease() {
        isPaning.current = false;
        pan.setValue(propsRef.current.value);
      },
    }),
  ).current;

  useEffect(() => {
    const multiplier = 10 ** getPrecision(step);
    const id = pan.addListener(({ value }) => {
      value = (value - min) * multiplier;
      const modulo = step * multiplier;
      const clampedValue = clamp(
        Math.floor(value - (value % modulo)) / multiplier,
        0,
        max - min,
      );
      onChange(clampedValue + min);
    });
    return () => {
      pan.removeListener(id);
    };
  }, [max, min, onChange, pan, step]);

  const steps = range(min, max, step);
  const size = steps.length * interval;

  return (
    <View
      {...panResponder.panHandlers}
      style={[style, styles.container]}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
    >
      <Animated.View
        style={[
          styles.dashContainer,
          {
            transform: [
              {
                translateX: pan.interpolate({
                  inputRange: [min, max],
                  outputRange: [0, -size],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {steps.map(step => (
          <View
            key={step}
            style={[styles.dash, { marginRight: interval - 1 }]}
          />
        ))}
        <View style={styles.dash} />
      </Animated.View>
      <View style={styles.thumb} />
    </View>
  );
};

export default DashedSlider;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  dashContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 14,
    left: '50%',
  },
  dash: {
    backgroundColor: colors.grey,
    height: 12,
    width: 1,
    borderRadius: 3,
  },
  thumb: {
    backgroundColor: colors.grey,
    height: 20,
    width: 2,
    borderRadius: 3,
  },
});
