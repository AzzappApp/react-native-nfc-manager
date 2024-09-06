import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { commitLocalUpdate, useRelayEnvironment } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useAuthState from './useAuthState';
import type { GraphQLError } from 'graphql';

type GraphQLErrors = { response: { errors: GraphQLError[] } };

const useHandleProfileActionError = (errorText: string) => {
  const intl = useIntl();
  const environment = useRelayEnvironment();
  const { profileInfos } = useAuthState();
  const router = useRouter();

  const handleProfileActionError = useCallback(
    (e: Error | GraphQLErrors) => {
      const error = (e as GraphQLErrors)?.response?.errors
        ? (e as GraphQLErrors).response.errors[0]
        : (e as Error);

      if (error.message === ERRORS.FORBIDDEN) {
        const role = (error as GraphQLError)?.extensions?.role as string;

        if (role) {
          commitLocalUpdate(environment, store => {
            const user = store.getRoot().getLinkedRecord('currentUser');
            const profiles = user?.getLinkedRecords('profiles');

            if (profiles) {
              const profile = profiles?.find(
                profile => profile.getDataID() === profileInfos?.profileId,
              );

              if (profile) {
                profile.setValue(role, 'profileRole');
              }
            }
          });

          dispatchGlobalEvent({
            type: 'PROFILE_ROLE_CHANGE',
            payload: {
              profileRole: role as string,
            },
          }).then(() => {
            router.backToTop();
          });
        }
      }
      if (error.message === ERRORS.UNAUTHORIZED) {
        commitLocalUpdate(environment, store => {
          const user = store.getRoot().getLinkedRecord('currentUser');
          const profiles = user?.getLinkedRecords('profiles');
          user?.setLinkedRecords(
            profiles?.filter(p => p.getDataID() !== profileInfos?.profileId) ??
              [],
            'profiles',
          );
        });

        router.backToTop();
      }

      const errors: Record<string, string> = {
        [ERRORS.FORBIDDEN]: intl.formatMessage({
          defaultMessage: 'Error, you lost the access right for this action',
          description: 'Toast Error message when user lost access right',
        }),
        [ERRORS.UNAUTHORIZED]: intl.formatMessage({
          defaultMessage: 'Error, you lost access to this webcard',
          description: 'Toast Error message when user lost webcard access',
        }),
      };

      Toast.show({
        type: 'error',
        text1: errors[error.message] ?? errorText,
      });
    },
    [environment, errorText, intl, profileInfos?.profileId, router],
  );

  return handleProfileActionError;
};

export default useHandleProfileActionError;
