import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import PostCreationScreen from '#screens/PostCreationScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewPostRoute } from '#routes';
import type { PostCreationMobileScreenQuery } from '@azzapp/relay/artifacts/PostCreationMobileScreenQuery.graphql';

const postCreationMobileScreenQuer = graphql`
  query PostCreationMobileScreenQuery {
    viewer {
      ...PostCreationScreen_viewer
    }
  }
`;

const PostCreationMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<NewPostRoute, PostCreationMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(
    postCreationMobileScreenQuer,
    preloadedQuery,
  );
  return <PostCreationScreen viewer={viewer} />;
};

PostCreationMobileScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

export default relayScreen(PostCreationMobileScreen, {
  query: postCreationMobileScreenQuer,
});
