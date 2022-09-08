import { StyleSheet, View, Image } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import { HEADER_HEIGHT } from '../../components/Header';
import Link from '../../components/Link';
import useViewportSize, { insetTop, VW100 } from '../../hooks/useViewportSize';
import { useCurrentRoute } from '../../PlatformEnvironment';
import Button from '../../ui/Button';
import RecommandedPostsList from './RecommandedPostsList';
import RecommandedUsersList from './RecommandedUsersList';
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
        ...RecommandedUsersList_viewer
        ...RecommandedPostsList_viewer
      }
    `,
    viewerRef,
  );
  const currentRoute = useCurrentRoute('willChange');

  const vp = useViewportSize();

  return (
    <RecommandedPostsList
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
          <RecommandedUsersList
            viewer={viewer}
            canPlay={currentRoute.route === 'HOME'}
            style={styles.recommandedUsersList}
          />
          {!viewer.user && (
            <View style={styles.signupSection}>
              <Link modal route="SIGN_UP">
                <Button label="Sign UP" />
              </Link>
            </View>
          )}
        </View>
      }
      stickyHeaderIndices={[0]}
      style={[
        styles.recommandedPostsList,
        {
          borderBottomLeftRadius: vp`${VW100} * ${0.16}`,
          borderBottomRightRadius: vp`${VW100} * ${0.16}`,
        },
      ]}
      postsContainerStyle={styles.recommandedPostsListPostsContainer}
    />
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  recommandedPostsList: {
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
  recommandedUsersList: {
    height: 200,
    marginTop: 10,
    marginBottom: 13,
  },
  signupSection: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommandedPostsListPostsContainer: {
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
