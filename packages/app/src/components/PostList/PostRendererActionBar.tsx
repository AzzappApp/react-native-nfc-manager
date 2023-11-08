import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Share } from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { buildPostUrl } from '@azzapp/shared/urlHelpers';
import { useRouter } from '#components/NativeRouter';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  PostRendererActionBar_post$key,
  ReactionKind,
} from '@azzapp/relay/artifacts/PostRendererActionBar_post.graphql';

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
    viewerPostReaction,
    id: postId,
    allowLikes,
    allowComments,
    counterReactions,
    author,
  } = useFragment(
    graphql`
      fragment PostRendererActionBar_post on Post {
        id
        viewerPostReaction
        allowComments
        allowLikes
        counterReactions
        content
        author {
          userName
        }
      }
    `,
    postKey,
  );

  const [commit] = useMutation(graphql`
    mutation PostRendererActionBarReactionMutation(
      $input: TogglePostReactionInput!
    ) {
      togglePostReaction(input: $input) {
        post {
          id
          viewerPostReaction
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

  const debouncedCommit = useDebouncedCallback(
    (add: boolean) => {
      commit({
        variables: {
          input: {
            postId,
            reactionKind: 'like',
          },
        },
        optimisticResponse: {
          togglePostReaction: {
            post: {
              id: postId,
              viewerPostReaction: reaction,
              counterReactions: countReactions,
            },
          },
        },
        updater: store => {
          const post = store.get<{ counterReactions: number }>(postId);
          if (post) {
            const counter = post?.getValue('counterReactions');

            if (typeof counter === 'number') {
              post?.setValue(counter + (add ? 1 : -1), 'counterReactions');
            }
            post.setValue(add ? reaction : null, 'viewerPostReaction');
          }
        },
        onError: error => {
          console.error(error);

          setCountReactions(prevReactions =>
            add ? prevReactions + 1 : prevReactions - 1,
          );

          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, we were unable to like this post',
              description: 'Error toast message when liking a post failed.',
            }),
          });
        },
      });
    },
    // delay in ms
    600,
    { trailing: true, leading: false },
  );
  // toggle the value locally
  const toggleReaction = useCallback(() => {
    if (reaction) {
      setCountReactions(countReactions - 1);
      setReaction(null);
      debouncedCommit(false);
    } else {
      setCountReactions(countReactions + 1);
      setReaction('like');
      debouncedCommit(true);
    }
  }, [countReactions, debouncedCommit, reaction]);

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
        url: buildPostUrl(author.userName, fromGlobalId(postId).id),
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
              defaultMessage="{countReactions} likes"
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
    witdh: '100%',
  },
  icon: {
    marginRight: 20,
  },
});
