import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Alert,
  Keyboard,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useFragment,
  useMutation,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ERRORS from '@azzapp/shared/errors';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import { useRouter } from '#components/NativeRouter';
import { useProfileInfos } from '#hooks/authStateHooks';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Input from '#ui/Input';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import DeletableCommentItem from './DeletableCommentItem';
import PostCommentsScreenHeader from './PostCommentsScreenHeader';
import ReportableCommentItem from './ReportableCommentItem';
import type { CommentItemFragment_comment$key } from '#relayArtifacts/CommentItemFragment_comment.graphql';
import type { PostCommentsList_myProfile$key } from '#relayArtifacts/PostCommentsList_myProfile.graphql';
import type { PostCommentsList_post$key } from '#relayArtifacts/PostCommentsList_post.graphql';
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
  profile: PostCommentsList_myProfile$key;
  /**
   *
   *
   * @type {PostCommentsList_post$key}
   */
  post: PostCommentsList_post$key;
  /**
   * the post id for the comments
   *
   * @type {string}
   */
  postId: string;
};

const PostCommentsList = ({
  profile: profileKey,
  post: postKey,
  postId,
}: PostCommentsListProps) => {
  const connectionID = ConnectionHandler.getConnectionID(
    postId,
    'PostCommentsList_post_connection_comments',
  );

  const router = useRouter();
  const intl = useIntl();
  const profileInfos = useProfileInfos();

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment PostCommentsList_post on Post
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
                ...ReportableCommentItemFragment_comment
              }
            }
          }
        }
      `,
      postKey,
    );

  const profile = useFragment(
    graphql`
      fragment PostCommentsList_myProfile on Profile {
        webCard {
          id
          cardIsPublished
          ...AuthorCartoucheFragment_webCard
        }
        invited
      }
    `,
    profileKey,
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
      $webCardId: ID!
      $input: CreatePostCommentInput!
      $connections: [ID!]!
    ) {
      createPostComment(webCardId: $webCardId, input: $input) {
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
    if (!profile.webCard?.cardIsPublished) {
      Alert.alert(
        intl.formatMessage(
          {
            defaultMessage: 'Unpublished WebCard{azzappA}.',
            description:
              'PostList - Alert Message title when the user is viewing a post (from deeplinking) with an unpublished WebCard',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as string,
        intl.formatMessage(
          {
            defaultMessage:
              'Oops, looks like your WebCard{azzappA} is not published. Publish it first!',
            description:
              'PostList - AlertMessage when the user is viewing a post (from deeplinking) with an unpublished WebCard',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as string,
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Ok',
              description:
                'PostList - Alert button when the user is viewing a post (from deeplinking) with an unpublished WebCard',
            }),
          },
        ],
      );

      return;
    }

    setSubmitting(true);
    if (!submitting) {
      Keyboard.dismiss();
      if (profileHasEditorRight(profileInfos?.profileRole)) {
        commit({
          variables: {
            webCardId: profileInfos?.webCardId,
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
            if (error.message === ERRORS.UNPUBLISHED_WEB_CARD) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage(
                  {
                    defaultMessage:
                      'Oops, this WebCard{azzappA} is not published.',
                    description:
                      'Error when a user tries to comment a post from an unpublished webCard',
                  },
                  {
                    azzappA: <Text variant="azzapp">a</Text>,
                  },
                ) as string,
              });
            } else {
              console.error(error);
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage:
                    'Error, could not save your comment, try again later',
                  description: 'Post comment screen - error toast',
                }),
              });
            }
          },
        });
      } else if (profile.invited) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Oops, first you must accept the pending invitation to join the WebCard.',
            description:
              'PostCommentsList - AlertMessage when the user is viewing a post (from deeplinking) with an invited WebCard',
          }),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Your role does not permit this action',
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
      if (profileInfos?.webCardId !== item.webCard.id) {
        return <ReportableCommentItem item={item} />;
      }
      return <DeletableCommentItem item={item} postId={postId} />;
    },
    [profileInfos?.webCardId, postId],
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
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAreaView}>
        <PostCommentsScreenHeader onClose={router.back} />
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
            author={profile.webCard!}
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
  list: { flex: 1 },
});
