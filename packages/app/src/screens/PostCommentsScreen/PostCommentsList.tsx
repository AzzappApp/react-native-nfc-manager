import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useMutation,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import { useRouter } from '#components/NativeRouter';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Input from '#ui/Input';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import CommentItem from './CommentItem';
import DeletableCommentItem from './DeletableCommentItem';
import PostCommentsScreenHeader from './PostCommentsScreenHeader';
import type { AuthorCartoucheFragment_webCard$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_webCard.graphql';
import type { CommentItemFragment_comment$key } from '@azzapp/relay/artifacts/CommentItemFragment_comment.graphql';
import type { PostCommentsList_comments$key } from '@azzapp/relay/artifacts/PostCommentsList_comments.graphql';
import type {
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';

type PostCommentsListProps = {
  /**
   *
   *
   * @type {PostCommentsListQuery$key}
   */
  webCard: AuthorCartoucheFragment_webCard$key;
  /**
   *
   *
   * @type {PostCommentsList_comments$key}
   */
  post: PostCommentsList_comments$key;
  /**
   * the post id for the comments
   *
   * @type {string}
   */
  postId: string;
};

const PostCommentsList = ({
  webCard: webCardKey,
  post: postKey,
  postId,
}: PostCommentsListProps) => {
  const connectionID = ConnectionHandler.getConnectionID(
    postId,
    'PostCommentsList_post_connection_comments',
  );

  const router = useRouter();
  const intl = useIntl();
  const auth = useAuthState();
  const onClose = () => {
    router.back();
  };

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment PostCommentsList_comments on Post
        @refetchable(queryName: "PostCommentsList_post_comments_connection")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 30 }
        ) {
          comments(after: $after, first: $first)
            @connection(key: "PostCommentsList_post_connection_comments") {
            edges {
              node {
                id
                webCard {
                  id
                }
                ...CommentItemFragment_comment
                ...DeletableCommentItemFragment_comment
              }
            }
          }
        }
      `,
      postKey,
    );

  const [comment, setComment] = useState<string>('');
  const [inputHeight, setInputHeight] = useState<number>(68);
  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    setInputHeight(
      Math.max(47, Math.min(e.nativeEvent.contentSize.height + 15, 92)),
    );
  };

  const [commit] = useMutation(graphql`
    mutation PostCommentsListMutation(
      $input: CreatePostCommentInput!
      $connections: [ID!]!
    ) {
      createPostComment(input: $input) {
        postComment
          @prependNode(
            connections: $connections
            edgeTypeName: "PostCommentEdge"
          ) {
          id
          ...CommentItemFragment_comment
        }
      }
    }
  `);

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    setSubmitting(true);
    if (!submitting) {
      if (auth.profileRole && isEditor(auth.profileRole)) {
        commit({
          variables: {
            input: { postId, comment },
            connections: [connectionID],
          },
          onCompleted() {
            setSubmitting(false);
            setComment('');
          },
          updater: store => {
            const post = store.get<{ counterComments: number }>(postId);
            if (post) {
              const counterComments = post?.getValue('counterComments');

              if (typeof counterComments === 'number') {
                post?.setValue(counterComments + 1, 'counterComments');
              }
            }
          },
          onError(error) {
            console.error(error);
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, could not save your comment, try again later',
                description: 'Post comment screen - error toast',
              }),
            });
          },
        });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Only admins can comment a post',
            description: 'Error message when trying to comment a post',
          }),
        });
      }
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !refreshing) {
      loadNext(30);
    }
  }, [isLoadingNext, hasNext, refreshing, loadNext]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (!refreshing && !isLoadingNext) {
      refetch(
        {},
        {
          fetchPolicy: 'store-and-network',
          onComplete() {
            setRefreshing(false);
          },
        },
      );
    }
  }, [isLoadingNext, refetch, refreshing]);

  const postComments = useMemo(
    () =>
      data.comments?.edges
        ? convertToNonNullArray(
            data.comments?.edges?.map(edge => edge?.node ?? null),
          )
        : [],
    [data.comments?.edges],
  );

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: CommentItemFragment_comment$key & { webCard: { id: string } };
    }) => {
      if (auth.webCardId !== item.webCard.id) {
        return <CommentItem item={item} />;
      }
      return <DeletableCommentItem item={item} postId={postId} />;
    },
    [auth.webCardId, postId],
  );

  const insets = useScreenInsets();

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
    );
  }, [refreshing, onRefresh]);

  const ListFooterComponent = useMemo(
    () => <ListLoadingFooter loading={isLoadingNext} />,
    [isLoadingNext],
  );

  return (
    <Container
      style={[
        styles.keyboardAreaView,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardAreaView]}
      >
        <PostCommentsScreenHeader onClose={onClose} />
        <FlatList
          data={postComments}
          renderItem={renderItem}
          onEndReached={onEndReached}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={ListFooterComponent}
          onEndReachedThreshold={0.5}
          style={styles.list}
          refreshControl={refreshControl}
        />
        <View style={styles.inputContainer}>
          <AuthorCartouche
            author={webCardKey}
            variant="post"
            hideUserName
            style={{ height: 48 }}
          />
          <Input
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Add a comment',
              description: 'Post comment textarea placeholdesd',
            })}
            value={comment}
            onChangeText={setComment}
            onContentSizeChange={onContentSizeChange}
            maxLength={MAX_COMMENT_LENGHT}
            style={{ height: inputHeight }}
            rightElement={
              <PressableOpacity
                onPress={onSubmit}
                disabled={!isNotFalsyString(comment)}
              >
                <Text variant="large">
                  <FormattedMessage
                    defaultMessage="Post"
                    description="Post Comment screen - create comment action button"
                  />
                </Text>
              </PressableOpacity>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default PostCommentsList;
const MAX_COMMENT_LENGHT = 2200;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    maxHeight: 110,
    flexGrow: 1,
    marginLeft: 15,
    paddingRight: 15,
    borderTopWidth: 1,
    borderTopColor: colors.grey50,
    paddingTop: 10,
  },
  keyboardAreaView: {
    flex: 1,
  },
  contentModal: {
    padding: 10,
  },
  counter: {
    marginTop: 5,
    marginLeft: 12,
    color: 'white',
  },
  list: { flex: 1 },
});
