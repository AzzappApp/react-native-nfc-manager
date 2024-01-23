import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Share } from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { buildPostUrl } from '@azzapp/shared/urlHelpers';
import { useRouter } from '#components/NativeRouter';
import useAuthState from '#hooks/useAuthState';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  PostRendererActionBar_post$key,
  ReactionKind,
} from '#relayArtifacts/PostRendererActionBar_post.graphql';
import type {
  PostRendererActionBarReactionMutation,
  PostRendererActionBarReactionMutation$data,
} from '#relayArtifacts/PostRendererActionBarReactionMutation.graphql';
import type { ViewProps } from 'react-native';

export type PostRendererActionBarProps = ViewProps & {
  postKey: PostRendererActionBar_post$key;
};

const PostRendererActionBar = ({
  postKey,
  style,
  ...props
}: PostRendererActionBarProps) => {
  const router = useRouter();
  const intl = useIntl();
  const {
    postReaction: viewerPostReaction,
    id: postId,
    allowLikes,
    allowComments,
    counterReactions,
    webCard,
  } = useFragment(
    graphql`
      fragment PostRendererActionBar_post on Post
      @argumentDefinitions(viewerWebCardId: { type: "ID!" }) {
        id
        postReaction(webCardId: $viewerWebCardId)
        allowComments
        allowLikes
        counterReactions
        content
        webCard {
          userName
        }
      }
    `,
    postKey,
  );

  const [commit] = useMutation<PostRendererActionBarReactionMutation>(graphql`
    mutation PostRendererActionBarReactionMutation(
      $input: TogglePostReactionInput!
      $viewerWebCardId: ID!
    ) {
      togglePostReaction(input: $input) {
        post {
          id
          postReaction(webCardId: $viewerWebCardId)
          counterReactions
        }
      }
    }
  `);

  const [reaction, setReaction] = useState<ReactionKind | null>(
    viewerPostReaction,
  );

  useEffect(() => {
    setReaction(viewerPostReaction);
  }, [viewerPostReaction]);

  const [countReactions, setCountReactions] =
    useState<number>(counterReactions);

  const { profileInfos } = useAuthState();
  const debouncedCommit = useDebouncedCallback(
    () => {
      if (!profileInfos) {
        return;
      }
      if (viewerPostReaction !== reaction) {
        const add = viewerPostReaction !== reaction;
        commit({
          variables: {
            viewerWebCardId: profileInfos.webCardId,
            input: {
              webCardId: profileInfos.webCardId,
              postId,
              reactionKind: 'like',
            },
          },
          optimisticResponse: {
            togglePostReaction: {
              post: {
                id: postId,
                postReaction: add ? reaction : null,
                counterReactions: Math.max(
                  0,
                  add ? countReactions + 1 : countReactions - 1,
                ),
              },
            },
          },
          updater: (
            store,
            response: PostRendererActionBarReactionMutation$data,
          ) => {
            const reaction = response.togglePostReaction;
            const added = response.togglePostReaction.post.postReaction != null;

            const post = store.get<{ counterReactions: number }>(
              reaction.post.id,
            );
            if (post) {
              const counter = post?.getValue('counterReactions');

              if (typeof counter === 'number') {
                post?.setValue(
                  reaction.post.counterReactions,
                  'counterReactions',
                );
              }
              post.setValue(reaction.post.postReaction, 'postReaction', {
                webCardId: profileInfos.webCardId,
              });
            }
            const webCard = store.get(profileInfos.webCardId);
            const counter = webCard?.getValue('nbPostsLiked');
            if (typeof counter === 'number') {
              webCard?.setValue(
                Math.max(counter + (added ? 1 : -1), 0),
                'nbPostsLiked',
              );
            }
          },
          onError: error => {
            console.log(error);

            setCountReactions(prevReactions =>
              add ? prevReactions - 1 : prevReactions + 1,
            );

            if (error.message === ERRORS.UNPUBLISHED_WEB_CARD) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'Error, the related webCard is unpublished',
                  description:
                    'Error when a user tries to like a post from an unpublished webCard',
                }),
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
        });
      }
    },
    // delay in ms
    700,
    { trailing: true, leading: false },
  );

  // toggle the value locally
  const toggleReaction = useCallback(() => {
    if (isEditor(profileInfos?.profileRole)) {
      if (reaction) {
        setCountReactions(countReactions - 1);
        setReaction(null);
      } else {
        setCountReactions(countReactions + 1);
        setReaction('like');
      }
      debouncedCommit();
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins & editors can like a post',
          description:
            'Error message when trying to like a post without being an admin',
        }),
      });
    }
  }, [
    countReactions,
    debouncedCommit,
    intl,
    profileInfos?.profileRole,
    reaction,
  ]);

  const goToComments = () => {
    router.push({
      route: 'POST_COMMENTS',
      params: { postId },
    });
  };

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      await Share.share({
        url: buildPostUrl(webCard.userName, fromGlobalId(postId).id),
      });
      //TODO: handle result of the share when specified
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  return (
    <>
      <View {...props} style={[styles.container, style]}>
        <View style={{ flexDirection: 'row' }}>
          {allowLikes && (
            <IconButton
              //TODO create an animation for the like button later ? design team
              icon={reaction ? 'like_filled' : 'like'}
              style={styles.icon}
              onPress={toggleReaction}
              variant="icon"
              accessibilityState={{ checked: !!reaction }}
              accessibilityLabel={
                reaction
                  ? intl.formatMessage({
                      defaultMessage: 'Like the post',
                      description:
                        'PostRendererActionBar like button accessibility',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Unlike the post',
                      description:
                        'PostRendererActionBar unlike button accessibility',
                    })
              }
            />
          )}
          {allowComments && (
            <IconButton
              icon="comment"
              style={styles.icon}
              onPress={goToComments}
              variant="icon"
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Comment the post',
                description:
                  'PostRendererActionBar Comment post button accessibility',
              })}
            />
          )}
          <IconButton
            icon="share"
            style={styles.icon}
            variant="icon"
            onPress={onShare}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Share the post',
              description:
                'PostRendererActionBar Share post button accessibility',
            })}
          />
        </View>
        {allowLikes && (
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="{countReactions, plural,
                                    =0 {0 like}
                                    one {1 like}
                                    other {# likes}
                                }"
              description="PastRendererActionBar - Like Counter"
              values={{ countReactions }}
            />
          </Text>
        )}
      </View>
    </>
  );
};

export default memo(PostRendererActionBar);

export const PostRendererActionBarSkeleton = () => {
  return (
    <View style={[styles.container, { marginTop: 10 }]}>
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon={'like'} style={styles.icon} variant="icon" />
        <Icon icon="comment" style={styles.icon} />
        <Icon icon="share" style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
    width: '100%',
  },
  icon: {
    marginRight: 20,
  },
});
