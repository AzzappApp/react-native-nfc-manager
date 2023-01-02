import { forwardRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import type { ForwardedRef } from 'react';
import type { ViewStyle, StyleProp, PressableProps, View } from 'react-native';

export type FloatingButtonProps = {
  onPress?: () => void;
  size?: number;
  variant?: 'default' | 'light' | 'white';
  style?: StyleProp<ViewStyle>;
  nativeID?: string;
  children: PressableProps['children'];
  accessibilityLabel?: string;
};

const FloatingButton = (
  {
    onPress,
    size = 50,
    style,
    children,
    variant = 'default',
    nativeID,
    accessibilityLabel,
  }: FloatingButtonProps,
  ref: ForwardedRef<View>,
) => {
  const variantStyles = stylesVariant[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { minWidth: size, height: size, borderRadius: size / 2 },
        styles.root,
        variantStyles.root,
        pressed && variantStyles.pressed,
        style,
      ]}
      nativeID={nativeID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      ref={ref}
    >
      {children}
    </Pressable>
  );
};

export default forwardRef(FloatingButton);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const stylesVariant = {
  default: StyleSheet.create({
    root: {
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pressed: {
      opacity: 0.8,
    },
  }),
  light: StyleSheet.create({
    root: {
      backgroundColor: 'rgba(255,255,255,0.8)',
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
  }),
  white: StyleSheet.create({
    root: {
      backgroundColor: '#FFF',
    },
    pressed: {
      backgroundColor: colors.grey50,
    },
  }),
} as const;
