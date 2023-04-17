import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import type { StyleProp, ViewStyle, LayoutRectangle } from 'react-native';

type SkeletonProps = {
  style: StyleProp<ViewStyle>;
  highLightColor?: string;
  duration?: number;
};

// TODO docs and tests once this component is production ready
const Skeleton = ({
  style,
  highLightColor = colors.grey200,
  duration = 1100,
}: SkeletonProps) => {
  const shared = useSharedValue(0);
  const [layout, setLayout] = useState<LayoutRectangle>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    shared.value = withRepeat(withTiming(1, { duration }), Infinity);
  }, [duration, shared]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shared.value,
          [0, 1],
          [layout ? -layout.width : 0, layout ? layout.width : 0],
        ),
      },
    ],
  }));
  const colorScheme = useColorScheme();
  return (
    <View
      style={[style, styles.container]}
      onLayout={event => setLayout(event.nativeEvent.layout)}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyles]}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          colors={[
            colorScheme === 'light' ? colors.grey50 : colors.grey900,
            highLightColor,
            colorScheme === 'light' ? colors.grey50 : colors.grey900,
          ]}
        />
      </Animated.View>
    </View>
  );
};
export default Skeleton;

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
