import Lottie from 'lottie-react-native';
import { useColorScheme } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverLoadingIndicatorProps = {
  width: number;
  style?: StyleProp<ViewStyle>;
  color?: 'black' | 'white';
};

function CoverLoadingIndicator({
  width,
  style,
  color,
}: CoverLoadingIndicatorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  color = color ?? (colorScheme === 'dark' ? 'white' : 'black');
  const borderRadius = width * COVER_CARD_RADIUS;
  const height = width / COVER_RATIO;
  return (
    <Lottie
      source={
        color === 'white'
          ? require('./coverLoadingAnimation.json')
          : require('./coverLoadingAnimationDark.json')
      }
      autoPlay
      loop
      hardwareAccelerationAndroid
      style={[{ borderRadius, width, height, overflow: 'hidden' }, style]}
    />
  );
}

export default CoverLoadingIndicator;
