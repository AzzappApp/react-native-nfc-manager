import AnimateableText from 'react-native-animateable-text';
import { useAnimatedProps } from 'react-native-reanimated';
import { useVariantStyleSheet } from '#helpers/createStyles';
import { textStyleSheet } from '#ui/Text';
import type { ColorSchemeName, TextProps as RNTextProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type TextProps = RNTextProps & {
  text: SharedValue<string>;
  animatedTextColor?: SharedValue<string>;
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
    | 'xsmall'
    | 'xxsmallextrabold';
  /**
   * Manually set the appearance of the component
   *
   * @type {('dark' | 'light')}
   */
  appearance?: ColorSchemeName;
  maxLength?: number;
};

const AnimatedText = ({
  // Only used in counter so we set a devault value to 0
  variant = 'none',
  appearance,
  maxLength,
  animatedTextColor,
  text,
  style,
  ...props
}: TextProps) => {
  const styles = useVariantStyleSheet(textStyleSheet, variant, appearance);

  const animatedProps = useAnimatedProps(() => {
    const textValue =
      !maxLength || text.value.length < maxLength
        ? text.value
        : `${text.value.slice(0, maxLength)}...`;
    // Here we use any because the text prop is not available in the type
    let result = {
      text: textValue,
    } as any;
    if (animatedTextColor) {
      result = { ...result, color: animatedTextColor?.value };
    }
    return result;
  }, [text]);

  return (
    <AnimateableText
      accessible={false}
      accessibilityRole="text"
      allowFontScaling={false}
      style={[styles.text, { padding: 0 }, style]}
      animatedProps={animatedProps}
      {...props}
    />
  );
};

export default AnimatedText;
