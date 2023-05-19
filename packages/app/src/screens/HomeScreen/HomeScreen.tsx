import { useCallback } from 'react';
import {
  StyleSheet,
  Image,
  Platform,
  View,
  useColorScheme,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
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
  const vp = useViewportSize();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const appearanceStyle = useStyleSheet(computedStyle);
  const viewer = useFragment(
    graphql`
      fragment HomeScreen_viewer on Viewer {
        profile {
          id
        }
        ...FollowedProfilesList_viewer
        ...FollowedProfilesPostsList_viewer
      }
    `,
    viewerRef,
  );

  const goToSettings = useCallback(() => {
    router.push({ route: 'ACCOUNT' });
  }, [router]);

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
          <FollowedProfilesList
            viewer={viewer}
            style={styles.followedProfilesList}
          />
        </Container>
      }
      stickyHeaderIndices={[0]}
      style={styles.followedProfilesPosts}
      postsContainerStyle={[
        appearanceStyle.followedProfilesPostsListPostsContainer,
        styles.followedProfilesPostsListPostsContainerShadow,
      ]}
    />
  );
};

export default HomeScreen;

const computedStyle = createStyleSheet(appearance => ({
  followedProfilesPostsListPostsContainer: {
    paddingVertical: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
  },
}));

const styles = StyleSheet.create({
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
  followedProfilesPostsListPostsContainerShadow: Platform.select({
    default: {
      shadowColor: colors.black,
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
    },
    android: { elevation: 10 },
  }),
});
