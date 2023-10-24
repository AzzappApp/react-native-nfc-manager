import { TextInput } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useVariantStyleSheet } from '#helpers/createStyles';
import { textStyleSheet } from '#ui/Text';
import type { ColorSchemeName } from '#helpers/createStyles';
import type { TextProps as RNTextProps } from 'react-native';

Animated.addWhitelistedNativeProps({ text: true });

type TextProps = RNTextProps & {
  text: Animated.SharedValue<string>;
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

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
//TODO: switch to skia text if ok (with rea3k not rea2, more complexity for few gain because with rea2, some part still use js thread)
// This is the only hack found as Text cannot be animated (virtual)
//this is more laggy
const AnimatedText = ({
  variant = 'none',
  appearance,
  ...props
}: TextProps) => {
  const styles = useVariantStyleSheet(textStyleSheet, variant, appearance);

  const { text, style } = { style: {}, ...props };
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });
  return (
    <AnimatedTextInput
      accessible={false}
      accessibilityRole="text"
      underlineColorAndroid="transparent"
      editable={false}
      value={text.value}
      style={[styles.text, { padding: 0 }, style]}
      pointerEvents={'box-none'}
      {...{ animatedProps }}
    />
  );
};

export default AnimatedText;
