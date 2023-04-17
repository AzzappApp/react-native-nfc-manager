import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput as NativeTextInput,
  useColorScheme,
} from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
  const appearanceStyles = useStyleSheet(computedStyled);
  const scheme = useColorScheme();
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
      placeholderTextColor={
        scheme === 'light' ? colors.grey400 : colors.grey400
      }
      onFocus={onFocusInner}
      onBlur={onBlurInner}
      style={[
        appearanceStyles.input,
        isFocused && appearanceStyles.focused,
        isErrored && styles.errored,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  errored: {
    borderColor: colors.red400,
  },
});

const computedStyled = createStyleSheet(appearance => ({
  text: {
    color: appearance === 'light' ? colors.black : colors.grey400,
  },
  input: {
    ...textStyles.textField,
    paddingHorizontal: 15,
    height: 47,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    color: appearance === 'light' ? colors.black : colors.white, //TODO: darkmode input color is not defined waiting for design team
  },

  focused: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
}));

export default forwardRef(TextInput);
