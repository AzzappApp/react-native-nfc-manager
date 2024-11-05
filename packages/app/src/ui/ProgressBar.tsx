import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import type { LayoutChangeEvent, ViewProps } from 'react-native';

type ProgressBarProps = ViewProps & { progress: number };

const ProgressBar = ({
  style,
  progress,
  accessibilityLabel,
}: ProgressBarProps) => {
  const [width, setWidth] = useState(300);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (width === 0) return { width: 0 };
    return {
      width: withTiming(progress * width),
    };
  });

  return (
    <View
      style={[styles.progressBar, style]}
      onLayout={onLayout}
      testID="progress-bar-container"
    >
      <Animated.View
        accessible
        style={[styles.progressBarInner, animatedStyle]}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}
        testID="progressbar"
      />
    </View>
  );
};
export default ProgressBar;

const BAR_HEIGHT = 3;
const styles = StyleSheet.create({
  progressBar: {
    backgroundColor: colors.grey900,
    height: BAR_HEIGHT,
  },
  progressBarInner: {
    height: BAR_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: BAR_HEIGHT / 2,
  },
});
