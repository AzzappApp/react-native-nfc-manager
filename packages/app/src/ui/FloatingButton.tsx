import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { ForwardedRef } from 'react';
import type { PressableProps, View, StyleProp, ViewStyle } from 'react-native';

export type FloatingButtonProps = Omit<PressableProps, 'style'> & {
  size?: number;
  variant?: 'grey' | 'normal'; //TODO: this variant does not exist in speficiation but some screen are still using a variation with grey.dont want to break everything
  style?: StyleProp<ViewStyle>;
};

const FloatingButton = (
  {
    onPress,
    size = FLOATING_BUTTON_SIZE,
    variant = 'normal',
    children,
    disabled = false,
    accessibilityRole = 'button',
    style,
    ...props
  }: FloatingButtonProps,
  ref: ForwardedRef<View>,
) => {
  const appearanceStyle = useVariantStyleSheet(computedStyle, variant);

  return (
    <Pressable
      onPress={!disabled ? onPress : undefined}
      style={({ pressed }) => [
        { minWidth: size, height: size, borderRadius: size / 2 },
        appearanceStyle.root,
        disabled && appearanceStyle.disabled,
        pressed && !disabled && appearanceStyle.pressed,
        style,
      ]}
      ref={ref}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export default forwardRef(FloatingButton);

export const FLOATING_BUTTON_SIZE = 50;

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 1,
    },
    disabled: {
      opacity: 0.3,
    },
    pressed: {
      opacity: 1,
      backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey800,
    },
  },
  normal: {
    root: {
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
      borderColor: appearance === 'light' ? colors.black : colors.white,
      borderWidth: 1,
    },
  },
  grey: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(14, 18, 22, 0.6)',
      opacity: 1,
    },
    pressed: {
      opacity: 1,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
  },
}));
