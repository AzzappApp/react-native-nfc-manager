import { forwardRef, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import Icon from './Icon';
import PressableNative from './PressableNative';
import TextInput from './TextInput';
import type { TextInputProps } from './TextInput';
import type { ForwardedRef } from 'react';
import type {
  GestureResponderEvent,
  TextInput as NativeTextInput,
} from 'react-native';
/**
 * A SecruedTextInput the can show secured text clearly
 *
 *
 * @param {TextInputProps} props
 * @return {React.Component<TextInputProps>}
 */

const SecuredTextInput = (
  props: TextInputProps,
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

  return (
    <View>
      <TextInput {...props} ref={ref} secureTextEntry={!showPassword} />
      <PressableNative
        testID="azzapp__Input__secure-icon"
        style={styles.buttonSecure}
        onPress={onPressShowPassword}
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to show secured text in clear',
          description:
            'TextInput - AccessibilityLabel button to show password in clear',
        })}
      >
        <Icon
          icon="viewpassword"
          style={{
            width: 11,
            height: StyleSheet.flatten(props.style)?.height ?? 43,
            marginLeft: 10,
            marginRight: 10,
          }}
        />
      </PressableNative>
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
