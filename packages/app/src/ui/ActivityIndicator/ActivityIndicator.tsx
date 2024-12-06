import Lottie from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { StyleProp, ViewStyle } from 'react-native';

export type ActivityIndicatorProps = {
  style?: StyleProp<ViewStyle>;
  color?: 'black' | 'white';
  variant?: 'none' | 'video';
};

const ActivityIndicator = ({
  style,
  color,
  variant = 'none',
}: ActivityIndicatorProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  color = color ?? (colorScheme === 'dark' ? 'white' : 'black');

  const styles = useVariantStyleSheet(indicatorStyleSheet, variant);

  return (
    <Lottie
      source={
        variant === 'video'
          ? require('./animation_video.json')
          : require('./animation.json')
      }
      colorFilters={[
        {
          keypath: 'Shape',
          color: color === 'white' ? '#fff' : '#000',
        },
      ]}
      autoPlay
      loop
      hardwareAccelerationAndroid
      style={[styles.loading, style]}
    />
  );
};

export const indicatorStyleSheet = createVariantsStyleSheet(_appearance => ({
  default: {
    loading: {},
  },
  none: {
    loading: {
      width: 51,
      height: 40,
    },
  },
  video: {
    loading: {
      width: 150,
      height: 150,
    },
  },
}));

export const DelayedActivityIndicator = ({
  delay,
  ...props
}: ActivityIndicatorProps & { delay: number }) => {
  const [visible, setVisible] = useState(false);

  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
      opacity.value = 1;
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, { duration: 500 }),
    };
  });

  return (
    visible && (
      <Animated.View style={style}>
        <ActivityIndicator {...props} />
      </Animated.View>
    )
  );
};

export const ACTIVITY_INDICATOR_WIDTH = 40;

export const ACTIVITY_INDICATOR_HEIGHT = 51;

export default ActivityIndicator;
