import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, textStyles } from '../../theme';
import type { ForwardedRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle, View } from 'react-native';

export type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
};

const Button = (
  { label, variant = 'primary', style, ...props }: ButtonProps,
  forwardedRef: ForwardedRef<View>,
) => {
  const variantStyles = stylesVariant[variant];
  return (
    <Pressable
      testID="azzapp_Button_pressable-wrapper"
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        styles.root,
        variantStyles.root,
        pressed && variantStyles.pressed,
        style,
      ]}
      ref={forwardedRef}
    >
      <Text style={[styles.label, variantStyles.label]}>{label}</Text>
    </Pressable>
  );
};

export default forwardRef(Button);

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  label: {
    ...textStyles.button,
  },
});

const stylesVariant = {
  primary: StyleSheet.create({
    root: {
      backgroundColor: colors.black,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    pressed: {
      backgroundColor: colors.grey900,
    },
    label: {
      color: '#fff',
    },
  }),
  secondary: StyleSheet.create({
    root: {
      borderWidth: 1,
      borderColor: colors.black,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    pressed: {
      opacity: 0.4,
    },
    label: {
      color: colors.black,
    },
  }),
} as const;
