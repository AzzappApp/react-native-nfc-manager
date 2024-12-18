import LottieView from 'lottie-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
type FingerHintProps = {
  color: 'dark' | 'light';
  style?: ViewStyle;
};
const FingerHint = ({ color, style }: FingerHintProps) => {
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={
          color === 'dark'
            ? require('#assets/hint_hand_black.json')
            : require('#assets/hint_hand_white.json')
        }
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

export default memo(FingerHint);

export const FINGER_HINT_HEIGHT = 187.5;
export const FINGER_HINT_WIDTH = 150;

const styles = StyleSheet.create({
  container: {
    width: FINGER_HINT_WIDTH,
    height: FINGER_HINT_HEIGHT,
    pointerEvents: 'none',
    position: 'absolute',
  },
  lottie: {
    width: FINGER_HINT_WIDTH,
    height: FINGER_HINT_HEIGHT,
  },
});
