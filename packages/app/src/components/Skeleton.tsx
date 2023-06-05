import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps } from 'react-native';

const Skeleton = ({ style }: ViewProps) => {
  const styles = useStyleSheet(styleSheet);
  return <View style={[styles.skelton, style]} />;
};
export default Skeleton;

const styleSheet = createStyleSheet(appearance => ({
  skelton: {
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey50,
  },
}));
