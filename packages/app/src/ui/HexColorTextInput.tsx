import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { isValidHex } from '@azzapp/shared/stringHelpers';
import { colors, fontFamilies } from '#theme';
import type {
  TextInputProps as NativeTextInputProps,
  StyleProp,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextStyle,
} from 'react-native';

type HexColorTextInputProps = Omit<
  Omit<NativeTextInputProps, 'onChangeText'>,
  'onChange'
> & {
  onChangeColor: (hexColor: string) => void;
  value: string;
};

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 *
 * @param {TextInputProps} props
 * @return {React.Component<TextInputProps>}
 */
const HexColorTextInput = ({
  style = {},
  onFocus,
  onBlur,
  value,
  accessibilityLabel,
  ...props
}: HexColorTextInputProps) => {
  const [colorValue, setColorValue] = useState<string>(value);
  const textInputRef = useRef<NativeTextInput>(null);
  useEffect(() => {
    setColorValue(value);
  }, [value]);

  const [focusedStyle, setFocusedStyle] = useState<StyleProp<TextStyle>>({});

  const focus = () => {
    //setting setTimeout fix a know bug where input will blur just after calling focus
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  const onInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({
      borderColor: colors.grey900,
    });
    if (onFocus) {
      onFocus(e);
    }
  };

  const onInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocusedStyle({});
    if (onBlur) {
      onBlur(e);
    }
  };

  const onChangeText = (text: string) => {
    const newColor = '#' + text.replace(/([^0-9A-F]+)/gi, '').substring(0, 6);
    setColorValue(newColor);
    //only accept 6 digit format
    if (isValidHex(newColor)) props.onChangeColor(newColor);
  };

  return (
    <View onTouchStart={focus} style={[styles.container]}>
      <Text style={styles.text}>
        <FormattedMessage
          defaultMessage="Hex"
          description="HexColorTextInput Component Hex Title"
        />
      </Text>

      <View
        pointerEvents="box-none"
        style={[styles.inputViewStyle, focusedStyle]}
      >
        <View
          style={[styles.colorPreview, { backgroundColor: value }]}
          testID="azzap_native_hexcolor_previewcolor"
        />
        <NativeTextInput
          testID="azzap_native_text_input"
          selectionColor={colors.primary400}
          accessibilityLabel={accessibilityLabel}
          autoComplete="off"
          keyboardType="name-phone-pad"
          autoCorrect={false}
          onChangeText={onChangeText}
          {...props}
          value={colorValue}
          ref={textInputRef}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          style={[styles.input, style]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  colorPreview: {
    width: 26,
    height: 26,

    marginRight: 5,
    marginLeft: 5,
  },
  text: {
    ...fontFamilies.semiBold,
    paddingBottom: 5,
    size: 14,
  },
  container: {
    marginRight: 10,
    width: 124,
  },
  inputViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey50,
    borderColor: colors.grey50,
    height: 43,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    ...fontFamilies.normal,
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    height: 43,
    width: 74,
    fontSize: 16,
    fontColor: colors.black,
    textTransform: 'uppercase',
  },
});

// this component can be used in multiple places, like list, making it a pure component can be a good idea
// passing object like style will cause rerender. Still have to test it again with
// the last version using why did you render
//memo(TextInputAzz, isEqual);
export default HexColorTextInput;
