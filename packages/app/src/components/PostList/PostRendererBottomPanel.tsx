import * as Sentry from '@sentry/react-native';
import * as Clipboard from 'expo-clipboard';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useState } from 'react';
import { FormattedMessage, FormattedRelativeTime, useIntl } from 'react-intl';
import { View, StyleSheet, Share, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { buildPostUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { relativeDateMinute } from '#helpers/dateHelpers';
import useAuthState from '#hooks/useAuthState';
import { useSendReport } from '#hooks/useSendReport';
import useToggleFollow from '#hooks/useToggleFollow';
import { POST_MAX_CONTENT_LENGTH } from '#screens/PostCreationScreen/PostContentPanel';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import ExpendableText from '#ui/ExpendableText';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextAreaModal from '#ui/TextAreaModal';
import PostRendererActionBar, {
  PostRendererActionBarSkeleton,
} from './PostRendererActionBar';
import type { PostRendererActionBar_post$key } from '#relayArtifacts/PostRendererActionBar_post.graphql';
import type { PostRendererBottomPanelDeletePostMutation } from '#relayArtifacts/PostRendererBottomPanelDeletePostMutation.graphql';
import type { PostRendererBottomPanelFragment_post$key } from '#relayArtifacts/PostRendererBottomPanelFragment_post.graphql';
import type { PostRendererBottomPanelUpdateAllowLikesPostMutation } from '#relayArtifacts/PostRendererBottomPanelUpdateAllowLikesPostMutation.graphql';
import type { PostRendererBottomPanelUpdateContentPostMutation } from '#relayArtifacts/PostRendererBottomPanelUpdateContentPostMutation.graphql';
import type { PostRendererBottomPanelUpdatePostAllowCommentsMutation } from '#relayArtifacts/PostRendererBottomPanelUpdatePostAllowCommentsMutation.graphql';

type PostRendererBottomPanelProps = {
  /**
   * Show the action modal
   *
   * @type {boolean}
   */
  showModal: boolean;
  /**
   *
   * Toggle the display modal action visibility
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
  /**
   * Allow actions
   *
   * @type {boolean}
   */
  actionEnabled: boolean;

  onActionDisabled?: () => void;
};

const PostRendererBottomPanel = ({
  showModal,
  toggleModal,
  post: postKey,
  actionEnabled,
  onActionDisabled,
}: PostRendererBottomPanelProps) => {
  const router = useRouter();
  const post = useFragment(
    graphql`
      fragment PostRendererBottomPanelFragment_post on Post
      @argumentDefinitions(viewerWebCardId: { type: "ID" }) {
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
          isFollowing(webCardId: $viewerWebCardId)
        }
        createdAt
      }
    `,
    postKey as PostRendererBottomPanelFragment_post$key,
  );

  const intl = useIntl();
  const copyLink = useCallback(() => {
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
  }, [intl, post.id, post.webCard.userName, toggleModal]);

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    const url = buildPostUrl(post.webCard.userName, fromGlobalId(post.id).id);
    let message = intl.formatMessage({
      defaultMessage: 'Check out this post on azzapp: ',
      description:
        'Post BottomPanel, message use when sharing the Post on azzapp',
    });
    if (Platform.OS === 'android') {
      // for android we need to add the message to the share
      message = `${message} ${url}`;
    }
    try {
      await Share.share({
        title: intl.formatMessage({
          defaultMessage: 'Post on azzapp',
          description:
            'Post BottomPanel, message use when sharing the Post on azzapp',
        }),
        message,
        url,
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

  const [commitUpdatePostComments] =
    useMutation<PostRendererBottomPanelUpdatePostAllowCommentsMutation>(graphql`
      mutation PostRendererBottomPanelUpdatePostAllowCommentsMutation(
        $webCardId: ID!
        $input: UpdatePostInput!
      ) {
        updatePost(webCardId: $webCardId, input: $input) {
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
        $webCardId: ID!
        $input: UpdatePostInput!
      ) {
        updatePost(webCardId: $webCardId, input: $input) {
          post {
            id
            allowLikes
          }
        }
      }
    `);

  const [commitUpdatePostContent, isLoadingUpdatePostContent] =
    useMutation<PostRendererBottomPanelUpdateContentPostMutation>(graphql`
      mutation PostRendererBottomPanelUpdateContentPostMutation(
        $webCardId: ID!
        $input: UpdatePostInput!
      ) {
        updatePost(webCardId: $webCardId, input: $input) {
          post {
            id
            content
          }
        }
      }
    `);

  //useToggle does not well here with modal and textmodal
  const [showEdit, setShowEdit] = useState(false);
  const openEditcontent = useCallback(() => {
    setShowEdit(true);
  }, []);
  const onCloseEditContent = useCallback(() => {
    setShowEdit(false);
  }, []);

  const editPostContent = useCallback(
    (text: string) => {
      commitUpdatePostContent({
        variables: {
          webCardId: post.webCard.id,
          input: {
            postId: post.id,
            content: text,
          },
        },
        optimisticResponse: {
          updatePost: {
            post: {
              id: post.id,
              content: text,
            },
          },
        },
        onCompleted: onCloseEditContent,
        onError: error => {
          Sentry.captureException(error);
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
    [
      commitUpdatePostContent,
      intl,
      onCloseEditContent,
      post.id,
      post.webCard.id,
    ],
  );

  const updatePost = useCallback(
    (input: { allowComments: boolean } | { allowLikes: boolean }) => {
      const update =
        'allowComments' in input
          ? commitUpdatePostComments
          : commitUpdatePostLikes;

      update({
        variables: {
          webCardId: post.webCard.id,
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
          Sentry.captureException(error);
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
    [
      commitUpdatePostComments,
      commitUpdatePostLikes,
      intl,
      post.id,
      post.webCard.id,
    ],
  );

  const setAllowComments = useCallback(() => {
    updatePost({ allowComments: !post.allowComments });
  }, [post.allowComments, updatePost]);

  const setAllowLikes = useCallback(() => {
    updatePost({ allowLikes: !post.allowLikes });
  }, [post.allowLikes, updatePost]);

  const { profileInfos } = useAuthState();

  const isViewer = profileInfos?.webCardId === post.webCard.id;

  const toggleFollow = useToggleFollow();

  const onToggleFollow = () => {
    if (profileHasEditorRight(profileInfos?.profileRole)) {
      toggleFollow(
        post.webCard.id,
        post.webCard.userName,
        !post.webCard.isFollowing,
      );
    } else if (post.webCard.isFollowing) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to unfollow a WebCard without being an admin',
        }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to follow a WebCard without being an admin',
        }),
      });
    }
  };

  const [commit, deleteLoading] =
    useMutation<PostRendererBottomPanelDeletePostMutation>(graphql`
      mutation PostRendererBottomPanelDeletePostMutation(
        $webCardId: ID!
        $postId: ID!
      ) {
        deletePost(webCardId: $webCardId, postId: $postId) {
          postId @deleteRecord
        }
      }
    `);

  const deletePost = useCallback(() => {
    if (
      profileHasEditorRight(profileInfos?.profileRole) &&
      profileInfos?.webCardId
    ) {
      commit({
        variables: {
          webCardId: profileInfos?.webCardId,
          postId: post.id,
        },
        onCompleted() {
          toggleModal();
        },
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description: 'Error message when trying to delete a comment',
        }),
      });
    }
  }, [
    commit,
    intl,
    post.id,
    profileInfos?.profileRole,
    profileInfos?.webCardId,
    toggleModal,
  ]);

  const [sendReport, commitSendReportLoading] = useSendReport(
    post.id,
    ({ sendReport }) => {
      if (sendReport.created) {
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'Report on post sent',
            description:
              'Success toast message when sending report on post succeeds.',
          }),
          onHide: toggleModal,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: intl.formatMessage({
            defaultMessage: 'You already reported this post',
            description:
              'Info toast message when sending report on post is already done.',
          }),
          onHide: toggleModal,
        });
      }
    },
    () =>
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while sending the report, please try again.',
          description: 'Error toast message when sending report fails.',
        }),
      }),
  );

  return (
    <>
      <View style={styles.bottomContainerPost}>
        <PostRendererActionBar
          style={{ marginTop: 10 }}
          postKey={postKey}
          actionEnabled={actionEnabled}
          onActionDisabled={onActionDisabled}
        />
        {!!post.content && (
          <ExpendableText
            style={styles.content}
            numberOfLines={3}
            label={post.content}
            variant="medium"
          />
        )}
        <PressableNative onPress={goToComments}>
          {post.allowComments && post.previewComment && (
            <Text variant="small" numberOfLines={2} ellipsizeMode="tail">
              <Text variant="smallbold">
                {post.previewComment.webCard.userName}{' '}
              </Text>
              {post.previewComment.comment}
            </Text>
          )}
          {post.allowComments && post.counterComments > 0 && (
            <PressableNative onPress={goToComments}>
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
            </PressableNative>
          )}
        </PressableNative>
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
        contentContainerStyle={styles.bottomSheetContainer}
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
          {isViewer && (
            <PressableNative onPress={openEditcontent} style={styles.modalLine}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Edit"
                  description="PostItem Modal - Edit Label"
                />
              </Text>
            </PressableNative>
          )}

          <PressableNative onPress={copyLink} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Copy link"
                description="PostItem Modal - Copy Link Label"
              />
            </Text>
          </PressableNative>
          <PressableNative onPress={onShare} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Share"
                description="PostItem Modal - Share Label"
              />
            </Text>
          </PressableNative>
          {post.allowComments && (
            <PressableNative onPress={addComment} style={styles.modalLine}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Add a comment"
                  description="PostItem Modal - Add a comment Label"
                />
              </Text>
            </PressableNative>
          )}
          {!isViewer && (
            <PressableNative onPress={onToggleFollow} style={styles.modalLine}>
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
            </PressableNative>
          )}
          {!isViewer && (
            <PressableNative
              onPress={sendReport}
              style={[styles.modalLine, styles.errorModalLine]}
              disabled={commitSendReportLoading}
            >
              {commitSendReportLoading ? (
                <ActivityIndicator />
              ) : (
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Report this post"
                    description="PostItem Modal - Report this post"
                  />
                </Text>
              )}
            </PressableNative>
          )}
          {isViewer && (
            <PressableNative
              onPress={deletePost}
              disabled={deleteLoading}
              style={[styles.modalLine, styles.errorModalLine]}
            >
              {deleteLoading ? (
                <ActivityIndicator />
              ) : (
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Delete this post"
                    description="PostItem Modal - Delete this post"
                  />
                </Text>
              )}
            </PressableNative>
          )}
        </View>
        <TextAreaModal
          visible={showEdit}
          value={post.content ?? ''}
          headerTitle={intl.formatMessage({
            defaultMessage: 'Edit description',
            description:
              'Title for text area header modal in post content edition screen',
          })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter description',
            description:
              'Placeholder for text area in post content edition screen',
          })}
          maxLength={POST_MAX_CONTENT_LENGTH}
          onClose={onCloseEditContent}
          closeOnBlur={false}
          onChangeText={editPostContent}
          loading={isLoadingUpdatePostContent}
        />
      </BottomSheetModal>
    </>
  );
};

export default PostRendererBottomPanel;

const styles = StyleSheet.create({
  bottomContainerPost: { marginHorizontal: 20, rowGap: 10 },

  bottomSheetContainer: {
    paddingHorizontal: 0,
  },
  modalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 42,
    paddingVertical: 5,
    paddingHorizontal: 20,
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
const SMALL_MODAL_HEIGHT = 242;
