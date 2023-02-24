import { forwardRef, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, textStyles } from '../theme';
import PressableBackground from './PressableBackground';
import PressableOpacity from './PressableOpacity';
import type { ForwardedRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

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
    children: <Text style={[styles.label, variantStyles.label]}>{label}</Text>,
    accessibilityState: { disabled: props.disabled ?? false },
    ref: forwardedRef,
    ...props,
  } as const;

  const backgroundColor = useMemo(() => {
    if (props.disabled) {
      return colors.grey200;
    }
    const flatStyles = StyleSheet.flatten(style);
    if ((flatStyles as ViewStyle)?.backgroundColor) {
      return (flatStyles as ViewStyle).backgroundColor;
    }
    return variant === 'primary' ? colors.black : 'transparent';
  }, [props.disabled, style, variant]);

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidContainer, style, { backgroundColor }]}>
        <Pressable
          {...buttonProps}
          style={[styles.root, variantStyles.root, { backgroundColor }]}
          android_ripple={{
            borderless: false,
            foreground: true,
            color: colors.grey400,
          }}
        />
      </View>
    );
  } else if (variant === 'primary') {
    return (
      <PressableBackground
        highlightColor={colors.grey900}
        style={[styles.root, variantStyles.root, style, { backgroundColor }]}
        {...buttonProps}
      />
    );
  }
  return (
    <PressableOpacity
      style={[styles.root, variantStyles.root, style, { backgroundColor }]}
      {...buttonProps}
    />
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
  androidContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

const stylesVariant = {
  primary: StyleSheet.create({
    root: {
      paddingHorizontal: 20,
      height: 46,
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
      height: 46,
    },
    label: {
      color: colors.black,
    },
  }),
} as const;
