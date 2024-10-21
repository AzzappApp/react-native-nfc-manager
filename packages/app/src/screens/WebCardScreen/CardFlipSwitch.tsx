import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardFlipSwitchProps = ViewProps & {
  flipped: boolean;
  disabled: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  onFlip(): void;
};

export type CardFlipSwitchRef = {
  triggerFlip: () => void;
  animationRunning: SharedValue<boolean>;
};

const CardFlipSwitch = forwardRef<CardFlipSwitchRef, CardFlipSwitchProps>(
  ({ flipped, disabled, front, back, onFlip, ...props }, ref) => {
    const flip = useSharedValue(flipped ? 1 : 0);

    const animationRunning = useSharedValue(false);

    const currentFlip = useSharedValue(!!flipped);

    const clockFlipDirection = useSharedValue(!!flipped);

    const startLeft = useSharedValue(false);

    const { width: windowWidth } = useWindowDimensions();

    const cardRadius = COVER_CARD_RADIUS * windowWidth;

    useImperativeHandle(ref, () => {
      return {
        triggerFlip: () => {
          animationRunning.value = true;
          const nextValue = !currentFlip.value;
          startLeft.value = false;
          clockFlipDirection.value = false;
          flip.value = withTiming(
            currentFlip.value ? 0 : 1,
            {
              duration: 1300,
              easing: Easing.out(Easing.back(1)),
            },
            animated => {
              if (animated) {
                runOnJS(onFlip)();
              }
              if (animated) {
                currentFlip.value = nextValue;
                clockFlipDirection.value = nextValue;
              }

              animationRunning.value = false;
            },
          );

          currentFlip.value = nextValue;
        },
        animationRunning,
      };
    }, [
      animationRunning,
      currentFlip,
      startLeft,
      clockFlipDirection,
      flip,
      onFlip,
    ]);

    const frontStyle = useAnimatedStyle(() => ({
      borderRadius: interpolate(
        flip.value,
        [0, 0.1, 0.9, 1],
        [0, cardRadius, cardRadius, 0],
      ),
      transform: [
        { perspective: 900 },
        {
          rotateY: `${interpolate(
            flip.value,
            [0, 1],
            clockFlipDirection.value
              ? [startLeft.value ? 360 : 0, 180]
              : [currentFlip.value ? -360 : 0, startLeft.value ? 180 : -180],
          )}deg`,
        },
        {
          scale: interpolate(flip.value, [0, 0.5, 1], [1, 0.7, 1]),
        },
      ],
    }));

    const backStyle = useAnimatedStyle(() => {
      return {
        borderRadius: interpolate(
          flip.value,
          [0, 0.1, 0.9, 1],
          [0, cardRadius, cardRadius, 0],
        ),
        transform: [
          { perspective: -900 },
          {
            rotateY: `${interpolate(
              flip.value,
              [0, 1],
              clockFlipDirection.value
                ? [startLeft.value ? 180 : 540, 360]
                : [currentFlip.value ? 540 : 180, startLeft.value ? 0 : 360],
            )}deg`,
          },
          {
            scale: interpolate(flip.value, [0, 0.5, 1], [1, 0.7, 1]),
          },
        ],
      };
    });

    const flipStartValue = useSharedValue(flip.value);

    const pan = Gesture.Pan()
      .enabled(!disabled && !animationRunning.value)

      .onStart(event => {
        startLeft.value = event.absoluteX < windowWidth / 2;
        flipStartValue.value = Math.abs(flip.value);
      })
      .onChange(e => {
        flip.value = Math.max(
          0,
          Math.min(
            (Math.round(flipStartValue.value) === 1 && e.translationX < 0) ||
              (Math.round(flipStartValue.value) === 0 && e.translationX > 0)
              ? flipStartValue.value + e.translationX / windowWidth
              : flipStartValue.value - e.translationX / windowWidth,
            1,
          ),
        );
      })
      .onEnd(e => {
        if (Math.abs(e.translationX) > windowWidth / 3) {
          animationRunning.value = true;
          flip.value = withTiming(
            currentFlip.value ? 0 : 1,
            {
              duration: 1000,
              easing: Easing.out(Easing.back(1)),
            },
            () => {
              runOnJS(onFlip)();

              const nextValue = !currentFlip.value;
              currentFlip.value = nextValue;
              clockFlipDirection.value = nextValue;
              animationRunning.value = false;
            },
          );
        } else {
          animationRunning.value = true;
          flip.value = withTiming(
            flipStartValue.value,
            {
              duration: 300,
              easing: Easing.out(Easing.back(1)),
            },
            () => {
              animationRunning.value = false;
            },
          );
        }
      });
    return (
      <GestureDetector gesture={pan}>
        <View {...props}>
          <Animated.View style={[styles.front, frontStyle]}>
            {front}
          </Animated.View>
          <Animated.View
            style={[styles.back, backStyle]}
            pointerEvents={flipped ? 'box-none' : 'none'}
          >
            {back}
          </Animated.View>
        </View>
      </GestureDetector>
    );
  },
);

CardFlipSwitch.displayName = 'CardFlipSwitch';

const styles = StyleSheet.create({
  front: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  back: {
    height: '100%',
    width: '100%',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
});

export default CardFlipSwitch;
