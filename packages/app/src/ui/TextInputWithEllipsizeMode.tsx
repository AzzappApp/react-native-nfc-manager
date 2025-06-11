import { useRef, useState } from 'react';
import { View } from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from './Text';
import { styleSheetData as textInputStyleSheet } from './TextInput';
import TextInputWithPrefix from './TextInputWithPrefix';
import type {
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
  TextInput,
} from 'react-native';

export type TextInputWithEllipsizeModeProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoFocus'
  | 'clearButtonMode'
  | 'enterKeyHint'
  | 'keyboardType'
  | 'multiline'
  | 'numberOfLines'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'placeholder'
  | 'returnKeyType'
  | 'style'
  | 'testID'
  | 'value'
> & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
  prefix?: string;
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
  prefix,
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

  const onTextPress = () => {
    nativeTextInputRef?.current?.focus();
  };

  return (
    <View style={style as ViewStyle}>
      <TextInputWithPrefix
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
        ]}
        inputStyle={[
          textStyles.textField,
          style,
          !isFocused ? { color: colors.transparent } : undefined,
        ]}
        prefix={prefix}
      />
      {!isFocused ? (
        <View style={styles.inputText}>
          <Text
            onPress={onTextPress}
            {...props}
            allowFontScaling={false}
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[
              styles.input,
              style,
              isErrored && styles.errored,
              {
                flex: 0,
                padding: 0,
                height: 'auto',
                opacity: !isFocused ? 1 : 0,
                borderWidth: 1,
                borderColor: colors.transparent,
                color: props.value ? undefined : colors.grey400,
              },
            ]}
          >
            {props.value || props.placeholder}
          </Text>
        </View>
      ) : undefined}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  ...textInputStyleSheet(appearance),
  inputText: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    position: 'absolute',
    flex: 1,
    top: 0,
    bottom: 0,
    width: '100%',
  },
}));

export default TextInputWithEllipsizeMode;
