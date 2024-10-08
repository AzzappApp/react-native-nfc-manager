import { TextInput, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useVariantStyleSheet } from '#helpers/createStyles';
import { textStyleSheet } from '#ui/Text';
import type { ColorSchemeName } from '#helpers/createStyles';
import type { TextProps as RNTextProps, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

Animated.addWhitelistedNativeProps({ text: true });

type TextProps = RNTextProps & {
  text: SharedValue<string>;
  animatedTextColor?: SharedValue<string>;
  containerStyle?: ViewStyle;
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
  maxLength?: number;
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
//TODO: switch to skia text if ok (with rea3k not rea2, more complexity for few gain because with rea2, some part still use js thread)
// This is the only hack found as Text cannot be animated (virtual)
//this is more laggy
const AnimatedText = ({
  variant = 'none',
  containerStyle,
  appearance,
  maxLength,
  animatedTextColor,
  ...props
}: TextProps) => {
  const styles = useVariantStyleSheet(textStyleSheet, variant, appearance);

  const { text, style } = { style: {}, ...props };

  const animatedProps = useAnimatedProps(() => {
    return {
      text:
        !maxLength || text.value.length < maxLength
          ? text.value
          : `${text.value.slice(0, maxLength)}...`,
      // Here we use any because the text prop is not available in the type
      color: animatedTextColor ? animatedTextColor.value : undefined,
    } as any;
  }, [text]);

  return (
    <View pointerEvents="box-only" style={containerStyle}>
      <AnimatedTextInput
        accessible={false}
        accessibilityRole="text"
        underlineColorAndroid="transparent"
        editable={false}
        defaultValue={
          !maxLength || text.value.length < maxLength
            ? text.value
            : `${text.value.slice(0, maxLength)}...`
        }
        allowFontScaling={false}
        style={[styles.text, { padding: 0 }, style]}
        pointerEvents="none"
        {...{ animatedProps }}
      />
    </View>
  );
};

export default AnimatedText;
