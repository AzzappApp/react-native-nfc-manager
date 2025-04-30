import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SwipeableRow, { SwipeableRowRightAction } from '#ui/SwipeableRow';
import CommentItem from './CommentItem';
import type { CommentItemFragment_comment$key } from '#relayArtifacts/CommentItemFragment_comment.graphql';
import type { DeletableCommentItemDeleteCommentMutation } from '#relayArtifacts/DeletableCommentItemDeleteCommentMutation.graphql';
import type { SwipeableRowActionsProps } from '#ui/SwipeableRow';
type DeletableCommentItemProps = {
  item: CommentItemFragment_comment$key;
  postId: string;
};

const DeletableCommentItem = (props: DeletableCommentItemProps) => {
  const { item, postId } = props;

  const comment = useFragment(
    graphql`
      fragment DeletableCommentItemFragment_comment on PostComment {
        id
      }
    `,
    item,
  );

  const [commit] = useMutation<DeletableCommentItemDeleteCommentMutation>(
    graphql`
      mutation DeletableCommentItemDeleteCommentMutation(
        $webCardId: ID!
        $commentId: ID!
      ) {
        deletePostComment(webCardId: $webCardId, commentId: $commentId) {
          commentId @deleteRecord
        }
      }
    `,
  );
  const intl = useIntl();

  if (!comment) return null;

  const DeletableCommentItemActions = ({
    progress,
    onClose,
  }: SwipeableRowActionsProps) => {
    const onDelete = () => {
      const { profileInfos } = getAuthState();
      if (profileInfoHasEditorRight(profileInfos) && profileInfos?.webCardId) {
        commit({
          variables: {
            webCardId: profileInfos?.webCardId,
            commentId: comment.id,
          },
          onCompleted() {
            onClose();
          },
          updater: store => {
            const post = store.get<{ counterComments: number }>(postId);
            if (post) {
              const counterComments = post?.getValue('counterComments');

              if (typeof counterComments === 'number') {
                post?.setValue(counterComments - 1, 'counterComments');
              }
            }
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
    };

    return (
      <View
        style={{
          width: 72,
          flexDirection: 'row',
        }}
      >
        <SwipeableRowRightAction x={72} progress={progress}>
          <PressableNative style={styles.rightAction} onPress={onDelete}>
            <Icon
              icon="trash"
              style={{ tintColor: colors.white, width: 24, height: 24 }}
            />
          </PressableNative>
        </SwipeableRowRightAction>
      </View>
    );
  };

  return (
    <SwipeableRow RightActions={DeletableCommentItemActions}>
      <CommentItem item={item} />
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.red400,
  },
});

export default DeletableCommentItem;
