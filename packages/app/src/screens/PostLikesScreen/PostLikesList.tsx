import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import PostLikesListItem from './PostLikesListItem';
import type { PostLikesList_post$key } from '#relayArtifacts/PostLikesList_post.graphql';
import type { PostLikesListItem_webCard$key } from '#relayArtifacts/PostLikesListItem_webCard.graphql';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

type Props = {
  post: PostLikesList_post$key;
  style?: StyleProp<ViewStyle>;
};

const PostLikesList = ({ post: postKey, style }: Props) => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment PostLikesList_post on Post
        @refetchable(queryName: "PostLikesList_post_likes_connection")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
          viewerWebCardId: { type: "ID!" }
        ) {
          reactions(after: $after, first: $first)
            @connection(key: "PostLikesList_post_connection_reactions") {
            edges {
              node {
                id
                ...PostLikesListItem_webCard
                  @arguments(viewerWebCardId: $viewerWebCardId)
              }
            }
          }
        }
      `,
      postKey,
    );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !refreshing) {
      loadNext(10);
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

  const webcards = useMemo(() => {
    return convertToNonNullArray(data.reactions.edges?.map(e => e?.node) ?? []);
  }, [data.reactions.edges]);

  const renderItem = useCallback(
    (
      infos: ListRenderItemInfo<PostLikesListItem_webCard$key & { id: string }>,
    ) => {
      return <PostLikesListItem webcard={infos.item} />;
    },
    [],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT + SEPARATOR_HEIGHT,
      offset: (ITEM_HEIGHT + SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );

  return (
    <FlatList
      testID="webCard-list"
      accessibilityRole="list"
      data={webcards}
      renderItem={renderItem}
      onEndReached={onEndReached}
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onRefresh={onRefresh}
      refreshing={refreshing}
      style={style}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      renderScrollComponent={props => <KeyboardAwareScrollView {...props} />}
    />
  );
};

const SEPARATOR_HEIGHT = 10.5;
const ITEM_HEIGHT = 58;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    rowGap: SEPARATOR_HEIGHT,
  },
});

export default PostLikesList;
