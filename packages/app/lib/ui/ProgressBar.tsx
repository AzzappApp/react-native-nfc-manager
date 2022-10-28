import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import type { ViewProps } from 'react-native';

type ProgressBarProps = ViewProps & { progress: number };

const ProgressBar = ({
  style,
  progress,
  accessibilityLabel,
}: ProgressBarProps) => (
  <View style={[styles.progressBar, style]}>
    <View
      style={[styles.progressBarInner, { width: `${progress * 100}%` }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    />
  </View>
);
export default ProgressBar;

const styles = StyleSheet.create({
  progressBar: {
    backgroundColor: colors.grey100,
    height: 5,
  },
  progressBarInner: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 5,
    backgroundColor: colors.black,
  },
});
