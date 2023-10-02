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

type CardFlipSwitchProps = ViewProps & {
  flipped: boolean;
  disabled: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  onFlip(): void;
};

export type CardFlipSwitchRef = {
  triggerFlip: () => void;
};

const CardFlipSwitch = forwardRef<CardFlipSwitchRef, CardFlipSwitchProps>(
  ({ flipped, disabled, front, back, onFlip, ...props }, ref) => {
    const flip = useSharedValue(flipped ? 1 : 0);
    const currentFlip = useSharedValue(!!flipped);

    const clockFlipDirection = useSharedValue(!!flipped);

    const { width: windowWidth } = useWindowDimensions();

    const cardRadius = COVER_CARD_RADIUS * windowWidth;

    useImperativeHandle(
      ref,
      () => {
        return {
          triggerFlip: () => {
            const nextValue = !currentFlip.value;
            clockFlipDirection.value = false;
            flip.value = withTiming(
              currentFlip.value ? 0 : 1,
              {
                duration: 1300,
                easing: Easing.out(Easing.back(1)),
              },
              animated => {
                if (animated && currentFlip.value !== flipped) {
                  runOnJS(onFlip)();
                }
                clockFlipDirection.value = nextValue;
              },
            );

            currentFlip.value = nextValue;
          },
        };
      },
      [clockFlipDirection, flip, currentFlip, flipped, onFlip],
    );

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
              ? [0, -180]
              : [currentFlip.value ? -360 : 0, -180],
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
                ? [180, 360]
                : [currentFlip.value ? 540 : 180, 360],
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
      .enabled(!disabled)
      .hitSlop({
        top: 0,
        bottom: 0,
        left: flipped ? 0 : -windowWidth / 2,
        right: flipped ? -windowWidth / 2 : 0,
      })
      .onStart(() => {
        flipStartValue.value = flip.value;
      })
      .onChange(e => {
        flip.value = Math.max(
          0,
          Math.min(flipStartValue.value - e.translationX / windowWidth, 1),
        );
      })
      .onEnd(e => {
        if (Math.abs(e.translationX) > windowWidth / 3) {
          flip.value = withTiming(
            currentFlip.value ? 0 : 1,
            {
              duration: 1000,
              easing: Easing.out(Easing.back(1)),
            },
            animated => {
              if (animated) {
                runOnJS(onFlip)();
              }
            },
          );
          const nextValue = !currentFlip.value;
          currentFlip.value = nextValue;
          clockFlipDirection.value = nextValue;
        } else {
          flip.value = withTiming(flipStartValue.value, {
            duration: 300,
            easing: Easing.out(Easing.back(1)),
          });
        }
      });

    return (
      <GestureDetector gesture={pan}>
        <View {...props}>
          <Animated.View
            style={[styles.front, frontStyle]}
            pointerEvents={flipped ? 'none' : 'box-none'}
          >
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
