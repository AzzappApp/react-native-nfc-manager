import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PostLikesList from './PostLikesList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostLikesScreenQuery } from '#relayArtifacts/PostLikesScreenQuery.graphql';
import type { PostLikesRoute } from '#routes';

const postLikesScreenQuery = graphql`
  query PostLikesScreenQuery($postId: ID!, $viewerWebCardId: ID!) {
    node(id: $postId) {
      ... on Post @alias(as: "post") {
        counterReactions
        ...PostLikesList_post @arguments(viewerWebCardId: $viewerWebCardId)
      }
    }
  }
`;

const PostLikesScreen = ({
  preloadedQuery,
}: RelayScreenProps<PostLikesRoute, PostLikesScreenQuery>) => {
  const insets = useScreenInsets();
  const router = useRouter();
  const intl = useIntl();

  const { node } = usePreloadedQuery(postLikesScreenQuery, preloadedQuery);
  const post = node?.post;

  return (
    <Container
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <Header
        middleElement={intl.formatMessage(
          {
            defaultMessage: `{likes, plural,
              =0 {0 likes}
              =1 {# like}
              other {# likes}
            }`,
            description: 'Post Likes header title',
          },
          { likes: post?.counterReactions },
        )}
        leftElement={
          <IconButton
            icon="arrow_down"
            onPress={router.back}
            iconSize={30}
            size={47}
            style={{ borderWidth: 0 }}
          />
        }
      />
      {post && <PostLikesList style={styles.likes} post={post} />}
    </Container>
  );
};

const PostLikesScreenFallback = () => null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  likes: {
    marginTop: 10,
  },
});

export default relayScreen(PostLikesScreen, {
  query: postLikesScreenQuery,
  getVariables: ({ postId }, profileInfos) => ({
    postId,
    viewerWebCardId: profileInfos?.webCardId,
  }),
  fallback: PostLikesScreenFallback,
});
