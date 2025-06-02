import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { useRouter } from '#components/NativeRouter';
import { logEvent } from '#helpers/analytics';
import { getQRCodeDeviceId } from './useQRCodeKey';

export const useGenerateEmailSignature = (
  profileId?: string | null,
  publicKey?: string | null,
  email?: string | null,
) => {
  const [commit, isGeneratingEmail] = useMutation(graphql`
    mutation useGenerateEmailSignatureMutation(
      $input: GenerateEmailSignatureWithKeyInput!
    ) {
      generateEmailSignatureWithKey(input: $input) {
        done
      }
    }
  `);

  const intl = useIntl();

  const router = useRouter();

  const generateEmailSignature = useCallback(async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage:
            'Please add an email address to your account to receive your email signature',
          description:
            'Toast message  if the user as not mail while generating email signature for the user',
        }),
      });
      return;
    }
    if (profileId) {
      logEvent('generate_email_signature');
      commit({
        variables: {
          input: {
            key: publicKey,
            profileId,
            deviceId: getQRCodeDeviceId(),
          },
        },
        onCompleted: () => {
          Toast.show({
            type: 'success',
            text1: intl.formatMessage({
              defaultMessage: 'An email has been sent to you',
              description:
                'Toast message while generating email signature for the user',
            }),
          });
        },
        onError: e => {
          if (e.message === ERRORS.SUBSCRIPTION_REQUIRED) {
            router.push({
              route: 'USER_PAY_WALL',
            });

            return;
          }
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Unknown error - Please retry',
              description:
                'ContactCardScreen - Error Unknown error - Please retry',
            }),
          });
        },
      });
    }
  }, [commit, email, intl, profileId, publicKey, router]);

  const result = useMemo(
    () => [generateEmailSignature, isGeneratingEmail] as const,
    [generateEmailSignature, isGeneratingEmail],
  );

  return result;
};
