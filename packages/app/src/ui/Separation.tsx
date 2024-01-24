import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

type SeparationProps = {
  small?: boolean;
};

const Separation = (props: SeparationProps) => {
  const styles = useStyleSheet(styleSheet);
  return <View style={[{ height: props.small ? 1 : 30 }, styles.separator]} />;
};

const styleSheet = createStyleSheet(appearance => ({
  separator: {
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.black,
  },
}));

export default Separation;
