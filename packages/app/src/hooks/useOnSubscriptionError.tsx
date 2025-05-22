import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import ERRORS from '@azzapp/shared/errors';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import Text from '#ui/Text';

const useOnSubscriptionError = (isWebSubscription: boolean) => {
  const router = useRouter();
  const intl = useIntl();
  const result = useCallback(
    (error: Error) => {
      const profileInfos = getAuthState()?.profileInfos;
      const isOwner = profileInfos?.profileRole === 'owner';

      if (
        error.message === ERRORS.SUBSCRIPTION_REQUIRED ||
        error.message === ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS
      ) {
        if (isOwner) {
          if (
            error.message === ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS &&
            isWebSubscription
          ) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, not enough users available in you subscription to publish this webcard, please upgrade your subscription',
                description:
                  'Toast Error message when user tries to publish a webcard but has not enough seats',
              }),
            });
            return;
          }

          router.push({ route: 'USER_PAY_WALL' });
          return;
        } else {
          Toast.show({
            type: 'error',
            text1:
              error.message === ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS
                ? (intl.formatMessage(
                    {
                      defaultMessage:
                        'Please contact the owner of this WebCard{azzappA}. There is not enough users available',
                      description:
                        'Error toast when a non-owner is trying to update a premium WebCard without enough seats',
                    },
                    {
                      azzappA: <Text variant="azzapp">a</Text>,
                    },
                  ) as unknown as string)
                : (intl.formatMessage(
                    {
                      defaultMessage:
                        'Please contact the owner of this WebCard{azzappA}. There is an issue on his/her azzapp+ subscription.',
                      description:
                        'Error toast when a non-owner is trying to update a premium WebCard without subscription',
                    },
                    {
                      azzappA: <Text variant="azzapp">a</Text>,
                    },
                  ) as unknown as string),
          });
          return;
        }
      }

      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Unknown error - Please retry',
          description: 'Error Unknown error - Please retry',
        }),
      });
    },
    [intl, isWebSubscription, router],
  );

  return result;
};

export default useOnSubscriptionError;
