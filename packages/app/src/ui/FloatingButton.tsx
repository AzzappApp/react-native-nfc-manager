import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { ForwardedRef } from 'react';
import type {
  ViewStyle,
  StyleProp,
  PressableProps,
  View,
  AccessibilityRole,
  AccessibilityValue,
} from 'react-native';

export type FloatingButtonProps = {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'grey' | 'normal'; //TODO: this variant does not exist in speficiation but some screen are still using a variation with grey.dont want to break everything
  nativeID?: string;
  disabled?: boolean;
  children: PressableProps['children'];
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityValue?: AccessibilityValue;
};

const FloatingButton = (
  {
    onPress,
    size = 50,
    style,
    variant = 'normal',
    children,
    nativeID,
    disabled = false,
    accessibilityRole = 'button',
    accessibilityLabel,
    accessibilityHint,
    accessibilityValue,
  }: FloatingButtonProps,
  ref: ForwardedRef<View>,
) => {
  const appearanceStyle = useVariantStyleSheet(computedStyle, variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { minWidth: size, height: size, borderRadius: size / 2 },
        appearanceStyle.root,
        disabled && appearanceStyle.disabled,
        pressed && appearanceStyle.pressed,
        style,
      ]}
      nativeID={nativeID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityValue={accessibilityValue}
      ref={ref}
    >
      {children}
    </Pressable>
  );
};

export default forwardRef(FloatingButton);

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
      borderColor: appearance === 'light' ? colors.black : colors.white,
      borderWidth: 1,
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
  normal: {},
  grey: {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderColor: 'transparent',
      borderWidth: 0,
      opacity: 1,
    },
    disabled: {
      opacity: 0.3,
    },
    pressed: {
      opacity: 1,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
  },
}));
