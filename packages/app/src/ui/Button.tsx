import { forwardRef } from 'react';
import { Platform, Pressable, useColorScheme, View } from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import ActivityIndicator from './ActivityIndicator';
import PressableBackground from './PressableBackground';
import PressableOpacity from './PressableOpacity';
import type { ForwardedRef, ReactNode } from 'react';
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type ButtonProps = PressableProps & {
  label: ReactNode;
  variant?: 'little_round_inverted' | 'little_round' | 'primary' | 'secondary';
  appearance?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  textStyle?: TextStyle;
};

const Button = (
  {
    label,
    variant = 'primary',
    appearance: appearanceProp,
    loading,
    disabled,
    style,
    leftElement,
    rightElement,
    textStyle,
    ...props
  }: ButtonProps,
  forwardedRef: ForwardedRef<View>,
) => {
  const colorScheme = useColorScheme();

  const appearance = appearanceProp ?? colorScheme ?? 'light';

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
    children: loading ? (
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
      <View
        style={[
          variantStyles.androidContainer,
          style,
          variantStyles.androidNoPadding,
        ]}
      >
        <Pressable
          {...buttonProps}
          style={[
            variantStyles.root,
            style,
            disabled && variantStyles.disabled,
          ]}
        />
      </View>
    );
  } else if (variant === 'primary') {
    return (
      <PressableBackground
        highlightColor={highlightColor!}
        style={[variantStyles.root, style, disabled && variantStyles.disabled]}
        disabledOpacity={1}
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
      borderCurve: 'continuous',
      paddingHorizontal: 15,
      overflow: 'hidden',
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 5,
    },
    label: {
      flexWrap: 'nowrap',
    },
    androidContainer: {
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
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey800,
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
