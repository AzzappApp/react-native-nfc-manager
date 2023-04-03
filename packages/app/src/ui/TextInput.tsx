import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput as NativeTextInput } from 'react-native';
import { colors, fontFamilies } from '#theme';
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
  {
    isErrored,
    placeholderTextColor = colors.grey400,
    onFocus,
    onBlur,
    style,
    ...props
  }: TextInputProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  const [isFocused, setIsFocused] = useState(false);

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
      placeholderTextColor={placeholderTextColor}
      onFocus={onFocusInner}
      onBlur={onBlurInner}
      style={[
        styles.input,
        isFocused && styles.focused,
        isErrored && styles.errored,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    ...fontFamilies.normal,
    fontSize: 16,
    paddingHorizontal: 20,
    height: 43,
    backgroundColor: colors.grey50,
    borderWidth: 1,
    borderColor: colors.grey50,
    borderRadius: 12,
    color: colors.black,
  },
  focused: {
    borderColor: colors.grey900,
  },
  errored: {
    borderColor: colors.red400,
  },
});

export default forwardRef(TextInput);
