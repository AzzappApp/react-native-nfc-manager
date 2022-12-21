import { useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { AUTHOR_CARTOUCHE_HEIGHT } from '../components/AuthorCartouche';
import { HEADER_HEIGHT } from '../components/Header';
import { useNativeNavigationEvent } from '../components/NativeRouter';
import relayScreen from '../helpers/relayScreen';
import PostScreen from '../screens/PostScreen';
import type { ScreenOptions } from '../components/NativeRouter';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { PostRoute } from '../routes';
import type { PostMobileScreenQuery } from '@azzapp/relay/artifacts/PostMobileScreenQuery.graphql';
import type { EdgeInsets } from 'react-native-safe-area-context';

const postMobileScreenQuery = graphql`
  query PostMobileScreenQuery($postId: ID!) {
    node(id: $postId) {
      ...PostScreenFragment_post
      ...PostScreenFragment_relatedPosts
    }
  }
`;

const PostMobileScreen = ({
  preloadedQuery,
  hasFocus,
  route: { params },
}: RelayScreenProps<PostRoute, PostMobileScreenQuery>) => {
  const data = usePreloadedQuery(postMobileScreenQuery, preloadedQuery);
  const [ready, setReady] = useState(false);

  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });
  if (!data.node) {
    return null;
  }
  return (
    <PostScreen
      ready={ready}
      hasFocus={hasFocus}
      post={data.node}
      initialVideoTime={params.videoTime}
    />
  );
};

PostMobileScreen.getScreenOptions = (
  { fromRectangle }: PostRoute['params'],
  safeArea: EdgeInsets,
): ScreenOptions | null => {
  if (Platform.OS !== 'ios') {
    // TODO make it works on android
    return { stackAnimation: 'default' };
  }
  if (!fromRectangle) {
    return null;
  }
  const windowWidth = Dimensions.get('window').width;
  return {
    stackAnimation: 'custom',
    stackAnimationOptions: {
      animator: 'reveal',
      fromRectangle,
      toRectangle: {
        x: 0,
        y: safeArea.top + HEADER_HEIGHT + AUTHOR_CARTOUCHE_HEIGHT,
        width: windowWidth,
        height: (windowWidth * fromRectangle.height) / fromRectangle.width,
      },
      fromRadius: (16 / fromRectangle.width) * windowWidth,
      toRadius: 0,
    },
    transitionDuration: 220,
    customAnimationOnSwipe: true,
    gestureEnabled: true,
  };
};

export default relayScreen(PostMobileScreen, {
  query: postMobileScreenQuery,
  getVariables: ({ postId }) => ({ postId }),
});
