import { useIntl } from 'react-intl';
import { StyleSheet, View, Image, Platform } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import { HEADER_HEIGHT } from '../../components/Header';
import Link from '../../components/Link';
import useViewportSize, { insetTop, VW100 } from '../../hooks/useViewportSize';
import { useCurrentRoute } from '../../PlatformEnvironment';
import Button from '../../ui/Button';
import FollowedProfilesList from './FollowedProfilesList';
import FollowedProfilesPostsList from './FollowedProfilesPostsList';
import type { HomeScreen_viewer$key } from '@azzapp/relay/artifacts/HomeScreen_viewer.graphql';

type HomeScreenProps = {
  viewer: HomeScreen_viewer$key;
};

const HomeScreen = ({ viewer: viewerRef }: HomeScreenProps) => {
  const viewer = useFragment(
    graphql`
      fragment HomeScreen_viewer on Viewer {
        user {
          id
        }
        ...FollowedProfilesList_viewer
        ...FollowedProfilesPostsList_viewer
      }
    `,
    viewerRef,
  );

  const currentRoute = useCurrentRoute('willChange');

  const vp = useViewportSize();

  const intl = useIntl();
  return (
    <FollowedProfilesPostsList
      viewer={viewer}
      canPlay={currentRoute.route === 'HOME'}
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
            canPlay={currentRoute.route === 'HOME'}
            style={styles.followedProfilesList}
          />
          {!viewer.user && (
            <View style={styles.signupSection}>
              <Link modal route="SIGN_UP">
                <Button
                  style={styles.signupButton}
                  label={intl.formatMessage({
                    defaultMessage: 'Sign Up',
                    description: 'Home screen sign up button label',
                  })}
                />
              </Link>
            </View>
          )}
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
      postsContainerStyle={styles.followedProfilesPostsListPostsContainer}
    />
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  signupButton: { paddingLeft: 100, paddingRight: 100 },
  followedProfilesPosts: {
    flex: 1,
    backgroundColor: '#FFF',
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
    shadowColor: colors.dark,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    zIndex: 20,
  },
});
