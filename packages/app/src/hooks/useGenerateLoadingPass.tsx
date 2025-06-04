import { addPass, addPassJWT } from '@reeq/react-native-passkit';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform } from 'react-native';
import { getArrayBufferForBlob } from 'react-native-blob-jsi-helper';
import { fromByteArray } from 'react-native-quick-base64';
import Toast from 'react-native-toast-message';
import { logEvent } from '#helpers/analytics';
import { getAppleWalletPass, getGoogleWalletPass } from '#helpers/MobileWebAPI';
import Text from '#ui/Text';

export const useGenerateLoadingPass = ({
  contactCardAccessId,
  publicKey,
}: {
  contactCardAccessId?: string | null;
  publicKey?: string | null;
}) => {
  const [loadingPass, setLoadingPass] = useState(false);

  const intl = useIntl();

  const generateLoadingPass = useCallback(async () => {
    if (contactCardAccessId && publicKey) {
      try {
        setLoadingPass(true);

        if (Platform.OS === 'ios') {
          const pass = await getAppleWalletPass({
            contactCardAccessId,
            key: publicKey,
            locale: intl.locale,
          });

          const base64Pass = fromByteArray(getArrayBufferForBlob(pass));

          await addPass(base64Pass);
        } else if (Platform.OS === 'android') {
          const pass = await getGoogleWalletPass({
            contactCardAccessId,
            key: publicKey,
            locale: intl.locale,
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
    }
  }, [contactCardAccessId, publicKey, intl]);

  return [generateLoadingPass, loadingPass] as const;
};
