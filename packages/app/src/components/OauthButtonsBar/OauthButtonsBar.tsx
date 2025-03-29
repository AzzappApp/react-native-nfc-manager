import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, Platform, View } from 'react-native';
import { getLocales } from 'react-native-localize';
import Toast from 'react-native-toast-message';
import { colors, shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { appleSignin } from '#helpers/MobileWebAPI';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { AuthResponse } from '@azzapp/shared/WebAPI';

WebBrowser.maybeCompleteAuthSession();
const redirectUri = AuthSession.makeRedirectUri({
  scheme: process.env.APP_SCHEME?.replace('://', '') ?? 'azzapp',
  path: 'login',
  native: `${process.env.APP_SCHEME}://login`,
});

export type OauthButtonsBarProps = {
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
};

const OauthButtonsBar = ({
  onLoadingStart,
  onLoadingEnd,
}: OauthButtonsBarProps) => {
  const styles = useStyleSheet(styleSheet);

  const intl = useIntl();
  const appleErrorMessage = useMemo(
    () =>
      intl.formatMessage({
        defaultMessage: 'Failed to sign in with Apple. Please try again later.',
        description:
          'Signup Screen - Error message when failed to sign in with Apple',
      }),
    [intl],
  );

  const onAppleSignUp = useCallback(async () => {
    let identityToken: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    try {
      const response = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      identityToken = response.identityToken;
      if (response.fullName) {
        firstName = response.fullName.givenName;
        lastName = response.fullName.familyName;
      }
    } catch (error: any) {
      if ('code' in error && error.code === 'ERR_REQUEST_CANCELED') {
        return;
      } else {
        Toast.show({
          type: 'error',
          text1: appleErrorMessage,
        });
        return;
      }
    }
    const locale = getLocales()[0];
    if (!identityToken) {
      Toast.show({
        type: 'error',
        text1: appleErrorMessage,
      });
      return;
    }
    try {
      onLoadingStart?.();
      const response = await appleSignin({
        identityToken,
        locale: locale.languageTag,
        firstName,
        lastName,
      });
      onLoadingEnd?.();
      await dispatchGlobalEvent({
        type: 'SIGN_IN',
        payload: {
          authTokens: {
            token: response.token,
            refreshToken: response.refreshToken,
          },
          profileInfos: response.profileInfos ?? null,
          email: response.email,
          phoneNumber: response.phoneNumber,
          userId: response.userId,
        },
      });
    } catch {
      onLoadingEnd?.();
      Toast.show({
        type: 'error',
        text1: appleErrorMessage,
      });
    }
  }, [appleErrorMessage, onLoadingEnd, onLoadingStart]);

  const linkedinErrorMessage = useMemo(
    () =>
      intl.formatMessage({
        defaultMessage:
          'Failed to sign in with LinkedIn. Please try again later.',
        description:
          'Signup Screen - Error message when failed to sign in with LinkedIn',
      }),
    [intl],
  );

  const googleErrorMessage = useMemo(
    () =>
      intl.formatMessage({
        defaultMessage:
          'Failed to sign in with Google. Please try again later.',
        description:
          'Signup Screen - Error message when failed to sign in with Google',
      }),
    [intl],
  );

  const router = useRouter();

  const onOpenIdSignUp = useCallback(
    async (kind: 'google' | 'linkedin') => {
      const authUrl = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/signin/${kind}?platform=${Platform.OS}`;
      const errorMessage =
        kind === 'google' ? googleErrorMessage : linkedinErrorMessage;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          preferEphemeralSession: kind === 'google',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        },
      );
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const signInInfoParam = url.searchParams.get('data');
        if (!signInInfoParam) {
          Toast.show({
            type: 'error',
            text1: errorMessage,
          });
          return;
        }
        let data: AuthResponse | { error: string };
        try {
          data = JSON.parse(signInInfoParam);
        } catch {
          Toast.show({
            type: 'error',
            text1: errorMessage,
          });
          return;
        }

        if ('error' in data) {
          console.error(data.error);
          Toast.show({
            type: 'error',
            text1: errorMessage,
          });
          return;
        }

        if ('issuer' in data) {
          router.push({
            route: 'CONFIRM_REGISTRATION',
            params: {
              issuer: data.issuer,
            },
          });
        } else {
          const {
            token,
            refreshToken,
            profileInfos,
            email,
            phoneNumber,
            userId,
          } = data;
          if (!token || !refreshToken || !userId) {
            throw new Error('Invalid response');
          }
          await dispatchGlobalEvent({
            type: 'SIGN_IN',
            payload: {
              authTokens: { token, refreshToken },
              profileInfos,
              email,
              phoneNumber,
              userId,
            },
          });
        }
      }
    },
    [googleErrorMessage, linkedinErrorMessage, router],
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        {Platform.OS === 'ios' && (
          <PressableNative
            style={[styles.button, { backgroundColor: '#000' }]}
            onPress={onAppleSignUp}
          >
            <Image
              source={require('./assets/apple.png')}
              style={{ width: 25, height: 31, objectFit: 'contain' }}
            />
          </PressableNative>
        )}
        <PressableNative
          style={styles.button}
          onPress={() => onOpenIdSignUp('linkedin')}
        >
          <Image
            source={require('./assets/linkedin.png')}
            style={{ width: 32, objectFit: 'contain' }}
          />
        </PressableNative>
        <PressableNative
          style={styles.button}
          onPress={() => onOpenIdSignUp('google')}
        >
          <Image
            source={require('./assets/google.png')}
            style={{ width: 31, objectFit: 'contain' }}
          />
        </PressableNative>
      </View>
      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
        <Text variant="medium" style={styles.or}>
          <FormattedMessage
            defaultMessage="or"
            description="Or separator in signin screen"
          />
        </Text>
        <View style={styles.separator} />
      </View>
    </View>
  );
};

export default OauthButtonsBar;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    gap: 10,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  button: [
    {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF',
    },
    shadow({ appearance }),
  ],
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grey100,
  },
  or: {
    color: colors.grey400,
  },
}));
