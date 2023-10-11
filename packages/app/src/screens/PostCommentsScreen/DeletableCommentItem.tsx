import { View, StyleSheet } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SwipeableRow, { SwipeableRowRightAction } from '#ui/SwipeableRow';
import CommentItem from './CommentItem';
import type { SwipeableRowActionsProps } from '#ui/SwipeableRow';
import type { CommentItemFragment_comment$key } from '@azzapp/relay/artifacts/CommentItemFragment_comment.graphql';
import type { DeletableCommentItemDeleteCommentMutation } from '@azzapp/relay/artifacts/DeletableCommentItemDeleteCommentMutation.graphql';
type DeletableCommentItemProps = {
  item: CommentItemFragment_comment$key;
};

const DeletableCommentItem = (props: DeletableCommentItemProps) => {
  const { item } = props;

  const { id } = useFragment(
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
        $input: DeletePostCommentInput!
      ) {
        deletePostComment(input: $input) {
          commentId @deleteRecord
        }
      }
    `,
  );

  const DeletableCommenItemActions = ({
    progress,
    onClose,
  }: SwipeableRowActionsProps) => {
    const onDelete = () => {
      commit({
        variables: {
          input: {
            commentId: id,
          },
        },
        onCompleted() {
          onClose();
        },
      });
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
    <SwipeableRow RightActions={DeletableCommenItemActions}>
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
