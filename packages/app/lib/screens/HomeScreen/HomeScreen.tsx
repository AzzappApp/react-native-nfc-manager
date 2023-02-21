import { useEffect } from 'react';
import { StyleSheet, Image, Platform, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import { HEADER_HEIGHT } from '../../components/Header';
import useViewportSize, { insetTop, VW100 } from '../../hooks/useViewportSize';
import { useRouter } from '../../PlatformEnvironment';
import FollowedProfilesList from './FollowedProfilesList';
import FollowedProfilesPostsList from './FollowedProfilesPostsList';
import type { HomeScreen_viewer$key } from '@azzapp/relay/artifacts/HomeScreen_viewer.graphql';

type HomeScreenProps = {
  viewer: HomeScreen_viewer$key;
  hasFocus?: boolean;
};

const HomeScreen = ({
  viewer: viewerRef,
  hasFocus = true,
}: HomeScreenProps) => {
  const viewer = useFragment(
    graphql`
      fragment HomeScreen_viewer on Viewer {
        profile {
          id
          isReady
        }
        ...FollowedProfilesList_viewer
        ...FollowedProfilesPostsList_viewer
      }
    `,
    viewerRef,
  );

  const router = useRouter();
  useEffect(() => {
    if (!viewer.profile?.isReady) router.showModal({ route: 'ONBOARDING' });
  }, [router, viewer.profile?.isReady]);

  const vp = useViewportSize();

  return (
    <FollowedProfilesPostsList
      viewer={viewer}
      canPlay={hasFocus}
      ListHeaderComponent={
        <View style={{ marginTop: vp`${insetTop}` }}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo-full.png')}
              style={styles.logo}
            />
          </View>
          <FollowedProfilesList
            viewer={viewer}
            style={styles.followedProfilesList}
          />
        </View>
      }
      stickyHeaderIndices={[0]}
      style={[
        styles.followedProfilesPosts,
        Platform.OS !== 'web' && {
          borderBottomLeftRadius: vp`${VW100} * ${0.16}`,
          borderBottomRightRadius: vp`${VW100} * ${0.16}`,
        },
      ]}
      postsContainerStyle={[
        styles.followedProfilesPostsListPostsContainer,
        styles.followedProfilesPostsListPostsContainerShadow,
      ]}
    />
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  signupButton: { width: 150 },
  followedProfilesPosts: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
  },
  logo: {
    height: 24,
  },
  followedProfilesList: {
    height: 200,
    marginTop: 10,
    marginBottom: 13,
    marginLeft: 10,
  },
  signupSection: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedProfilesPostsListPostsContainer: {
    paddingVertical: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFF',
    zIndex: 20,
  },
  followedProfilesPostsListPostsContainerShadow: Platform.select({
    default: {
      shadowColor: colors.dark,
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
    },
    android: { elevation: 10 },
  }),
});
