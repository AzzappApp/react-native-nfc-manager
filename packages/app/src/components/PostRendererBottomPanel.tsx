/* eslint-disable no-alert */
import { FormattedMessage, FormattedRelativeTime } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
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
  showModal: boolean;
  toggleModal: () => void;
  author: PostRendererBottomPanelFragment_author$key;
  post: PostRendererBottomPanelFragment_post$key;
};

const PostRendererBottomPanel = ({
  showModal,
  toggleModal,
  author: authorKey,
  post: postKey,
}: PostRendererBottomPanelProps) => {
  const post = useFragment(
    graphql`
      fragment PostRendererBottomPanelFragment_post on Post {
        ...PostRendererActionBar_post
        content
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

  const share = () => {
    //TODO
    alert('TODO');
    toggleModal();
  };

  const addComment = () => {
    //TODO
    alert('TODO');
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
          <PressableOpacity onPress={share} style={styles.modalLine}>
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
