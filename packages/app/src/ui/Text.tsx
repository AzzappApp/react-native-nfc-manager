import { createElement, forwardRef } from 'react';
import { Text as NativeText } from 'react-native';
import { colors, textStyles } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { ColorSchemeName } from '#helpers/createStyles';
import type { ForwardedRef } from 'react';
import type { TextProps as NativeTextProps } from 'react-native';

export type TextVariant =
  | 'azzapp'
  | 'button'
  | 'error'
  | 'hyperLink'
  | 'large'
  | 'medium'
  | 'none'
  | 'small'
  | 'smallbold'
  | 'textField'
  | 'xlarge'
  | 'xsmall'
  | 'xxsmallextrabold';

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  /**
   * Manually set the appearance of the component
   *
   * @type {('dark' | 'light')}
   */
  appearance?: ColorSchemeName;
};
/**
 * A wrapper Text component that adds Azzapp's default styling whith dark mode support
 *
 */
// eslint-disable-next-line react/display-name
const Text = forwardRef(
  (
    { variant = 'none', appearance, ...props }: TextProps,
    ref: ForwardedRef<NativeText>,
  ) => {
    const styles = useVariantStyleSheet(textStyleSheet, variant, appearance);

    return createElement(NativeText, {
      ...props,
      ref,
      style: [styles.text, props.style],
      maxFontSizeMultiplier: 1,
      allowFontScaling: false,
      accessible: true, // this is needed, accessible was lost with createElement
    });
  },
);

export const textStyleSheet = createVariantsStyleSheet(appearance => ({
  default: {
    text: {
      color: appearance === 'light' ? colors.black : colors.white,
    },
  },
  none: {
    text: {
      fontFamily: 'PlusJakartaSans-Regular',
    },
  },
  xlarge: {
    text: {
      ...textStyles.xlarge,
    },
  },
  large: {
    text: {
      ...textStyles.large,
    },
  },
  textField: {
    text: {
      ...textStyles.textField,
    },
  },
  button: {
    text: {
      ...textStyles.button,
    },
  },
  smallbold: {
    text: {
      ...textStyles.smallbold,
    },
  },
  xsmall: {
    text: {
      ...textStyles.xsmall,
    },
  },
  xxsmallextrabold: {
    text: {
      ...textStyles.xxsmallextrabold,
    },
  },
  medium: {
    text: {
      ...textStyles.medium,
    },
  },
  small: {
    text: {
      ...textStyles.small,
    },
  },
  hyperLink: {
    text: {
      ...textStyles.hyperLink,
    },
  },
  error: {
    text: {
      ...textStyles.small,
      color: colors.red400,
    },
  },
  azzapp: {
    text: {
      ...textStyles.azzapp,
    },
  },
}));

export default Text;
