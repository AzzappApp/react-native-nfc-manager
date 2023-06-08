import { useCallback, useRef } from 'react';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import Container from '#ui/Container';
import FollowedProfilesPostsList from './FollowedProfilesPostsList';
import HomeHeader from './HomeHeader';
import HomeProfilesList from './HomeProfilesList';
import type { HomeScreen_viewer$key } from '@azzapp/relay/artifacts/HomeScreen_viewer.graphql';

type HomeScreenProps = {
  viewer: HomeScreen_viewer$key;
  hasFocus?: boolean;
  onReady?: () => void;
};

const HomeScreen = ({
  viewer: viewerRef,
  hasFocus = true,
  onReady,
}: HomeScreenProps) => {
  const viewer = useFragment(
    graphql`
      fragment HomeScreen_viewer on Viewer {
        profile {
          id
        }
        ...HomeProfilesList_viewer
        ...FollowedProfilesPostsList_viewer
      }
    `,
    viewerRef,
  );

  const router = useRouter();
  const goToSettings = useCallback(() => {
    router.push({ route: 'ACCOUNT' });
  }, [router]);

  const vp = useViewportSize();
  const styles = useStyleSheet(styleSheet);

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

  return (
    <FollowedProfilesPostsList
      viewer={viewer}
      canPlay={hasFocus}
      ListHeaderComponent={
        <Container style={{ marginTop: vp`${insetTop}` }}>
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
