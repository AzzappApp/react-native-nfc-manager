import { useEffect } from 'react';
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

const CardFlipSwitch = ({
  flipped,
  disabled,
  front,
  back,
  onFlip,
  ...props
}: CardFlipSwitchProps) => {
  const flip = useSharedValue(flipped ? 1 : 0);
  const currentFlip = useSharedValue(flipped ? 1 : 0);

  const { width: windowWidth } = useWindowDimensions();

  const cardRadius = COVER_CARD_RADIUS * windowWidth;

  useEffect(() => {
    flip.value = withTiming(flipped ? 1 : 0, {
      duration: 1300,
      easing: Easing.out(Easing.back(1)),
    });

    currentFlip.value = flipped ? 1 : 0;
  }, [flipped, flip, currentFlip]);

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
          [currentFlip.value === 1 ? -360 : 0, -180],
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
        {
          rotateY: `${interpolate(
            flip.value,
            [0, 1],
            [currentFlip.value === 1 ? 540 : 180, 360],
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
        runOnJS(onFlip)();
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
};

const styles = StyleSheet.create({
  front: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  back: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
});

export default CardFlipSwitch;
