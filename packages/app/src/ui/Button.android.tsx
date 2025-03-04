import { forwardRef } from 'react';
import { useColorScheme, View } from 'react-native';
import { Pressable as PressableGestureHandler } from 'react-native-gesture-handler';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import ActivityIndicator from './ActivityIndicator';
import type { ForwardedRef, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { PressableProps } from 'react-native-gesture-handler';

export type ButtonProps = PressableProps & {
  label: ReactNode;
  variant?: 'little_round_inverted' | 'little_round' | 'primary' | 'secondary';
  appearance?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  rightElement?: ReactNode;
  leftElement?: ReactNode;
  textStyle?: TextStyle;
};

// We use gesture handler as temporary solution for Android when there is a transform (via keyboard for example) on the parent view
// that causes the button to not be clickable. This is a workaround.
const Button = (
  {
    label,
    variant = 'primary',
    appearance,
    loading,
    disabled,
    style,
    rightElement,
    textStyle,
    leftElement,
    ...props
  }: ButtonProps,
  forwardedRef: ForwardedRef<View>,
) => {
  const colorScheme = useColorScheme();

  appearance = appearance ?? colorScheme ?? 'light';

  const highlightColor =
    variant === 'primary'
      ? appearance === 'light'
        ? colors.grey900
        : colors.grey100
      : undefined;
  const variantStyles = useVariantStyleSheet(
    computedStyles,
    variant,
    appearance,
  );

  let color: 'black' | 'white' = variant === 'primary' ? 'white' : 'black';

  if (appearance === 'dark') {
    color = variant === 'primary' ? 'black' : 'white';
  }

  const buttonProps = {
    accessibilityRole: 'button',

    accessibilityState: {
      disabled: disabled ?? false,
      busy: loading ?? false,
    },
    disabled: disabled ?? loading ?? false,
    ref: forwardedRef,
    ...props,
  } as const;

  return (
    <PressableGestureHandler
      {...buttonProps}
      onPress={props.onPress}
      android_ripple={{
        borderless: false,
        foreground: true,
        color: highlightColor,
      }}
      style={[variantStyles.root, style, disabled && variantStyles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={variantStyles.labelContainer}>
          {leftElement}
          <Text
            variant="button"
            style={[variantStyles.label, textStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightElement}
        </View>
      )}
    </PressableGestureHandler>
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
      borderCurve: 'continuous',
      paddingHorizontal: 20,
      overflow: 'hidden',
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 5,
    },
    label: {
      flexWrap: 'nowrap',
      lineHeight: 18,
    },
    androidContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 5,
      borderRadius: 12,
      overflow: 'hidden',
    },
    androidNoPadding: {
      padding: 0,
      overflow: 'hidden',
      height: undefined,
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
    androidNoPadding: {
      padding: 1, //for border
      overflow: 'hidden',
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
    androidNoPadding: {
      padding: 1, //for border
      overflow: 'hidden',
    },
  },
  little_round_inverted: {
    root: {
      backgroundColor: appearance === 'light' ? colors.black : colors.white,
      borderColor: appearance === 'light' ? colors.white : colors.black,
      borderWidth: 1,
      height: 29,
      borderRadius: 29,
      paddingHorizontal: 15,
    },
    label: {
      color: appearance === 'light' ? colors.white : colors.black,
    },
    disabled: {
      color: appearance === 'light' ? colors.grey900 : colors.grey200,
      borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
      backgroundColor: 'transparent',
    },
    androidNoPadding: {
      padding: 1, //for border
      overflow: 'hidden',
    },
  },
}));
