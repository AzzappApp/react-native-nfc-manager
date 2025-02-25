import { forwardRef, useState } from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { DefinedColorSchemeName } from '#helpers/createStyles';
import type { ForwardedRef } from 'react';
import type {
  TextInputProps as NativeTextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

export type TextInputProps = NativeTextInputProps & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
};

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 */
const TextInput = (
  { isErrored, onFocus, onBlur, style, ...props }: TextInputProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  //#region hooks
  const styles = useStyleSheet(styleSheet);
  const [isFocused, setIsFocused] = useState(false);
  //#endregion

  const onFocusInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const onBlurInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <NativeTextInput
      ref={ref}
      selectionColor={colors.primary400}
      {...props}
      placeholderTextColor={colors.grey400}
      onFocus={onFocusInner}
      onBlur={onBlurInner}
      allowFontScaling={false}
      style={[
        styles.input,
        isFocused && styles.focused,
        isErrored && styles.errored,
        style,
      ]}
    />
  );
};

export const styleSheetData = (appearance: DefinedColorSchemeName) => ({
  text: {
    color: appearance === 'light' ? colors.black : colors.grey400,
  },
  input: {
    ...textStyles.textField,
    paddingHorizontal: 15,
    paddingVertical: 3,
    height: 47,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    color: appearance === 'light' ? colors.black : colors.white,
  },
  focused: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
  errored: {
    borderColor: colors.red400,
  },
});
const styleSheet = createStyleSheet(styleSheetData);

export default forwardRef(TextInput);
