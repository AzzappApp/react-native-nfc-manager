import { forwardRef } from 'react';
import { Platform, Pressable, View, useColorScheme } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import ActivityIndicator from './ActivityIndicator';
import PressableBackground from './PressableBackground';
import PressableOpacity from './PressableOpacity';
import type { ForwardedRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export type ButtonProps = PressableProps & {
  label: string;
  variant?: 'little_round' | 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
};

const Button = (
  {
    label,
    variant = 'primary',
    loading,
    disabled,
    style,
    ...props
  }: ButtonProps,
  forwardedRef: ForwardedRef<View>,
) => {
  const colorScheme = useColorScheme();

  const highlightColor =
    variant === 'primary'
      ? colorScheme === 'light'
        ? colors.grey900
        : colors.grey100
      : undefined;
  const variantStyles = useVariantStyleSheet(computedStyles, variant);
  const buttonProps = {
    accessibilityRole: 'button',
    children: loading ? (
      <ActivityIndicator color={colorScheme === 'light' ? 'white' : 'black'} />
    ) : (
      <Text variant="button" style={variantStyles.label} numberOfLines={1}>
        {label}
      </Text>
    ),
    accessibilityState: {
      disabled: disabled ?? false,
      busy: loading ?? false,
    },
    disabled: disabled ?? loading ?? false,
    ref: forwardedRef,
    ...props,
  } as const;

  if (Platform.OS === 'android') {
    return (
      <View style={[variantStyles.androidContainer, style]}>
        <Pressable
          {...buttonProps}
          style={[
            variantStyles.root,
            style,
            disabled && variantStyles.disabled,
          ]}
          android_ripple={{
            borderless: false,
            foreground: true,
            color: highlightColor,
          }}
        />
      </View>
    );
  } else if (variant === 'primary') {
    return (
      <PressableBackground
        highlightColor={highlightColor!}
        style={[variantStyles.root, style, disabled && variantStyles.disabled]}
        {...buttonProps}
      />
    );
  }
  return (
    <PressableOpacity
      style={[variantStyles.root, style, disabled && variantStyles.disabled]}
      {...buttonProps}
    />
  );
};

export default forwardRef(Button);

export const BUTTON_HEIGHT = 47;

const computedStyles = createVariantsStyleSheet(appearance => ({
  default: {
    root: {
      height: BUTTON_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 20,
    },
    label: {
      flexWrap: 'nowrap',
    },
    androidContainer: {
      borderRadius: 12,
      overflow: 'hidden',
    },
  },
  primary: {
    root: {
      backgroundColor: appearance === 'light' ? colors.black : colors.white,
    },
    label: {
      color: appearance === 'light' ? colors.white : colors.black,
    },
    disabled: {
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey900,
    },
  },
  secondary: {
    root: {
      backgroundColor: 'transparent',
      borderColor: appearance === 'light' ? colors.black : colors.white,
      borderWidth: 1,
    },
    label: {
      color: appearance === 'light' ? colors.black : colors.white,
    },
    disabled: {
      color: appearance === 'light' ? colors.grey200 : colors.grey900,
      borderColor: appearance === 'light' ? colors.grey400 : colors.grey900,
      backgroundColor: 'transparent',
    },
  },
  little_round: {
    root: {
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
      borderColor: appearance === 'light' ? colors.black : colors.white,
      borderWidth: 1,
      height: 29,
      borderRadius: 29,
      paddingHorizontal: 15,
    },
    label: {
      color: appearance === 'light' ? colors.black : colors.white,
    },
    disabled: {
      color: appearance === 'light' ? colors.grey200 : colors.grey900,
      borderColor: appearance === 'light' ? colors.grey400 : colors.grey900,
      backgroundColor: 'transparent',
    },
  },
}));
