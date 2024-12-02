import * as Sentry from '@sentry/react-native';

import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import ERRORS from '@azzapp/shared/errors';
import Text from '#ui/Text';
import { useProfileInfos } from './authStateHooks';
import type { useToggleLikePostMutation } from '#relayArtifacts/useToggleLikePostMutation.graphql';
import type { UseMutationConfig } from 'react-relay';

const useToggleLikePost = (
  config: Partial<UseMutationConfig<useToggleLikePostMutation>> = {},
  validate?: () => void,
  debounceDelay: number = 0,
) => {
  const intl = useIntl();
  const profileInfos = useProfileInfos();
  const currentWebCardId = profileInfos?.webCardId;

  const [commit] = useMutation<useToggleLikePostMutation>(graphql`
    mutation useToggleLikePostMutation(
      $webCardId: ID!
      $input: TogglePostReactionInput!
    ) {
      togglePostReaction(webCardId: $webCardId, input: $input) {
        post {
          id
          postReaction(webCardId: $webCardId)
          counterReactions
        }
      }
    }
  `);

  const toggleLike = useDebouncedCallback(
    (postId: string) => {
      if (!currentWebCardId) {
        return;
      }

      if (!validate || validate?.()) {
        commit({
          variables: {
            webCardId: currentWebCardId,
            input: {
              postId,
              reactionKind: 'like',
            },
          },
          onError: error => {
            console.log(error);

            if (error.message === ERRORS.UNPUBLISHED_WEB_CARD) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage(
                  {
                    defaultMessage:
                      'Oops, this WebCard{azzappA} is not published.',
                    description:
                      'Error when a user tries to like a post from an unpublished webCard',
                  },
                  {
                    azzappA: <Text variant="azzapp">a</Text>,
                  },
                ) as unknown as string,
              });
            } else {
              //add manual capture exception for testing issue
              Sentry.captureException(error, {
                extra: { tag: 'PostReaction' },
              });

              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'Error, we were unable to like this post',
                  description: 'Error toast message when liking a post failed.',
                }),
              });
            }
          },
          ...config,
        });
      }
    }, // delay in ms
    debounceDelay,
    { trailing: true, leading: false },
  );

  return toggleLike;
};

export default useToggleLikePost;
