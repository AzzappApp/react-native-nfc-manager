import { forwardRef, useState } from 'react';
import { TextInput as NativeTextInput, View, StyleSheet } from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { DefinedColorSchemeName } from '#helpers/createStyles';
import type { ForwardedRef } from 'react';
import type {
  TextInputProps as NativeTextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

export type TextInputProps = Omit<NativeTextInputProps, 'style'> & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
  /**
   * The main container style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The main container style
   */
  inputStyle?: StyleProp<TextStyle> | undefined;
  /**
   * input prefix
   */
  prefix?: string;
};

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 */
const TextInputWithPrefix = (
  {
    isErrored,
    onFocus,
    onBlur,
    style,
    inputStyle,
    prefix,
    ...props
  }: TextInputProps,
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
    <View
      style={[
        styles.input,
        isFocused && styles.focused,
        isErrored && styles.errored,
        mainStyles.container,
        style,
      ]}
    >
      {prefix && <NativeTextInput value={prefix} style={styles.prefix} />}
      <NativeTextInput
        ref={ref}
        testID="nativeInputText"
        selectionColor={colors.primary400}
        style={[styles.text, inputStyle]}
        {...props}
        placeholderTextColor={colors.grey400}
        onFocus={onFocusInner}
        onBlur={onBlurInner}
        allowFontScaling={false}
      />
    </View>
  );
};

export const styleSheetData = (appearance: DefinedColorSchemeName) => ({
  text: {
    flex: 1,
    color: appearance === 'light' ? colors.black : colors.white,
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
  prefix: {
    minWidth: 30,
    color: colors.grey400,
    paddingRight: 5,
  },
  focused: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
  errored: {
    borderColor: colors.red400,
  },
});
const styleSheet = createStyleSheet(styleSheetData);

const mainStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default forwardRef(TextInputWithPrefix);
