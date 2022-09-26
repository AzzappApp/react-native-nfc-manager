import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, textStyles } from '../../theme';
import type { ForwardedRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle, View } from 'react-native';

export type ButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

const Button = (
  { label, style, ...props }: ButtonProps,
  forwardedRef: ForwardedRef<View>,
) => (
  <Pressable
    testID="azzapp_Button_pressable-wrapper"
    accessibilityRole="button"
    {...props}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.buttonPressed,
      style,
    ]}
    ref={forwardedRef}
  >
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

export default forwardRef(Button);

const styles = StyleSheet.create({
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonPressed: {
    backgroundColor: colors.grey900,
  },
  label: {
    ...textStyles.button,
    color: '#fff',
  },
});
