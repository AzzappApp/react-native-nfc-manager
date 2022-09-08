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
import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

type SignUpScreenProps = {
  signup: (params: SignUpParams) => Promise<void>;
};

const SignUpScreen = ({ signup }: SignUpScreenProps) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await signup({ userName, email, password });
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
            placeholder="User name"
            value={userName}
            onChange={e => setUserName(e.nativeEvent.text)}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.nativeEvent.text)}
            style={styles.textInput}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
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

export default SignUpScreen;

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
