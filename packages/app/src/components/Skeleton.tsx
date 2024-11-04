import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps, LayoutChangeEvent } from 'react-native';

const Skeleton = ({ style }: ViewProps) => {
  const styles = useStyleSheet(styleSheet);
  const animationSharedValue = useSharedValue(-1);
  const widthSharedValue = useSharedValue(0);

  useEffect(() => {
    animationSharedValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false,
    );
  }, [animationSharedValue]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      widthSharedValue.value = event.nativeEvent.layout.width;
    },
    [widthSharedValue],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const width = widthSharedValue.value;
    return {
      transform: [
        {
          translateX: interpolate(
            animationSharedValue.value,
            [-1, 1],
            [-300, width > 300 ? width : 300],
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.skeleton, style]} onLayout={onLayout}>
      <Animated.View style={[styles.skeletonAnimation, animatedStyle]} />
    </View>
  );
};
export default Skeleton;

const styleSheet = createStyleSheet(appearance => ({
  skeleton: {
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey900,
    overflow: 'hidden',
  },
  skeletonAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: '100%',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
    opacity: 0.03,
  },
}));
