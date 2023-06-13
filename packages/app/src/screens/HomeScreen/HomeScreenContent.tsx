import { useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors, shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import FollowedProfilesPostsList from './FollowedProfilesPostsList';
import HomeHeader from './HomeHeader';
import HomeProfilesList from './HomeProfilesList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeRoute } from '#routes';
import type { HomeScreenContentQuery } from '@azzapp/relay/artifacts/HomeScreenContentQuery.graphql';

type HomeScreenContentProps = RelayScreenProps<
  HomeRoute,
  HomeScreenContentQuery
> & {
  onReady: () => void;
  onLoaded: () => void;
};

export const homeScreenQuery = graphql`
  query HomeScreenContentQuery {
    viewer {
      profile {
        id
      }
      ...HomeProfilesList_viewer
      ...FollowedProfilesPostsList_viewer
    }
  }
`;

const HomeScreen = ({
  preloadedQuery,
  hasFocus = true,
  onReady,
  onLoaded,
}: HomeScreenContentProps) => {
  const { viewer } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  useEffect(() => {
    // the usePreloadedQuery hook will suspend until the query is ready
    onLoaded?.();
  }, [onLoaded]);

  const router = useRouter();
  const goToSettings = useCallback(() => {
    router.push({ route: 'ACCOUNT' });
  }, [router]);

  const postsReady = useRef(false);
  const coversReady = useRef(false);

  const onPostsReady = useCallback(() => {
    postsReady.current = true;
    if (coversReady.current) {
      onReady?.();
    }
  }, [onReady]);

  const onCoversReady = useCallback(() => {
    coversReady.current = true;
    if (postsReady.current) {
      onReady?.();
    }
  }, [onReady]);

  const insets = useSafeAreaInsets();
  const styles = useStyleSheet(styleSheet);

  return (
    <FollowedProfilesPostsList
      viewer={viewer}
      canPlay={hasFocus}
      ListHeaderComponent={
        <Container style={{ marginTop: insets.top }}>
          <HomeHeader goToSettings={goToSettings} />
          <HomeProfilesList
            viewer={viewer}
            style={styles.followedProfilesList}
            onReady={onCoversReady}
          />
        </Container>
      }
      stickyHeaderIndices={[0]}
      style={styles.followedProfilesPosts}
      postsContainerStyle={styles.followedProfilesPostsListPostsContainerShadow}
      onReady={onPostsReady}
    />
  );
};

export default HomeScreen;

const styleSheet = createStyleSheet(appearance => ({
  followedProfilesPosts: {
    flex: 1,
  },
  followedProfilesList: {
    height: 200,
    marginTop: 10,
    marginBottom: 13,
    marginLeft: 10,
  },
  followedProfilesPostsListPostsContainerShadow: [
    {
      paddingVertical: 8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      zIndex: 20,
      backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    },
    shadow(appearance),
  ],
}));
