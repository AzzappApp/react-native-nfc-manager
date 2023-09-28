import Lottie from 'lottie-react-native';
import { useColorScheme } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type ActivityIndicatorProps = {
  style?: StyleProp<ViewStyle>;
  color?: 'black' | 'white';
};

function ActivityIndicator({ style, color }: ActivityIndicatorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  color = color ?? (colorScheme === 'dark' ? 'white' : 'black');
  return (
    <Lottie
      source={require('./animation.json')}
      colorFilters={[
        {
          keypath: 'Shape',
          color: color === 'white' ? '#fff' : '#000',
        },
      ]}
      autoPlay
      loop
      hardwareAccelerationAndroid
      style={[style, { width: 51, height: 40 }]}
    />
  );
}

export const ACTIVITY_INDICATOR_WIDTH = 40;

export const ACTIVITY_INDICATOR_HEIGHT = 51;

export default ActivityIndicator;
