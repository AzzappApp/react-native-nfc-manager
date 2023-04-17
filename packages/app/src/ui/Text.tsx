import { createElement } from 'react';
import { Text as NativeText } from 'react-native';
import { colors, textStyles } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import type { ColorSchemeName } from '#helpers/createStyles';
import type { TextProps as NativeTextProps } from 'react-native';

type TextProps = NativeTextProps & {
  variant?:
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
    | 'xsmall';
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
const Text = ({ variant = 'none', appearance, ...props }: TextProps) => {
  const styles = useVariantStyleSheet(computedStyles, variant, appearance);

  return createElement(NativeText, {
    ...props,
    style: [styles.text, props.style],
    accessible: true, // this is needed, accessible was lost with createElement
  });
};

const computedStyles = createVariantsStyleSheet(appearance => ({
  default: {
    text: {
      color: appearance === 'light' ? colors.black : colors.white,
    },
  },
  none: {},
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
}));

export default Text;
