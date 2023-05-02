import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ViewProps } from 'react-native';

const Skeleton = ({ style }: ViewProps) => {
  const styles = useStyleSheet(stylesheet);
  return <View style={[styles.skelton, style]} />;
};
export default Skeleton;

const stylesheet = createStyleSheet(appearance => ({
  skelton: {
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey50,
  },
}));
