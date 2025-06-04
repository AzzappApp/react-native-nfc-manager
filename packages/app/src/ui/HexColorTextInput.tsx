import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { TextInput as NativeTextInput, View } from 'react-native';
import { isValidHex } from '@azzapp/shared/stringHelpers';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type {
  TextInputProps as NativeTextInputProps,
  StyleProp,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
} from 'react-native';

type HexColorTextInputProps = Omit<
  Omit<NativeTextInputProps, 'onChangeText'>,
  'onChange'
> & {
  onColorChange: (hexColor: string) => void;
  value: string;
};

/**
 * A wrapper around TextInput that allow to input a hex color.
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

  const [focusedStyle, setFocusedStyle] = useState<StyleProp<ViewStyle>>({});
  //#region hooks
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  //#endregion

  const focus = () => {
    //setting setTimeout fix a know bug where input will blur just after calling focus
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  const onInputFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocusedStyle({
        borderColor: colors.grey900,
      });
      shouldHandleKeyboardEvents.set(true);
      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus, shouldHandleKeyboardEvents],
  );

  const onInputBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocusedStyle({});
      shouldHandleKeyboardEvents.set(false);
      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur, shouldHandleKeyboardEvents],
  );

  //#region effects
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.set(false);
    };
  }, [shouldHandleKeyboardEvents]);
  //#endregion

  const onChangeText = (text: string) => {
    const newColor = '#' + text.replace(/([^0-9A-F]+)/gi, '').substring(0, 6);
    setColorValue(newColor);
    //only accept 6 digit format
    if (isValidHex(newColor)) props.onColorChange(newColor);
  };

  const styles = useStyleSheet(styleSheet);

  return (
    <View onTouchStart={focus} style={styles.container}>
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

const styleSheet = createStyleSheet(appearance => ({
  colorPreview: {
    width: 26,
    height: 26,

    marginLeft: 5,
  },
  text: {
    paddingBottom: 5,
  },
  container: {
    marginRight: 10,
    width: 124,
  },
  inputViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 47,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    height: 47,
    flex: 1,
    textTransform: 'uppercase',
    color: appearance === 'light' ? colors.black : colors.white, //TODO: darkmode input color is not defined waiting for design team
    ...textStyles.medium,
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

// this component can be used in multiple places, like list, making it a pure component can be a good idea
// passing object like style will cause rerender. Still have to test it again with
// the last version using why did you render
//memo(TextInputAzz, isEqual);
export default HexColorTextInput;
