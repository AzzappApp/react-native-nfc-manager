import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  View,
} from 'react-native';

import { colors, fontFamilies, textStyles } from '../../theme';
import type {
  TextInputProps as NativeTextInputProps,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextStyle,
} from 'react-native';

export type TextInputProps = NativeTextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
  errorLabel?: string;
  errorLabelStyle?: StyleProp<ViewStyle>;
};
/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 *
 * @param {TextInputProps} props
 * @return {React.Component<TextInputProps>}
 */
//TODO: darkmode;
const TextInput = ({
  label,
  containerStyle,
  style = {},
  placeholderTextColor = colors.grey400,
  onFocus,
  onBlur,
  errorLabel,
  errorLabelStyle,
  testID,
  accessibilityLabel,
  ...props
}: TextInputProps) => {
  const textInputRef = useRef<NativeTextInput>(null);
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

  const [errorStyle, setErrorStyle] = useState({});
  useEffect(() => {
    if (isNotFalsyString(errorLabel)) {
      setErrorStyle({ borderColor: colors.red400 });
    } else {
      setErrorStyle({});
    }
  }, [errorLabel]);

  return (
    <View
      testID={testID ?? 'azzapp__Input__view-wrapper'}
      onTouchStart={focus}
      style={[styles.container, containerStyle]}
    >
      {label && (
        <Text testID="native_text_input_label" style={styles.text}>
          {label}
        </Text>
      )}
      <View pointerEvents="box-none">
        <NativeTextInput
          testID="azzap_native_text_input"
          selectionColor={colors.primary400}
          placeholderTextColor={placeholderTextColor}
          accessibilityLabel={accessibilityLabel}
          {...props}
          ref={textInputRef}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          style={[styles.input, focusedStyle, style, errorStyle]}
        />
        {props.children}
      </View>
      <View style={{ minHeight: 15 }}>
        {isNotFalsyString(errorLabel) && (
          <Text
            testID="azzapp__Input__error-label"
            style={[styles.errorTextStyle, errorLabelStyle]}
            numberOfLines={2}
            allowFontScaling
          >
            {errorLabel}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    ...fontFamilies.semiBold,
    paddingBottom: 5,
    size: 14,
  },
  container: {
    padding: 10,
    paddingBottom: 0, //will be replace by the error line specified on figma
  },
  input: {
    ...fontFamilies.normal,
    flexDirection: 'row',
    alignItems: 'center',
    height: 43,
    backgroundColor: colors.grey50,
    borderColor: colors.grey50,
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 16,
    fontColor: colors.black,
    borderWidth: 1,
  },
  errorTextStyle: {
    ...textStyles.error,
  },
});

// this component can be used in multiple places, like list, making it a pure component can be a good idea
// passing object like style will cause rerender. Still have to test it again with
// the last version using why did you render
//memo(TextInputAzz, isEqual);
export default TextInput;
