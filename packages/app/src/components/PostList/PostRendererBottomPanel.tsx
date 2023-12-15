/* eslint-disable no-alert */
import * as Sentry from '@sentry/react-native';
import * as Clipboard from 'expo-clipboard';
import { fromGlobalId } from 'graphql-relay';
import { useCallback } from 'react';
import { FormattedMessage, FormattedRelativeTime, useIntl } from 'react-intl';
import { View, StyleSheet, Share } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { buildPostUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { relativeDateMinute } from '#helpers/dateHelpers';
import useAuthState from '#hooks/useAuthState';
import useToggleFollow from '#hooks/useToggleFollow';
import BottomSheetModal from '#ui/BottomSheetModal';
import ExpendableText from '#ui/ExpendableText';
import PressableOpacity from '#ui/PressableOpacity';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import PostRendererActionBar, {
  PostRendererActionBarSkeleton,
} from './PostRendererActionBar';
import type { PostRendererActionBar_post$key } from '@azzapp/relay/artifacts/PostRendererActionBar_post.graphql';
import type { PostRendererBottomPanelFragment_post$key } from '@azzapp/relay/artifacts/PostRendererBottomPanelFragment_post.graphql';
import type { PostRendererBottomPanelUpdateAllowLikesPostMutation } from '@azzapp/relay/artifacts/PostRendererBottomPanelUpdateAllowLikesPostMutation.graphql';
import type { PostRendererBottomPanelUpdatePostAllowCommentsMutation } from '@azzapp/relay/artifacts/PostRendererBottomPanelUpdatePostAllowCommentsMutation.graphql';

type PostRendererBottomPanelProps = {
  /**
   * Show the action modal
   *
   * @type {boolean}
   */
  showModal: boolean;
  /**
   *
   * Togg the display modal action visibility
   * @type {() => void}
   */
  toggleModal: () => void;
  /**
   * The post to display
   *
   * @type { PostRendererActionBar_post$key & PostRendererBottomPanelFragment_post$key}
   */
  post: PostRendererActionBar_post$key &
    PostRendererBottomPanelFragment_post$key;
};

const PostRendererBottomPanel = ({
  showModal,
  toggleModal,
  post: postKey,
}: PostRendererBottomPanelProps) => {
  const router = useRouter();
  const post = useFragment(
    graphql`
      fragment PostRendererBottomPanelFragment_post on Post {
        id
        content
        counterComments
        allowComments
        allowLikes
        previewComment {
          id
          comment
          webCard {
            userName
          }
        }
        webCard {
          id
          userName
          isFollowing
        }
        createdAt
      }
    `,
    postKey as PostRendererBottomPanelFragment_post$key,
  );

  const copyLink = () => {
    toggleModal();

    Clipboard.setStringAsync(
      buildPostUrl(post.webCard.userName, fromGlobalId(post.id).id),
    ).then(() => {
      /* 
        Modals and Toasts are known to interfere with each other
        We need to wait for the modal to be hidden before displaying the toast, or he will get hidden too
      */
      setTimeout(() => {
        Toast.show({
          type: 'info',
          bottomOffset: TOAST_BOTTOM_OFFSET,
          position: 'bottom',
          props: {
            showClose: true,
          },
          text1: intl.formatMessage({
            defaultMessage: 'Link copied to the clipboard',
            description:
              'Toast info message that appears when the user copy the link of a post',
          }),
        });
      }, MODAL_ANIMATION_TIME);
    });
  };

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      await Share.share({
        url: buildPostUrl(post.webCard.userName, fromGlobalId(post.id).id),
      });
      //TODO: handle result of the share when specified
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  const goToComments = () => {
    router.push({
      route: 'POST_COMMENTS',
      params: { postId: post.id },
    });
  };
  const addComment = () => {
    goToComments();
    toggleModal();
  };

  const report = () => {
    //TODO
    alert('TODO');
    toggleModal();
  };

  const [commitUpdatePostComments] =
    useMutation<PostRendererBottomPanelUpdatePostAllowCommentsMutation>(graphql`
      mutation PostRendererBottomPanelUpdatePostAllowCommentsMutation(
        $input: UpdatePostInput!
      ) {
        updatePost(input: $input) {
          post {
            id
            allowComments
          }
        }
      }
    `);

  const [commitUpdatePostLikes] =
    useMutation<PostRendererBottomPanelUpdateAllowLikesPostMutation>(graphql`
      mutation PostRendererBottomPanelUpdateAllowLikesPostMutation(
        $input: UpdatePostInput!
      ) {
        updatePost(input: $input) {
          post {
            id
            allowLikes
          }
        }
      }
    `);

  const intl = useIntl();

  const updatePost = useCallback(
    (input: { allowComments: boolean } | { allowLikes: boolean }) => {
      const update =
        'allowComments' in input
          ? commitUpdatePostComments
          : commitUpdatePostLikes;

      update({
        variables: {
          input: {
            postId: post.id,
            ...input,
          },
        },
        optimisticResponse: {
          updatePost: {
            post: {
              id: post.id,
              ...input,
            },
          },
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error while updating this post, please try again.',
              description: 'Error toast message when updating post fails.',
            }),
          });
        },
      });
    },
    [commitUpdatePostComments, commitUpdatePostLikes, intl, post.id],
  );

  const setAllowComments = useCallback(() => {
    updatePost({ allowComments: !post.allowComments });
  }, [post.allowComments, updatePost]);

  const setAllowLikes = useCallback(() => {
    updatePost({ allowLikes: !post.allowLikes });
  }, [post.allowLikes, updatePost]);

  const { webCardId, profileRole } = useAuthState();

  const isViewer = webCardId === post.webCard.id;

  const toggleFollow = useToggleFollow();

  const onToggleFollow = () => {
    if (profileRole && isEditor(profileRole)) {
      toggleFollow(
        post.webCard.id,
        post.webCard.userName,
        !post.webCard.isFollowing,
      );
    } else if (post.webCard.isFollowing) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins can stop following a WebCard',
          description:
            'Error message when trying to unfollow a WebCard without being an admin',
        }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins can follow a WebCard',
          description:
            'Error message when trying to follow a WebCard without being an admin',
        }),
      });
    }
  };

  return (
    <>
      <View style={styles.bottomContainerPost}>
        <PostRendererActionBar style={{ marginTop: 10 }} postKey={postKey} />
        {!!post.content && (
          <ExpendableText
            style={styles.content}
            numberOfLines={3}
            label={post.content}
            variant="medium"
          />
        )}
        <PressableOpacity onPress={goToComments}>
          {post.previewComment && (
            <Text variant="small" numberOfLines={2} ellipsizeMode="tail">
              <Text variant="smallbold">
                {post.previewComment.webCard.userName}{' '}
              </Text>
              {post.previewComment.comment}
            </Text>
          )}
          {post.allowComments && post.counterComments > 0 && (
            <Text
              variant="medium"
              style={styles.textCommentCounter}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              <FormattedMessage
                defaultMessage="See {counterComments, plural,
                                    =0 {0 comment}
                                    one {1 comment}
                                    other {# comments}
                                }"
                description="PostRendererBottomPanel - Comments Counter"
                values={{
                  counterComments: post.counterComments ?? 0,
                }}
              />
            </Text>
          )}
        </PressableOpacity>
        <Text variant="small" style={styles.relativeTime}>
          <FormattedRelativeTime
            value={relativeDateMinute(post.createdAt)}
            numeric="auto"
            updateIntervalInSeconds={60}
          />
        </Text>
      </View>
      <BottomSheetModal
        visible={showModal}
        height={post.allowComments ? MODAL_HEIGHT : SMALL_MODAL_HEIGHT}
        variant="modal"
        onRequestClose={toggleModal}
      >
        <View style={{ flex: 1, justifyContent: 'space-evenly' }}>
          {isViewer && (
            <View style={styles.modalLine}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Likes"
                  description="PostItem Modal - Likes switch Label"
                />
              </Text>
              <Switch
                variant="large"
                value={post.allowLikes}
                onValueChange={setAllowLikes}
              />
            </View>
          )}
          {isViewer && (
            <View style={styles.modalLine}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Comments"
                  description="PostItem Modal - Comments switch Label"
                />
              </Text>
              <Switch
                variant="large"
                value={post.allowComments}
                onValueChange={setAllowComments}
              />
            </View>
          )}

          <PressableOpacity onPress={copyLink} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Copy link"
                description="PostItem Modal - Copy Link Label"
              />
            </Text>
          </PressableOpacity>
          <PressableOpacity onPress={onShare} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Share"
                description="PostItem Modal - Share Label"
              />
            </Text>
          </PressableOpacity>
          {post.allowComments && (
            <PressableOpacity onPress={addComment} style={styles.modalLine}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Add a comment"
                  description="PostItem Modal - Add a comment Label"
                />
              </Text>
            </PressableOpacity>
          )}
          {!isViewer && (
            <PressableOpacity onPress={onToggleFollow} style={styles.modalLine}>
              {post.webCard?.isFollowing ? (
                <Text variant="medium" style={{ color: colors.grey400 }}>
                  <FormattedMessage
                    defaultMessage="Unfollow"
                    description="PostItem Modal - unfollow Label"
                  />
                </Text>
              ) : (
                <Text variant="medium">
                  <FormattedMessage
                    defaultMessage="Follow"
                    description="PostItem Modal - Follows Label"
                  />
                </Text>
              )}
            </PressableOpacity>
          )}
          {!isViewer && (
            <PressableOpacity
              onPress={report}
              style={[styles.modalLine, styles.errorModalLine]}
            >
              <Text variant="error">
                <FormattedMessage
                  defaultMessage="Report this post"
                  description="PostItem Modal - Likes Label"
                />
              </Text>
            </PressableOpacity>
          )}
          {isViewer && (
            <PressableOpacity
              onPress={report}
              style={[styles.modalLine, styles.errorModalLine]}
            >
              <Text variant="error">
                <FormattedMessage
                  defaultMessage="Delete this post"
                  description="PostItem Modal - Delete this post"
                />
              </Text>
            </PressableOpacity>
          )}
        </View>
      </BottomSheetModal>
    </>
  );
};

export default PostRendererBottomPanel;

const styles = StyleSheet.create({
  bottomContainerPost: { marginHorizontal: 20, rowGap: 10 },
  modalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
    marginHorizontal: 20,
  },
  errorModalLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relativeTime: { color: colors.grey400 },
  textCommentCounter: { color: colors.grey400, marginTop: 5 },
  content: {
    fontSize: 12,
  },
});

export const PostRendererBottomPanelSkeleton = () => {
  return (
    <View style={styles.bottomContainerPost}>
      <PostRendererActionBarSkeleton />
    </View>
  );
};

const TOAST_BOTTOM_OFFSET = 50;
const MODAL_ANIMATION_TIME = 800;
const MODAL_HEIGHT = 284;
const SMALL_MODAL_HEIGHT = 200;
