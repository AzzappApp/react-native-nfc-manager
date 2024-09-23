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
    <View style={styles.container}>
      <LottieView
        source={
          color === 'dark'
            ? require('#assets/hint_hand_black.json')
            : require('#assets/hint_hand_white.json')
        }
        autoPlay
        loop
        style={[styles.lottie, style]}
      />
    </View>
  );
};

export default memo(FingerHint);

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 187.5,
    position: 'absolute',
    pointerEvents: 'none',
  },
  lottie: {
    width: 150,
    height: 187.5,
  },
});
