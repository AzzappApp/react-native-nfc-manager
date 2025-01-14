import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Share, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { buildPostUrl } from '@azzapp/shared/urlHelpers';
import { useRouter } from '#components/NativeRouter';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import { useProfileInfos } from '#hooks/authStateHooks';
import useToggleLikePost from '#hooks/useToggleLikePost';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type {
  PostRendererActionBar_post$key,
  ReactionKind,
} from '#relayArtifacts/PostRendererActionBar_post.graphql';
import type { ViewProps } from 'react-native';

export type PostRendererActionBarProps = ViewProps & {
  postKey: PostRendererActionBar_post$key;
  actionEnabled: boolean;
  onActionDisabled?: () => void;
};

const PostRendererActionBar = ({
  actionEnabled,
  onActionDisabled,
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
          id
          userName
          cardIsPublished
        }
      }
    `,
    postKey,
  );

  const [reaction, setReaction] = useState<ReactionKind | null>(
    viewerPostReaction,
  );

  useEffect(() => {
    setReaction(viewerPostReaction);
  }, [viewerPostReaction]);

  const [countReactions, setCountReactions] =
    useState<number>(counterReactions);

  useEffect(() => {
    setCountReactions(counterReactions);
  }, [counterReactions]);

  const profileInfos = useProfileInfos();
  const add = viewerPostReaction !== reaction;

  const toggleLikePost = useToggleLikePost(
    {
      optimisticResponse: {
        togglePostReaction: {
          post: {
            id: postId,
            postReaction: add ? reaction : null,
            counterReactions: Math.max(0, countReactions),
          },
        },
      },
      updater: (store, response) => {
        const webCardId = profileInfos?.webCardId;
        if (!response || !webCardId) {
          return;
        }
        const reaction = response.togglePostReaction;
        const added = response.togglePostReaction.post.postReaction != null;

        const post = store.get<{ counterReactions: number }>(reaction.post.id);
        if (post) {
          const counter = post?.getValue('counterReactions');

          if (typeof counter === 'number') {
            post?.setValue(reaction.post.counterReactions, 'counterReactions');
          }
          post.setValue(reaction.post.postReaction, 'postReaction', {
            webCardId,
          });
        }
        const webCard = store.get(webCardId);
        const counter = webCard?.getValue('nbPostsLiked');
        if (typeof counter === 'number') {
          webCard?.setValue(
            Math.max(counter + (added ? 1 : -1), 0),
            'nbPostsLiked',
          );
        }
      },
    },
    () => viewerPostReaction !== reaction,
    700,
  );

  // toggle the value locally
  const toggleReaction = useCallback(() => {
    if (!actionEnabled) {
      onActionDisabled?.();

      return;
    }

    if (profileInfoHasEditorRight(profileInfos)) {
      if (reaction) {
        setCountReactions(countReactions - 1);
        setReaction(null);
      } else {
        setCountReactions(countReactions + 1);
        setReaction('like');
      }
      toggleLikePost(postId);
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to like a post without being an admin',
        }),
      });
    }
  }, [
    actionEnabled,
    countReactions,
    intl,
    onActionDisabled,
    postId,
    profileInfos,
    reaction,
    toggleLikePost,
  ]);

  const goToComments = () => {
    if (!actionEnabled) {
      onActionDisabled?.();

      return;
    }

    router.push({
      route: 'POST_COMMENTS',
      params: { postId },
    });
  };

  const goToLikes = () => {
    router.push({
      route: 'POST_LIKES',
      params: { postId },
    });
  };

  const onShare = async () => {
    if (!actionEnabled) {
      onActionDisabled?.();
      return;
    }
    if (!webCard.userName) {
      Sentry.captureMessage('null username in PostRenderedActionBar');
      return;
    }
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      const url = buildPostUrl(webCard.userName, fromGlobalId(postId).id);
      let message = intl.formatMessage({
        defaultMessage: 'Check out this post on azzapp: ',
        description:
          'Post ActionBar, message use when sharing the Post on azzapp',
      });
      if (Platform.OS === 'android') {
        // for android we need to add the message to the share
        message = `${message} ${url}`;
      }
      await Share.share({
        title: intl.formatMessage({
          defaultMessage: 'Post on azzapp',
          description:
            'Post ActionBar, message use when sharing the Post on azzapp',
        }),
        message,
        url,
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
          <PressableNative onPress={goToLikes}>
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="{countReactions, plural,
                                    =0 {0 like}
                                    one {1 like}
                                    other {# likes}
                                }"
                description="PostRendererActionBar - Like Counter"
                values={{ countReactions }}
              />
            </Text>
          </PressableNative>
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
        <IconButton icon="like" style={styles.icon} variant="icon" />
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
