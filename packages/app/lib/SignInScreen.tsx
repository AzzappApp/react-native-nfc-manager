import { useState } from 'react';
import {
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

type SignInScreenProps = {
  signin: (params: SignInParams) => Promise<void>;
};
const SignInScreen = ({ signin }: SignInScreenProps) => {
  const [userNameOrEmail, setUserNameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await signin({ userNameOrEmail, password });
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e.message);
      return;
    }
  };

  const Container: typeof TouchableWithoutFeedback =
    Platform.OS === 'web' ? (View as any) : TouchableWithoutFeedback;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Container onPress={Keyboard.dismiss} style={styles.container}>
        <View style={styles.inner}>
          <TextInput
            placeholder="User name Or Email"
            value={userNameOrEmail}
            onChange={e => setUserNameOrEmail(e.nativeEvent.text)}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.nativeEvent.text)}
            secureTextEntry
            style={styles.textInput}
          />
          <View style={styles.btnContainer}>
            <Button title="Submit" onPress={onSubmit} />
          </View>
        </View>
      </Container>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    padding: 24,
    flex: 1,
  },
  header: {
    fontSize: 36,
    marginBottom: 48,
  },
  textInput: {
    height: 40,
    borderColor: '#000000',
    borderBottomWidth: 1,
    marginBottom: 36,
  },
  btnContainer: {
    backgroundColor: 'white',
    marginTop: 12,
  },
});
