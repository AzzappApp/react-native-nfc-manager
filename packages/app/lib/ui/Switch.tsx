import { StyleSheet, Switch as RNSwitch, Text, View } from 'react-native';
import { colors, textStyles } from '../../theme';
import type { SwitchProps as RNSwitchProps } from 'react-native';

type SwitchProps = Omit<RNSwitchProps, 'onChange' | 'onValueChange'> & {
  label?: string;
  onValueChange?: (value: boolean) => void;
};

const Switch = ({
  label,
  thumbColor,
  trackColor,
  style,
  ...props
}: SwitchProps) => {
  const switchProps = {
    thumbColor: thumbColor ?? '#fff',
    trackColor: trackColor ?? { false: colors.grey, true: colors.orange },
    ...props,
  };
  return label ? (
    <View style={[styles.root, style]}>
      <RNSwitch {...switchProps} />
      <Text style={[textStyles.small, styles.text]}>{label}</Text>
    </View>
  ) : (
    <RNSwitch {...switchProps} style={style} />
  );
};

export default Switch;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 10,
    fontSize: 12,
  },
});
