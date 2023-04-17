import MaskedView from '@react-native-masked-view/masked-view';
import clamp from 'lodash/clamp';
import range from 'lodash/range';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getPrecision } from '@azzapp/shared/numberHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps } from 'react-native';

type DashedSliderProps = ViewProps & {
  variant?: 'default' | 'small';
  value: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  onChange: (value: number) => void;
};

const DEFAULT_INTERVAL = 6;

const DashedSlider = ({
  variant = 'default',
  value,
  min,
  max,
  step,
  onChange,
  interval = DEFAULT_INTERVAL,
  style,
  ...props
}: DashedSliderProps) => {
  const appearanceStyle = useStyleSheet(computedStyle);
  const pan = useRef(new Animated.Value(value)).current;
  const computedInterval = interval * (variant === 'small' ? 0.5 : 1);

  const isPaning = useRef(false);
  const propsRef = useRef({ value, min, max, step, computedInterval });
  propsRef.current = { value, min, max, step, computedInterval };
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
        const { min, max, step, computedInterval } = propsRef.current;
        const dval = step * (gestureState.dx / computedInterval);
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
  const size = steps.length * computedInterval;

  return (
    <MaskedView
      maskElement={
        <LinearGradient
          colors={['transparent', colors.grey50, 'transparent']}
          locations={[0.0, 0.5, 1]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
        />
      }
    >
      <View
        {...props}
        {...panResponder.panHandlers}
        style={[
          style,
          styles.container,
          variant === 'small' && { width: '50%' },
        ]}
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
              style={[
                styles.dash,
                appearanceStyle.dash,
                { marginRight: computedInterval - 1 },
              ]}
            />
          ))}
          <View style={[styles.dash, appearanceStyle.dash]} />
        </Animated.View>
        <View style={[styles.thumb, appearanceStyle.thumb]} />
      </View>
    </MaskedView>
  );
};

export default DashedSlider;
const computedStyle = createStyleSheet(appearance => ({
  thumb: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  dash: {
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.white,
  },
}));
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
    width: '100%',
  },
  dash: {
    backgroundColor: colors.grey200,
    height: 12,
    width: 1,
    borderRadius: 3,
  },
  thumb: {
    height: 20,
    width: 6,
    borderRadius: 3,
  },
});
