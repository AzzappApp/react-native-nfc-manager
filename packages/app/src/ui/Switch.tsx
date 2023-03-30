import { useMemo } from 'react';
import { StyleSheet, Switch as RNSwitch, Text, View } from 'react-native';
import { colors, textStyles } from '#theme';
import { createId } from '#helpers/idHelpers';
import type { SwitchProps as RNSwitchProps } from 'react-native';

type SwitchProps = Omit<RNSwitchProps, 'onChange' | 'onValueChange'> & {
  label?: string;
  onValueChange?: (value: boolean) => void;
  switchStyle?: RNSwitchProps['style'];
};

const Switch = ({
  label,
  thumbColor,
  trackColor,
  style,
  switchStyle,
  ...props
}: SwitchProps) => {
  const switchProps = {
    thumbColor: thumbColor ?? '#fff',
    trackColor: trackColor ?? { false: colors.grey, true: colors.black },
    ...props,
  };
  const id = useMemo(() => createId(), []);
  return label ? (
    <View style={[styles.root, style]}>
      <RNSwitch
        {...switchProps}
        accessibilityLabelledBy={id}
        style={switchStyle}
      />
      <Text style={styles.text} nativeID={id}>
        {label}
      </Text>
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
    ...textStyles.small,
    marginLeft: 10,
    fontSize: 12,
  },
});
