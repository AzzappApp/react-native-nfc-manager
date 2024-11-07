import AnimateableText from 'react-native-animateable-text';
import { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { useVariantStyleSheet } from '#helpers/createStyles';
import { textStyleSheet } from '#ui/Text';
import type {
  ColorSchemeName,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import type { DerivedValue, SharedValue } from 'react-native-reanimated';

type TextProps = RNTextProps & {
  text: SharedValue<string>;
  animatedTextColor?: DerivedValue<string | undefined> | DerivedValue<string>;
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
    return {
      text: textValue,
    } as any;
  }, [text]);

  const colorStyle = useAnimatedStyle(() => {
    return {
      color:
        animatedTextColor?.value ||
        (style as TextStyle)?.color ||
        (styles.text as TextStyle)?.color,
    };
  });

  return (
    <AnimateableText
      accessible={false}
      accessibilityRole="text"
      allowFontScaling={false}
      style={[styles.text, { padding: 0 }, style, colorStyle]}
      animatedProps={animatedProps}
      {...props}
    />
  );
};

export default AnimatedText;
