import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { StyleProp, ViewStyle } from 'react-native';

type SeparationProps = {
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

const Separation = (props: SeparationProps) => {
  const { style, small } = props;
  const styles = useStyleSheet(styleSheet);
  return <View style={[{ height: small ? 1 : 30 }, styles.separator, style]} />;
};

const styleSheet = createStyleSheet(appearance => ({
  separator: {
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
}));

export default Separation;
