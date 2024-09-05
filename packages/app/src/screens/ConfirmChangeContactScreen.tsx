import { type GraphQLError } from 'graphql';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Keyboard, Platform, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
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

  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const insets = useScreenInsets();
  const router = useRouter();

  const [code, setCode] = useState('');
  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

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
      <View onTouchStart={Keyboard.dismiss} style={styles.container}>
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
                    defaultMessage="We just sent you a link to confirm your email, or you can type the code below"
                    description="ConfirmChangeContactScreen - message to inform the user an email has been sent to confirm his email address"
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
                    defaultMessage="You can type the code below"
                    description="ConfirmChangeContactScreen - message to inform the user an sms has been sent to confirm his phone number"
                  />
                </Text>
              </>
            )}
          </View>

          <CodeField
            ref={ref}
            {...props}
            value={code}
            onChangeText={setCode}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.select({
              android: 'sms-otp' as const,
              default: 'one-time-code' as const,
            })}
            caretHidden={true}
            renderCell={({ index, symbol, isFocused }) => (
              <View
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}
              >
                <Text variant="large">
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              </View>
            )}
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
      </View>
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

const styleSheet = createStyleSheet(appearance => ({
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
    alignItem: 'center',
    marginBottom: 100,
    paddingHorizontal: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  back: { color: colors.grey200 },
  codeFieldRoot: {
    paddingHorizontal: 12,
  },
  cell: {
    width: 47,
    height: 47,
    lineHeight: 38,
    fontSize: 24,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    color: appearance === 'light' ? colors.black : colors.grey400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCell: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
}));

export default relayScreen(ConfirmRegistrationScreen, {
  query: confirmChangeContactQuery,
});
