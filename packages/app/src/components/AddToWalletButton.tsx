import { addPass, addPassJWT } from '@reeq/react-native-passkit';
import { Image } from 'expo-image';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ActivityIndicator,
  Platform,
  useColorScheme,
  View,
} from 'react-native';
import { getArrayBufferForBlob } from 'react-native-blob-jsi-helper';
import { fromByteArray } from 'react-native-quick-base64';
import Toast from 'react-native-toast-message';
import { colors } from '#theme';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getAppleWalletPass, getGoogleWalletPass } from '#helpers/MobileWebAPI';
import { getQRCodeDeviceId } from '#hooks/useQRCodeKey';
import PressableNative from '../ui/PressableNative';
import Text from '../ui/Text';
import type { ColorSchemeName, ViewStyle } from 'react-native';

type Props = {
  profileId: string;
  publicKey: string;
  style?: ViewStyle;
  appearance?: ColorSchemeName;
};

const AddToWalletButton = ({
  profileId,
  publicKey,
  style,
  appearance,
}: Props) => {
  const intl = useIntl();
  const [loadingPass, setLoadingPass] = useState(false);
  const scheme = useColorScheme();
  const colorScheme = appearance || scheme;
  const styles = useStyleSheet(styleSheet, colorScheme);

  const generateLoadingPass = useCallback(async () => {
    try {
      setLoadingPass(true);

      if (Platform.OS === 'ios') {
        const pass = await getAppleWalletPass({
          profileId: fromGlobalId(profileId).id,
          key: publicKey,
          locale: intl.locale,
          deviceId: getQRCodeDeviceId(),
        });

        const base64Pass = fromByteArray(getArrayBufferForBlob(pass));

        await addPass(base64Pass);
      } else if (Platform.OS === 'android') {
        const pass = await getGoogleWalletPass({
          profileId: fromGlobalId(profileId).id,
          key: publicKey,
          locale: intl.locale,
          deviceId: getQRCodeDeviceId(),
        });

        await addPassJWT(pass.token);
      }
      logEvent('add_pass_wallet');
    } catch {
      Toast.show({
        text1: intl.formatMessage({
          defaultMessage: 'Error',
          description: 'Error toast title',
        }),
        text2: Platform.select({
          ios: intl.formatMessage(
            {
              defaultMessage:
                'Oops, ContactCard{azzappA} could not add pass to Apple Wallet',
              description:
                'Error toast message when adding pass to Apple Wallet',
            },
            { azzappA: <Text variant="azzapp">a</Text> },
          ) as unknown as string,
          android: intl.formatMessage(
            {
              defaultMessage:
                'Oops, ContactCard{azzappA} could not add pass to Google Wallet',
              description:
                'Error toast message when adding pass to Google Wallet',
            },
            { azzappA: <Text variant="azzapp">a</Text> },
          ) as unknown as string,
        }),
        type: 'error',
      });
    } finally {
      setLoadingPass(false);
    }
  }, [profileId, publicKey, intl]);

  return (
    <>
      {Platform.OS === 'ios' && (
        <View style={[styles.addToWalletContainer, style]}>
          <PressableNative
            testID="add-to-wallet-button"
            disabled={loadingPass}
            style={styles.addToWalletButton}
            onPress={generateLoadingPass}
          >
            {loadingPass ? (
              <ActivityIndicator
                color={colorScheme === 'dark' ? 'black' : 'white'}
                style={styles.addToWalletIcon}
              />
            ) : (
              <Image
                source={require('#assets/wallet.png')}
                style={styles.addToWalletIcon}
                cachePolicy="none"
              />
            )}
            <Text variant="button" style={styles.addToWalletButtonText}>
              <FormattedMessage
                defaultMessage="Add to Apple Wallet"
                description="Add to Apple Wallet button label"
              />
            </Text>
          </PressableNative>
        </View>
      )}
      {Platform.OS === 'android' && (
        <View>
          <PressableNative
            testID="add-to-wallet-button"
            disabled={loadingPass}
            onPress={generateLoadingPass}
            ripple={{
              foreground: true,
              borderless: false,
              color: colorScheme === 'dark' ? colors.grey100 : colors.grey900,
            }}
            style={styles.googleWalletButton}
          >
            <Image
              source={require('#assets/google-wallet.svg')}
              style={styles.googleWalletLogo}
              contentFit="contain"
            />
          </PressableNative>
          {loadingPass && (
            <View style={styles.googleWalletLoadingContainer}>
              <ActivityIndicator
                color={colorScheme === 'dark' ? 'black' : 'white'}
              />
            </View>
          )}
        </View>
      )}
    </>
  );
};

export default AddToWalletButton;

const styleSheet = createStyleSheet(appearance => ({
  addToWalletIcon: {
    width: 38,
    height: 37,
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  addToWalletContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    width: '100%',
  },
  addToWalletButton: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToWalletButtonText: {
    color: appearance === 'light' ? colors.white : colors.black,
  },

  googleWalletLogo: {
    height: 47,
    overflow: 'visible',
  },
  googleWalletButton: {
    aspectRatio: 283 / 50, // derived from google wallet logo svg
    height: 47,
    alignSelf: 'center',
  },
  googleWalletLoadingContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
