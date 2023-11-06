import { StyleSheet, View } from 'react-native';
import { colors, textStyles } from '#theme';
import Text from './Text';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type SeparationProps = {
  children: ReactNode;
  style?: ViewStyle;
};

const Separation = (props: SeparationProps) => {
  const { children, style } = props;

  return (
    <View style={[styles.separation, style]}>
      <Text style={[styles.text, textStyles.xsmall]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  separation: {
    backgroundColor: colors.grey100,
    borderRadius: 12,
    paddingVertical: 7,
  },
  text: {
    color: colors.grey600,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default Separation;
