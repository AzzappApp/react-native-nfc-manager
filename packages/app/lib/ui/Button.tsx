import { forwardRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, textStyles } from '../../theme';
import PressableBackground from './PressableBackground';
import PressableOpacity from './PressableOpacity';
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
  const buttonProps = {
    testID: 'azzapp_Button_pressable-wrapper',
    accessibilityRole: 'button',
    style: [styles.root, variantStyles.root, style] as StyleProp<ViewStyle>,
    children: <Text style={[styles.label, variantStyles.label]}>{label}</Text>,
    ref: forwardedRef,
    ...props,
  } as const;

  switch (variant) {
    case 'secondary':
      return <PressableOpacity {...buttonProps} />;
    default:
      return (
        <PressableBackground highlightColor={colors.grey900} {...buttonProps} />
      );
  }
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
    label: {
      color: colors.black,
    },
  }),
} as const;
