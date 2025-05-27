import { type GraphQLError } from 'graphql';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import useUpdateUser from './AccountDetailsScreen/useUpdateUser';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ConfirmChangeContactScreenQuery } from '#relayArtifacts/ConfirmChangeContactScreenQuery.graphql';
import type { ConfirmChangeContactRoute } from '#routes';

export const confirmChangeContactQuery = graphql`
  query ConfirmChangeContactScreenQuery {
    currentUser {
      id
      email
      phoneNumber
      ...HomeScreenContent_user
    }
  }
`;

const ConfirmRegistrationScreen = ({
  route: { params },
  preloadedQuery,
}: RelayScreenProps<
  ConfirmChangeContactRoute,
  ConfirmChangeContactScreenQuery
>) => {
  const preloaded = usePreloadedQuery(
    confirmChangeContactQuery,
    preloadedQuery,
  );

  const currentUser = preloaded.currentUser;

  const intl = useIntl();
  const insets = useScreenInsets();
  const router = useRouter();

  const [code, setCode] = useState('');

  const isEmail = isValidEmail(params.issuer);

  const [commitMutation, isLoading] = useUpdateUser();

  const onSubmit = async () => {
    const input = isEmail
      ? { email: params.issuer }
      : { phoneNumber: params.issuer };

    commitMutation({
      variables: {
        input: {
          ...input,
          token: code,
        },
      },
      optimisticResponse: {
        updateUser: {
          user: {
            id: currentUser?.id,
            email: currentUser?.email,
            phoneNumber: currentUser?.phoneNumber,
            ...input,
          },
        },
      },
      updater: store => {
        if (isEmail) {
          store
            .getRoot()
            .getLinkedRecord('currentUser')
            ?.setValue(params.issuer, 'email');
        } else {
          store
            .getRoot()
            .getLinkedRecord('currentUser')
            ?.setValue(params.issuer, 'phoneNumber');
        }
      },
      onCompleted: () => {
        router.back();
      },
      onError: error => {
        const response = ('response' in error ? error.response : undefined) as
          | { errors: GraphQLError[] }
          | undefined;
        if (
          response?.errors.some(
            r => r.message === ERRORS.PHONENUMBER_ALREADY_EXISTS,
          )
        ) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'This phone number is already registered.',
              description:
                'ConfirmChangeContactScreen - Error This phone number is already registered',
            }),
            visibilityTime: 5000,
          });
        } else if (
          response?.errors.some(r => r.message === ERRORS.EMAIL_ALREADY_EXISTS)
        ) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'This email address is already registered',
              description:
                'ConfirmChangeContactScreen - Error This email address is already registered ',
            }),
            visibilityTime: 5000,
          });
        } else {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: isEmail
              ? intl.formatMessage({
                  defaultMessage: 'Error while confirming your email.',
                  description:
                    'Toast Error message when confirming email fails',
                })
              : intl.formatMessage({
                  defaultMessage: 'Error while confirming your phone number.',
                  description:
                    'Toast Error message when confirming phone number',
                }),
            text2: intl.formatMessage({
              defaultMessage: 'Please try again.',
              description:
                'Toast Error message when confirm email or phone number fails',
            }),
            visibilityTime: 5000,
          });
        }
      },
    });
  };

  return (
    <Container style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Icon icon={isEmail ? 'mail_line' : 'sms'} style={styles.logo} />
          </View>
          <View style={styles.viewText}>
            {isEmail ? (
              <>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Check your emails!"
                    description="ConfirmChangeContactScreen - Check your emails or messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We just sent you a link to confirm your email {email}, or you can type the code below"
                    description="ConfirmChangeContactScreen - message to inform the user an email has been sent to confirm his email address"
                    values={{
                      email: params.issuer,
                    }}
                  />
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Check your messages!"
                    description="ConfirmChangeContactScreen - Check your messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We just sent you a code in your phone {phoneNumber}, or you can type the code below"
                    description="ConfirmChangeContactScreen - message to inform the user an sms has been sent to confirm his phone number"
                    values={{
                      phoneNumber: params.issuer,
                    }}
                  />
                </Text>
              </>
            )}
          </View>

          <TextInput
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.select({
              android: 'sms-otp' as const,
              default: 'one-time-code' as const,
            })}
            style={styles.textInputStyle}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            autoFocus
          />
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Confirm',
              description: 'ConfirmChangeContactScreen - Confirm button',
            })}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Tap to confirm you email or phone number',
              description:
                'ConfirmChangeContactScreen - AccessibilityLabel confirm email or phone number button',
            })}
            style={styles.button}
            onPress={onSubmit}
            disabled={!(code.length === CELL_COUNT)}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
      <View
        style={{
          bottom: insets.bottom,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative onPress={router.back}>
          <Text style={styles.back} variant="medium">
            {isEmail ? (
              <FormattedMessage
                defaultMessage="Cancel edit email address"
                description="ConfirmChangeContactScreen - Cancel email bottom screen link"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Cancel edit phone number"
                description="ConfirmChangeContactScreen - Cancel phone number bottom screen link"
              />
            )}
          </Text>
        </PressableNative>
      </View>
    </Container>
  );
};
const CELL_COUNT = 6;

const styles = StyleSheet.create({
  inner: {
    height: 300,
    rowGap: 20,
  },
  textForgotExplain: {
    color: colors.grey400,
    textAlign: 'center',
  },
  textForgot: {
    color: colors.grey900,
  },
  viewText: {
    alignItems: 'center',
    paddingLeft: 38,
    paddingRight: 38,
    rowGap: 20,
  },
  flex: { flex: 1 },
  button: { marginHorizontal: 20 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
    paddingHorizontal: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  back: { color: colors.grey200 },
  textInputStyle: {
    marginHorizontal: 20,
  },
});

export default relayScreen(ConfirmRegistrationScreen, {
  query: confirmChangeContactQuery,
});
