import { useCallback } from 'react';
import { Image, View, useColorScheme } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowedProfilesPostsList from './FollowedProfilesPostsList';
import HomeProfilesList from './HomeProfilesList';
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
  const colorScheme = useColorScheme();

  return (
    <FollowedProfilesPostsList
      viewer={viewer}
      canPlay={hasFocus}
      ListHeaderComponent={
        <Container style={{ marginTop: vp`${insetTop}` }}>
          <Header
            leftElement={
              <Image
                source={
                  colorScheme === 'dark'
                    ? require('#assets/logo-full_white.png')
                    : require('#assets/logo-full_dark.png')
                }
                style={styles.logo}
              />
            }
            rightElement={
              <View style={styles.rightButtonContainer}>
                <IconButton
                  icon="notification"
                  iconSize={24}
                  size={45}
                  variant="icon"
                  onPress={goToSettings}
                />
                <IconButton
                  icon="account"
                  onPress={goToSettings}
                  iconSize={26}
                  size={45}
                  variant="icon"
                />
              </View>
            }
            style={{ marginBottom: 8 }}
          />
          <HomeProfilesList
            viewer={viewer}
            style={styles.followedProfilesList}
          />
        </Container>
      }
      stickyHeaderIndices={[0]}
      style={styles.followedProfilesPosts}
      postsContainerStyle={styles.followedProfilesPostsListPostsContainerShadow}
    />
  );
};

export default HomeScreen;

const styleSheet = createStyleSheet(appearance => ({
  signupButton: { width: 150 },
  followedProfilesPosts: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 47,
  },
  logo: {
    height: 28,
  },
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
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
