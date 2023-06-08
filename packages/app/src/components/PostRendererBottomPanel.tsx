/* eslint-disable no-alert */
import { FormattedMessage, FormattedRelativeTime } from 'react-intl';
import { View, StyleSheet, Share } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors } from '#theme';
import { relativeDateMinute } from '#helpers/dateHelpers';
import BottomSheetModal from '#ui/BottomSheetModal';
import ExpendableText from '#ui/ExpendableText';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import PostRendererActionBar, {
  PostRendererActionBarSkeleton,
} from './PostRendererActionBar';

import type { PostRendererBottomPanelFragment_author$key } from '@azzapp/relay/artifacts/PostRendererBottomPanelFragment_author.graphql';
import type { PostRendererBottomPanelFragment_post$key } from '@azzapp/relay/artifacts/PostRendererBottomPanelFragment_post.graphql';
import type { PostRendererBottomPanelToggleFollowMutation } from '@azzapp/relay/artifacts/PostRendererBottomPanelToggleFollowMutation.graphql';

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
   *
   *
   * @type {PostRendererBottomPanelFragment_author$key}
   */
  author: PostRendererBottomPanelFragment_author$key;
  /**
   * The post to display
   *
   * @type {PostRendererBottomPanelFragment_post$key}
   */
  post: PostRendererBottomPanelFragment_post$key;
};

const PostRendererBottomPanel = ({
  showModal,
  toggleModal,
  author: authorKey,
  post: postKey,
}: PostRendererBottomPanelProps) => {
  const router = useRouter();
  const post = useFragment(
    graphql`
      fragment PostRendererBottomPanelFragment_post on Post {
        ...PostRendererActionBar_post
        id
        content
        counterComments
        previewComment {
          id
          comment
          author {
            userName
          }
        }
        createdAt
      }
    `,
    postKey,
  );

  const author = useFragment(
    graphql`
      fragment PostRendererBottomPanelFragment_author on Profile {
        id
        isFollowing
      }
    `,
    authorKey,
  );

  const copyLink = () => {
    //TODO
    alert('TODO');
    toggleModal();
  };

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      await Share.share({
        message: 'Azzapp | An app made for your business',
      });
      //TODO: handle result of the share when specified
    } catch (error: any) {
      //TODO error
      console.log(error.message);
    }
  };

  const goToComments = () => {
    router.push({ route: 'POST_COMMENTS', params: { postId: post.id } });
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

  const [commit, toggleFollowingActive] =
    useMutation<PostRendererBottomPanelToggleFollowMutation>(graphql`
      mutation PostRendererBottomPanelToggleFollowMutation(
        $input: ToggleFollowingInput!
      ) {
        toggleFollowing(input: $input) {
          profile {
            id
            isFollowing
          }
        }
      }
    `);

  const toggleFollow = () => {
    if (toggleFollowingActive) {
      return;
    }
    commit({
      variables: {
        input: {
          profileId: author.id,
          follow: !author.isFollowing,
        },
      },
      optimisticResponse: {
        toggleFollowing: {
          profile: {
            id: author.id,
            isFollowing: !author.isFollowing,
          },
        },
      },
    });
  };

  return (
    <>
      <View style={styles.bottomContainerPost}>
        <PostRendererActionBar style={{ marginTop: 10 }} postKey={post} />
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
            <Text variant="small">
              <Text variant="smallbold">
                {post.previewComment.author.userName}{' '}
              </Text>
              {post.previewComment.comment}
            </Text>
          )}
          <Text
            variant="medium"
            style={styles.textCommentCounter}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            <FormattedMessage
              defaultMessage="See {counterComments} comments"
              description="PostRendererBottomPanel - Comment Counter"
              values={{
                counterComments: post.counterComments,
              }}
            />
          </Text>
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
        height={284}
        variant="modal"
        onRequestClose={toggleModal}
      >
        <View style={{ flex: 1, justifyContent: 'space-evenly' }}>
          <PressableOpacity onPress={copyLink} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage defaultMessage="Copy link" description="" />
            </Text>
          </PressableOpacity>
          <PressableOpacity onPress={onShare} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage defaultMessage="Share" description="" />
            </Text>
          </PressableOpacity>
          <PressableOpacity onPress={addComment} style={styles.modalLine}>
            <Text variant="medium">
              <FormattedMessage defaultMessage="Add a comment" description="" />
            </Text>
          </PressableOpacity>
          <PressableOpacity onPress={toggleFollow} style={styles.modalLine}>
            {author?.isFollowing ? (
              <Text variant="medium">
                <FormattedMessage defaultMessage="Follow" description="" />
              </Text>
            ) : (
              <Text variant="medium" style={{ color: colors.grey400 }}>
                <FormattedMessage defaultMessage="Unfollow" description="" />
              </Text>
            )}
          </PressableOpacity>
          <PressableOpacity
            onPress={report}
            style={[styles.modalLine, styles.errorModalLine]}
          >
            <Text variant="error">
              <FormattedMessage
                defaultMessage="Report this post"
                description=""
              />
            </Text>
          </PressableOpacity>
        </View>
      </BottomSheetModal>
    </>
  );
};

export default PostRendererBottomPanel;

const styles = StyleSheet.create({
  bottomContainerPost: { marginHorizontal: 20, rowGap: 10 },
  modalLine: { height: 32, marginHorizontal: 20 },
  errorModalLine: { alignItems: 'center' },
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
