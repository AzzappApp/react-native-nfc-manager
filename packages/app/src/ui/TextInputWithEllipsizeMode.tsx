import { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from './Text';
import { styleSheetData as textInputStyleSheet } from './TextInput';
import type {
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
} from 'react-native';

export type TextInputWithEllipsizeModeProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'enterKeyHint'
  | 'keyboardType'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'placeholder'
  | 'style'
  | 'value'
> & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
};

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 * This version is a workaround for missing ellipsizemode support on
 * TextInput.
 * It simplify swap between TextInput and Text (with ellipsize) when it is unfocused
 */
const TextInputWithEllipsizeMode = ({
  isErrored,
  onFocus,
  onBlur,
  style,
  ...props
}: TextInputWithEllipsizeModeProps) => {
  //#region hooks
  const styles = useStyleSheet(styleSheet);
  const [isFocused, setIsFocused] = useState(false);
  //#endregion

  const nativeTextInputRef = useRef<TextInput>(null);

  const onFocusInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const onBlurInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={style as ViewStyle}>
      <TextInput
        testID="nativeInputText"
        ref={nativeTextInputRef}
        selectionColor={colors.primary400}
        {...props}
        placeholderTextColor={colors.grey400}
        onFocus={onFocusInner}
        onBlur={onBlurInner}
        allowFontScaling={false}
        style={[
          styles.input,
          style,
          isFocused && styles.focused,
          isErrored && styles.errored,
          !isFocused ? { color: 'transparent' } : undefined,
        ]}
      />
      {!isFocused ? (
        <Text
          onPress={nativeTextInputRef?.current?.focus}
          {...props}
          allowFontScaling={false}
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            styles.input,
            style,
            isErrored && styles.errored,
            styles.inputText,
            {
              opacity: !isFocused ? 1 : 0,
            },
          ]}
        >
          {props.value}
        </Text>
      ) : undefined}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  ...textInputStyleSheet(appearance),
  inputText: {
    top: 9, // workaround for text positioning from react native
    backgroundColor: 'transparent',
    justifyContent: 'center',
    position: 'absolute',
  },
}));

export default TextInputWithEllipsizeMode;
