import { forwardRef, useState } from 'react';
import {
  TextInput as NativeTextInput,
  useColorScheme,
  View,
} from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ForwardedRef, ReactNode } from 'react';
import type {
  TextInputProps as NativeTextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type TextInputProps = Omit<NativeTextInputProps, 'style'> & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
  /**
   * The left button to display in the header.
   */
  leftElement?: ReactNode;
  /**
   * The right button to display in the header.
   */
  rightElement?: ReactNode;
  /**
   * the style to apply to the view container around the elements and textInput
   */
  style?: StyleProp<ViewStyle>;
  /**
   * the style to apply to the TextInput
   */
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Input component as defined in figma azzap
 *
 * the figma design for INPUT, include, a right and left element inside the input component
 * the text should not go over those element.
 * we need to have a view that wrap the input and the left and right element as before and not only the RNTextInput
 * TODO:// should we keep the TextInput which is only a wrapper
 *
 */
const Input = (
  {
    isErrored,
    onFocus,
    onBlur,
    style,
    rightElement,
    leftElement,
    inputStyle,
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

  const scheme = useColorScheme();
  const styles = useStyleSheet(styleSheet);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.focused,
        isErrored && styles.errored,
        style,
      ]}
    >
      {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
      <NativeTextInput
        ref={ref}
        selectionColor={colors.primary400}
        textAlignVertical="center"
        {...props}
        placeholderTextColor={
          scheme === 'light' ? colors.grey400 : colors.grey400
        }
        onFocus={onFocusInner}
        onBlur={onBlurInner}
        style={[styles.input, inputStyle]}
      />
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  rightElement: { marginRight: 13.5, justifyContent: 'center' },
  leftElement: { marginLeft: 16, justifyContent: 'center' },
  errored: {
    borderColor: colors.red400,
  },
  text: {
    color: appearance === 'light' ? colors.black : colors.grey400,
  },
  container: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    flexDirection: 'row',
    height: 47,
    flex: 1,
  },
  input: {
    ...textStyles.textField,
    justifyContent: 'center',
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingVertical: 0,
    lineHeight: 22,
    color: appearance === 'light' ? colors.black : colors.white,
  },
  focused: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
}));

export default forwardRef(Input);
