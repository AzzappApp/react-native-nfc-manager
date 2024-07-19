import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import useAuthState from './useAuthState';
import type { useMultiUserUpdateMutation } from '#relayArtifacts/useMultiUserUpdateMutation.graphql';

export const useMultiUserUpdate = (onCompleted?: () => void) => {
  const [commit] = useMutation<useMultiUserUpdateMutation>(graphql`
    mutation useMultiUserUpdateMutation(
      $webCardId: ID!
      $input: UpdateMultiUserInput!
    ) {
      updateMultiUser(webCardId: $webCardId, input: $input) {
        webCard {
          id
          isMultiUser
          isPremium
        }
      }
    }
  `);

  const intl = useIntl();

  const { profileInfos } = useAuthState();

  const setAllowMultiUser = useCallback(
    (value: boolean) => {
      commit({
        variables: {
          webCardId: profileInfos?.webCardId ?? '',
          input: { isMultiUser: value },
        },
        optimisticResponse: {
          updateMultiUser: {
            webCard: {
              id: profileInfos?.webCardId,
              isMultiUser: value,
              isPremium: true,
            },
          },
        },
        updater: store => {
          if (!value && profileInfos?.webCardId) {
            const webCard = store.get(profileInfos.webCardId);
            if (webCard) {
              const profiles = webCard.getLinkedRecords('profiles');
              webCard.setLinkedRecords(
                profiles?.filter(
                  p => p.getDataID() === profileInfos.profileId,
                ) ?? [],
                'profiles',
              );
            }
          }
        },
        onCompleted,
        onError: error => {
          if (error.message === ERRORS.SUBSCRIPTION_REQUIRED) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'You need a subscription to activate multi user.',
                description:
                  'Error toast message when trying to activate multi user without a subscription.',
              }),
            });
            return;
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error while updating your multi user settings.',
                description:
                  'Error toast message when updating multi user fails',
              }),
            });
          }
        },
      });
    },
    [
      commit,
      intl,
      onCompleted,
      profileInfos?.profileId,
      profileInfos?.webCardId,
    ],
  );

  return setAllowMultiUser;
};
