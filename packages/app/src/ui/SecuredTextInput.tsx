import { forwardRef, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import Icon from './Icon';
import PressableOpacity from './PressableOpacity';
import TextInput from './TextInput';
import type { TextInputProps } from './TextInput';
import type { ForwardedRef } from 'react';
import type {
  GestureResponderEvent,
  TextInput as NativeTextInput,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

type SecuredTextInputProps = Omit<TextInputProps, 'style'> & {
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * A SecruedTextInput the can show secured text clearly
 *
 *
 * @param {TextInputProps} props
 * @return {React.Component<TextInputProps>}
 */
const SecuredTextInput = (
  { style, inputStyle, ...props }: SecuredTextInputProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  const intl = useIntl();
  const [showPassword, setShowPassword] = useState(false);
  const onPressShowPassword = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      setShowPassword(!showPassword);
    },
    [showPassword],
  );

  const height = useMemo(
    () => StyleSheet.flatten(style)?.height ?? 43,
    [style],
  );

  return (
    <View style={style}>
      <TextInput
        {...props}
        ref={ref}
        style={inputStyle}
        secureTextEntry={!showPassword}
        textContentType="password"
      />
      <PressableOpacity
        style={styles.buttonSecure}
        onPress={onPressShowPassword}
        accessibilityRole="togglebutton"
        accessibilityState={{ checked: showPassword }}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Show password',
          description:
            'Password text input - show password button accessibility label',
        })}
      >
        <Icon
          icon={!showPassword ? 'display' : 'secret'}
          style={{
            width: 11,
            height,
            marginLeft: 10,
            marginRight: 10,
          }}
        />
      </PressableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonSecure: {
    position: 'absolute',
    justifyContent: 'center',
    right: 8,
  },
});

export default forwardRef(SecuredTextInput);
