import Lottie from 'lottie-react-native';
import { useColorScheme } from 'react-native';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export type ActivityIndicatorProps = {
  style?: StyleProp<ViewStyle>;
  containerProps?: ViewProps;
  color?: 'black' | 'white';
};

function ActivityIndicator({
  style,
  containerProps,
  color,
}: ActivityIndicatorProps) {
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
      containerProps={containerProps}
      style={[style, { width: 51, height: 40 }]}
    />
  );
}

export default ActivityIndicator;
